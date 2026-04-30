package tools

import (
	"encoding/base64"
	"encoding/json"
	"net/http"
	"strings"
)

func HandleJWT(w http.ResponseWriter, r *http.Request) {
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

	parts := strings.Split(strings.TrimSpace(req.Input), ".")
	if len(parts) != 3 {
		http.Error(w, "Invalid JWT format", http.StatusBadRequest)
		return
	}

	header, err := decodeJWTPart(parts[0])
	if err != nil {
		http.Error(w, "Failed to decode header", http.StatusBadRequest)
		return
	}
	payload, err := decodeJWTPart(parts[1])
	if err != nil {
		http.Error(w, "Failed to decode payload", http.StatusBadRequest)
		return
	}

	result := map[string]interface{}{
		"header":    header,
		"payload":   payload,
		"signature": parts[2],
	}
	json.NewEncoder(w).Encode(map[string]interface{}{"output": result})
}

func decodeJWTPart(part string) (map[string]interface{}, error) {
	// 补齐 Base64 padding
	switch len(part) % 4 {
	case 2:
		part += "=="
	case 3:
		part += "="
	}
	part = strings.ReplaceAll(part, "-", "+")
	part = strings.ReplaceAll(part, "_", "/")

	data, err := base64.StdEncoding.DecodeString(part)
	if err != nil {
		return nil, err
	}
	var result map[string]interface{}
	if err := json.Unmarshal(data, &result); err != nil {
		return nil, err
	}
	return result, nil
}
