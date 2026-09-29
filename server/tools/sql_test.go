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

func TestFormatSQLCore(t *testing.T) {
	cases := []struct {
		name string
		sql  string
		want string
	}{
		// JOIN variants — each must render the join type in uppercase with ON below
		{
			name: "join-plain",
			sql:  "SELECT id FROM users JOIN orders ON users.id=orders.user_id",
			want: "SELECT id\nFROM users\n  JOIN orders\n    ON users.id = orders.user_id",
		},
		{
			name: "join-left",
			sql:  "SELECT id FROM users LEFT JOIN orders ON users.id=orders.user_id",
			want: "SELECT id\nFROM users\n  LEFT JOIN orders\n    ON users.id = orders.user_id",
		},
		{
			name: "join-right",
			sql:  "SELECT id FROM users RIGHT JOIN orders ON users.id=orders.user_id",
			want: "SELECT id\nFROM users\n  RIGHT JOIN orders\n    ON users.id = orders.user_id",
		},
		{
			name: "join-inner",
			sql:  "SELECT id FROM users INNER JOIN orders ON users.id=orders.user_id",
			want: "SELECT id\nFROM users\n  INNER JOIN orders\n    ON users.id = orders.user_id",
		},
		{
			name: "join-cross-no-on",
			sql:  "SELECT id FROM users CROSS JOIN orders",
			want: "SELECT id\nFROM users\n  CROSS JOIN orders",
		},
		{
			name: "join-full-outer",
			sql:  "SELECT id FROM users FULL OUTER JOIN orders ON users.id=orders.user_id",
			want: "SELECT id\nFROM users\n  FULL OUTER JOIN orders\n    ON users.id = orders.user_id",
		},
		// Chained JOINs — each ON condition on its own line
		{
			name: "join-chain",
			sql:  "SELECT * FROM users JOIN orders ON users.id=orders.user_id JOIN products ON orders.product_id=products.id",
			want: "SELECT *\nFROM users\n  JOIN orders\n    ON users.id = orders.user_id\n  JOIN products\n    ON orders.product_id = products.id",
		},
		// Keyword uppercasing in SELECT column list
		{
			name: "keywords-uppercased-in-select",
			sql:  "select id, name, count(*) as total from users",
			want: "SELECT id,\n  name,\n  COUNT(*) AS total\nFROM users",
		},
		{
			name: "distinct-uppercased",
			sql:  "select distinct count(id) from users",
			want: "SELECT DISTINCT COUNT(id)\nFROM users",
		},
		// Lowercase keywords normalised
		{
			name: "lowercase-keywords-normalised",
			sql:  "select id from users where name='john' and status=1",
			want: "SELECT id\nFROM users\nWHERE name = 'john'\n  AND status = 1",
		},
		// Multiple statements separated by semicolon
		{
			name: "multi-statement-semicolon",
			sql:  "SELECT id FROM t;SELECT name FROM s",
			want: "SELECT id\nFROM t;\nSELECT name\nFROM s",
		},
		// Subquery in FROM clause — 收尾括号与 FROM 所在行对齐
		{
			name: "subquery-in-from-single-field",
			sql:  "SELECT * FROM (SELECT id FROM users) AS u",
			want: "SELECT *\nFROM (\n  SELECT id\n  FROM users\n) AS u",
		},
		// Subquery in WHERE clause (IN)
		{
			name: "subquery-in-where-in",
			sql:  "SELECT * FROM users WHERE id IN (SELECT user_id FROM orders)",
			want: "SELECT *\nFROM users\nWHERE id IN ( SELECT user_id FROM orders)",
		},
		{
			name: "subquery-in-where-in-with-condition",
			sql:  "SELECT * FROM users WHERE id IN (SELECT user_id FROM orders WHERE status=1)",
			want: "SELECT *\nFROM users\nWHERE id IN ( SELECT user_id FROM orders WHERE status = 1)",
		},
		// Subquery in WHERE clause (EXISTS)
		{
			name: "subquery-in-where-exists",
			sql:  "SELECT * FROM users WHERE EXISTS (SELECT 1 FROM orders WHERE orders.user_id=users.id)",
			want: "SELECT *\nFROM users\nWHERE EXISTS ( SELECT 1 FROM orders WHERE orders.user_id = users.id)",
		},
		// Table alias (no AS keyword)
		{
			name: "table-alias-no-as",
			sql:  "SELECT u.id FROM users u JOIN orders o ON u.id=o.user_id",
			want: "SELECT u.id\nFROM users u\n  JOIN orders o\n    ON u.id = o.user_id",
		},
		// GROUP BY and ORDER BY
		{
			name: "group-by",
			sql:  "SELECT COUNT(*),status FROM users GROUP BY status",
			want: "SELECT COUNT(*),\n  status\nFROM users\nGROUP BY status",
		},
		{
			name: "order-by",
			sql:  "SELECT id,name FROM users ORDER BY name ASC,id DESC",
			want: "SELECT id,\n  name\nFROM users\nORDER BY name ASC,id DESC",
		},
		// UNION
		{
			name: "union",
			sql:  "SELECT id FROM a UNION SELECT id FROM b",
			want: "SELECT id\nFROM a\nUNION \nSELECT id\nFROM b",
		},
		// Backtick identifiers preserved
		{
			name: "backtick-identifiers",
			sql:  "SELECT `id`,`name` FROM `users`",
			want: "SELECT `id`,\n  `name`\nFROM `users`",
		},
		// WITH CTE — CTE 体递归按语句格式化，收尾括号与 WITH 所在行对齐
		{
			name: "with-cte",
			sql:  "WITH cte AS (SELECT id FROM users) SELECT * FROM cte",
			want: "WITH cte AS (\n  SELECT id\n  FROM users\n)\nSELECT *\nFROM cte",
		},
		{
			name: "with-multiple-cte",
			sql:  "WITH a AS (SELECT x FROM t1), b AS (SELECT y FROM t2 WHERE z=3) SELECT * FROM a",
			want: "WITH a AS (\n  SELECT x\n  FROM t1\n),\nb AS (\n  SELECT y\n  FROM t2\n  WHERE z = 3\n)\nSELECT *\nFROM a",
		},
		{
			name: "with-recursive",
			sql:  "WITH RECURSIVE tree AS (SELECT id FROM nodes) SELECT * FROM tree",
			want: "WITH RECURSIVE tree AS (\n  SELECT id\n  FROM nodes\n)\nSELECT *\nFROM tree",
		},
		{
			name: "with-lowercase",
			sql:  "with cte as (select id from users) select * from cte",
			want: "WITH cte AS (\n  SELECT id\n  FROM users\n)\nSELECT *\nFROM cte",
		},
		{
			name: "with-cte-column-list",
			sql:  "WITH cte (id) AS (SELECT id FROM users) SELECT * FROM cte",
			want: "WITH cte (id) AS (\n  SELECT id\n  FROM users\n)\nSELECT *\nFROM cte",
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
