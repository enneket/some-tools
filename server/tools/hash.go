package tools

import (
	"crypto/md5"
	"crypto/sha1"
	"crypto/sha256"
	"crypto/sha512"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"net/http"
)

func HandleHash(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	var req struct {
		Input string `json:"input"`
		Alg   string `json:"alg"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	var result string
	switch req.Alg {
	case "md5":
		h := md5.Sum([]byte(req.Input))
		result = hex.EncodeToString(h[:])
	case "sha1":
		h := sha1.Sum([]byte(req.Input))
		result = hex.EncodeToString(h[:])
	case "sha256":
		h := sha256.Sum256([]byte(req.Input))
		result = hex.EncodeToString(h[:])
	case "sha512":
		h := sha512.Sum512([]byte(req.Input))
		result = hex.EncodeToString(h[:])
	case "all":
		md5h := md5.Sum([]byte(req.Input))
		sha1h := sha1.Sum([]byte(req.Input))
		sha256h := sha256.Sum256([]byte(req.Input))
		sha512h := sha512.Sum512([]byte(req.Input))
		result = fmt.Sprintf("MD5:    %s\nSHA1:   %s\nSHA256: %s\nSHA512: %s",
			hex.EncodeToString(md5h[:]),
			hex.EncodeToString(sha1h[:]),
			hex.EncodeToString(sha256h[:]),
			hex.EncodeToString(sha512h[:]))
	default:
		http.Error(w, "Invalid alg, use md5/sha1/sha256/sha512/all", http.StatusBadRequest)
		return
	}

	json.NewEncoder(w).Encode(map[string]string{"output": result})
}
