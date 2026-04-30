package tools

import (
	"encoding/json"
	"fmt"
	"net/http"
	"regexp"
	"strconv"
	"strings"
)

func HandleColor(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	var req struct {
		Input string `json:"input"`
		From  string `json:"from"`
		To    string `json:"to"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}
	var output string
	switch {
	case req.From == "hex" && req.To == "rgb":
		hex := strings.TrimPrefix(req.Input, "#")
		if len(hex) != 6 {
			http.Error(w, "Invalid hex color", http.StatusBadRequest)
			return
		}
		r, err := strconv.ParseInt(hex[0:2], 16, 64)
		if err != nil {
			http.Error(w, "Invalid hex color", http.StatusBadRequest)
			return
		}
		g, err := strconv.ParseInt(hex[2:4], 16, 64)
		if err != nil {
			http.Error(w, "Invalid hex color", http.StatusBadRequest)
			return
		}
		b, err := strconv.ParseInt(hex[4:6], 16, 64)
		if err != nil {
			http.Error(w, "Invalid hex color", http.StatusBadRequest)
			return
		}
		output = fmt.Sprintf("rgb(%d, %d, %d)", r, g, b)
	case req.From == "rgb" && req.To == "hex":
		rgbRe := regexp.MustCompile(`rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)`)
		matches := rgbRe.FindStringSubmatch(req.Input)
		if len(matches) != 4 {
			http.Error(w, "Invalid rgb color format", http.StatusBadRequest)
			return
		}
		r, err := strconv.ParseInt(matches[1], 10, 64)
		if err != nil {
			http.Error(w, "Invalid rgb color", http.StatusBadRequest)
			return
		}
		g, err := strconv.ParseInt(matches[2], 10, 64)
		if err != nil {
			http.Error(w, "Invalid rgb color", http.StatusBadRequest)
			return
		}
		b, err := strconv.ParseInt(matches[3], 10, 64)
		if err != nil {
			http.Error(w, "Invalid rgb color", http.StatusBadRequest)
			return
		}
		output = fmt.Sprintf("#%02x%02x%02x", r, g, b)
	default:
		http.Error(w, "Invalid conversion, use 'hex'->'rgb' or 'rgb'->'hex'", http.StatusBadRequest)
		return
	}
	json.NewEncoder(w).Encode(map[string]string{"output": output})
}
