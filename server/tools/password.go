package tools

import (
	"crypto/rand"
	"encoding/json"
	"math/big"
	"net/http"
)

const (
	lowerChars = "abcdefghijklmnopqrstuvwxyz"
	upperChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
	digitChars = "0123456789"
	symbolChars = "!@#$%^&*()_+-=[]{}|;:,.<>?"
)

func HandlePassword(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	var req struct {
		Length  int  `json:"length"`
		Upper   bool `json:"upper"`
		Digits  bool `json:"digits"`
		Symbols bool `json:"symbols"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	if req.Length <= 0 {
		req.Length = 16
	}
	if req.Length > 128 {
		req.Length = 128
	}

	chars := lowerChars
	if req.Upper {
		chars += upperChars
	}
	if req.Digits {
		chars += digitChars
	}
	if req.Symbols {
		chars += symbolChars
	}

	password := make([]byte, req.Length)
	for i := range password {
		n, err := rand.Int(rand.Reader, big.NewInt(int64(len(chars))))
		if err != nil {
			http.Error(w, "Failed to generate password", http.StatusInternalServerError)
			return
		}
		password[i] = chars[n.Int64()]
	}

	json.NewEncoder(w).Encode(map[string]string{"output": string(password)})
}
