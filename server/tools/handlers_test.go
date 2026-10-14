package tools

import (
	"crypto/md5"
	"crypto/sha1"
	"crypto/sha256"
	"crypto/sha512"
	"encoding/base64"
	"encoding/hex"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"regexp"
	"strings"
	"testing"
)

// callHandler 以指定方法与请求体调用 handler，返回状态码与解析后的 JSON 响应。
// 错误分支写的是纯文本而非 JSON，此时 payload 为空，交给调用方按状态码断言。
func callHandler(t *testing.T, handler http.HandlerFunc, method, body string) (int, map[string]string) {
	t.Helper()
	recorder := httptest.NewRecorder()
	handler(recorder, httptest.NewRequest(method, "/", strings.NewReader(body)))
	payload := map[string]string{}
	_ = json.Unmarshal(recorder.Body.Bytes(), &payload)
	return recorder.Code, payload
}

func expectOK(t *testing.T, handler http.HandlerFunc, body, wantOutput string) {
	t.Helper()
	status, payload := callHandler(t, handler, http.MethodPost, body)
	if status != http.StatusOK {
		t.Fatalf("请求 %s 得到状态码 %d，期望 200", body, status)
	}
	if payload["output"] != wantOutput {
		t.Errorf("请求 %s 输出 %q，期望 %q", body, payload["output"], wantOutput)
	}
}

func expectStatus(t *testing.T, handler http.HandlerFunc, method, body string, want int) {
	t.Helper()
	status, _ := callHandler(t, handler, method, body)
	if status != want {
		t.Errorf("%s 请求 %s 得到状态码 %d，期望 %d", method, body, status, want)
	}
}

func TestHandleJSON(t *testing.T) {
	expectOK(t, HandleJSON, `{"input":"{\"a\":1}"}`, "{\n  \"a\": 1\n}")
	expectOK(t, HandleJSON, `{"input":"[1,2,3]"}`, "[\n  1,\n  2,\n  3\n]")
	// 键顺序与空白被规范化，重复键保留最后一个
	// 对象键按字母序输出：handler 解到 map[string]any 后由 MarshalIndent 排序
	expectOK(t, HandleJSON, `{"input":"{ \"b\" : 2 , \"a\" : 1 }"}`, "{\n  \"a\": 1,\n  \"b\": 2\n}")
	expectOK(t, HandleJSON, `{"input":"{\"a\":1,\"a\":2}"}`, "{\n  \"a\": 2\n}")
	expectStatus(t, HandleJSON, http.MethodPost, `{"input":"{bad}"}`, http.StatusBadRequest)
	expectStatus(t, HandleJSON, http.MethodPost, `{"input":""}`, http.StatusBadRequest)
	expectStatus(t, HandleJSON, http.MethodGet, "", http.StatusMethodNotAllowed)
}

func TestHandleBase64(t *testing.T) {
	expectOK(t, HandleBase64, `{"input":"hello","action":"encode"}`, "aGVsbG8=")
	expectOK(t, HandleBase64, `{"input":"5L2g5aW9","action":"decode"}`, "你好")
	// 1 字节输入编码后没有 padding，解码必须补齐
	expectOK(t, HandleBase64, `{"input":"a","action":"encode"}`, "YQ==")
	expectOK(t, HandleBase64, `{"input":"YQ==","action":"decode"}`, "a")
	expectOK(t, HandleBase64, `{"input":"","action":"encode"}`, "")
	expectOK(t, HandleBase64, `{"input":"","action":"decode"}`, "")
	expectStatus(t, HandleBase64, http.MethodPost, `{"input":"!!!","action":"decode"}`, http.StatusBadRequest)
	expectStatus(t, HandleBase64, http.MethodPost, `{"input":"x","action":"encrypt"}`, http.StatusBadRequest)
	expectStatus(t, HandleBase64, http.MethodGet, "", http.StatusMethodNotAllowed)
}

func TestHandleURL(t *testing.T) {
	expectOK(t, HandleURL, `{"input":"a b&c=d","action":"encode"}`, "a+b%26c%3Dd")
	expectOK(t, HandleURL, `{"input":"a+b%26c%3Dd","action":"decode"}`, "a b&c=d")
	expectOK(t, HandleURL, `{"input":"中文","action":"encode"}`, "%E4%B8%AD%E6%96%87")
	expectOK(t, HandleURL, `{"input":"%E4%B8%AD%E6%96%87","action":"decode"}`, "中文")
	// %zz 不是合法百分号编码
	expectStatus(t, HandleURL, http.MethodPost, `{"input":"%zz","action":"decode"}`, http.StatusBadRequest)
	expectStatus(t, HandleURL, http.MethodPost, `{"input":"x","action":"nope"}`, http.StatusBadRequest)
	expectStatus(t, HandleURL, http.MethodGet, "", http.StatusMethodNotAllowed)
}

var uuidV4Pattern = regexp.MustCompile(
	`^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$`)

func TestHandleUUID(t *testing.T) {
	seen := make(map[string]bool)
	for i := 0; i < 200; i++ {
		status, payload := callHandler(t, HandleUUID, http.MethodPost, "")
		if status != http.StatusOK {
			t.Fatalf("状态码 %d，期望 200", status)
		}
		id := payload["output"]
		if !uuidV4Pattern.MatchString(id) {
			t.Fatalf("%q 不是合法的 v4 UUID", id)
		}
		if seen[id] {
			t.Fatalf("UUID 重复: %s", id)
		}
		seen[id] = true
	}
	expectStatus(t, HandleUUID, http.MethodGet, "", http.StatusMethodNotAllowed)
}

func TestHandleJWT(t *testing.T) {
	// 无签名 token，仅验证解码路径；alg=none 的签名校验不在本工具职责内
	token := "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9." +
		"eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIn0.signature"
	recorder := httptest.NewRecorder()
	HandleJWT(recorder, httptest.NewRequest(http.MethodPost, "/", strings.NewReader(`{"input":"`+token+`"}`)))
	if recorder.Code != http.StatusOK {
		t.Fatalf("状态码 %d，期望 200", recorder.Code)
	}
	var payload struct {
		Output struct {
			Header    map[string]any `json:"header"`
			Payload   map[string]any `json:"payload"`
			Signature string         `json:"signature"`
		} `json:"output"`
	}
	if err := json.Unmarshal(recorder.Body.Bytes(), &payload); err != nil {
		t.Fatal(err)
	}
	if payload.Output.Header["alg"] != "HS256" {
		t.Errorf("header.alg = %v，期望 HS256", payload.Output.Header["alg"])
	}
	if payload.Output.Payload["name"] != "John Doe" {
		t.Errorf("payload.name = %v，期望 John Doe", payload.Output.Payload["name"])
	}
	if payload.Output.Signature != "signature" {
		t.Errorf("signature = %q", payload.Output.Signature)
	}

	// base64url 去掉 padding 后长度余 2 或 3，解码函数需要补齐
	head2, _ := base64.RawURLEncoding.DecodeString("eyJhIjoxfQ")
	if string(head2) != `{"a":1}` {
		t.Fatalf("测试样本的 base64url 解码失败: %q", head2)
	}
	padded := base64.RawURLEncoding.EncodeToString(head2)

	expectStatus(t, HandleJWT, http.MethodPost, `{"input":"only.two"}`, http.StatusBadRequest)
	expectStatus(t, HandleJWT, http.MethodPost, `{"input":"!!!.???.###"}`, http.StatusBadRequest)
	expectStatus(t, HandleJWT, http.MethodGet, "", http.StatusMethodNotAllowed)
	if _, err := decodeJWTPart(padded); err != nil {
		t.Errorf("补齐 padding 后仍解码失败: %v", err)
	}
}

func TestHandleHash(t *testing.T) {
	input := `{"input":"","alg":"all"}`
	status, payload := callHandler(t, HandleHash, http.MethodPost, input)
	if status != http.StatusOK {
		t.Fatalf("状态码 %d，期望 200", status)
	}
	md5Sum := md5.Sum(nil)
	sha1Sum := sha1.Sum(nil)
	sha256Sum := sha256.Sum256(nil)
	sha512Sum := sha512.Sum512(nil)
	checks := map[string]string{
		"MD5":    hex.EncodeToString(md5Sum[:]),
		"SHA1":   hex.EncodeToString(sha1Sum[:]),
		"SHA256": hex.EncodeToString(sha256Sum[:]),
		"SHA512": hex.EncodeToString(sha512Sum[:]),
	}
	for label, want := range checks {
		if !strings.Contains(payload["output"], want) {
			t.Errorf("all 输出缺少 %s 的 %s", label, want)
		}
	}
	expectOK(t, HandleHash, `{"input":"abc","alg":"md5"}`, "900150983cd24fb0d6963f7d28e17f72")
	expectOK(t, HandleHash, `{"input":"abc","alg":"sha1"}`, "a9993e364706816aba3e25717850c26c9cd0d89d")
	// 非 ASCII 输入按 UTF-8 字节参与摘要
	expectOK(t, HandleHash, `{"input":"中文","alg":"sha256"}`,
		"72726d8818f693066ceb69afa364218b692e62ea92b385782363780f47529c21")
	expectStatus(t, HandleHash, http.MethodPost, `{"input":"x","alg":"crc32"}`, http.StatusBadRequest)
	expectStatus(t, HandleHash, http.MethodGet, "", http.StatusMethodNotAllowed)
}

func TestHandlePassword(t *testing.T) {

	status, payload := callHandler(t, HandlePassword, http.MethodPost,
		`{"length":24,"upper":true,"digits":true,"symbols":true}`)
	if status != http.StatusOK {
		t.Fatalf("状态码 %d，期望 200", status)
	}
	generated := payload["output"]
	if len(generated) != 24 {
		t.Errorf("长度为 %d，期望 24", len(generated))
	}
	if !strings.ContainsAny(generated, "abcdefghijklmnopqrstuvwxyz") ||
		!strings.ContainsAny(generated, "ABCDEFGHIJKLMNOPQRSTUVWXYZ") ||
		!strings.ContainsAny(generated, "0123456789") {
		t.Errorf("未覆盖小写字母: %q", generated)
	}

	// length 缺省或越界都要被夹到合法区间，而不是报错或生成超长串
	for _, body := range []string{`{}`, `{"length":0}`, `{"length":-5}`} {
		status, payload := callHandler(t, HandlePassword, http.MethodPost, body)
		if status != http.StatusOK {
			t.Fatalf("%s 状态码 %d", body, status)
		}
		if len(payload["output"]) != 16 {
			t.Errorf("%s 长度为 %d，期望 16", body, len(payload["output"]))
		}
	}
	status, payload = callHandler(t, HandlePassword, http.MethodPost, `{"length":9999}`)
	if status != http.StatusOK || len(payload["output"]) != 128 {
		t.Errorf("超长请求：状态码 %d 长度 %d，期望 200 与 128", status, len(payload["output"]))
	}

	// 同参数多次调用不应产生相同结果
	seen := make(map[string]bool)
	for i := 0; i < 50; i++ {
		_, payload := callHandler(t, HandlePassword, http.MethodPost, `{"length":32}`)
		if seen[payload["output"]] {
			t.Fatalf("密码重复生成: %s", payload["output"])
		}
		seen[payload["output"]] = true
	}
	expectStatus(t, HandlePassword, http.MethodGet, "", http.StatusMethodNotAllowed)

}
