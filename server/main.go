package main

import (
	"context"
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
	readHeaderTimeout   = 10 * time.Second
	idleTimeout         = 60 * time.Second
)

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

	// 不设 WriteTimeout：一次翻译会串行请求上游多次，耗时可达分钟级，
	// 写超时会把正常的慢请求拦腰截断。上游单次请求已有 30 秒超时兜底。
	server := &http.Server{
		Addr:              ":" + port,
		ReadHeaderTimeout: readHeaderTimeout,
		IdleTimeout:       idleTimeout,
	}

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
