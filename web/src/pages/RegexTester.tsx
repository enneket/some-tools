import { useState, useMemo } from 'react'
import ToolLayout from '../components/ToolLayout'

export default function RegexTester() {
  const [pattern, setPattern] = useState('')
  const [flags, setFlags] = useState('g')
  const [text, setText] = useState('')

  const { matches, error } = useMemo(() => {
    if (!pattern || !text) return { matches: [], error: '' }
    try {
      const regex = new RegExp(pattern, flags)
      const results: { index: number; match: string; groups: string[] }[] = []
      let m: RegExpExecArray | null
      if (flags.includes('g')) {
        while ((m = regex.exec(text)) !== null) {
          results.push({ index: m.index, match: m[0], groups: m.slice(1) })
          if (m.index === regex.lastIndex) regex.lastIndex++
        }
      } else {
        m = regex.exec(text)
        if (m) results.push({ index: m.index, match: m[0], groups: m.slice(1) })
      }
      return { matches: results, error: '' }
    } catch (e) {
      return { matches: [], error: (e as Error).message }
    }
  }, [pattern, flags, text])

  const highlighted = useMemo(() => {
    if (!pattern || !text || matches.length === 0) return text
    try {
      const regex = new RegExp(pattern, flags)
      return text.replace(regex, '<mark style="background:#fef08a;padding:1px 2px;border-radius:2px">$&</mark>')
    } catch {
      return text
    }
  }, [pattern, flags, text, matches])

  return (
    <ToolLayout title="正则测试" description="测试正则表达式匹配">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            type="text"
            value={pattern}
            onChange={e => setPattern(e.target.value)}
            placeholder="输入正则表达式..."
            style={{ flex: 1, padding: '12px', fontSize: '14px', border: '1px solid #e5e5e5', borderRadius: '8px', fontFamily: 'monospace' }}
          />
          <input
            type="text"
            value={flags}
            onChange={e => setFlags(e.target.value)}
            placeholder="flags"
            style={{ width: '80px', padding: '12px', fontSize: '14px', border: '1px solid #e5e5e5', borderRadius: '8px', fontFamily: 'monospace', textAlign: 'center' }}
          />
        </div>
        {error && <div style={{ color: '#ef4444', fontSize: '13px' }}>{error}</div>}
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="输入测试文本..."
          style={{ width: '100%', height: '200px', padding: '12px', fontSize: '14px', border: '1px solid #e5e5e5', borderRadius: '8px', resize: 'vertical', fontFamily: 'monospace' }}
        />
        {matches.length > 0 && (
          <>
            <div style={{ fontSize: '14px', color: '#666' }}>匹配结果 ({matches.length} 个)</div>
            <div style={{ padding: '12px', background: '#f9f9f9', borderRadius: '8px', fontFamily: 'monospace', fontSize: '13px', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }} dangerouslySetInnerHTML={{ __html: highlighted }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {matches.map((m, i) => (
                <div key={i} style={{ padding: '8px 12px', background: '#fff', border: '1px solid #e5e5e5', borderRadius: '6px', fontSize: '13px', fontFamily: 'monospace' }}>
                  <span style={{ color: '#666' }}>#{i + 1}</span> 位置 {m.index}: <strong>{m.match}</strong>
                  {m.groups.length > 0 && <span style={{ color: '#888' }}>  捕获组: [{m.groups.join(', ')}]</span>}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </ToolLayout>
  )
}
