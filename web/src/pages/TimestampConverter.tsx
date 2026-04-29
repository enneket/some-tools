import { useState } from 'react'
import Header from '../components/Header'
import ToolLayout from '../components/ToolLayout'

export default function TimestampConverter() {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')

  const handleConvert = async () => {
    try {
      const res = await fetch('/api/convert/timestamp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ timestamp: parseInt(input, 10) }),
      })
      const data = await res.json()
      setOutput(data.result || data.error || '')
    } catch (err) {
      setOutput('Error: ' + (err as Error).message)
    }
  }

  return (
    <div>
      <Header />
      <ToolLayout title="时间戳转换" description="时间戳与日期时间互转">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <input
            type="number"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="输入时间戳（毫秒）..."
            style={{ width: '100%', padding: '12px', fontSize: '14px', border: '1px solid #e5e5e5', borderRadius: '8px', fontFamily: 'monospace' }}
          />
          <button onClick={handleConvert} style={{ padding: '12px 24px', background: '#333', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', alignSelf: 'flex-start' }}>
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
        </div>
      </ToolLayout>
    </div>
  )
}