import { useState } from 'react'
import ToolLayout from '../components/ToolLayout'

export default function PasswordGenerator() {
  const [length, setLength] = useState(16)
  const [upper, setUpper] = useState(true)
  const [digits, setDigits] = useState(true)
  const [symbols, setSymbols] = useState(true)
  const [output, setOutput] = useState('')

  const handleGenerate = async () => {
    try {
      const res = await fetch('/api/password/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ length, upper, digits, symbols }),
      })
      const data = await res.json()
      setOutput(data.output || data.error || '')
    } catch (err) {
      setOutput('Error: ' + (err as Error).message)
    }
  }

  const checkboxStyle = { display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }

  return (
    <ToolLayout title="密码生成器" description="生成安全随机密码">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <label style={{ fontSize: '14px' }}>长度:</label>
          <input type="range" min="4" max="128" value={length} onChange={e => setLength(Number(e.target.value))} style={{ flex: 1 }} />
          <span style={{ fontFamily: 'monospace', minWidth: '40px', textAlign: 'right' }}>{length}</span>
        </div>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <label style={checkboxStyle}><input type="checkbox" checked disabled />小写字母</label>
          <label style={checkboxStyle}><input type="checkbox" checked={upper} onChange={e => setUpper(e.target.checked)} />大写字母</label>
          <label style={checkboxStyle}><input type="checkbox" checked={digits} onChange={e => setDigits(e.target.checked)} />数字</label>
          <label style={checkboxStyle}><input type="checkbox" checked={symbols} onChange={e => setSymbols(e.target.checked)} />特殊符号</label>
        </div>
        <button onClick={handleGenerate} style={{ padding: '12px 24px', background: '#333', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', alignSelf: 'flex-start' }}>生成密码</button>
        {output && (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input type="text" value={output} readOnly style={{ flex: 1, padding: '12px', fontSize: '16px', fontFamily: 'monospace', border: '1px solid #e5e5e5', borderRadius: '8px', background: '#f9f9f9' }} />
            <button onClick={() => navigator.clipboard.writeText(output)} style={{ padding: '12px 16px', background: '#f5f5f5', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>复制</button>
          </div>
        )}
      </div>
    </ToolLayout>
  )
}
