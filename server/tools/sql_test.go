package tools

import "testing"

func TestFormatSQLWhitespace(t *testing.T) {
	cases := []struct {
		name string
		sql  string
		want string
	}{
		{
			name: "literal-backslash-n",
			sql:  `SELECT * FROM users WHERE id=1\nAND name='x'`,
			want: "SELECT *\nFROM users\nWHERE id = 1\n  AND name = 'x'",
		},
		{
			name: "literal-backslash-t",
			sql:  `SELECT\tid,\tname\nFROM users\nWHERE id=1`,
			want: "SELECT id,\n  name\nFROM users\nWHERE id = 1",
		},
		{
			name: "literal-crlf",
			sql:  `SELECT * FROM users WHERE id=1\r\nAND name='x'`,
			want: "SELECT *\nFROM users\nWHERE id = 1\n  AND name = 'x'",
		},
		{
			name: "actual-newline-and-tab",
			sql:  "SELECT\t*\nFROM users\nWHERE id = 1",
			want: "SELECT *\nFROM users\nWHERE id = 1",
		},
		{
			name: "no-trailing-comma-single-field",
			sql:  "SELECT * FROM users",
			want: "SELECT *\nFROM users",
		},
		{
			name: "no-trailing-comma-multi-field",
			sql:  "SELECT id, name, age FROM users",
			want: "SELECT id,\n  name,\n  age\nFROM users",
		},
		{
			name: "string-literal-escapes-preserved",
			sql:  `INSERT INTO t VALUES ('line1\nline2', 'C:\new\dir')`,
			want: "INSERT INTO t\nVALUES ('line1\\nline2', 'C:\\new\\dir')",
		},
		{
			name: "string-literal-quote-escape-preserved",
			sql:  `SELECT 'it\'s' AS quote`,
			want: "SELECT 'it\\'s' AS quote",
		},
		{
			name: "string-literal-doubled-quote",
			sql:  `SELECT 'it''s' AS quote`,
			want: "SELECT 'it''s' AS quote",
		},
		{
			name: "keyword-inside-string-not-uppercased",
			sql:  `SELECT name FROM users WHERE status = 'from'`,
			want: "SELECT name\nFROM users\nWHERE status = 'from'",
		},
		{
			name: "string-literal-not-split-by-from",
			sql:  `SELECT name FROM users WHERE note = 'from the table'`,
			want: "SELECT name\nFROM users\nWHERE note = 'from the table'",
		},
		{
			name: "backtick-identifier-with-tab-preserved",
			sql:  "SELECT `a\tb` FROM t",
			want: "SELECT `a\tb`\nFROM t",
		},
		{
			name: "keyword-concatenated-with-star",
			sql:  `SELECT*FROM users WHERE id=1`,
			want: "SELECT *\nFROM users\nWHERE id = 1",
		},
	}
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			got := FormatSQL(c.sql)
			if got != c.want {
				t.Errorf("FormatSQL(%q)\n got: %q\nwant: %q", c.sql, got, c.want)
			}
		})
	}
}
