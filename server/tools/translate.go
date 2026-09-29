package tools

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os"
	"strings"
	"time"
)

// LangAuto 表示自动检测源语言
const LangAuto = "auto"

const (
	defaultGoogleTranslateEndpoint = "https://translate.googleapis.com/translate_a/single"
	maxTranslateResponse           = 1 << 20
	translateRequestTimeout        = 30 * time.Second
)

// googleTranslateEndpoint 可用环境变量覆盖，便于接入自建代理，
// 指向一个不可达地址可以验证降级到 MyMemory 的路径
func googleTranslateEndpoint() string {
	if endpoint := os.Getenv("GOOGLE_TRANSLATE_ENDPOINT"); endpoint != "" {
		return endpoint
	}
	return defaultGoogleTranslateEndpoint
}

// TranslateLanguage 是语言下拉框中的一个可选项
type TranslateLanguage struct {
	Code string `json:"code"`
	Name string `json:"name"`
}

// TranslateLanguages 是本工具支持的语言清单，前端下拉框与后端校验共用此清单
var TranslateLanguages = []TranslateLanguage{
	{Code: LangAuto, Name: "自动检测"},
	{Code: "zh-CN", Name: "中文（简体）"},
	{Code: "zh-TW", Name: "中文（繁体）"},
	{Code: "en", Name: "英语"},
	{Code: "ja", Name: "日语"},
	{Code: "ko", Name: "韩语"},
	{Code: "fr", Name: "法语"},
	{Code: "de", Name: "德语"},
	{Code: "es", Name: "西班牙语"},
	{Code: "pt", Name: "葡萄牙语"},
	{Code: "it", Name: "意大利语"},
	{Code: "ru", Name: "俄语"},
	{Code: "ar", Name: "阿拉伯语"},
	{Code: "he", Name: "希伯来语"},
	{Code: "th", Name: "泰语"},
	{Code: "vi", Name: "越南语"},
	{Code: "id", Name: "印尼语"},
	{Code: "tr", Name: "土耳其语"},
	{Code: "pl", Name: "波兰语"},
	{Code: "nl", Name: "荷兰语"},
	{Code: "sv", Name: "瑞典语"},
	{Code: "uk", Name: "乌克兰语"},
}

// TranslateResult 是一次翻译的结果，Detected 为识别出的源语言代码
type TranslateResult struct {
	Text     string
	Detected string
}

// Translator 屏蔽具体的翻译服务实现，更换供应商只需调整 translateProviders
type Translator interface {
	Translate(ctx context.Context, text, from, to string) (TranslateResult, error)
	// SupportsAutoDetect 表示该实现能否自行判断源语言
	SupportsAutoDetect() bool
}

// translateProviders 按顺序尝试，第一个成功的即采用。主服务为非官方免费端点，
// 失效时回退到官方免费服务。
var translateProviders = []Translator{
	&googleTranslator{client: &http.Client{Timeout: translateRequestTimeout}},
	&myMemoryTranslator{client: &http.Client{Timeout: translateRequestTimeout}},
}

type googleTranslator struct {
	client *http.Client
}

// Translate 以 POST 表单方式请求翻译端点，GET 方式在文本较长时会被拒绝
// SupportsAutoDetect 返回 true：上游的 sl=auto 会回传识别到的源语言
func (translator *googleTranslator) SupportsAutoDetect() bool {
	return true
}

func (translator *googleTranslator) Translate(ctx context.Context, text, from, to string) (TranslateResult, error) {
	form := url.Values{}
	form.Set("client", "gtx")
	form.Set("sl", from)
	form.Set("tl", to)
	form.Set("dt", "t")
	form.Set("q", text)

	request, err := http.NewRequestWithContext(ctx, http.MethodPost, googleTranslateEndpoint(), strings.NewReader(form.Encode()))
	if err != nil {
		return TranslateResult{}, err
	}
	request.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	response, err := translator.client.Do(request)
	if err != nil {
		return TranslateResult{}, err
	}
	defer response.Body.Close()

	body, err := io.ReadAll(io.LimitReader(response.Body, maxTranslateResponse))
	if err != nil {
		return TranslateResult{}, err
	}
	if response.StatusCode != http.StatusOK {
		return TranslateResult{}, fmt.Errorf("上游返回 %d: %s", response.StatusCode, strings.TrimSpace(string(body)))
	}
	return parseTranslateResponse(body)
}

// parseTranslateResponse 解析 [[译文片段, 原文片段, ...], null, 源语言, ...] 结构
func parseTranslateResponse(body []byte) (TranslateResult, error) {
	var fields []json.RawMessage
	if err := json.Unmarshal(body, &fields); err != nil {
		return TranslateResult{}, fmt.Errorf("解析翻译结果失败: %w", err)
	}
	if len(fields) == 0 {
		return TranslateResult{}, fmt.Errorf("翻译结果为空")
	}

	var segments [][]json.RawMessage
	if err := json.Unmarshal(fields[0], &segments); err != nil {
		return TranslateResult{}, fmt.Errorf("解析译文片段失败: %w", err)
	}

	var translated strings.Builder
	for _, segment := range segments {
		if len(segment) == 0 || bytes.Equal(segment[0], []byte("null")) {
			continue
		}
		var piece string
		if err := json.Unmarshal(segment[0], &piece); err != nil {
			return TranslateResult{}, fmt.Errorf("解析译文片段失败: %w", err)
		}
		translated.WriteString(piece)
	}

	result := TranslateResult{Text: translated.String()}
	if len(fields) > 2 {
		var detected string
		if err := json.Unmarshal(fields[2], &detected); err == nil {
			result.Detected = detected
		}
	}
	return result, nil
}

func isSupportedLanguage(code string) bool {
	for _, language := range TranslateLanguages {
		if language.Code == code {
			return true
		}
	}
	return false
}

func writeTranslateError(w http.ResponseWriter, status int, message string) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(map[string]string{"error": message})
}

// HandleTranslateLanguages 返回语言清单，供前端下拉框使用
func HandleTranslateLanguages(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeTranslateError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}
	json.NewEncoder(w).Encode(map[string][]TranslateLanguage{"languages": TranslateLanguages})
}

// HandleTranslate 翻译文本，from 传 auto 时自动检测源语言
func HandleTranslate(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeTranslateError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}
	var req struct {
		Input string `json:"input"`
		From  string `json:"from"`
		To    string `json:"to"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeTranslateError(w, http.StatusBadRequest, "Invalid JSON")
		return
	}
	req.Input = strings.TrimSpace(req.Input)
	if req.Input == "" {
		writeTranslateError(w, http.StatusBadRequest, "请输入要翻译的文本")
		return
	}
	if req.From == "" {
		req.From = LangAuto
	}
	if req.To == "" {
		writeTranslateError(w, http.StatusBadRequest, "请选择目标语言")
		return
	}
	if !isSupportedLanguage(req.From) {
		writeTranslateError(w, http.StatusBadRequest, fmt.Sprintf("不支持的源语言: %s", req.From))
		return
	}
	if !isSupportedLanguage(req.To) {
		writeTranslateError(w, http.StatusBadRequest, fmt.Sprintf("不支持的目标语言: %s", req.To))
		return
	}
	if req.From == req.To {
		json.NewEncoder(w).Encode(map[string]string{"output": req.Input, "detected": req.From})
		return
	}

	var providerErr error
	blockedByDetection := false
	for _, provider := range translateProviders {
		source := req.From
		if source == LangAuto && !provider.SupportsAutoDetect() {
			detected, confident := detectSourceLanguage(req.Input)
			if !confident {
				blockedByDetection = true
				continue
			}
			source = detected
		}
		result, err := provider.Translate(r.Context(), req.Input, source, req.To)
		if err == nil {
			json.NewEncoder(w).Encode(map[string]string{"output": result.Text, "detected": result.Detected})
			return
		}
		providerErr = err
	}

	message := "翻译服务不可用"
	if providerErr != nil {
		message = "翻译服务不可用: " + providerErr.Error()
	}
	if blockedByDetection {
		message += "；自动检测源语言的备用服务未能识别语种，请手动指定源语言后重试"
	}
	writeTranslateError(w, http.StatusBadGateway, message)
}
