package tools

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func postTimestamp(t *testing.T, input, to, timezone string) (int, string) {
	t.Helper()
	body, err := json.Marshal(map[string]string{"input": input, "to": to, "timezone": timezone})
	if err != nil {
		t.Fatal(err)
	}
	recorder := httptest.NewRecorder()
	HandleTimestamp(recorder, httptest.NewRequest(http.MethodPost, "/api/convert/timestamp", strings.NewReader(string(body))))
	var payload struct {
		Output string `json:"output"`
	}
	_ = json.Unmarshal(recorder.Body.Bytes(), &payload)
	return recorder.Code, payload.Output
}

func TestHandleTimestamp(t *testing.T) {
	cases := []struct {
		name       string
		input      string
		to         string
		timezone   string
		wantStatus int
		wantOutput string
	}{
		{name: "seconds-to-date-utc", input: "1700000000", to: "date", timezone: "UTC",
			wantStatus: http.StatusOK, wantOutput: "2023-11-14 22:13:20"},
		{name: "seconds-to-date-shanghai", input: "1700000000", to: "date", timezone: "Asia/Shanghai",
			wantStatus: http.StatusOK, wantOutput: "2023-11-15 06:13:20"},
		// 阈值 9999999999 秒约合 2286 年，此后的秒级时间戳会被误当成毫秒
		{name: "milliseconds-to-date", input: "1700000000000", to: "date", timezone: "UTC",
			wantStatus: http.StatusOK, wantOutput: "2023-11-14 22:13:20"},
		{name: "date-to-timestamp", input: "2023-11-15 06:13:20", to: "timestamp", timezone: "Asia/Shanghai",
			wantStatus: http.StatusOK, wantOutput: "1700000000"},
		{name: "date-only", input: "2023-11-15", to: "timestamp", timezone: "Asia/Shanghai",
			wantStatus: http.StatusOK, wantOutput: "1699977600"},
		{name: "slash-format", input: "2023/11/15 06:13:20", to: "timestamp", timezone: "Asia/Shanghai",
			wantStatus: http.StatusOK, wantOutput: "1700000000"},
		{name: "iso-format", input: "2023-11-14T22:13:20", to: "timestamp", timezone: "UTC",
			wantStatus: http.StatusOK, wantOutput: "1700000000"},

		// 非法时区此前被静默忽略，返回服务器本地时区的结果
		{name: "invalid-timezone", input: "1700000000", to: "date", timezone: "Not/AZone",
			wantStatus: http.StatusBadRequest},
		{name: "non-numeric-timestamp", input: "abc", to: "date", timezone: "UTC",
			wantStatus: http.StatusBadRequest},
		{name: "unparsable-date", input: "15/11/2023", to: "timestamp", timezone: "UTC",
			wantStatus: http.StatusBadRequest},
		{name: "unknown-direction", input: "1700000000", to: "year",
			wantStatus: http.StatusBadRequest},
	}
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			status, output := postTimestamp(t, c.input, c.to, c.timezone)
			if status != c.wantStatus {
				t.Fatalf("to=%s tz=%q 输入 %q：状态码 %d，期望 %d",
					c.to, c.timezone, c.input, status, c.wantStatus)
			}
			if c.wantOutput != "" && output != c.wantOutput {
				t.Errorf("to=%s tz=%q 输入 %q = %q，期望 %q", c.to, c.timezone, c.input, output, c.wantOutput)
			}
		})
	}
}

// recorder 只是为了让失败信息可读，避免在错误分支里再存一份 body
func recorder(r *httptest.ResponseRecorder) string {
	return r.Body.String()
}
