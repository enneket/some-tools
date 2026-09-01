import { useState, useEffect } from 'react'
import ToolLayout from '../components/ToolLayout'

type Unit = 's' | 'ms'

const UNIT_OPTIONS: { value: Unit; label: string }[] = [
  { value: 's', label: '秒' },
  { value: 'ms', label: '毫秒' },
]

function pad(n: number) {
  return String(n).padStart(2, '0')
}

async function callApi(input: string, to: 'date' | 'timestamp', timezone: string) {
  const res = await fetch('/api/convert/timestamp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ input, to, timezone }),
  })
  const ct = res.headers.get('content-type') || ''
  if (ct.includes('application/json')) {
    const data = await res.json()
    return data.output || data.error || `HTTP ${res.status}`
  }
  const text = await res.text()
  return text || `HTTP ${res.status}`
}

export default function TimestampConverter() {
  const [timezone, setTimezone] = useState('Asia/Shanghai')
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [])

  const formattedDate = new Date(now).toLocaleString('sv-SE', { timeZone: timezone })
  const currentTimestamp = Math.floor(now / 1000)

  // Row 1: Unix timestamp → 日期
  const [row1Input, setRow1Input] = useState('')
  const [row1Unit, setRow1Unit] = useState<Unit>('s')
  const [row1Output, setRow1Output] = useState('')
  const [row1Error, setRow1Error] = useState('')

  // Row 2: 文字日期 → Unix 时间戳
  const [row2Input, setRow2Input] = useState('')
  const [row2Unit, setRow2Unit] = useState<Unit>('s')
  const [row2Output, setRow2Output] = useState('')
  const [row2Error, setRow2Error] = useState('')

  // Row 3: 年月日时分秒 → Unix 时间戳
  const now0 = new Date()
  const [row3Y, setRow3Y] = useState(String(now0.getFullYear()))
  const [row3Mo, setRow3Mo] = useState(pad(now0.getMonth() + 1))
  const [row3D, setRow3D] = useState(pad(now0.getDate()))
  const [row3H, setRow3H] = useState(pad(now0.getHours()))
  const [row3Mi, setRow3Mi] = useState(pad(now0.getMinutes()))
  const [row3S, setRow3S] = useState(pad(now0.getSeconds()))
  const [row3Unit, setRow3Unit] = useState<Unit>('s')
  const [row3Output, setRow3Output] = useState('')
  const [row3Error, setRow3Error] = useState('')

  const [copied, setCopied] = useState(false)
  const handleCopyTs = async () => {
    const text = String(currentTimestamp)
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1200)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = text
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      try {
        document.execCommand('copy')
        setCopied(true)
        setTimeout(() => setCopied(false), 1200)
      } catch {
        // ignore
      }
      document.body.removeChild(ta)
    }
  }

  const handleRow1 = async () => {
    setRow1Error('')
    if (!row1Input.trim()) {
      setRow1Output('')
      setRow1Error('请输入时间戳')
      return
    }
    try {
      const out = await callApi(row1Input.trim(), 'date', timezone)
      if (/^Invalid/i.test(out) || /^Error/i.test(out)) {
        setRow1Error(out)
        setRow1Output('')
      } else {
        setRow1Output(out)
      }
    } catch (err) {
      setRow1Error('Error: ' + (err as Error).message)
    }
  }

  const handleRow2 = async () => {
    setRow2Error('')
    if (!row2Input.trim()) {
      setRow2Output('')
      setRow2Error('请输入日期')
      return
    }
    try {
      const out = await callApi(row2Input.trim(), 'timestamp', timezone)
      if (/^Invalid/i.test(out) || /^Error/i.test(out)) {
        setRow2Error(out)
        setRow2Output('')
        return
      }
      const sec = Number(out)
      if (Number.isFinite(sec)) {
        setRow2Output(row2Unit === 'ms' ? String(sec * 1000) : out)
      } else {
        setRow2Output(out)
      }
    } catch (err) {
      setRow2Error('Error: ' + (err as Error).message)
    }
  }

  const handleRow3 = async () => {
    setRow3Error('')
    const composite = `${row3Y}-${row3Mo}-${row3D} ${row3H}:${row3Mi}:${row3S}`
    try {
      const out = await callApi(composite, 'timestamp', timezone)
      if (/^Invalid/i.test(out) || /^Error/i.test(out)) {
        setRow3Error(out)
        setRow3Output('')
        return
      }
      const sec = Number(out)
      if (Number.isFinite(sec)) {
        setRow3Output(row3Unit === 'ms' ? String(sec * 1000) : out)
      } else {
        setRow3Output(out)
      }
    } catch (err) {
      setRow3Error('Error: ' + (err as Error).message)
    }
  }

  const inputStyle: React.CSSProperties = {
    padding: '10px 12px',
    fontSize: '14px',
    border: '1px solid #e5e5e5',
    borderRadius: '8px',
    fontFamily: 'monospace',
    background: '#fff',
    outline: 'none',
  }

  const selectStyle: React.CSSProperties = {
    padding: '10px 12px',
    fontSize: '14px',
    border: '1px solid #e5e5e5',
    borderRadius: '8px',
    background: '#fff',
    cursor: 'pointer',
  }

  const outlinedBtn: React.CSSProperties = {
    padding: '10px 18px',
    fontSize: '14px',
    background: '#fff',
    color: '#3b82f6',
    border: '1px solid #3b82f6',
    borderRadius: '8px',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  }

  const outputStyle: React.CSSProperties = {
    flex: 1,
    minWidth: '180px',
    padding: '10px 12px',
    fontSize: '14px',
    border: '1px solid #e5e5e5',
    borderRadius: '8px',
    fontFamily: 'monospace',
    background: '#f8f9fa',
  }

  const rowStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap',
  }

  const labelStyle: React.CSSProperties = {
    fontSize: '14px',
    color: '#333',
    whiteSpace: 'nowrap',
    minWidth: '180px',
  }

  const errorStyle: React.CSSProperties = {
    color: '#c53030',
    fontSize: '12px',
    marginTop: '4px',
    minHeight: '16px',
  }

  return (
    <ToolLayout title="时间戳转换" description="时间戳与日期时间互转">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* 当前时间 */}
        <div
          style={{
            background: '#f8f9fa',
            borderRadius: '12px',
            padding: '20px',
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '16px',
          }}
        >
          <div>
            <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>当前时间</div>
            <div style={{ fontSize: '18px', fontFamily: 'monospace', fontWeight: 600 }}>
              {formattedDate}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>当前时间戳</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '18px', fontFamily: 'monospace', fontWeight: 600 }}>
                {currentTimestamp}
              </span>
              <button
                onClick={handleCopyTs}
                style={{
                  padding: '2px 10px',
                  fontSize: '12px',
                  background: copied ? '#e6f4ea' : '#fff',
                  color: copied ? '#1e7a3a' : '#333',
                  border: '1px solid #e5e5e5',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  transition: 'all 150ms',
                }}
              >
                {copied ? '已复制' : '复制'}
              </button>
            </div>
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

        {/* Row 1: Unix timestamp → 日期 */}
        <div style={rowStyle}>
          <label style={labelStyle}>Unix 时间戳（Unix timestamp）</label>
          <input
            type="text"
            value={row1Input}
            onChange={e => setRow1Input(e.target.value)}
            placeholder="1788223556"
            style={{ ...inputStyle, flex: 1, minWidth: '200px' }}
          />
          <select
            value={row1Unit}
            onChange={e => setRow1Unit(e.target.value as Unit)}
            style={selectStyle}
          >
            {UNIT_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <button onClick={handleRow1} style={outlinedBtn}>
            转换
          </button>
          <input
            type="text"
            value={row1Output}
            readOnly
            placeholder="2026-09-01 08:45:56"
            style={outputStyle}
          />
        </div>
        <div style={errorStyle}>{row1Error}</div>

        {/* Row 2: 文字日期 → Unix 时间戳 */}
        <div style={rowStyle}>
          <label style={labelStyle}>时间（年/月/日 时:分:秒）</label>
          <input
            type="text"
            value={row2Input}
            onChange={e => setRow2Input(e.target.value)}
            placeholder="2026-09-01 08:45:56"
            style={{ ...inputStyle, flex: 1, minWidth: '200px' }}
          />
          <button onClick={handleRow2} style={outlinedBtn}>
            转换成Unix时间戳
          </button>
          <input
            type="text"
            value={row2Output}
            readOnly
            placeholder="1788223556"
            style={outputStyle}
          />
          <select
            value={row2Unit}
            onChange={e => setRow2Unit(e.target.value as Unit)}
            style={selectStyle}
          >
            {UNIT_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div style={errorStyle}>{row2Error}</div>

        {/* Row 3: 年月日时分秒 → Unix 时间戳 */}
        <div style={rowStyle}>
          <label style={labelStyle}>时间</label>
          {(
            [
              { v: row3Y, set: setRow3Y, ph: '年', len: 4 },
              { v: row3Mo, set: setRow3Mo, ph: '月', len: 2 },
              { v: row3D, set: setRow3D, ph: '日', len: 2 },
              { v: row3H, set: setRow3H, ph: '时', len: 2 },
              { v: row3Mi, set: setRow3Mi, ph: '分', len: 2 },
              { v: row3S, set: setRow3S, ph: '秒', len: 2 },
            ] as const
          ).map((f, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <input
                type="text"
                value={f.v}
                onChange={e => f.set(e.target.value.replace(/\D/g, '').slice(0, f.len))}
                placeholder={f.ph}
                style={{ ...inputStyle, width: '64px', textAlign: 'center' }}
              />
              <span style={{ fontSize: '13px', color: '#333' }}>{f.ph}</span>
            </div>
          ))}
          <button onClick={handleRow3} style={outlinedBtn}>
            转换成Unix时间戳
          </button>
          <input
            type="text"
            value={row3Output}
            readOnly
            placeholder="1788223556"
            style={outputStyle}
          />
          <select
            value={row3Unit}
            onChange={e => setRow3Unit(e.target.value as Unit)}
            style={selectStyle}
          >
            {UNIT_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div style={errorStyle}>{row3Error}</div>
      </div>
    </ToolLayout>
  )
}
