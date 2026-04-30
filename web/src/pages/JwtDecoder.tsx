import { useState } from 'react'
import ToolLayout from '../components/ToolLayout'

export default function JwtDecoder() {
  const [input, setInput] = useState('')
  const [header, setHeader] = useState('')
  const [payload, setPayload] = useState('')
  const [signature, setSignature] = useState('')

  const handleDecode = async () => {
    try {
      const res = await fetch('/api/jwt/decode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input }),
      })
      const data = await res.json()
      if (data.output) {
        setHeader(JSON.stringify(data.output.header, null, 2))
        setPayload(JSON.stringify(data.output.payload, null, 2))
        setSignature(data.output.signature)
      } else {
        setHeader(data.error || 'Error')
        setPayload('')
        setSignature('')
      }
    } catch (err) {
      setHeader('Error: ' + (err as Error).message)
      setPayload('')
      setSignature('')
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
        <button onClick={handleDecode} style={{ padding: '12px 24px', background: '#333', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', alignSelf: 'flex-start' }}>解码</button>
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
