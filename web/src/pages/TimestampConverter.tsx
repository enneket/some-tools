import { useState, useEffect } from 'react'
import ToolLayout from '../components/ToolLayout'

export default function TimestampConverter() {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [mode, setMode] = useState<'to-date' | 'to-timestamp'>('to-date')
  const [timezone, setTimezone] = useState('Asia/Shanghai')
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [])

  const formattedDate = new Date(now).toLocaleString('sv-SE', { timeZone: timezone })
  const currentTimestamp = Math.floor(now / 1000)

  const handleConvert = async () => {
    try {
      const res = await fetch('/api/convert/timestamp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: mode === 'to-date' ? input : input.trim(), to: mode === 'to-date' ? 'date' : 'timestamp', timezone }),
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
          <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', color: '#666', whiteSpace: 'nowrap' }}>时区</span>
            <select
              value={timezone}
              onChange={e => setTimezone(e.target.value)}
              style={{
                padding: '4px 8px',
                fontSize: '13px',
                border: '1px solid #e5e5e5',
                borderRadius: '6px',
                background: '#fff',
                cursor: 'pointer',
              }}
            >
              <option value="Asia/Shanghai">上海 (UTC+8)</option>
              <option value="Asia/Tokyo">东京 (UTC+9)</option>
              <option value="America/New_York">纽约 (UTC-5/-4)</option>
              <option value="America/Los_Angeles">洛杉矶 (UTC-8/-7)</option>
              <option value="Europe/London">伦敦 (UTC+0/+1)</option>
              <option value="Europe/Berlin">柏林 (UTC+1/+2)</option>
              <option value="Australia/Sydney">悉尼 (UTC+10/+11)</option>
              <option value="UTC">UTC (UTC+0)</option>
            </select>
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
