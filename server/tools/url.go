package tools

import (
	"encoding/json"
	"net/http"
	"net/url"
)

func HandleURL(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	var req struct {
		Input  string `json:"input"`
		Action string `json:"action"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}
	var output string
	switch req.Action {
	case "encode":
		output = url.QueryEscape(req.Input)
	case "decode":
		unescaped, err := url.QueryUnescape(req.Input)
		if err != nil {
			http.Error(w, "Invalid URL encoded input", http.StatusBadRequest)
			return
		}
		output = unescaped
	default:
		http.Error(w, "Invalid action, use 'encode' or 'decode'", http.StatusBadRequest)
		return
	}
	json.NewEncoder(w).Encode(map[string]string{"output": output})
}
