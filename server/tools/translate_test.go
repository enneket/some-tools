package tools

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestParseTranslateResponse(t *testing.T) {
	cases := []struct {
		name         string
		body         string
		wantText     string
		wantDetected string
	}{
		{
			name:         "single-segment",
			body:         `[[["Hello World","你好世界",null,null,10]],null,"zh-CN",null,null,null,1,[],[["zh-CN"]]]`,
			wantText:     "Hello World",
			wantDetected: "zh-CN",
		},
		{
			name:         "multi-segment-joined",
			body:         `[[["你好世界，这是一个测试。\n","Hello world, this is a test.\n",null,null,3],["第二行在这里。","Second line here.",null,null,3]],null,"en"]`,
			wantText:     "你好世界，这是一个测试。\n第二行在这里。",
			wantDetected: "en",
		},
		{
			name:         "null-segment-skipped",
			body:         `[[[null,null,null,null,10],["ok","好",null,null,10]],null,"zh-CN"]`,
			wantText:     "ok",
			wantDetected: "zh-CN",
		},
		{
			name:         "no-segments",
			body:         `[[],null,"zh-CN"]`,
			wantText:     "",
			wantDetected: "zh-CN",
		},
		{
			name:         "missing-detected-field",
			body:         `[[["hi","你好",null,null,10]]]`,
			wantText:     "hi",
			wantDetected: "",
		},
	}
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			got, err := parseTranslateResponse([]byte(c.body))
			if err != nil {
				t.Fatalf("parseTranslateResponse(%s) error: %v", c.body, err)
			}
			if got.Text != c.wantText {
				t.Errorf("parseTranslateResponse(%s).Text\n got: %q\nwant: %q", c.body, got.Text, c.wantText)
			}
			if got.Detected != c.wantDetected {
				t.Errorf("parseTranslateResponse(%s).Detected\n got: %q\nwant: %q", c.body, got.Detected, c.wantDetected)
			}
		})
	}
}

func TestParseTranslateResponseError(t *testing.T) {
	cases := []struct {
		name string
		body string
	}{
		{name: "not-json", body: `<html>error</html>`},
		{name: "empty-array", body: `[]`},
		{name: "segments-wrong-type", body: `["not-a-segment-list"]`},
		{name: "segment-piece-wrong-type", body: `[[[123]]]`},
	}
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			if _, err := parseTranslateResponse([]byte(c.body)); err == nil {
				t.Errorf("parseTranslateResponse(%s) expected error, got nil", c.body)
			}
		})
	}
}

func TestIsSupportedLanguage(t *testing.T) {
	cases := []struct {
		code string
		want bool
	}{
		{code: LangAuto, want: true},
		{code: "zh-CN", want: true},
		{code: "en", want: true},
		{code: "kl-GL", want: false},
		{code: "", want: false},
	}
	for _, c := range cases {
		if got := isSupportedLanguage(c.code); got != c.want {
			t.Errorf("isSupportedLanguage(%q) = %v, want %v", c.code, got, c.want)
		}
	}
}

// 打桩主服务，返回合法的翻译响应结构，并记录收到的请求次数
func newStubGoogle(t *testing.T, requests *int) {
	t.Helper()
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		*requests++
		json.NewEncoder(w).Encode([]any{[]any{[]any{"[T]"}}, nil, "en"})
	}))
	t.Cleanup(server.Close)
	t.Setenv("GOOGLE_TRANSLATE_ENDPOINT", server.URL)
}

func postTranslate(t *testing.T, input string) *httptest.ResponseRecorder {
	t.Helper()
	body, err := json.Marshal(map[string]string{"input": input, "from": "auto", "to": "en"})
	if err != nil {
		t.Fatal(err)
	}
	recorder := httptest.NewRecorder()
	HandleTranslate(recorder, httptest.NewRequest(http.MethodPost, "/api/translate", strings.NewReader(string(body))))
	return recorder
}

// 降级路径每 450 字切一片、每片失败重试一次，不设上限时一个请求能放大成
// 数千次上游请求。这里确认超长文本在发出任何上游请求前就被挡下。
func TestHandleTranslateRejectsOverlongInput(t *testing.T) {
	cases := []struct {
		name  string
		input string
		want  int
	}{
		{name: "one-over-limit", input: strings.Repeat("a", maxTranslateInputRunes+1), want: http.StatusBadRequest},
		{name: "way-over-limit", input: strings.Repeat("a", 1<<20), want: http.StatusBadRequest},
		{name: "at-limit", input: strings.Repeat("a", maxTranslateInputRunes), want: http.StatusOK},
	}
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			var requests int
			newStubGoogle(t, &requests)
			recorder := postTranslate(t, c.input)
			if recorder.Code != c.want {
				t.Errorf("输入 %d 字，状态码 %d，期望 %d，响应 %s",
					len(c.input), recorder.Code, c.want, recorder.Body.String())
			}
			if c.want == http.StatusBadRequest && requests != 0 {
				t.Errorf("超长输入仍发起了 %d 次上游请求", requests)
			}
		})
	}
}
