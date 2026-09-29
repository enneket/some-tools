import { useState } from 'react'
import ToolLayout from '../components/ToolLayout'

const HTML_ENTITIES: Record<string, string> = {
  '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&apos;': "'",
  '&nbsp;': ' ', '&copy;': '©', '&reg;': '®', '&trade;': '™', '&euro;': '€',
  '&pound;': '£', '&yen;': '¥', '&cent;': '¢', '&sect;': '§', '&para;': '¶',
  '&deg;': '°', '&plusmn;': '±', '&times;': '×', '&divide;': '÷',
  '&laquo;': '«', '&raquo;': '»', '&hellip;': '…', '&mdash;': '—', '&ndash;': '–',
}

const REVERSE_ENTITIES: Record<string, string> = {}
for (const [entity, char] of Object.entries(HTML_ENTITIES)) {
  REVERSE_ENTITIES[char] = entity
}

function encodeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

const ENTITY_PATTERN = new RegExp(
  [
    ...Object.keys(HTML_ENTITIES).map(entity => entity.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
    '&#x[0-9a-fA-F]+;',
    '&#\\d+;',
  ].join('|'),
  'g'
)

// 单次左到右扫描：每个实体只被消费一次，回调结果不会被再次匹配，
// 因此 `&amp;lt;` 与 `&amp;#60;` 不会被级联解码。
function decodeHtml(input: string): string {
  return input.replace(ENTITY_PATTERN, match => {
    const named = HTML_ENTITIES[match]
    if (named !== undefined) return named
    const isHex = match[2] === 'x' || match[2] === 'X'
    const code = isHex ? match.slice(3, -1) : match.slice(2, -1)
    return String.fromCharCode(parseInt(code, isHex ? 16 : 10))
  })
}

export default function HtmlEntity() {
  const [input, setInput] = useState('<div class="hello">Hello & World</div>')
  const [mode, setMode] = useState<'encode' | 'decode'>('encode')

  const output = mode === 'encode' ? encodeHtml(input) : decodeHtml(input)

  return (
    <ToolLayout title="HTML 实体编解码" description="HTML 特殊字符编码和解码">
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
        {(['encode', 'decode'] as const).map(m => (
          <button key={m} onClick={() => setMode(m)} style={{
            padding: '8px 24px', border: 'none', borderRadius: '20px',
            background: mode === m ? '#333' : '#f5f5f5',
            color: mode === m ? '#fff' : '#333', cursor: 'pointer',
          }}>{m === 'encode' ? '编码' : '解码'}</button>
        ))}
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', fontWeight: 600, marginBottom: '8px' }}>输入</label>
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          style={{
            width: '100%', minHeight: '120px', padding: '12px', fontSize: '14px',
            fontFamily: 'monospace', border: '1px solid #e5e5e5', borderRadius: '8px',
            resize: 'vertical',
          }}
        />
      </div>

      <div>
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
            width: '100%', minHeight: '120px', padding: '12px', fontSize: '14px',
            fontFamily: 'monospace', border: '1px solid #e5e5e5', borderRadius: '8px',
            background: '#f9f9f9', resize: 'vertical',
          }}
        />
      </div>

      <div style={{ marginTop: '24px', padding: '16px', background: '#f8f8f8', borderRadius: '8px' }}>
        <div style={{ fontWeight: 600, marginBottom: '12px' }}>常用 HTML 实体</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '8px' }}>
          {Object.entries(HTML_ENTITIES).slice(0, 12).map(([entity, char]) => (
            <div key={entity} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', padding: '4px 0' }}>
              <code style={{ color: '#666' }}>{entity}</code>
              <span>{char}</span>
            </div>
          ))}
        </div>
      </div>
    </ToolLayout>
  )
}
