package main

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"path/filepath"
	"runtime/debug"
	"syscall"
	"time"

	"toolhub/tools"
)

const (
	maxRequestBodyBytes = 1 << 20
	shutdownTimeout     = 10 * time.Second
)

var toolCatalog = []map[string]interface{}{
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
	{"name": "qrcode-decode", "endpoint": "", "method": "", "description": "Recognize QR code from image"},
	{"name": "cron", "endpoint": "", "method": "", "description": "Parse Cron expression"},
	{"name": "html-entity", "endpoint": "", "method": "", "description": "HTML entity encode/decode"},
	{"name": "unicode", "endpoint": "", "method": "", "description": "Unicode encode/decode"},
	{"name": "base", "endpoint": "", "method": "", "description": "Number base conversion"},
	{"name": "wordcount", "endpoint": "", "method": "", "description": "Count words and characters"},
	{"name": "img2base64", "endpoint": "", "method": "", "description": "Convert image to Base64"},
	{"name": "base64toimg", "endpoint": "", "method": "", "description": "Convert Base64 to image"},
	{"name": "httpstatus", "endpoint": "", "method": "", "description": "HTTP status code reference"},
	{"name": "sql", "endpoint": "/api/format/sql", "method": "POST", "description": "Format SQL query"},
	{"name": "translate", "endpoint": "/api/translate", "method": "POST", "description": "Translate text between languages"},
	{"name": "m3u8", "endpoint": "", "method": "", "description": "Download M3U8 video stream"},
	{"name": "portrait", "endpoint": "", "method": "", "description": "Portrait segmentation using AI"},
}

// withAPIContract wraps every JSON API handler so that the response media type,
// the request body ceiling and panic containment are defined in one place
// instead of per handler.
func withAPIContract(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		defer func() {
			if recovered := recover(); recovered != nil {
				log.Printf("panic serving %s: %v\n%s", r.URL.Path, recovered, debug.Stack())
				http.Error(w, "Internal server error", http.StatusInternalServerError)
			}
		}()

		if r.ContentLength > maxRequestBodyBytes {
			http.Error(w, "Request body too large", http.StatusRequestEntityTooLarge)
			return
		}
		r.Body = http.MaxBytesReader(w, r.Body, maxRequestBodyBytes)
		w.Header().Set("Content-Type", "application/json")
		next(w, r)
	}
}

func main() {
	http.HandleFunc("/api/tools", withAPIContract(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}
		json.NewEncoder(w).Encode(map[string]interface{}{
			"tools": toolCatalog,
		})
	}))

	apiRoutes := map[string]http.HandlerFunc{
		"/api/format/json":         tools.HandleJSON,
		"/api/encode/base64":       tools.HandleBase64,
		"/api/encode/url":          tools.HandleURL,
		"/api/generate/uuid":       tools.HandleUUID,
		"/api/convert/timestamp":   tools.HandleTimestamp,
		"/api/convert/color":       tools.HandleColor,
		"/api/hash":                tools.HandleHash,
		"/api/jwt/decode":          tools.HandleJWT,
		"/api/password/generate":   tools.HandlePassword,
		"/api/format/sql":          tools.HandleSQL,
		"/api/translate":           tools.HandleTranslate,
		"/api/translate/languages": tools.HandleTranslateLanguages,
	}
	for pattern, handler := range apiRoutes {
		http.HandleFunc(pattern, withAPIContract(handler))
	}

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

	server := &http.Server{Addr: ":" + port}

	shutdownRequested := make(chan os.Signal, 1)
	signal.Notify(shutdownRequested, os.Interrupt, syscall.SIGTERM)
	shutdownComplete := make(chan struct{})
	go func() {
		defer close(shutdownComplete)
		<-shutdownRequested
		shutdownContext, cancel := context.WithTimeout(context.Background(), shutdownTimeout)
		defer cancel()
		if err := server.Shutdown(shutdownContext); err != nil {
			log.Printf("graceful shutdown did not finish: %v", err)
		}
	}()

	fmt.Printf("ToolHub server starting on :%s\n", port)
	if err := server.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
		log.Fatalf("server stopped: %v", err)
	}
	<-shutdownComplete
}
