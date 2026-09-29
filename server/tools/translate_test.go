package tools

import "testing"

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
