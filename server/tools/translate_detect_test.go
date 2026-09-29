package tools

import "testing"

func TestDetectSourceLanguage(t *testing.T) {
	cases := []struct {
		name       string
		text       string
		want       string
		wantConfid bool
	}{
		{name: "chinese", text: "今天天气很好，我们去公园散步吧。", want: "zh-CN", wantConfid: true},
		{name: "japanese-kana", text: "今日はいい天気ですね。", want: "ja", wantConfid: true},
		{name: "japanese-kanji-only-with-kana", text: "日本語を勉強しています", want: "ja", wantConfid: true},
		{name: "korean", text: "오늘 날씨가 좋네요.", want: "ko", wantConfid: true},
		{name: "russian", text: "Сегодня хорошая погода.", want: "ru", wantConfid: true},
		{name: "ukrainian", text: "Сьогодні гарна погода, і це добре.", want: "uk", wantConfid: true},
		{name: "arabic", text: "الطقس جميل اليوم.", want: "ar", wantConfid: true},
		{name: "hebrew", text: "מזג האוויר נפלא היום.", want: "he", wantConfid: true},
		{name: "thai", text: "วันนี้อากาศดีมาก", want: "th", wantConfid: true},
		{name: "vietnamese-diacritics", text: "Hôm nay thời tiết đẹp.", want: "vi", wantConfid: true},
		{name: "turkish-diacritics", text: "Hava bugün çok güzel.", want: "tr", wantConfid: true},
		{name: "polish-diacritics", text: "Dzisia jest ładna pogoda.", want: "pl", wantConfid: true},
		{name: "german-sharp-s", text: "Die Straße ist heute schön.", want: "de", wantConfid: true},
		{name: "swedish-ring", text: "Vädret är vackert idag.", want: "sv", wantConfid: true},
		{name: "english-stopwords", text: "the server is not running and it should be with the config", want: "en", wantConfid: true},
		{name: "german-stopwords", text: "der Server ist nicht mit der Konfiguration und das ist ein Problem", want: "de", wantConfid: true},
		{name: "french-stopwords", text: "le serveur est pas avec une configuration mais c'est dans le journal", want: "fr", wantConfid: true},
		{name: "spanish-stopwords", text: "el servidor no es una configuración pero está en el registro con los datos", want: "es", wantConfid: true},
		{name: "short-text-unsure", text: "hello", want: "", wantConfid: false},
		{name: "digits-only", text: "1234567890", want: "", wantConfid: false},
		{name: "empty", text: "   ", want: "", wantConfid: false},
	}
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			got, confident := detectSourceLanguage(c.text)
			if confident != c.wantConfid {
				t.Fatalf("detectSourceLanguage(%q) 置信度 = %v, want %v", c.text, confident, c.wantConfid)
			}
			if got != c.want {
				t.Errorf("detectSourceLanguage(%q) = %q, want %q", c.text, got, c.want)
			}
		})
	}
}

func TestDetectSourceLanguageResultIsSupported(t *testing.T) {
	// 降级路径会把判定结果直接拼进 langpair，必须始终是受支持的语种
	samples := []string{
		"今天天气很好", "今日はいい天気", "오늘 날씨", "Сегодня хорошо", "Сьогодні",
		"الطقس جميل", "מזג נפלא", "วันนี้ดี", "Hôm nay đẹp", "Hava bugün çok güzel",
		"Dzisia jest ładna pogoda", "Die Straße ist schön", "Vädret är vackert idag", "the server is not running",
		"Il server non è una configurazione con i dati", "O servidor não é uma configuração com os dados",
	}
	for _, sample := range samples {
		detected, confident := detectSourceLanguage(sample)
		if !confident {
			t.Errorf("detectSourceLanguage(%q) 无法判定", sample)
			continue
		}
		if !isSupportedLanguage(detected) {
			t.Errorf("detectSourceLanguage(%q) = %q，不在支持的语言清单中", sample, detected)
		}
	}
}
