package tools

import (
	"encoding/base64"
	"encoding/json"
	"net/http"
)

func HandleBase64(w http.ResponseWriter, r *http.Request) {
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
		output = base64.StdEncoding.EncodeToString([]byte(req.Input))
	case "decode":
		decoded, err := base64.StdEncoding.DecodeString(req.Input)
		if err != nil {
			http.Error(w, "Invalid base64 input", http.StatusBadRequest)
			return
		}
		output = string(decoded)
	default:
		http.Error(w, "Invalid action, use 'encode' or 'decode'", http.StatusBadRequest)
		return
	}
	json.NewEncoder(w).Encode(map[string]string{"output": output})
}
