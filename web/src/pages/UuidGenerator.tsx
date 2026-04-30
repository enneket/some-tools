import { useState } from 'react'
import ToolLayout from '../components/ToolLayout'

export default function UuidGenerator() {
  const [uuid, setUuid] = useState('')

  const handleGenerate = async () => {
    try {
      const res = await fetch('/api/generate/uuid', { method: 'POST' })
      const data = await res.json()
      setUuid(data.output || data.error || '')
    } catch (err) {
      setUuid('Error: ' + (err as Error).message)
    }
  }

  return (
    <ToolLayout title="UUID 生成" description="生成随机 UUID">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <button onClick={handleGenerate} style={{ padding: '12px 24px', background: '#333', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', alignSelf: 'flex-start' }}>
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
        </div>
    </ToolLayout>
  )
}