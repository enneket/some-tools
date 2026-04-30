import { useState } from 'react'
import ToolLayout from '../components/ToolLayout'

export default function Base64() {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [mode, setMode] = useState<'encode' | 'decode'>('encode')

  const handleConvert = async () => {
    try {
      const res = await fetch('/api/encode/base64', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input, action: mode }),
      })
      const data = await res.json()
      setOutput(data.output || data.error || '')
    } catch (err) {
      setOutput('Error: ' + (err as Error).message)
    }
  }

  return (
    <ToolLayout title="Base64 编解码" description="Base64 编码和解码">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => setMode('encode')}
              style={{ padding: '8px 16px', background: mode === 'encode' ? '#333' : '#f5f5f5', color: mode === 'encode' ? '#fff' : '#333', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
            >
              编码
            </button>
            <button
              onClick={() => setMode('decode')}
              style={{ padding: '8px 16px', background: mode === 'decode' ? '#333' : '#f5f5f5', color: mode === 'decode' ? '#fff' : '#333', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
            >
              解码
            </button>
          </div>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={mode === 'encode' ? '输入文本...' : '输入 Base64...'}
            style={{ width: '100%', height: '150px', padding: '12px', fontSize: '14px', border: '1px solid #e5e5e5', borderRadius: '8px', resize: 'vertical', fontFamily: 'monospace' }}
          />
          <button onClick={handleConvert} style={{ padding: '12px 24px', background: '#333', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', alignSelf: 'flex-start' }}>
            转换
          </button>
          {output && (
            <textarea
              value={output}
              readOnly
              style={{ width: '100%', height: '150px', padding: '12px', fontSize: '14px', border: '1px solid #e5e5e5', borderRadius: '8px', resize: 'vertical', fontFamily: 'monospace', background: '#f9f9f9' }}
            />
          )}
        </div>
      </ToolLayout>
  )
}