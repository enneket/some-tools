package tools

import (
	"encoding/json"
	"net/http"
	"regexp"
	"strings"
)

func HandleSQL(w http.ResponseWriter, r *http.Request) {
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

	formatted := formatSQL(req.Input)
	json.NewEncoder(w).Encode(map[string]string{"output": formatted})
}

var (
	spaceRegex = regexp.MustCompile(`[\t\r\n]+`)
)

// formatSQL collapses whitespace and formats SQL with proper indentation
func formatSQL(sql string) string {
	// Step 1: collapse all whitespace (including newlines/tabs) to single space
	s := spaceRegex.ReplaceAllString(sql, " ")
	s = strings.TrimSpace(s)

	// Step 2: collapse multiple spaces to one
	s = strings.Join(strings.Fields(s), " ")

	// Step 3: uppercase keywords
	upper := strings.ToUpper(s)

	// Step 4: format with indentation
	return formatWithIndent(upper)
}

func formatWithIndent(sql string) string {
	// Simple line-by-line formatter with keyword-based indentation
	var result strings.Builder

	// Split into statements by semicolon
	statements := strings.Split(sql, ";")
	for si, stmt := range statements {
		stmt = strings.TrimSpace(stmt)
		if stmt == "" {
			continue
		}

		// Keywords that increase indent level after them
		afterIncrease := []string{"SELECT", "FROM", "WHERE", "JOIN", "LEFT JOIN", "RIGHT JOIN",
			"INNER JOIN", "OUTER JOIN", "CROSS JOIN", "INSERT INTO", "VALUES", "UPDATE",
			"SET", "ORDER BY", "GROUP BY", "HAVING", "AND", "OR", "CASE", "WHEN", "THEN", "ELSE"}
		// Keywords that decrease indent level before them
		beforeDecrease := []string{"WHERE", "GROUP BY", "HAVING", "ORDER BY", "LIMIT", "OFFSET",
			"END", "ELSE", "THEN"}

		lines := strings.Split(stmt, " ")
		indent := 0
		for i, word := range lines {
			upper := strings.ToUpper(word)

			// Check if this word should decrease indent first
			decrease := false
			for _, kw := range beforeDecrease {
				if strings.HasPrefix(upper, kw) && (kw == upper || strings.HasPrefix(upper, kw+" ")) {
					decrease = true
					break
				}
			}
			if decrease && indent > 0 {
				indent--
			}

			// Add indentation
			for j := 0; j < indent; j++ {
				result.WriteString("  ")
			}
			result.WriteString(word)
			if i < len(lines)-1 {
				result.WriteString(" ")
			}

			// Check if next word should increase indent after this word
			for _, kw := range afterIncrease {
				if strings.HasPrefix(upper, kw) && (kw == upper || strings.HasPrefix(upper, kw+" ")) {
					indent++
					break
				}
			}
		}

		if si < len(statements)-1 {
			result.WriteString(";")
			if si < len(statements)-2 {
				result.WriteString("\n\n")
			} else {
				result.WriteString("\n")
			}
		} else if strings.TrimSpace(sql) != "" {
			result.WriteString(";")
		}
	}

	return result.String()
}
