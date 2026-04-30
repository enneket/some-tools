import { useState } from 'react'
import ToolLayout from '../components/ToolLayout'

const BASES = [
  { key: 2, label: '二进制', prefix: '0b' },
  { key: 8, label: '八进制', prefix: '0o' },
  { key: 10, label: '十进制', prefix: '' },
  { key: 16, label: '十六进制', prefix: '0x' },
]

function convertAll(input: string, fromBase: number): Record<number, string> {
  const result: Record<number, string> = {}
  try {
    const clean = input.replace(/^(0x|0o|0b)/i, '').trim()
    const num = parseInt(clean, fromBase)
    if (isNaN(num)) {
      for (const b of BASES) result[b.key] = '无效输入'
      return result
    }
    for (const b of BASES) {
      result[b.key] = b.prefix + num.toString(b.key).toUpperCase()
    }
  } catch {
    for (const b of BASES) result[b.key] = '无效输入'
  }
  return result
}

function getBitDisplay(input: string, fromBase: number): string {
  try {
    const clean = input.replace(/^(0x|0o|0b)/i, '').trim()
    const num = parseInt(clean, fromBase)
    if (isNaN(num) || num < 0) return ''
    return num.toString(2).padStart(Math.ceil(num.toString(2).length / 8) * 8, '0')
      .match(/.{1,8}/g)?.join(' ') || ''
  } catch {
    return ''
  }
}

export default function BaseConverter() {
  const [input, setInput] = useState('255')
  const [fromBase, setFromBase] = useState(10)

  const results = convertAll(input, fromBase)
  const bits = getBitDisplay(input, fromBase)

  return (
    <ToolLayout title="进制转换" description="二进制、八进制、十进制、十六进制互转">
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
          {BASES.map(b => (
            <button key={b.key} onClick={() => setFromBase(b.key)} style={{
              padding: '6px 14px', border: '1px solid #e5e5e5', borderRadius: '16px',
              background: fromBase === b.key ? '#333' : '#fff',
              color: fromBase === b.key ? '#fff' : '#333', cursor: 'pointer', fontSize: '13px',
            }}>{b.label}</button>
          ))}
        </div>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder={`输入 ${BASES.find(b => b.key === fromBase)?.label} 数值`}
          style={{
            width: '100%', padding: '14px 16px', fontSize: '20px', fontFamily: 'monospace',
            border: '2px solid #e5e5e5', borderRadius: '8px', textAlign: 'center',
          }}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '24px' }}>
        {BASES.filter(b => b.key !== fromBase).map(b => (
          <div key={b.key} style={{
            padding: '16px', background: '#f8f8f8', borderRadius: '8px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <div>
              <div style={{ fontSize: '12px', color: '#999', marginBottom: '4px' }}>{b.label}</div>
              <div style={{ fontSize: '18px', fontFamily: 'monospace', fontWeight: 600 }}>
                {results[b.key]}
              </div>
            </div>
            <button onClick={() => navigator.clipboard.writeText(results[b.key])} style={{
              padding: '4px 10px', border: '1px solid #e5e5e5', borderRadius: '6px',
              background: '#fff', cursor: 'pointer', fontSize: '12px',
            }}>复制</button>
          </div>
        ))}
      </div>

      {bits && (
        <div style={{ padding: '16px', background: '#f0f0f0', borderRadius: '8px' }}>
          <div style={{ fontWeight: 600, marginBottom: '8px' }}>位表示（8位分组）</div>
          <div style={{ fontFamily: 'monospace', fontSize: '16px', letterSpacing: '4px', wordBreak: 'break-all' }}>
            {bits}
          </div>
        </div>
      )}
    </ToolLayout>
  )
}
