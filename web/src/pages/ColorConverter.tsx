import { useState } from 'react'
import ToolLayout from '../components/ToolLayout'

export default function ColorConverter() {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [mode, setMode] = useState<'hex2rgb' | 'rgb2hex'>('hex2rgb')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleConvert = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/convert/color', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input, from: mode === 'hex2rgb' ? 'hex' : 'rgb', to: mode === 'hex2rgb' ? 'rgb' : 'hex' }),
      })
      if (!res.ok) {
        setError(await res.text() || `请求失败 (${res.status})`)
        return
      }
      const data = await res.json()
      setOutput(data.output || '')
    } catch (err) {
      setError('请求失败: ' + (err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <ToolLayout title="颜色转换" description="HEX 与 RGB 颜色值互转">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => setMode('hex2rgb')}
              style={{ padding: '8px 16px', background: mode === 'hex2rgb' ? '#333' : '#f5f5f5', color: mode === 'hex2rgb' ? '#fff' : '#333', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
            >
              HEX → RGB
            </button>
            <button
              onClick={() => setMode('rgb2hex')}
              style={{ padding: '8px 16px', background: mode === 'rgb2hex' ? '#333' : '#f5f5f5', color: mode === 'rgb2hex' ? '#fff' : '#333', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
            >
              RGB → HEX
            </button>
          </div>
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={mode === 'hex2rgb' ? '输入 HEX（如 #FF5733）...' : '输入 RGB（如 255, 87, 51）...'}
            style={{ width: '100%', padding: '12px', fontSize: '14px', border: '1px solid #e5e5e5', borderRadius: '8px', fontFamily: 'monospace' }}
          />
          <button onClick={handleConvert} disabled={loading} style={{ padding: '12px 24px', background: loading ? '#999' : '#333', color: '#fff', border: 'none', borderRadius: '8px', cursor: loading ? 'default' : 'pointer', alignSelf: 'flex-start' }}>
            转换
          </button>
          {output && (
            <input
              type="text"
              value={output}
              readOnly
              style={{ width: '100%', padding: '12px', fontSize: '14px', border: '1px solid #e5e5e5', borderRadius: '8px', fontFamily: 'monospace', background: '#f9f9f9' }}
            />
          )}
          {error && <div style={{ color: '#ef4444', fontSize: '13px' }}>{error}</div>}
        </div>
      </ToolLayout>
  )
}