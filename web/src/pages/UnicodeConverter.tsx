import { useState } from 'react'
import ToolLayout from '../components/ToolLayout'

function toUnicode(input: string): string {
  return Array.from(input).map(ch => {
    const code = ch.codePointAt(0)!
    if (code > 0xFFFF) {
      return `\\U${code.toString(16).padStart(8, '0')}`
    }
    return `\\u${code.toString(16).padStart(4, '0')}`
  }).join('')
}

function toUnicodeEscape(input: string): string {
  return Array.from(input).map(ch => {
    const code = ch.codePointAt(0)!
    if (code > 0xFFFF) {
      return `&#x${code.toString(16)};`
    }
    return `&#x${code.toString(16).padStart(4, '0')};`
  }).join('')
}

function toJsEscape(input: string): string {
  return Array.from(input).map(ch => {
    const code = ch.codePointAt(0)!
    if (code > 0xFFFF) {
      return `\\u{${code.toString(16)}}`
    }
    return `\\u${code.toString(16).padStart(4, '0')}`
  }).join('')
}

function fromUnicode(input: string): string {
  return input
    .replace(/\\U([0-9a-fA-F]{8})/g, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/\\u\{([0-9a-fA-F]+)\}/g, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(parseInt(dec)))
}

const FORMATS = [
  { key: 'unicode', label: 'Unicode (\\uXXXX)', encode: toUnicode },
  { key: 'html', label: 'HTML 实体 (&#x)', encode: toUnicodeEscape },
  { key: 'js', label: 'JS 转义 (\\u{})', encode: toJsEscape },
]

export default function UnicodeConverter() {
  const [input, setInput] = useState('你好世界 Hello 🌍')
  const [mode, setMode] = useState<'encode' | 'decode'>('encode')
  const [format, setFormat] = useState('unicode')

  const output = mode === 'encode'
    ? FORMATS.find(f => f.key === format)!.encode(input)
    : fromUnicode(input)

  const charInfo = mode === 'encode' ? Array.from(input).slice(0, 50).map(ch => ({
    char: ch,
    code: ch.codePointAt(0)!,
    hex: (ch.codePointAt(0)!).toString(16).toUpperCase().padStart(4, '0'),
  })) : []

  return (
    <ToolLayout title="Unicode 编解码" description="Unicode 字符编码和解码">
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
        {(['encode', 'decode'] as const).map(m => (
          <button key={m} onClick={() => setMode(m)} style={{
            padding: '8px 24px', border: 'none', borderRadius: '20px',
            background: mode === m ? '#333' : '#f5f5f5',
            color: mode === m ? '#fff' : '#333', cursor: 'pointer',
          }}>{m === 'encode' ? '编码' : '解码'}</button>
        ))}
      </div>

      {mode === 'encode' && (
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
          {FORMATS.map(f => (
            <button key={f.key} onClick={() => setFormat(f.key)} style={{
              padding: '6px 14px', border: '1px solid #e5e5e5', borderRadius: '16px',
              background: format === f.key ? '#333' : '#fff',
              color: format === f.key ? '#fff' : '#333', cursor: 'pointer', fontSize: '13px',
            }}>{f.label}</button>
          ))}
        </div>
      )}

      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', fontWeight: 600, marginBottom: '8px' }}>输入</label>
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          style={{
            width: '100%', minHeight: '100px', padding: '12px', fontSize: '14px',
            fontFamily: 'monospace', border: '1px solid #e5e5e5', borderRadius: '8px',
            resize: 'vertical',
          }}
        />
      </div>

      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <label style={{ fontWeight: 600 }}>输出</label>
          <button onClick={() => navigator.clipboard.writeText(output)} style={{
            padding: '4px 12px', border: '1px solid #e5e5e5', borderRadius: '6px',
            background: '#fff', cursor: 'pointer', fontSize: '13px',
          }}>复制</button>
        </div>
        <textarea
          value={output}
          readOnly
          style={{
            width: '100%', minHeight: '100px', padding: '12px', fontSize: '14px',
            fontFamily: 'monospace', border: '1px solid #e5e5e5', borderRadius: '8px',
            background: '#f9f9f9', resize: 'vertical',
          }}
        />
      </div>

      {mode === 'encode' && charInfo.length > 0 && (
        <div>
          <div style={{ fontWeight: 600, marginBottom: '12px' }}>字符详情</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '8px' }}>
            {charInfo.map((c, i) => (
              <div key={i} style={{
                textAlign: 'center', padding: '8px', background: '#f8f8f8', borderRadius: '6px',
              }}>
                <div style={{ fontSize: '24px', marginBottom: '4px' }}>{c.char}</div>
                <div style={{ fontSize: '11px', color: '#666', fontFamily: 'monospace' }}>U+{c.hex}</div>
                <div style={{ fontSize: '11px', color: '#999' }}>{c.code}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </ToolLayout>
  )
}
