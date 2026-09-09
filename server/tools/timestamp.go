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
		Input    string `json:"input"`
		To       string `json:"to"`
		Timezone string `json:"timezone"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}
	w.Header().Set("Content-Type", "application/json")

	loc := time.Local
	if req.Timezone != "" {
		if l, err := time.LoadLocation(req.Timezone); err == nil {
			loc = l
		}
	}

	switch req.To {
	case "date":
		input := strings.TrimSpace(req.Input)
		ts, err := strconv.ParseInt(input, 10, 64)
		if err != nil {
			http.Error(w, "Invalid timestamp", http.StatusBadRequest)
			return
		}
		if ts > 9999999999 {
			ts = ts / 1000
		}
		t := time.Unix(ts, 0).In(loc)
		json.NewEncoder(w).Encode(map[string]string{"output": t.Format("2006-01-02 15:04:05")})

	case "timestamp":
		input := strings.TrimSpace(req.Input)
		if input == "" {
			input = time.Now().In(loc).Format("2006-01-02 15:04:05")
		}
		// 支持多种常见格式
		layouts := []string{
			"2006-01-02 15:04:05",
			"2006-01-02 15:04",
			"2006-01-02T15:04:05",
			"2006-01-02T15:04",
			"2006-01-02",
			"2006/01/02 15:04:05",
			"2006/01/02 15:04",
			"2006/01/02",
		}
		var t time.Time
		var err error
		for _, layout := range layouts {
			t, err = time.ParseInLocation(layout, input, loc)
			if err == nil {
				break
			}
		}
		if err != nil {
			http.Error(w, "Invalid date format, use '2006-01-02 15:04:05' or similar", http.StatusBadRequest)
			return
		}
		json.NewEncoder(w).Encode(map[string]string{"output": strconv.FormatInt(t.Unix(), 10)})

	default:
		http.Error(w, "Invalid 'to' value, use 'date' or 'timestamp'", http.StatusBadRequest)
	}
}
