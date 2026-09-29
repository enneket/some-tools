package tools

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"strings"
)

const defaultMyMemoryEndpoint = "https://api.mymemory.translated.net/get"

// 以变量形式存在，便于测试时指向本地打桩服务
var myMemoryEndpoint = defaultMyMemoryEndpoint

// 上游对 q 参数的硬上限实测为 500 字符（中英文一致），这里留出余量。
// 注意该上限按字符计而非字节：500 个汉字（1500 字节）同样可以通过。
const myMemoryChunkRunes = 450

// 网络抖动时重试一次，避免降级路径本身再失败
const myMemoryMaxAttempts = 2

type myMemoryTranslator struct {
	client *http.Client
}

// SupportsAutoDetect 返回 false：MyMemory 的 langpair 必须给出两个不同的语种，
// 传 Autodetect 会被拒绝（403 PLEASE SELECT TWO DISTINCT LANGUAGES）
func (translator *myMemoryTranslator) SupportsAutoDetect() bool {
	return false
}

func (translator *myMemoryTranslator) Translate(ctx context.Context, text, from, to string) (TranslateResult, error) {
	chunks := splitForTranslation(text, myMemoryChunkRunes)

	var translated strings.Builder
	for index, chunk := range chunks {
		piece, err := translator.translateChunk(ctx, chunk.text, from, to)
		if err != nil {
			return TranslateResult{}, err
		}
		piece = strings.TrimSpace(piece)
		if piece == "" {
			continue
		}
		// 译文自身不含原段落的空白，按原文的断句方式决定是否补一个空格
		if index > 0 && chunks[index-1].joinWithSpace {
			translated.WriteString(" ")
		}
		translated.WriteString(piece)
	}
	// 源语言由调用方确定（显式指定或本地判定），无需上游回传
	return TranslateResult{Text: translated.String(), Detected: from}, nil
}

func (translator *myMemoryTranslator) translateChunk(ctx context.Context, text, from, to string) (string, error) {
	query := url.Values{}
	query.Set("q", text)
	query.Set("langpair", from+"|"+to)

	var lastErr error
	for attempt := 0; attempt < myMemoryMaxAttempts; attempt++ {
		result, err := translator.requestChunk(ctx, query)
		if err == nil {
			return result, nil
		}
		lastErr = err
		if ctx.Err() != nil {
			break
		}
	}
	return "", lastErr
}

func (translator *myMemoryTranslator) requestChunk(ctx context.Context, query url.Values) (string, error) {
	request, err := http.NewRequestWithContext(ctx, http.MethodGet, myMemoryEndpoint+"?"+query.Encode(), nil)
	if err != nil {
		return "", err
	}

	response, err := translator.client.Do(request)
	if err != nil {
		return "", err
	}
	defer response.Body.Close()

	if response.StatusCode != http.StatusOK {
		return "", fmt.Errorf("上游返回 %d", response.StatusCode)
	}

	var payload struct {
		ResponseData struct {
			TranslatedText string `json:"translatedText"`
		} `json:"responseData"`
		ResponseStatus  int    `json:"responseStatus"`
		ResponseDetails string `json:"responseDetails"`
	}
	if err := json.NewDecoder(response.Body).Decode(&payload); err != nil {
		return "", fmt.Errorf("解析翻译结果失败: %w", err)
	}
	if payload.ResponseStatus != http.StatusOK {
		detail := strings.TrimSpace(payload.ResponseDetails)
		if detail == "" {
			detail = fmt.Sprintf("status %d", payload.ResponseStatus)
		}
		return "", fmt.Errorf("上游返回 %d: %s", payload.ResponseStatus, detail)
	}
	return payload.ResponseData.TranslatedText, nil
}

// translationChunk 是切分后的一段。joinWithSpace 表示与下一段拼接时
// 是否需要补一个空格：原文在空格处断开时译文之间也会缺空格。
type translationChunk struct {
	text          string
	joinWithSpace bool
}

// splitForTranslation 按字符切分，优先在断句标点处切开，其次在空格处切开，
// 都没有时按长度硬切。切分不会丢字，标点归入前一段、空格归入后一段。
func splitForTranslation(text string, limit int) []translationChunk {
	characters := []rune(text)
	if len(characters) <= limit {
		return []translationChunk{{text: text}}
	}

	var chunks []translationChunk
	start := 0
	for start < len(characters) {
		end := start + limit
		if end >= len(characters) {
			chunks = append(chunks, translationChunk{text: string(characters[start:])})
			break
		}

		window := characters[start:end]
		chunk := translationChunk{text: string(window)}

		if cut := lastIndexOfAnyRune(window, sentenceEndRunes); cut >= 0 {
			// 标点归入本段，下一段从标点之后开始
			chunk.text = string(window[:cut+1])
			end = start + cut + 1
		} else if cut := lastIndexOfAnyRune(window, " \t"); cut > 0 {
			// 空格归入下一段，拼接译文时需要补回空格
			chunk.text = string(window[:cut])
			chunk.joinWithSpace = true
			end = start + cut + 1
		}
		chunks = append(chunks, chunk)
		start = end
	}
	return chunks
}

const sentenceEndRunes = "\n。！？；.!?;"

// lastIndexOfAnyRune 返回区间内最后一个属于字符集的字符下标，找不到返回 -1。
// 这里按字符而非字节定位，避免切碎多字节字符。
func lastIndexOfAnyRune(characters []rune, candidates string) int {
	for index := len(characters) - 1; index >= 0; index-- {
		if strings.ContainsRune(candidates, characters[index]) {
			return index
		}
	}
	return -1
}
