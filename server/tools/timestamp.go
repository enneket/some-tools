package tools

import (
	"encoding/json"
	"net/http"
	"strconv"
	"strings"
	"time"
)

func HandleTimestamp(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	var req struct {
		Input string `json:"input"`
		To    string `json:"to"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	switch req.To {
	case "date":
		// 时间戳 → 日期
		input := strings.TrimSpace(req.Input)
		ts, err := strconv.ParseInt(input, 10, 64)
		if err != nil {
			http.Error(w, "Invalid timestamp", http.StatusBadRequest)
			return
		}
		if ts > 9999999999 {
			// 毫秒级转秒级
			ts = ts / 1000
		}
		t := time.Unix(ts, 0)
		json.NewEncoder(w).Encode(map[string]string{"output": t.Format("2006-01-02 15:04:05")})

	case "timestamp":
		// 日期 → 时间戳
		input := strings.TrimSpace(req.Input)
		if input == "" {
			input = time.Now().Format("2006-01-02 15:04:05")
		}
		t, err := time.ParseInLocation("2006-01-02 15:04:05", input, time.Local)
		if err != nil {
			http.Error(w, "Invalid date format, use '2006-01-02 15:04:05'", http.StatusBadRequest)
			return
		}
		json.NewEncoder(w).Encode(map[string]string{"output": strconv.FormatInt(t.Unix(), 10)})

	default:
		http.Error(w, "Invalid 'to' value, use 'date' or 'timestamp'", http.StatusBadRequest)
	}
}
