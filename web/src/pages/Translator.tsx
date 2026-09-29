import { useEffect, useState } from 'react'
import ToolLayout from '../components/ToolLayout'

interface Language {
  code: string
  name: string
}

const AUTO_LANGUAGE = 'auto'
const DEFAULT_TARGET = 'en'

const selectStyle: React.CSSProperties = {
  padding: '8px 12px',
  fontSize: '14px',
  border: '1px solid #e5e5e5',
  borderRadius: '8px',
  background: '#fff',
  cursor: 'pointer',
}

const textareaStyle: React.CSSProperties = {
  width: '100%',
  minHeight: '160px',
  padding: '12px',
  fontSize: '14px',
  lineHeight: '1.6',
  border: '1px solid #e5e5e5',
  borderRadius: '8px',
  fontFamily: 'inherit',
  resize: 'vertical',
}

export default function Translator() {
  const [languages, setLanguages] = useState<Language[]>([])
  const [from, setFrom] = useState(AUTO_LANGUAGE)
  const [to, setTo] = useState(DEFAULT_TARGET)
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [detected, setDetected] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetch('/api/translate/languages')
      .then(res => res.json())
      .then((data: { languages?: Language[] }) => {
        if (!cancelled && data.languages) {
          setLanguages(data.languages)
        }
      })
      .catch(() => {
        if (!cancelled) setError('语言列表加载失败')
      })
    return () => {
      cancelled = true
    }
  }, [])

  const targetLanguages = languages.filter(language => language.code !== AUTO_LANGUAGE)

  const languageName = (code: string) => languages.find(language => language.code === code)?.name || code

  const handleTranslate = async () => {
    if (!input.trim()) {
      setError('请输入要翻译的文本')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input, from, to }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || `翻译失败 (${res.status})`)
        return
      }
      setOutput(data.output || '')
      setDetected(data.detected || '')
    } catch (err) {
      setError('请求失败: ' + (err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const handleSwap = () => {
    const nextFrom = from !== AUTO_LANGUAGE ? from : detected || 'zh-CN'
    setFrom(to)
    setTo(targetLanguages.some(language => language.code === nextFrom) ? nextFrom : DEFAULT_TARGET)
    if (output) setInput(output)
    setOutput('')
    setDetected('')
    setError('')
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
      event.preventDefault()
      handleTranslate()
    }
  }

  return (
    <ToolLayout title="文本翻译" description="多语言互译，支持自动检测源语言">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <select value={from} onChange={e => setFrom(e.target.value)} style={selectStyle} disabled={loading}>
            {languages.map(language => (
              <option key={language.code} value={language.code}>
                {language.code === AUTO_LANGUAGE ? '源语言：自动检测' : `源语言：${language.name}`}
              </option>
            ))}
          </select>
          <button
            onClick={handleSwap}
            style={{
              padding: '8px 14px',
              background: '#f5f5f5',
              color: '#333',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
            }}
            title="交换源语言和目标语言"
          >
            ⇄ 互换
          </button>
          <select value={to} onChange={e => setTo(e.target.value)} style={selectStyle} disabled={loading}>
            {targetLanguages.map(language => (
              <option key={language.code} value={language.code}>
                目标语言：{language.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <label style={{ fontSize: '13px', color: '#666' }}>原文</label>
            <span style={{ fontSize: '12px', color: '#999' }}>Ctrl / ⌘ + Enter 翻译</span>
          </div>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入要翻译的文本..."
            style={textareaStyle}
            disabled={loading}
          />
        </div>

        <button
          onClick={handleTranslate}
          disabled={loading}
          style={{
            padding: '12px 24px',
            background: loading ? '#999' : '#333',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            cursor: loading ? 'default' : 'pointer',
            alignSelf: 'flex-start',
          }}
        >
          {loading ? '翻译中...' : '翻译'}
        </button>

        {error && <div style={{ color: '#ef4444', fontSize: '13px' }}>{error}</div>}

        {output && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <label style={{ fontSize: '13px', color: '#666' }}>译文</label>
              {detected && from === AUTO_LANGUAGE && (
                <span style={{ fontSize: '12px', color: '#999' }}>检测到源语言：{languageName(detected)}</span>
              )}
            </div>
            <textarea value={output} readOnly style={{ ...textareaStyle, background: '#f9f9f9' }} />
          </div>
        )}
      </div>
    </ToolLayout>
  )
}
