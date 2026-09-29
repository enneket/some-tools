import { useState } from 'react'
import ToolLayout from '../components/ToolLayout'

export default function UuidGenerator() {
  const [uuid, setUuid] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleGenerate = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/generate/uuid', { method: 'POST' })
      if (!res.ok) {
        setError(await res.text() || `请求失败 (${res.status})`)
        return
      }
      const data = await res.json()
      setUuid(data.output || '')
    } catch (err) {
      setError('请求失败: ' + (err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <ToolLayout title="UUID 生成" description="生成随机 UUID">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <button onClick={handleGenerate} disabled={loading} style={{ padding: '12px 24px', background: loading ? '#999' : '#333', color: '#fff', border: 'none', borderRadius: '8px', cursor: loading ? 'default' : 'pointer', alignSelf: 'flex-start' }}>
            生成 UUID
          </button>
          {uuid && (
            <input
              type="text"
              value={uuid}
              readOnly
              style={{ width: '100%', padding: '12px', fontSize: '14px', border: '1px solid #e5e5e5', borderRadius: '8px', fontFamily: 'monospace', background: '#f9f9f9' }}
            />
          )}
          {error && <div style={{ color: '#ef4444', fontSize: '13px' }}>{error}</div>}
        </div>
    </ToolLayout>
  )
}