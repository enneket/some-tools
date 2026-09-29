package tools

import (
	"strings"
	"unicode"
)

// MyMemory 不接受 Autodetect 作为源语言，降级到该服务前必须自行判断语种。
// 判断只服务于降级路径，采用「先看文字系统、再看变音符号、最后统计虚词」的顺序，
// 拿不准时返回 false，让调用方提示用户手动指定源语言，而不是猜一个。

// 各语种独有的字母与组合符号，命中即可直接判定
var (
	vietnameseRunes = "ăđơưạảấầẩẫậắằẳẵặẹẻẽếềểễệỉịọỏốồổỗộớờởỡụủứừửữựỳỵỷỹ"
	turkishRunes    = "ıİğĞşŞ"
	polishRunes     = "ąćęłńśźż"
)

// 拉丁字母语种的虚词表，用于最后的词频判定
var latinStopwordList = map[string][]string{
	"en": {"the", "is", "are", "was", "of", "and", "to", "in", "that", "this", "you", "for", "not", "with", "have", "but"},
	"de": {"der", "die", "das", "ist", "nicht", "und", "mit", "ein", "eine", "den", "von", "zu", "sich", "auf", "für"},
	"fr": {"le", "la", "les", "est", "pas", "une", "des", "pour", "dans", "que", "qui", "avec", "sur", "mais", "nous"},
	"es": {"el", "la", "los", "las", "es", "no", "una", "con", "para", "por", "pero", "que", "como", "más", "se"},
	"pt": {"o", "a", "os", "as", "não", "uma", "com", "para", "por", "mas", "que", "como", "mais", "você", "está"},
	"it": {"il", "lo", "la", "è", "non", "una", "con", "per", "ma", "che", "come", "più", "sono", "del", "della"},
	"nl": {"het", "een", "is", "niet", "van", "met", "voor", "maar", "dat", "die", "op", "zijn", "er", "ook", "worden"},
	"sv": {"och", "att", "det", "som", "är", "inte", "med", "för", "på", "av", "den", "till", "har", "de", "en", "idag", "jag", "vi", "kan", "ska", "inte"},
	"tr": {"bir", "ve", "bu", "için", "ile", "çok", "daha", "değil", "olarak", "olan", "gibi", "de", "da", "ne", "var", "yok"},
}

var latinStopwords = buildStopwordSets()

func buildStopwordSets() map[string]map[string]bool {
	sets := make(map[string]map[string]bool, len(latinStopwordList))
	for language, words := range latinStopwordList {
		set := make(map[string]bool, len(words))
		for _, word := range words {
			set[word] = true
		}
		sets[language] = set
	}
	return sets
}

const minStopwordScore = 1

// detectSourceLanguage 判断文本的源语言。第二个返回值为 false 表示无法确定。
func detectSourceLanguage(text string) (string, bool) {
	if strings.TrimSpace(text) == "" {
		return "", false
	}

	var han, kana, hangul, cyrillic, arabic, hebrew, thai int
	hasUkrainianLetter := false

	for _, char := range text {
		switch {
		case unicode.Is(unicode.Hangul, char):
			hangul++
		case unicode.Is(unicode.Hiragana, char), unicode.Is(unicode.Katakana, char):
			kana++
		case unicode.Is(unicode.Han, char):
			han++
		case unicode.Is(unicode.Cyrillic, char):
			cyrillic++
		case unicode.Is(unicode.Arabic, char):
			arabic++
		case unicode.Is(unicode.Hebrew, char):
			hebrew++
		case unicode.Is(unicode.Thai, char):
			thai++
		}
		switch char {
		case 'і', 'ї', 'є', 'ґ', 'І', 'Ї', 'Є', 'Ґ':
			hasUkrainianLetter = true
		}
	}

	switch {
	case hangul > 0:
		return "ko", true
	case kana > 0:
		return "ja", true
	case han > 0:
		// 繁简体在降级路径上不区分，zh-CN 同样能处理繁体输入
		return "zh-CN", true
	case cyrillic > 0:
		if hasUkrainianLetter {
			return "uk", true
		}
		return "ru", true
	case arabic > 0:
		return "ar", true
	case hebrew > 0:
		return "he", true
	case thai > 0:
		return "th", true
	}

	return detectLatinLanguage(text)
}

func detectLatinLanguage(text string) (string, bool) {
	for _, char := range text {
		switch {
		case strings.ContainsRune(vietnameseRunes, char):
			return "vi", true
		case strings.ContainsRune(turkishRunes, char):
			return "tr", true
		case strings.ContainsRune(polishRunes, char):
			return "pl", true
		case char == 'ß':
			return "de", true
		case char == 'å':
			return "sv", true
		}
	}

	words := tokenizeWords(text)
	if len(words) == 0 {
		return "", false
	}

	bestLanguage, bestScore, runnerUpScore := "", 0, 0
	for language, stopwords := range latinStopwords {
		score := 0
		for _, word := range words {
			if stopwords[word] {
				score++
			}
		}
		if score > bestScore {
			runnerUpScore = bestScore
			bestLanguage, bestScore = language, score
		} else if score > runnerUpScore {
			runnerUpScore = score
		}
	}
	// 至少命中一个虚词，且要明显领先次名；势均力敌说明判不准，直接让用户指定
	if bestScore < minStopwordScore || bestScore <= runnerUpScore {
		return "", false
	}
	return bestLanguage, true
}

// tokenizeWords 切出小写单词，忽略标点与数字
func tokenizeWords(text string) []string {
	var words []string
	var current strings.Builder
	for _, char := range text {
		if unicode.IsLetter(char) {
			current.WriteRune(unicode.ToLower(char))
			continue
		}
		if current.Len() > 0 {
			words = append(words, current.String())
			current.Reset()
		}
	}
	if current.Len() > 0 {
		words = append(words, current.String())
	}
	return words
}
