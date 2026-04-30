import { useState } from 'react'
import ToolLayout from '../components/ToolLayout'

const WEEKDAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
const MONTHS = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月']

function parseCronField(field: string, min: number, names?: string[]): string {
  if (field === '*') return '每' + (names ? '个' : '')
  if (field.includes('/')) {
    const [range, step] = field.split('/')
    const start = range === '*' ? min : parseInt(range)
    return `从 ${names ? names[start] || String(start) : start} 开始，每隔 ${step} 个`
  }
  if (field.includes('-')) {
    const [from, to] = field.split('-').map(Number)
    return `${names ? names[from] || String(from) : from} 到 ${names ? names[to] || String(to) : to}`
  }
  if (field.includes(',')) {
    return field.split(',').map(v => names ? names[parseInt(v)] || v : v).join(', ')
  }
  return names ? names[parseInt(field)] || field : field
}

function describeCron(expr: string): string {
  const parts = expr.trim().split(/\s+/)
  if (parts.length !== 5) return '需要 5 个字段：分 时 日 月 周'

  const [min, hour, day, month, weekday] = parts
  const desc: string[] = []

  if (weekday !== '*') desc.push(`在 ${parseCronField(weekday, 0, WEEKDAYS)}`)
  if (month !== '*') desc.push(`${parseCronField(month, 1, MONTHS)}`)
  if (day !== '*') desc.push(`${parseCronField(day, 1)} 号`)
  if (hour !== '*') desc.push(`${parseCronField(hour, 0)} 时`)
  if (min !== '*') desc.push(`${parseCronField(min, 0)} 分`)

  if (desc.length === 0) return '每分钟执行一次'
  return desc.reverse().join('，')
}

function getNextRuns(expr: string, count: number): Date[] {
  const parts = expr.trim().split(/\s+/)
  if (parts.length !== 5) return []

  const [minExpr, hourExpr, dayExpr, monthExpr, weekdayExpr] = parts
  const now = new Date()
  const results: Date[] = []

  const matches = (val: number, expr: string): boolean => {
    if (expr === '*') return true
    if (expr.includes('/')) {
      const [range, step] = expr.split('/').map(Number)
      const start = range || 0
      return (val - start) % step === 0
    }
    if (expr.includes('-')) {
      const [from, to] = expr.split('-').map(Number)
      return val >= from && val <= to
    }
    if (expr.includes(',')) {
      return expr.split(',').map(Number).includes(val)
    }
    return val === parseInt(expr)
  }

  const d = new Date(now)
  d.setSeconds(0)
  d.setMilliseconds(0)
  d.setMinutes(d.getMinutes() + 1)

  for (let i = 0; i < 525960 && results.length < count; i++) {
    if (
      matches(d.getMinutes(), minExpr) &&
      matches(d.getHours(), hourExpr) &&
      matches(d.getDate(), dayExpr) &&
      matches(d.getMonth() + 1, monthExpr) &&
      matches(d.getDay(), weekdayExpr)
    ) {
      results.push(new Date(d))
    }
    d.setMinutes(d.getMinutes() + 1)
  }
  return results
}

const PRESETS = [
  { label: '每分钟', value: '* * * * *' },
  { label: '每小时', value: '0 * * * *' },
  { label: '每天零点', value: '0 0 * * *' },
  { label: '每周一', value: '0 0 * * 1' },
  { label: '每月1号', value: '0 0 1 * *' },
  { label: '工作日9点', value: '0 9 * * 1-5' },
  { label: '每5分钟', value: '*/5 * * * *' },
  { label: '每30分钟', value: '*/30 * * * *' },
]

export default function CronParser() {
  const [cron, setCron] = useState('0 9 * * 1-5')

  const description = describeCron(cron)
  const nextRuns = getNextRuns(cron, 5)
  const parts = cron.trim().split(/\s+/)
  const valid = parts.length === 5

  return (
    <ToolLayout title="Cron 表达式解析" description="解析 Cron 表达式，查看执行计划">
      <div style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
          {PRESETS.map(p => (
            <button key={p.value} onClick={() => setCron(p.value)} style={{
              padding: '4px 10px', border: '1px solid #e5e5e5', borderRadius: '16px',
              background: cron === p.value ? '#333' : '#fff',
              color: cron === p.value ? '#fff' : '#333',
              cursor: 'pointer', fontSize: '13px',
            }}>{p.label}</button>
          ))}
        </div>
        <input
          value={cron}
          onChange={e => setCron(e.target.value)}
          placeholder="* * * * *"
          style={{
            width: '100%', padding: '12px 16px', fontSize: '20px', fontFamily: 'monospace',
            border: `2px solid ${valid ? '#e5e5e5' : '#ef4444'}`, borderRadius: '8px',
            textAlign: 'center', letterSpacing: '4px',
          }}
        />
      </div>

      {valid && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px', marginBottom: '24px' }}>
            {['分', '时', '日', '月', '周'].map((label, i) => (
              <div key={i} style={{ textAlign: 'center', padding: '12px', background: '#f8f8f8', borderRadius: '8px' }}>
                <div style={{ fontSize: '12px', color: '#999', marginBottom: '4px' }}>{label}</div>
                <div style={{ fontSize: '18px', fontFamily: 'monospace', fontWeight: 600 }}>{parts[i]}</div>
              </div>
            ))}
          </div>

          <div style={{ padding: '16px', background: '#f0fdf4', borderRadius: '8px', marginBottom: '24px', border: '1px solid #bbf7d0' }}>
            <div style={{ fontWeight: 600, marginBottom: '4px' }}>执行计划</div>
            <div style={{ color: '#333' }}>{description}</div>
          </div>

          <div>
            <div style={{ fontWeight: 600, marginBottom: '12px' }}>最近 5 次执行时间</div>
            {nextRuns.map((d, i) => (
              <div key={i} style={{
                padding: '10px 16px', background: i % 2 === 0 ? '#fafafa' : '#fff',
                borderRadius: '6px', fontFamily: 'monospace', fontSize: '14px',
                display: 'flex', justifyContent: 'space-between',
              }}>
                <span>{d.getFullYear()}-{String(d.getMonth() + 1).padStart(2, '0')}-{String(d.getDate()).padStart(2, '0')}</span>
                <span>{WEEKDAYS[d.getDay()]}</span>
                <span>{String(d.getHours()).padStart(2, '0')}:{String(d.getMinutes()).padStart(2, '0')}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {!valid && <div style={{ color: '#ef4444', textAlign: 'center', padding: '20px' }}>请输入有效的 5 段 Cron 表达式</div>}
    </ToolLayout>
  )
}
