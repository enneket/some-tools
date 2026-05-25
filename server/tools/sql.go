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
	formatted := FormatSQL(req.Input)
	json.NewEncoder(w).Encode(map[string]string{"output": formatted})
}

func FormatSQL(sql string) string {
	// Strip ALL literal backslash sequences (backslash + any char) before collapseWhitespace
	s := regexp.MustCompile(`\\.`).ReplaceAllString(sql, "")
	s = collapseWhitespace(s)
	s = upperCaseKeywords(s)
	return formatStatement(s, 0)
}

var wsRe = regexp.MustCompile(`[\t\r\n]+`)

func collapseWhitespace(s string) string {
	return strings.Join(strings.Fields(wsRe.ReplaceAllString(s, " ")), " ")
}

var keywords = []string{
	"SELECT", "FROM", "WHERE", "AND", "OR", "NOT", "IN", "IS", "NULL",
	"INSERT", "INTO", "VALUES", "UPDATE", "SET", "DELETE", "CREATE", "TABLE",
	"ALTER", "DROP", "INDEX", "JOIN", "LEFT", "RIGHT", "INNER", "OUTER", "CROSS",
	"ON", "AS", "ORDER", "BY", "GROUP", "HAVING", "LIMIT", "OFFSET",
	"DISTINCT", "COUNT", "SUM", "AVG", "MAX", "MIN", "CASE", "WHEN",
	"THEN", "ELSE", "END", "UNION", "ALL", "EXISTS", "BETWEEN", "LIKE",
	"ASC", "DESC", "PRIMARY", "KEY", "FOREIGN", "REFERENCES", "CONSTRAINT",
	"DEFAULT", "CHECK", "UNIQUE", "AUTO_INCREMENT", "INTEGER", "VARCHAR",
	"TEXT", "BOOLEAN", "DATE", "DATETIME", "TIMESTAMP", "FLOAT", "DOUBLE",
	"DECIMAL", "CHAR", "BLOB", "SERIAL", "BIGSERIAL", "CASCADE", "RESTRICT",
	"VIEW", "TRIGGER", "FUNCTION", "PROCEDURE", "BEGIN", "COMMIT", "ROLLBACK",
	"TRANSACTION", "GRANT", "REVOKE", "IF", "FOR", "LOOP", "WHILE",
	"PARTITION", "OVER", "ROW_NUMBER", "DENSE_RANK", "RANK", "WITH",
	"RECURSIVE", "USING", "ILIKE", "MATCH", "AGAINST", "FULL", "NATURAL",
	"WINDOW", "LATERAL", "RETURNING", "COALESCE", "NULLIF", "CAST", "EXTRACT",
	"ARRAY", "JSON", "JSONB",
}

func upperCaseKeywords(sql string) string {
	result := sql
	for _, kw := range keywords {
		re := regexp.MustCompile(`(?i)\b` + kw + `\b`)
		result = re.ReplaceAllStringFunc(result, strings.ToUpper)
	}
	return result
}

func formatStatement(s string, baseIndent int) string {
	s = strings.TrimSpace(s)
	if s == "" {
		return ""
	}
	// REPLACED_LITERAL_N_T: Replace literal \n \t and real \n \t with nothing to strip all whitespace
	s = strings.ReplaceAll(s, "\\n", "")
	s = strings.ReplaceAll(s, "\\t", "")
	s = strings.ReplaceAll(s, "\n", "")
	s = strings.ReplaceAll(s, "\t", "")
	indent := strings.Repeat("  ", baseIndent)

	// Top-level split: SELECT, FROM, WHERE, GROUP BY, ORDER BY, etc.
	parts := splitTopLevel(s)
	if len(parts) == 0 {
		return s
	}

	var lines []string
	for _, part := range parts {
		part = strings.TrimSpace(part)
		if part == "" {
			continue
		}
		kw := detectClause(part)
		if kw != "" {
			content := strings.TrimSpace(strings.TrimPrefix(part, kw))
			lines = append(lines, indent+kw+" "+formatClauseContent(content, kw, baseIndent+1))
		} else if isJoinKeyword(strings.ToUpper(part)) {
			lines = append(lines, indent+"  "+formatJoin(part, baseIndent+1))
		} else {
			lines = append(lines, indent+"  "+formatInline(part))
		}
	}
	return strings.Join(lines, "\n")
}

func formatClauseContent(s string, kw string, indent int) string {
	switch kw {
	case "SELECT":
		return formatSelectFields(s, indent)
	case "FROM":
		return formatFrom(s, indent)
	case "WHERE", "HAVING":
		return formatConditions(s, indent)
	case "GROUP BY":
		return formatGroupBy(s, indent)
	case "ORDER BY":
		return formatOrderBy(s, indent)
	default:
		return formatInline(s)
	}
}

func formatSelectFields(s string, indent int) string {
	ind := strings.Repeat("  ", indent)
	if strings.HasPrefix(strings.TrimSpace(s), "(") {
		return formatSubquery(s, indent)
	}
	fields := splitByCommas(s)
	var lines []string
	for i, f := range fields {
		f = strings.TrimSpace(f)
		if f == "" {
			continue
		}
		comma := ""
		if i < len(fields)-1 {
			comma = ","
		}
		lines = append(lines, ind+f+comma)
	}
	return strings.Join(lines, "\n")
}

func formatFrom(s string, indent int) string {
	ind := strings.Repeat("  ", indent)
	// Check for subquery
	trimmed := strings.TrimSpace(s)
	if strings.HasPrefix(trimmed, "(") {
		// Check if closing paren exists and what's after it
		closingIdx := findClosingParen(trimmed)
		if closingIdx >= 0 {
			inner := trimmed[1:closingIdx]
			after := strings.TrimSpace(trimmed[closingIdx+1:])
			if after != "" {
				formatted := formatSubqueryInner(inner, indent)
				restParts := splitByClauseKeywords(after)
				var parts []string
				parts = append(parts, "(\n"+formatted+"\n"+ind+")")
				var currentLines []string
				for _, p := range restParts {
					p = strings.TrimSpace(p)
					if p == "" {
						continue
					}
					upper := strings.ToUpper(p)
					if isJoinKeyword(upper) {
						// Flush accumulated lines before this JOIN
						for _, l := range currentLines {
							parts = append(parts, ind+"  "+l)
						}
						currentLines = nil
						// Check if previous part ends with "ON" that needs this JOIN's condition
						if len(parts) > 0 {
							last := parts[len(parts)-1]
							if strings.HasSuffix(last, "ON") || strings.HasSuffix(last, "ON ") {
								// Combine ON with this JOIN
								lastLine := last + " " + p
								parts[len(parts)-1] = lastLine
								continue
							}
						}
						parts = append(parts, formatJoin(p, indent))
					} else if strings.HasPrefix(upper, "ON ") || strings.HasPrefix(upper, "ON(") {
						currentLines = append(currentLines, p)
					} else {
						currentLines = append(currentLines, p)
					}
				}
				for _, l := range currentLines {
					parts = append(parts, ind+"  "+l)
				}
				return strings.Join(parts, "\n")
			}
			return "(\n" + formatSubqueryInner(inner, indent) + "\n" + ind + ")"
		}
	}
	// Split by WHERE, GROUP BY, ORDER BY, LIMIT
	parts := splitByClauseKeywords(s)
	var lines []string
	for _, p := range parts {
		p = strings.TrimSpace(p)
		if p == "" {
			continue
		}
		upper := strings.ToUpper(p)
		if strings.HasPrefix(upper, "WHERE") {
			content := strings.TrimPrefix(p, "WHERE")
			content = strings.TrimSpace(content)
			lines = append(lines, "WHERE\n"+ind+"  "+formatConditions(content, indent+1))
		} else if strings.HasPrefix(upper, "GROUP BY") {
			content := strings.TrimPrefix(p, "GROUP BY")
			content = strings.TrimSpace(content)
			lines = append(lines, "GROUP BY\n"+ind+"  "+formatGroupBy(content, indent+1))
		} else if strings.HasPrefix(upper, "ORDER BY") {
			content := strings.TrimPrefix(p, "ORDER BY")
			content = strings.TrimSpace(content)
			lines = append(lines, "ORDER BY\n"+ind+"  "+formatOrderBy(content, indent+1))
		} else if isJoinKeyword(upper) {
			lines = append(lines, formatJoin(p, indent))
		} else {
			lines = append(lines, formatInline(p))
		}
	}
	return strings.Join(lines, "\n")
}

func formatConditions(s string, indent int) string {
	ind := strings.Repeat("  ", indent)
	// Split by AND and OR (respecting parentheses)
	parts := splitByKeywords(s, []string{"AND", "OR"})
	var lines []string
	var pendingKeyword string
	for _, p := range parts {
		p = strings.TrimSpace(p)
		if p == "" {
			continue
		}
		upper := strings.ToUpper(p)
		if upper == "AND" || upper == "OR" {
			pendingKeyword = upper
			continue
		}
		content := formatInline(p)
		if pendingKeyword != "" {
			lines = append(lines, ind+pendingKeyword+" "+content)
			pendingKeyword = ""
		} else {
			lines = append(lines, ind+content)
		}
	}
	return strings.Join(lines, "\n")
}

func splitByKeywords(s string, kws []string) []string {
	var result []string
	var current strings.Builder
	depth := 0
	i := 0
	for i < len(s) {
		if s[i] == '(' {
			depth++
			current.WriteByte(s[i])
			i++
			continue
		}
		if s[i] == ')' {
			depth--
			current.WriteByte(s[i])
			i++
			continue
		}
		if depth == 0 {
			matched := false
			for _, kw := range kws {
				// Need to check bounds before HasPrefix
				if i+len(kw) <= len(s) && strings.HasPrefix(s[i:], kw) {
					next := i + len(kw)
					isBoundary := next >= len(s) || !isIdent(s[next])
					isStart := i == 0 || !isIdent(s[i-1])
					if isBoundary && isStart {
						if current.Len() > 0 {
							result = append(result, current.String())
							current.Reset()
						}
						result = append(result, kw)
						i += len(kw)
						matched = true
						break
					}
				}
			}
			if !matched {
				current.WriteByte(s[i])
				i++
			}
		} else {
			current.WriteByte(s[i])
			i++
		}
	}
	if current.Len() > 0 {
		result = append(result, current.String())
	}
	return result
}

func formatGroupBy(s string, indent int) string {
	ind := strings.Repeat("  ", indent)
	fields := splitByCommas(s)
	var lines []string
	for _, f := range fields {
		f = strings.TrimSpace(f)
		if f == "" {
			continue
		}
		lines = append(lines, ind+f)
	}
	return strings.Join(lines, ",\n")
}

func formatOrderBy(s string, indent int) string {
	ind := strings.Repeat("  ", indent)
	fields := splitByCommas(s)
	var lines []string
	for _, f := range fields {
		f = strings.TrimSpace(f)
		if f == "" {
			continue
		}
		lines = append(lines, ind+f)
	}
	return strings.Join(lines, ",\n")
}

// findONKeyword finds " ON " at top level (depth=0), ignoring those inside parentheses
func findONKeyword(s string) int {
	depth := 0
	for i := 0; i <= len(s)-4; i++ {
		if s[i] == '(' {
			depth++
			continue
		}
		if s[i] == ')' {
			depth--
			continue
		}
		if depth == 0 && strings.HasPrefix(s[i:], " ON ") {
			return i
		}
	}
	return -1
}

// formatTablePart formats a table reference, handling subqueries specially
func formatTablePart(s string, indent int) string {
	trimmed := strings.TrimSpace(s)
	if strings.HasPrefix(trimmed, "(") {
		closingIdx := findClosingParen(trimmed)
		if closingIdx >= 0 {
			inner := trimmed[1:closingIdx]
			after := strings.TrimSpace(trimmed[closingIdx+1:])
			formattedInner := formatSubqueryInner(inner, indent)
			if after != "" {
				// Has alias after subquery: "(...) alias"
				return "(\n" + formattedInner + "\n" + strings.Repeat("  ", indent) + ")" + " " + after
			}
			return "(\n" + formattedInner + "\n" + strings.Repeat("  ", indent) + ")"
		}
	}
	return formatInline(s)
}

func formatJoin(s string, indent int) string {
	ind := strings.Repeat("  ", indent)
	upper := strings.ToUpper(s)

	// Extract join type — handle alias prefix before JOIN
	joinType := ""
	rest := s
	for _, jt := range []string{"LEFT JOIN", "RIGHT JOIN", "INNER JOIN", "OUTER JOIN", "CROSS JOIN", "FULL JOIN", "LEFT OUTER JOIN", "JOIN"} {
		idx := strings.Index(upper, jt)
		if idx >= 0 {
			joinType = jt
			rest = strings.TrimSpace(s[idx+len(jt):])
			// If there was content before the join type (alias), keep it
			prefix := strings.TrimSpace(s[:idx])
			if prefix != "" {
				rest = prefix + " " + joinType + " " + rest
				joinType = "" // indicate we already have full rest
			}
			break
		}
	}

	// If we have full rest (original logic without alias prefix)
	if joinType == "" {
		// rest already contains "alias JOIN table ON ..."
		parts := splitByKeywords(rest, []string{" ON ", " ON("})
		if len(parts) >= 2 {
			// Re-extract join type and table from first part
			first := parts[0]
			firstUpper := strings.ToUpper(first)
			for _, jt := range []string{"LEFT JOIN", "RIGHT JOIN", "INNER JOIN", "OUTER JOIN", "CROSS JOIN", "FULL JOIN", "LEFT OUTER JOIN", "JOIN"} {
				jtIdx := strings.Index(firstUpper, jt)
				if jtIdx >= 0 {
					joinType = jt
					alias := strings.TrimSpace(first[:jtIdx])
					tablePart := strings.TrimSpace(first[jtIdx+len(jt):])
					// Only use parts[1] as condition, not all remaining parts
					condPart := strings.TrimSpace(parts[1])
					condFormatted := formatConditions(condPart, indent+1)
					if alias != "" {
						return ind + joinType + " " + alias + " " + tablePart + "\n" + ind + "  ON " + condFormatted
					}
					return ind + joinType + " " + formatInline(tablePart) + "\n" + ind + "  ON " + condFormatted
				}
			}
		}
		// Fallback: inline everything
		return ind + formatInline(rest)
	}

	// Split rest by ON keyword - find first " ON " not inside parentheses
	onIdx := findONKeyword(rest)
	if onIdx >= 0 {
		tablePart := strings.TrimSpace(rest[:onIdx])
		condPart := strings.TrimSpace(rest[onIdx+4:])
		condFormatted := formatConditions(condPart, indent+1)
		// Check if tablePart is a subquery - starts with ( and has closing )
		tableFormatted := formatTablePart(tablePart, indent)
		return ind + joinType + " " + tableFormatted + "\n" + ind + "  ON " + condFormatted
	}
	return ind + joinType + " " + formatInline(rest)
}

func formatSubquery(s string, indent int) string {
	ind := strings.Repeat("  ", indent-1)
	inner := strings.TrimSpace(s)
	if strings.HasPrefix(inner, "(") && strings.HasSuffix(inner, ")") {
		inner = inner[1 : len(inner)-1]
	}
	sub := formatStatement(inner, indent)
	return "(\n" + sub + "\n" + ind + ")"
}

func formatSubqueryInner(s string, indent int) string {
	return formatStatement(s, indent)
}

func findClosingParen(s string) int {
	depth := 0
	for i := 0; i < len(s); i++ {
		if s[i] == '(' {
			depth++
		} else if s[i] == ')' {
			depth--
			if depth == 0 {
				return i
			}
		}
	}
	return -1
}

func formatInline(s string) string {
	s = strings.TrimSpace(s)
	s = regexp.MustCompile(`\s*([=<>!]+)\s*`).ReplaceAllString(s, " $1 ")
	s = regexp.MustCompile(`\s+`).ReplaceAllString(s, " ")
	return s
}

// ---- Splitting helpers ----

// splitTopLevel splits by top-level clause keywords (not inside parens)
func splitTopLevel(s string) []string {
	clauseStarts := []string{
		"SELECT", "FROM", "WHERE", "ORDER BY", "GROUP BY", "HAVING",
		"LIMIT", "OFFSET", "UNION", "EXCEPT", "INTERSECT",
		"INSERT INTO", "VALUES", "UPDATE", "SET",
		"DELETE FROM", "CREATE TABLE", "ALTER TABLE", "WITH",
	}
	var result []string
	var current strings.Builder
	depth := 0
	i := 0
	for i < len(s) {
		if s[i] == '(' {
			depth++
			current.WriteByte(s[i])
			i++
			continue
		}
		if s[i] == ')' {
			depth--
			current.WriteByte(s[i])
			i++
			continue
		}
		if depth == 0 {
			matched := false
			for _, kw := range clauseStarts {
				if strings.HasPrefix(s[i:], kw) {
					next := i + len(kw)
					isBoundary := next >= len(s) || !isIdent(s[next])
					isStart := i == 0 || !isIdent(s[i-1])
					if isBoundary && isStart {
						// Flush content before this keyword
						if current.Len() > 0 {
							result = append(result, current.String())
							current.Reset()
						}
						// Write keyword to current (it will be flushed when we see the next keyword)
						current.WriteString(kw)
						i += len(kw)
						matched = true
						break
					}
				}
			}
			if !matched {
				current.WriteByte(s[i])
				i++
			}
		} else {
			current.WriteByte(s[i])
			i++
		}
	}
	if current.Len() > 0 {
		result = append(result, current.String())
	}
	return result
}

// splitByClauseKeywords splits on WHERE/GROUP BY/ORDER BY/LIMIT inside FROM content
func splitByClauseKeywords(s string) []string {
	kwMap := []string{"WHERE", "GROUP BY", "ORDER BY", "LIMIT", "OFFSET", "ON", "INNER JOIN", "LEFT JOIN", "RIGHT JOIN", "FULL JOIN", "CROSS JOIN", "OUTER JOIN", "JOIN"}
	return splitByMultipleKeywords(s, kwMap)
}

// splitByKeyword splits on a keyword (respecting parentheses)
func splitByKeyword(s string, kw string) []string {
	var result []string
	var current strings.Builder
	depth := 0
	i := 0
	for i < len(s) {
		// Always track parens depth to avoid splitting inside them
		if s[i] == '(' {
			depth++
			current.WriteByte(s[i])
			i++
			continue
		}
		if s[i] == ')' {
			depth--
			current.WriteByte(s[i])
			i++
			continue
		}
		if depth == 0 && i+len(kw) <= len(s) && strings.HasPrefix(s[i:], kw) {
			next := i + len(kw)
			isBoundary := next >= len(s) || !isIdent(s[next])
			isStart := i == 0 || !isIdent(s[i-1])
			if isBoundary && isStart {
				if current.Len() > 0 {
					result = append(result, current.String())
					current.Reset()
				}
				result = append(result, kw)
				i += len(kw)
				continue
			}
		}
		current.WriteByte(s[i])
		i++
	}
	if current.Len() > 0 {
		result = append(result, current.String())
	}
	return result
}

func splitByMultipleKeywords(s string, kws []string) []string {
	var result []string
	var current strings.Builder
	depth := 0
	i := 0
	for i < len(s) {
		if s[i] == '(' {
			depth++
			current.WriteByte(s[i])
			i++
			continue
		}
		if s[i] == ')' {
			depth--
			current.WriteByte(s[i])
			i++
			continue
		}
		if depth == 0 {
			matched := false
			for _, kw := range kws {
				if strings.HasPrefix(s[i:], kw) {
					next := i + len(kw)
					isBoundary := next >= len(s) || !isIdent(s[next])
					isStart := i == 0 || !isIdent(s[i-1])
					if isBoundary && isStart {
						if current.Len() > 0 {
							result = append(result, current.String())
							current.Reset()
						}
						// For JOIN keywords, use longerKeyword to handle compound types first
						if strings.HasSuffix(kw, "JOIN") {
							joinStart := i
							joinKw := longerKeyword(kws, s, i)
							i += len(joinKw)
							// Collect content until next keyword or end
							for i < len(s) {
								foundNext := false
								for _, nextKw := range kws {
									if i+len(nextKw) <= len(s) && strings.HasPrefix(s[i:], nextKw) {
										nextNext := i + len(nextKw)
										nextIsBoundary := nextNext >= len(s) || !isIdent(s[nextNext])
										nextIsStart := i == 0 || !isIdent(s[i-1])
										if nextIsBoundary && nextIsStart {
											foundNext = true
											break
										}
									}
								}
								if foundNext {
									break
								}
								current.WriteByte(s[i])
								i++
							}
							result = append(result, s[joinStart:i])
							matched = true
							break
						}
					}
				}
			}
			if !matched {
				current.WriteByte(s[i])
				i++
			}
		} else {
			current.WriteByte(s[i])
			i++
		}
	}
	if current.Len() > 0 {
		result = append(result, current.String())
	}
	return result
}

func splitByCommas(s string) []string {
	var result []string
	var current strings.Builder
	depth := 0
	for i := 0; i < len(s); i++ {
		if s[i] == '(' {
			depth++
			current.WriteByte(s[i])
		} else if s[i] == ')' {
			depth--
			current.WriteByte(s[i])
		} else if s[i] == ',' && depth == 0 {
			result = append(result, current.String())
			current.Reset()
		} else {
			current.WriteByte(s[i])
		}
	}
	if current.Len() > 0 {
		result = append(result, current.String())
	}
	return result
}

func findKeyword(s string, kw string, respectParens bool) int {
	depth := 0
	for i := 0; i <= len(s)-len(kw); i++ {
		if respectParens {
			if s[i] == '(' {
				depth++
				continue
			}
			if s[i] == ')' {
				depth--
				continue
			}
		}
		if depth == 0 && strings.HasPrefix(s[i:], kw) {
			next := i + len(kw)
			isBoundary := next >= len(s) || !isIdent(s[next])
			if isBoundary {
				return i
			}
		}
	}
	return -1
}

func detectClause(s string) string {
	s = strings.TrimSpace(s)
	upper := strings.ToUpper(s)
	for _, kw := range []string{"SELECT", "FROM", "WHERE", "ORDER BY", "GROUP BY",
		"HAVING", "LIMIT", "OFFSET", "UNION", "INSERT INTO", "VALUES",
		"UPDATE", "SET", "DELETE FROM", "WITH"} {
		if strings.HasPrefix(upper, kw) {
			return kw
		}
	}
	return ""
}

func isJoinKeyword(s string) bool {
	joinTypes := []string{"LEFT JOIN", "RIGHT JOIN", "INNER JOIN", "OUTER JOIN", "CROSS JOIN", "FULL JOIN", "LEFT OUTER JOIN", "JOIN"}
	for _, j := range joinTypes {
		if strings.HasPrefix(s, j) {
			return true
		}
	}
	return false
}

func isIdent(c byte) bool {
	return (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') ||
		(c >= '0' && c <= '9') || c == '_'
}

// longerKeyword matches compound JOIN keywords before simple ones
func longerKeyword(kws []string, s string, i int) string {
	for _, kw := range kws {
		if i+len(kw) <= len(s) && strings.HasPrefix(s[i:], kw) {
			return kw
		}
	}
	return ""
}
