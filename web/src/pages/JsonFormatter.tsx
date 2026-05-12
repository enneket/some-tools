import { useState } from 'react'
import ToolLayout from '../components/ToolLayout'

export default function JsonFormatter() {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(output)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleFormat = async () => {
    try {
      const res = await fetch('/api/format/json', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input }),
      })
      const data = await res.json()
      setOutput(data.output || data.error || '')
    } catch (err) {
      setOutput('Error: ' + (err as Error).message)
    }
  }

  return (
    <ToolLayout title="JSON 格式化" description="格式化、压缩、验证 JSON">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="输入 JSON..."
            style={{ width: '100%', height: '200px', padding: '12px', fontSize: '14px', border: '1px solid #e5e5e5', borderRadius: '8px', resize: 'vertical', fontFamily: 'monospace' }}
          />
          <button onClick={handleFormat} style={{ padding: '12px 24px', background: '#333', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', alignSelf: 'flex-start' }}>
            格式化
          </button>
          {output && (
            <div style={{ position: 'relative' }}>
              <button
                onClick={handleCopy}
                style={{
                  position: 'absolute', top: '8px', right: '8px', padding: '6px 14px',
                  background: copied ? '#22c55e' : '#333', color: '#fff', border: 'none',
                  borderRadius: '6px', cursor: 'pointer', fontSize: '13px', zIndex: 1,
                }}
              >
                {copied ? '已复制' : '复制'}
              </button>
              <textarea
                value={output}
                readOnly
                style={{ width: '100%', height: '200px', padding: '12px', fontSize: '14px', border: '1px solid #e5e5e5', borderRadius: '8px', resize: 'vertical', fontFamily: 'monospace', background: '#f9f9f9' }}
              />
            </div>
          )}
        </div>
      </ToolLayout>
  )
}