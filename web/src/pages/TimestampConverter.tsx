import { useState, useEffect } from 'react'
import ToolLayout from '../components/ToolLayout'

export default function TimestampConverter() {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [mode, setMode] = useState<'to-date' | 'to-timestamp'>('to-date')
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [])

  const currentDate = new Date(now)
  const formattedDate = [
    currentDate.getFullYear(),
    String(currentDate.getMonth() + 1).padStart(2, '0'),
    String(currentDate.getDate()).padStart(2, '0'),
  ].join('-') + ' ' + [
    String(currentDate.getHours()).padStart(2, '0'),
    String(currentDate.getMinutes()).padStart(2, '0'),
    String(currentDate.getSeconds()).padStart(2, '0'),
  ].join(':')
  const currentTimestamp = Math.floor(now / 1000)

  const handleConvert = async () => {
    try {
      const res = await fetch('/api/convert/timestamp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: mode === 'to-date' ? input : input.trim(), to: mode === 'to-date' ? 'date' : 'timestamp' }),
      })
      const data = await res.json()
      setOutput(data.output || data.error || '')
    } catch (err) {
      setOutput('Error: ' + (err as Error).message)
    }
  }

  return (
    <ToolLayout title="时间戳转换" description="时间戳与日期时间互转">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* 当前时间 */}
        <div style={{
          background: '#f8f9fa',
          borderRadius: '12px',
          padding: '20px',
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '16px',
        }}>
          <div>
            <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>当前时间</div>
            <div style={{ fontSize: '18px', fontFamily: 'monospace', fontWeight: 600 }}>{formattedDate}</div>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>当前时间戳</div>
            <div style={{ fontSize: '18px', fontFamily: 'monospace', fontWeight: 600 }}>{currentTimestamp}</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={() => { setMode('to-date'); setOutput('') }}
            style={{
              padding: '8px 16px',
              background: mode === 'to-date' ? '#333' : '#f5f5f5',
              color: mode === 'to-date' ? '#fff' : '#333',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
            }}
          >
            时间戳 → 日期
          </button>
          <button
            onClick={() => { setMode('to-timestamp'); setOutput('') }}
            style={{
              padding: '8px 16px',
              background: mode === 'to-timestamp' ? '#333' : '#f5f5f5',
              color: mode === 'to-timestamp' ? '#fff' : '#333',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
            }}
          >
            日期 → 时间戳
          </button>
        </div>
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder={mode === 'to-date' ? '输入时间戳（秒），如 1714000000...' : '输入日期，格式：2024-04-24 23:06:40'}
          style={{
            width: '100%',
            padding: '12px',
            fontSize: '14px',
            border: '1px solid #e5e5e5',
            borderRadius: '8px',
            fontFamily: 'monospace',
          }}
        />
        <button
          onClick={handleConvert}
          style={{
            padding: '12px 24px',
            background: '#333',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            alignSelf: 'flex-start',
          }}
        >
          转换
        </button>
        {output && (
          <input
            type="text"
            value={output}
            readOnly
            style={{
              width: '100%',
              padding: '12px',
              fontSize: '14px',
              border: '1px solid #e5e5e5',
              borderRadius: '8px',
              fontFamily: 'monospace',
              background: '#f9f9f9',
            }}
          />
        )}
      </div>
    </ToolLayout>
  )
}
