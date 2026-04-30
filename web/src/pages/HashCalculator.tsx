import { useState } from 'react'
import ToolLayout from '../components/ToolLayout'

export default function HashCalculator() {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [alg, setAlg] = useState<'md5' | 'sha1' | 'sha256' | 'sha512' | 'all'>('all')

  const handleCalc = async () => {
    try {
      const res = await fetch('/api/hash', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input, alg }),
      })
      const data = await res.json()
      setOutput(data.output || data.error || '')
    } catch (err) {
      setOutput('Error: ' + (err as Error).message)
    }
  }

  return (
    <ToolLayout title="Hash 计算" description="计算 MD5/SHA1/SHA256/SHA512 摘要">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="输入文本..."
          style={{ width: '100%', height: '120px', padding: '12px', fontSize: '14px', border: '1px solid #e5e5e5', borderRadius: '8px', resize: 'vertical', fontFamily: 'monospace' }}
        />
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {(['md5', 'sha1', 'sha256', 'sha512', 'all'] as const).map(a => (
            <button key={a} onClick={() => setAlg(a)} style={{ padding: '8px 16px', background: alg === a ? '#333' : '#f5f5f5', color: alg === a ? '#fff' : '#333', border: 'none', borderRadius: '8px', cursor: 'pointer', textTransform: 'uppercase' }}>{a}</button>
          ))}
        </div>
        <button onClick={handleCalc} style={{ padding: '12px 24px', background: '#333', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', alignSelf: 'flex-start' }}>计算</button>
        {output && (
          <pre style={{ padding: '16px', background: '#f9f9f9', borderRadius: '8px', fontFamily: 'monospace', fontSize: '13px', whiteSpace: 'pre-wrap', wordBreak: 'break-all', margin: 0 }}>{output}</pre>
        )}
      </div>
    </ToolLayout>
  )
}
