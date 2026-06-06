package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"

	"toolhub/tools"
)

func main() {
	// API routes
	http.HandleFunc("/api/tools", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}
		tools := []map[string]interface{}{
			{"name": "json", "endpoint": "/api/format/json", "method": "POST", "description": "Format JSON input"},
			{"name": "base64", "endpoint": "/api/encode/base64", "method": "POST", "description": "Base64 encode/decode"},
			{"name": "url", "endpoint": "/api/encode/url", "method": "POST", "description": "URL encode/decode"},
			{"name": "uuid", "endpoint": "/api/generate/uuid", "method": "POST", "description": "Generate UUID"},
			{"name": "timestamp", "endpoint": "/api/convert/timestamp", "method": "POST", "description": "Convert timestamp to date"},
			{"name": "color", "endpoint": "/api/convert/color", "method": "POST", "description": "Convert between HEX and RGB colors"},
			{"name": "hash", "endpoint": "/api/hash", "method": "POST", "description": "Calculate MD5/SHA1/SHA256/SHA512 hash"},
			{"name": "jwt", "endpoint": "/api/jwt/decode", "method": "POST", "description": "Decode JWT token"},
			{"name": "password", "endpoint": "/api/password/generate", "method": "POST", "description": "Generate random password"},
			{"name": "regex", "endpoint": "", "method": "", "description": "Test regular expressions"},
			{"name": "markdown", "endpoint": "", "method": "", "description": "Preview Markdown rendering"},
			{"name": "diff", "endpoint": "", "method": "", "description": "Compare two texts"},
			{"name": "qrcode", "endpoint": "", "method": "", "description": "Generate QR code from text"},
			{"name": "cron", "endpoint": "", "method": "", "description": "Parse Cron expression"},
			{"name": "html-entity", "endpoint": "", "method": "", "description": "HTML entity encode/decode"},
			{"name": "unicode", "endpoint": "", "method": "", "description": "Unicode encode/decode"},
			{"name": "base", "endpoint": "", "method": "", "description": "Number base conversion"},
			{"name": "wordcount", "endpoint": "", "method": "", "description": "Count words and characters"},
			{"name": "img2base64", "endpoint": "", "method": "", "description": "Convert image to Base64"},
				{"name": "base64toimg", "endpoint": "", "method": "", "description": "Convert Base64 to image"},
			{"name": "httpstatus", "endpoint": "", "method": "", "description": "HTTP status code reference"},
		{"name": "sql", "endpoint": "/api/format/sql", "method": "POST", "description": "Format SQL query"},
		{"name": "m3u8", "endpoint": "", "method": "", "description": "Download M3U8 video stream"},
		{"name": "portrait", "endpoint": "", "method": "", "description": "Portrait segmentation using AI"},
		}
		json.NewEncoder(w).Encode(map[string]interface{}{
			"tools": tools,
		})
	})

	http.HandleFunc("/api/format/json", tools.HandleJSON)
	http.HandleFunc("/api/encode/base64", tools.HandleBase64)
	http.HandleFunc("/api/encode/url", tools.HandleURL)
	http.HandleFunc("/api/generate/uuid", tools.HandleUUID)
	http.HandleFunc("/api/convert/timestamp", tools.HandleTimestamp)
	http.HandleFunc("/api/convert/color", tools.HandleColor)
	http.HandleFunc("/api/hash", tools.HandleHash)
	http.HandleFunc("/api/jwt/decode", tools.HandleJWT)
	http.HandleFunc("/api/password/generate", tools.HandlePassword)
	http.HandleFunc("/api/format/sql", tools.HandleSQL)

	// Serve static files from disk
	distDir := filepath.Join(".", "dist")
	_, err := os.Stat(distDir)
	if err != nil {
		log.Printf("Warning: dist directory not found: %v", err)
	}

	fs := http.FileServer(http.Dir(distDir))
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		// Serve static files if they exist
		filePath := filepath.Join(distDir, r.URL.Path)
		if _, err := os.Stat(filePath); err == nil {
			fs.ServeHTTP(w, r)
			return
		}
		// SPA fallback: serve index.html for all other paths
		w.Header().Set("Content-Type", "text/html")
		http.ServeFile(w, r, filepath.Join(distDir, "index.html"))
	})

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	fmt.Printf("ToolHub server starting on :%s\n", port)
	log.Fatal(http.ListenAndServe(":"+port, nil))
}
