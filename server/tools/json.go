package tools

import (
	"encoding/json"
	"net/http"
)

func HandleJSON(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	var req struct {
		Input string `json:"input"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}
	var decoded interface{}
	if err := json.Unmarshal([]byte(req.Input), &decoded); err != nil {
		http.Error(w, "Invalid JSON input", http.StatusBadRequest)
		return
	}
	formatted, err := json.MarshalIndent(decoded, "", "  ")
	if err != nil {
		http.Error(w, "Failed to format JSON", http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(map[string]string{"output": string(formatted)})
}
