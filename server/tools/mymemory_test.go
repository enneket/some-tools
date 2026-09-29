package tools

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

// newStubMyMemory 打桩上游，按收到的原文原样回显并记录请求次数
func newStubMyMemory(t *testing.T, requests *[]string) *httptest.Server {
	t.Helper()
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		text := r.URL.Query().Get("q")
		*requests = append(*requests, text)
		json.NewEncoder(w).Encode(map[string]any{
			"responseData":   map[string]string{"translatedText": "[T]" + text + "[/T]"},
			"responseStatus": 200,
		})
	}))
	t.Cleanup(server.Close)
	original := myMemoryEndpoint
	myMemoryEndpoint = server.URL
	t.Cleanup(func() { myMemoryEndpoint = original })
	return server
}

func TestMyMemoryTranslateJoinsChunksWithSpace(t *testing.T) {
	var requests []string
	newStubMyMemory(t, &requests)

	translator := &myMemoryTranslator{client: http.DefaultClient}
	// 无句号的长文本，只能在空格处断开
	text := strings.Repeat("alpha beta gamma ", 60)

	result, err := translator.Translate(context.Background(), text, "en", "zh-CN")
	if err != nil {
		t.Fatalf("Translate 返回错误: %v", err)
	}
	if len(requests) < 2 {
		t.Fatalf("期望切分成多段，实际请求 %d 次", len(requests))
	}
	for _, request := range requests {
		if len([]rune(request)) > myMemoryChunkRunes {
			t.Errorf("请求片段 %d 字符，超过上限 %d", len([]rune(request)), myMemoryChunkRunes)
		}
	}
	// 译文以标记包裹原样回显，据此还原期望的拼接结果，逐字符比对拼接规则
	var expected strings.Builder
	chunks := splitForTranslation(text, myMemoryChunkRunes)
	for index, chunk := range chunks {
		if index > 0 && chunks[index-1].joinWithSpace {
			expected.WriteString(" ")
		}
		expected.WriteString("[T]" + chunk.text + "[/T]")
	}
	if result.Text != expected.String() {
		t.Errorf("拼接结果不符合预期\n got: %q\nwant: %q", result.Text, expected.String())
	}
	if strings.Contains(result.Text, "gamma[T]") {
		t.Error("空格边界处两段译文被粘连，中间缺少空格")
	}
	if result.Detected != "en" {
		t.Errorf("Detected = %q, want %q", result.Detected, "en")
	}
}

func TestMyMemoryTranslateSentenceBoundaryNeedsNoSpace(t *testing.T) {
	var requests []string
	newStubMyMemory(t, &requests)

	translator := &myMemoryTranslator{client: http.DefaultClient}
	text := strings.Repeat("一句中文。", 120)

	result, err := translator.Translate(context.Background(), text, "zh-CN", "en")
	if err != nil {
		t.Fatalf("Translate 返回错误: %v", err)
	}
	if got := strings.Count(result.Text, " "); got != 0 {
		t.Errorf("标点断句处不应补空格，实际译文有 %d 个空格: %q", got, result.Text[:min(len(result.Text), 80)])
	}
}

func TestMyMemoryTranslatePropagatesUpstreamError(t *testing.T) {
	var requests []string
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		requests = append(requests, r.URL.Query().Get("q"))
		json.NewEncoder(w).Encode(map[string]any{
			"responseData":    map[string]string{"translatedText": ""},
			"responseStatus":  403,
			"responseDetails": "QUERY LENGTH LIMIT EXCEEDED",
		})
	}))
	defer server.Close()
	original := myMemoryEndpoint
	myMemoryEndpoint = server.URL
	defer func() { myMemoryEndpoint = original }()

	translator := &myMemoryTranslator{client: http.DefaultClient}
	if _, err := translator.Translate(context.Background(), "hello", "en", "zh-CN"); err == nil {
		t.Error("上游返回 403 时应返回错误")
	}
	if len(requests) != myMemoryMaxAttempts {
		t.Errorf("请求次数 = %d, want %d", len(requests), myMemoryMaxAttempts)
	}
}

func TestSplitForTranslation(t *testing.T) {
	cases := []struct {
		name  string
		text  string
		limit int
	}{
		{name: "short-single-chunk", text: "hello world", limit: 450},
		{name: "exactly-at-limit", text: strings.Repeat("a", 450), limit: 450},
		{name: "cjk-sentence-boundary", text: strings.Repeat("今天天气很好。", 100), limit: 450},
		{name: "latin-sentence-boundary", text: strings.Repeat("This is a sentence. ", 60), limit: 450},
		{name: "no-punctuation-falls-back-to-space", text: strings.Repeat("word ", 200), limit: 450},
		{name: "single-long-token-hard-cut", text: strings.Repeat("x", 1000), limit: 450},
		{name: "multibyte-boundary-safety", text: strings.Repeat("天", 1000), limit: 450},
	}
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			chunks := splitForTranslation(c.text, c.limit)

			var rebuilt strings.Builder
			for index, chunk := range chunks {
				if len([]rune(chunk.text)) > c.limit {
					t.Errorf("chunk %d 长度 %d 超过上限 %d", index, len([]rune(chunk.text)), c.limit)
				}
				if !strings.Contains(c.text, chunk.text) {
					t.Errorf("chunk %d 不是原文子串: %q", index, chunk.text)
				}
				rebuilt.WriteString(chunk.text)
				if chunk.joinWithSpace && index < len(chunks)-1 {
					rebuilt.WriteString(" ")
				}
			}
			if rebuilt.String() != c.text {
				t.Errorf("拼接结果与原文不一致\n got: %q\nwant: %q", rebuilt.String(), c.text)
			}
		})
	}
}

func TestSplitForTranslationProgress(t *testing.T) {
	// 全是标点的输入最容易在切分时死循环
	texts := []string{
		strings.Repeat("。", 1000),
		strings.Repeat(" ", 1000),
		strings.Repeat("a。", 500),
		strings.Repeat("a b。", 300),
	}
	for _, text := range texts {
		chunks := splitForTranslation(text, 450)
		if len(chunks) == 0 {
			t.Errorf("输入 %q 切分结果为空", text[:10])
			continue
		}
		if len(chunks) > len([]rune(text)) {
			t.Errorf("输入 %q 切出 %d 段，超过字符数", text[:10], len(chunks))
		}
	}
}

func TestSplitForTranslationKeepsPunctuationWithPreviousChunk(t *testing.T) {
	text := strings.Repeat("第一句。", 200)
	chunks := splitForTranslation(text, 450)
	if !strings.HasSuffix(chunks[0].text, "。") {
		t.Errorf("首段应以标点结尾，实际为 %q", lastRunes(chunks[0].text, 5))
	}
	if chunks[0].joinWithSpace {
		t.Error("标点断句处不应补空格")
	}
}

func lastRunes(text string, count int) string {
	characters := []rune(text)
	if len(characters) <= count {
		return text
	}
	return string(characters[len(characters)-count:])
}

func TestMyMemorySupportsAutoDetect(t *testing.T) {
	if (&myMemoryTranslator{}).SupportsAutoDetect() {
		t.Error("MyMemory 不支持自动检测源语言")
	}
	if !(&googleTranslator{}).SupportsAutoDetect() {
		t.Error("Google 端点支持自动检测源语言")
	}
}
