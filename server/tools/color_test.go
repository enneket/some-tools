package tools

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func postColor(t *testing.T, input, from, to string) (int, string) {
	t.Helper()
	body, err := json.Marshal(map[string]string{"input": input, "from": from, "to": to})
	if err != nil {
		t.Fatal(err)
	}
	recorder := httptest.NewRecorder()
	HandleColor(recorder, httptest.NewRequest(http.MethodPost, "/api/convert/color", strings.NewReader(string(body))))
	var payload struct {
		Output string `json:"output"`
	}
	_ = json.Unmarshal(recorder.Body.Bytes(), &payload)
	return recorder.Code, payload.Output
}

func TestHandleColor(t *testing.T) {
	cases := []struct {
		name       string
		input      string
		from, to   string
		wantStatus int
		wantOutput string
	}{
		{name: "hex-to-rgb", input: "#ff8800", from: "hex", to: "rgb",
			wantStatus: http.StatusOK, wantOutput: "rgb(255, 136, 0)"},
		{name: "hex-without-hash", input: "ff8800", from: "hex", to: "rgb",
			wantStatus: http.StatusOK, wantOutput: "rgb(255, 136, 0)"},
		{name: "hex-uppercase", input: "#FF8800", from: "hex", to: "rgb",
			wantStatus: http.StatusOK, wantOutput: "rgb(255, 136, 0)"},
		{name: "hex-wrong-length", input: "#fff", from: "hex", to: "rgb",
			wantStatus: http.StatusBadRequest},
		{name: "rgb-to-hex", input: "rgb(255, 136, 0)", from: "rgb", to: "hex",
			wantStatus: http.StatusOK, wantOutput: "#ff8800"},
		{name: "rgb-with-spaces", input: "rgb( 255 , 136 , 0 )", from: "rgb", to: "hex",
			wantStatus: http.StatusOK, wantOutput: "#ff8800"},
		{name: "rgb-boundary-255", input: "rgb(255, 255, 255)", from: "rgb", to: "hex",
			wantStatus: http.StatusOK, wantOutput: "#ffffff"},
		{name: "rgb-boundary-zero", input: "rgb(0, 0, 0)", from: "rgb", to: "hex",
			wantStatus: http.StatusOK, wantOutput: "#000000"},

		// %02x 不会截断超范围的值，旧实现会输出 7 位/12 位的假色值
		{name: "rgb-overflow-999", input: "rgb(999,0,0)", from: "rgb", to: "hex",
			wantStatus: http.StatusBadRequest},
		{name: "rgb-overflow-300", input: "rgb(300,300,300)", from: "rgb", to: "hex",
			wantStatus: http.StatusBadRequest},
		{name: "rgb-overflow-single-component", input: "rgb(16,256,16)", from: "rgb", to: "hex",
			wantStatus: http.StatusBadRequest},
		{name: "rgb-negative-not-matched", input: "rgb(-1,0,0)", from: "rgb", to: "hex",
			wantStatus: http.StatusBadRequest},
		{name: "unknown-direction", input: "#ff8800", from: "hex", to: "hex",
			wantStatus: http.StatusBadRequest},
	}
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			status, output := postColor(t, c.input, c.from, c.to)
			if status != c.wantStatus {
				t.Fatalf("%s->%s(%q) 状态码 %d，期望 %d", c.from, c.to, c.input, status, c.wantStatus)
			}
			if c.wantOutput != "" && output != c.wantOutput {
				t.Errorf("%s->%s(%q) = %q，期望 %q", c.from, c.to, c.input, output, c.wantOutput)
			}
		})
	}
}
