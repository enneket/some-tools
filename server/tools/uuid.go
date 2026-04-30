package tools

import (
	"encoding/json"
	"net/http"

	"github.com/google/uuid"
)

func HandleUUID(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	id := uuid.New()
	json.NewEncoder(w).Encode(map[string]string{"output": id.String()})
}
