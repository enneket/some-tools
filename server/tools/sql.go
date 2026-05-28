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
		SQL   string `json:"sql"`
		Input string `json:"input"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}
	sql := req.SQL
	if sql == "" {
		sql = req.Input
	}
	formatted := FormatSQL(sql)
	json.NewEncoder(w).Encode(map[string]string{"output": formatted})
}

func FormatSQL(sql string) string {
	// Strip ALL literal backslash sequences (backslash + any char) before collapseWhitespace
	// Use SPACE as replacement to preserve token separation
	s := regexp.MustCompile(`\\.`).ReplaceAllString(sql, " ")
	s = collapseWhitespace(s)
	// Ensure space before SQL keywords to prevent token concatenation
	s = ensureKeywordSpacing(s)
	s = upperCaseKeywords(s)
	return formatStatement(s, 0)
}

var wsRe = regexp.MustCompile(`[\t\r\n]+`)

func collapseWhitespace(s string) string {
	return strings.Join(strings.Fields(wsRe.ReplaceAllString(s, " ")), " ")
}

// ensureKeywordSpacing adds space before SQL keywords if missing to prevent token concatenation
func ensureKeywordSpacing(s string) string {
	keywords := []string{"SELECT", "FROM", "WHERE", "AND", "OR", "JOIN", "ON", "GROUP BY", "ORDER BY", "LIMIT", "OFFSET", "INNER", "LEFT", "RIGHT", "CROSS", "FULL", "OUTER", "HAVING", "UNION", "AS", "CASE", "WHEN", "THEN", "ELSE", "END", "IN", "NOT", "IS", "NULL", "EXISTS", "BETWEEN", "LIKE"}

	result := s
	for _, kw := range keywords {
		searchFrom := 0
		for {
			pos := strings.Index(result[searchFrom:], kw)
			if pos < 0 {
				break
			}
			realIdx := searchFrom + pos
			if realIdx > 0 && result[realIdx-1] != ' ' {
				prevChar := result[realIdx-1]
				if prevChar == '_' || (prevChar >= 'a' && prevChar <= 'z') || (prevChar >= 'A' && prevChar <= 'Z') || (prevChar >= '0' && prevChar <= '9') {
					searchFrom = realIdx + 1
					continue
				}
				result = result[:realIdx] + " " + result[realIdx:]
				searchFrom = realIdx + len(kw) + 1
			} else {
				searchFrom = realIdx + len(kw) + 1
			}
		}
	}
	return result
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
			formatted := formatClauseContent(content, kw, baseIndent+1)
			// formatClauseContent adds its own indent; strip leading indent from first line
			// so keyword and first content appear on the same line: "SELECT o.id"
			formatted = strings.TrimLeft(formatted, " ")
			lines = append(lines, indent+kw+" "+formatted)
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
	case "LIMIT", "OFFSET":
		return strings.TrimSpace(s)
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
	if len(fields) == 0 {
		return ""
	}
	// First field: no indent prefix so SELECT keyword and first field stay on same line
	first := strings.TrimSpace(fields[0])
	var rest []string
	for i := 1; i < len(fields); i++ {
		f := strings.TrimSpace(fields[i])
		if f == "" {
			continue
		}
		rest = append(rest, ind+f+",")
	}
	if len(rest) == 0 {
		return first + ","
	}
	return first + ",\n" + strings.Join(rest, "\n")
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
				// Extract alias (first word after closing paren)
				alias, rest := extractFirstWord(after)
				// If alias is "AS", the real alias is in rest
				if strings.ToUpper(alias) == "AS" {
					alias2, rest2 := extractFirstWord(rest)
					alias = alias + " " + alias2
					rest = rest2
				}
				var parts []string
				indInner := strings.Repeat("  ", indent+1)
				parts = append(parts, "(\n"+formatted+"\n"+indInner+") "+alias)
				// Split rest into individual JOINs (each with its ON clause) and trailing clauses
				joins, trailing := splitRestIntoJoins(rest)
				for _, j := range joins {
					parts = append(parts, formatJoin(j, indent))
				}
				// Handle trailing WHERE/GROUP BY/ORDER BY/LIMIT
				trailingParts := splitByClauseKeywords(trailing)
				for _, p := range trailingParts {
					p = strings.TrimSpace(p)
					if p == "" {
						continue
					}
					upper := strings.ToUpper(p)
					if strings.HasPrefix(upper, "WHERE") {
						content := strings.TrimSpace(strings.TrimPrefix(p, "WHERE"))
						parts = append(parts, "WHERE\n"+ind+"  "+formatConditions(content, indent+1))
					} else if strings.HasPrefix(upper, "GROUP BY") {
						content := strings.TrimSpace(strings.TrimPrefix(p, "GROUP BY"))
						parts = append(parts, "GROUP BY\n"+ind+"  "+formatGroupBy(content, indent+1))
					} else if strings.HasPrefix(upper, "ORDER BY") {
						content := strings.TrimSpace(strings.TrimPrefix(p, "ORDER BY"))
						parts = append(parts, "ORDER BY\n"+ind+"  "+formatOrderBy(content, indent+1))
					}
				}
				return strings.Join(parts, "\n")
			}
			indInner := strings.Repeat("  ", indent+1)
			return "(\n" + formatSubqueryInner(inner, indent) + "\n" + indInner + ")"
		}
	}
	// No subquery - split by JOINs and trailing clauses
	joins, trailing := splitRestIntoJoins(s)
	var lines []string
	for _, j := range joins {
		lines = append(lines, formatJoin(j, indent))
	}
	// Handle trailing WHERE/GROUP BY/ORDER BY/LIMIT
	trailingParts := splitByClauseKeywords(trailing)
	for _, p := range trailingParts {
		p = strings.TrimSpace(p)
		if p == "" {
			continue
		}
		upper := strings.ToUpper(p)
		if strings.HasPrefix(upper, "WHERE") {
			content := strings.TrimSpace(strings.TrimPrefix(p, "WHERE"))
			lines = append(lines, "WHERE\n"+ind+"  "+formatConditions(content, indent+1))
		} else if strings.HasPrefix(upper, "GROUP BY") {
			content := strings.TrimSpace(strings.TrimPrefix(p, "GROUP BY"))
			lines = append(lines, "GROUP BY\n"+ind+"  "+formatGroupBy(content, indent+1))
		} else if strings.HasPrefix(upper, "ORDER BY") {
			content := strings.TrimSpace(strings.TrimPrefix(p, "ORDER BY"))
			lines = append(lines, "ORDER BY\n"+ind+"  "+formatOrderBy(content, indent+1))
		}
	}
	return strings.Join(lines, "\n")
}

// extractFirstWord splits "word rest" into ("word", "rest")
func extractFirstWord(s string) (string, string) {
	s = strings.TrimSpace(s)
	for i := 0; i < len(s); i++ {
		if s[i] == ' ' || s[i] == '\t' || s[i] == '\n' {
			return s[:i], strings.TrimSpace(s[i:])
		}
	}
	return s, ""
}

// splitRestIntoJoins splits the rest of a FROM clause into individual JOIN segments (each with ON clause)
// and any trailing non-JOIN content (WHERE, GROUP BY, ORDER BY, LIMIT).
// joinKwTypes lists compound join keywords (longer first) for matching.
var joinKwTypes = []string{"LEFT OUTER JOIN", "RIGHT OUTER JOIN", "FULL OUTER JOIN", "INNER JOIN", "LEFT JOIN", "RIGHT JOIN", "FULL JOIN", "CROSS JOIN", "JOIN"}

func splitRestIntoJoins(rest string) (joins []string, trailing string) {
	rest = strings.TrimSpace(rest)
	if rest == "" {
		return nil, ""
	}

	i := 0
	lastJoinEnd := 0

	for i < len(rest) {
		// Track parentheses to avoid matching inside subqueries
		if rest[i] == '(' {
			depth := 1
			i++
			for i < len(rest) && depth > 0 {
				if rest[i] == '(' {
					depth++
				} else if rest[i] == ')' {
					depth--
				}
				i++
			}
			continue
		}

		// Check for trailing clause keywords at depth 0
		for _, tw := range []string{"WHERE", "GROUP BY", "ORDER BY", "LIMIT", "OFFSET"} {
			if i+len(tw) <= len(rest) && strings.HasPrefix(rest[i:], tw) {
				next := i + len(tw)
				isBoundary := next >= len(rest) || !isIdent(rest[next])
				isStart := i == 0 || !isIdent(rest[i-1])
				if isBoundary && isStart {
					trailing = rest[i:]
					if lastJoinEnd > 0 {
						joins = append(joins, strings.TrimSpace(rest[:lastJoinEnd]))
					}
					return
				}
			}
		}

		// Check for JOIN keyword
		matched := false
		for _, jkw := range joinKwTypes {
			if i+len(jkw) <= len(rest) && strings.HasPrefix(rest[i:], jkw) {
				next := i + len(jkw)
				isBoundary := next >= len(rest) || !isIdent(rest[next])
				isStart := i == 0 || !isIdent(rest[i-1])
				if isBoundary && isStart {
					// If we have a previous JOIN accumulated, save it
					if lastJoinEnd > 0 {
						joins = append(joins, strings.TrimSpace(rest[:lastJoinEnd]))
						rest = rest[lastJoinEnd:]
						i = 0
					} else if i > 0 {
						// Content before the first JOIN (e.g., table name) — save as separate segment
						joins = append(joins, strings.TrimSpace(rest[:i]))
						rest = rest[i:]
						i = 0
					}
					// Now find where this JOIN ends — at the next JOIN keyword or trailing keyword or end
					j := i + len(jkw)
					joinEnd := len(rest) // default: rest of string
					for j < len(rest) {
						// Skip parenthesized content
						if rest[j] == '(' {
							d := 1
							j++
							for j < len(rest) && d > 0 {
								if rest[j] == '(' {
									d++
								} else if rest[j] == ')' {
									d--
								}
								j++
							}
							continue
						}
						// Check for trailing keywords
						isTrailing := false
						for _, tw := range []string{"WHERE", "GROUP BY", "ORDER BY", "LIMIT", "OFFSET"} {
							if j+len(tw) <= len(rest) && strings.HasPrefix(rest[j:], tw) {
								n := j + len(tw)
								ib := n >= len(rest) || !isIdent(rest[n])
								is := j == 0 || !isIdent(rest[j-1])
								if ib && is {
									joinEnd = j
									isTrailing = true
									break
								}
							}
						}
						if isTrailing {
							break
						}
						// Check for next JOIN keyword
						for _, nkw := range joinKwTypes {
							if j+len(nkw) <= len(rest) && strings.HasPrefix(rest[j:], nkw) {
								n := j + len(nkw)
								ib := n >= len(rest) || !isIdent(rest[n])
								is := j == 0 || !isIdent(rest[j-1])
								if ib && is {
									joinEnd = j
									goto doneJoin
								}
							}
						}
						j++
					}
				doneJoin:
					joins = append(joins, strings.TrimSpace(rest[:joinEnd]))
					rest = rest[joinEnd:]
					i = 0
					lastJoinEnd = 0
					matched = true
					break
				}
			}
		}
		if !matched {
			i++
			lastJoinEnd = i
		}
	}
	if strings.TrimSpace(rest) != "" {
		joins = append(joins, strings.TrimSpace(rest))
	}
	return
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
	s = strings.TrimSpace(s)
	// If all fields are simple identifiers (no functions, no expressions),
	// keep them on one line
	if isSimpleFieldList(s) {
		return s
	}
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
	s = strings.TrimSpace(s)
	// If all fields are simple identifiers, keep on one line
	if isSimpleFieldList(s) {
		return s
	}
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

// findONKeyword finds "ON" at top level (depth=0), ignoring those inside parentheses.
// Matches "ON " or "ON(" — the space before ON is required to avoid matching "CONDITION".
func findONKeyword(s string) int {
	depth := 0
	for i := 0; i < len(s)-1; i++ {
		if s[i] == '(' {
			depth++
			continue
		}
		if s[i] == ')' {
			depth--
			continue
		}
		if depth == 0 && s[i] == 'O' && i+2 <= len(s) && s[i:i+2] == "ON" {
			// Must be preceded by space (or start of string)
			if i > 0 && s[i-1] != ' ' {
				continue
			}
			// Must be followed by space or ( to be the ON keyword
			after := i + 2
			if after < len(s) && (s[after] == ' ' || s[after] == '(') {
				return i
			}
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

	// First find the leftmost JOIN keyword at a word boundary, then determine its type.
	// This avoids matching JOIN keywords inside subqueries.
	joinStart := -1
	for i := 0; i < len(s); i++ {
		if !isIdent(s[i]) {
			continue
		}
		// Try each join type at this position
		for _, jt := range []string{"LEFT OUTER JOIN", "RIGHT OUTER JOIN", "FULL OUTER JOIN", "INNER JOIN", "LEFT JOIN", "RIGHT JOIN", "FULL JOIN", "CROSS JOIN", "JOIN"} {
			if i+len(jt) <= len(s) && strings.HasPrefix(upper[i:], jt) {
				end := i + len(jt)
				if end >= len(s) || !isIdent(s[end]) {
					joinStart = i
					i = len(s) // exit outer loop
					break
				}
			}
		}
	}

	if joinStart < 0 {
		return ind + formatInline(s)
	}

	// Now determine join type from the known position
	joinType := ""
	for _, jt := range []string{"LEFT OUTER JOIN", "RIGHT OUTER JOIN", "FULL OUTER JOIN", "INNER JOIN", "LEFT JOIN", "RIGHT JOIN", "FULL JOIN", "CROSS JOIN", "JOIN"} {
		if joinStart+len(jt) <= len(s) && strings.HasPrefix(upper[joinStart:], jt) {
			joinType = jt
			break
		}
	}

	if joinType == "" {
		return ind + formatInline(s)
	}

	// Get the table part (everything after JOIN keyword) and any prefix before it
	prefix := strings.TrimSpace(s[:joinStart])
	tableAndRest := strings.TrimSpace(s[joinStart+len(joinType):])

	// Find ON at top level (not inside parentheses)
	onIdx := findONKeyword(tableAndRest)
	if onIdx >= 0 {
		tablePart := strings.TrimSpace(tableAndRest[:onIdx])
		condPart := strings.TrimSpace(tableAndRest[onIdx+2:])
		condFormatted := formatConditions(condPart, indent+1)
		// formatConditions adds its own indent; strip it since we add ind + "  ON " prefix.
		// For multi-line conditions, re-indent continuation lines to align with ON.
		condLines := strings.Split(condFormatted, "\n")
		for i := range condLines {
			condLines[i] = strings.TrimLeft(condLines[i], " ")
		}
		condStr := condLines[0]
		if len(condLines) > 1 {
			continuationIndent := ind + "     "
			condStr = condStr + "\n" + continuationIndent + strings.Join(condLines[1:], "\n"+continuationIndent)
		}
		tableFormatted := formatTablePart(tablePart, indent)
		result := ind + joinType + " " + tableFormatted + "\n" + ind + "  ON " + condStr
		if prefix != "" {
			result = prefix + " " + result
		}
		return result
	}
	// No ON clause (e.g., CROSS JOIN)
	result := ind + joinType + " " + formatInline(tableAndRest)
	if prefix != "" {
		result = prefix + " " + result
	}
	return result
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
									// Check if the found keyword is ON — if so, collect through ON+condition
									onKw := "ON"
									if i+len(onKw) <= len(s) && strings.HasPrefix(s[i:], onKw) &&
										(i == 0 || !isIdent(s[i-1])) &&
										(i+len(onKw) >= len(s) || !isIdent(s[i+len(onKw)])) {
										// Skip past ON keyword
										i += len(onKw)
										// Collect condition until next major keyword or end
										for i < len(s) {
											foundNext2 := false
											for _, nextKw2 := range kws {
												if i+len(nextKw2) <= len(s) && strings.HasPrefix(s[i:], nextKw2) {
													nextNext2 := i + len(nextKw2)
													nextIsBoundary2 := nextNext2 >= len(s) || !isIdent(s[nextNext2])
													nextIsStart2 := i == 0 || !isIdent(s[i-1])
													if nextIsBoundary2 && nextIsStart2 {
														foundNext2 = true
														break
													}
												}
											}
											if foundNext2 {
												break
											}
											i++
										}
									}
									break
								}
								i++
							}
							// Trim trailing whitespace from collected JOIN content
							joinContent := strings.TrimRight(s[joinStart:i], " \t")
							if len(joinContent) > 0 {
								result = append(result, joinContent)
							}
							current.Reset()
							matched = true
							break
						}
						// Non-JOIN keyword: append it and advance past it
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

// isSimpleFieldList checks if a field list contains only simple identifiers
// (letters, digits, underscores, dots) separated by commas. Used to decide
// whether to keep GROUP BY / ORDER BY fields on one line.
func isSimpleFieldList(s string) bool {
	s = strings.TrimSpace(s)
	if s == "" {
		return false
	}
	for i := 0; i < len(s); i++ {
		c := s[i]
		// Skip allowed characters
		if (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') ||
			(c >= '0' && c <= '9') || c == '_' || c == '.' || c == ' ' || c == '\t' {
			continue
		}
		// Comma at depth 0 is ok
		if c == ',' {
			continue
		}
		// Any other character means it's not simple
		return false
	}
	return true
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
