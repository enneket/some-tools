import { useState } from 'react'
import ToolLayout from '../components/ToolLayout'

export default function JwtDecoder() {
  const [input, setInput] = useState('')
  const [header, setHeader] = useState('')
  const [payload, setPayload] = useState('')
  const [signature, setSignature] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleDecode = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/jwt/decode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input }),
      })
      if (!res.ok) {
        setError(await res.text() || `请求失败 (${res.status})`)
        return
      }
      const data = await res.json()
      if (data.output) {
        setHeader(JSON.stringify(data.output.header, null, 2))
        setPayload(JSON.stringify(data.output.payload, null, 2))
        setSignature(data.output.signature)
      } else {
        setError(data.error || '解析失败')
      }
    } catch (err) {
      setError('请求失败: ' + (err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <ToolLayout title="JWT 解析" description="解码 JWT Token 的 Header、Payload 和 Signature">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="粘贴 JWT Token..."
          style={{ width: '100%', height: '100px', padding: '12px', fontSize: '13px', border: '1px solid #e5e5e5', borderRadius: '8px', resize: 'vertical', fontFamily: 'monospace' }}
        />
        <button onClick={handleDecode} disabled={loading} style={{ padding: '12px 24px', background: loading ? '#999' : '#333', color: '#fff', border: 'none', borderRadius: '8px', cursor: loading ? 'default' : 'pointer', alignSelf: 'flex-start' }}>解码</button>
        {error && <div style={{ color: '#ef4444', fontSize: '13px' }}>{error}</div>}
        {header && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Header</div>
              <pre style={{ padding: '12px', background: '#f9f9f9', borderRadius: '8px', fontFamily: 'monospace', fontSize: '13px', margin: 0, whiteSpace: 'pre-wrap' }}>{header}</pre>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Payload</div>
              <pre style={{ padding: '12px', background: '#f9f9f9', borderRadius: '8px', fontFamily: 'monospace', fontSize: '13px', margin: 0, whiteSpace: 'pre-wrap' }}>{payload}</pre>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Signature</div>
              <pre style={{ padding: '12px', background: '#f9f9f9', borderRadius: '8px', fontFamily: 'monospace', fontSize: '13px', margin: 0, wordBreak: 'break-all' }}>{signature}</pre>
            </div>
          </div>
        )}
      </div>
    </ToolLayout>
  )
}
