import { useState, useMemo } from 'react'
import ToolLayout from '../components/ToolLayout'

function diffLines(a: string, b: string) {
  const linesA = a.split('\n')
  const linesB = b.split('\n')
  const result: { type: 'same' | 'add' | 'remove'; line: string }[] = []
  const max = Math.max(linesA.length, linesB.length)
  for (let i = 0; i < max; i++) {
    const la = linesA[i]
    const lb = linesB[i]
    if (la === lb) {
      result.push({ type: 'same', line: la || '' })
    } else {
      if (la !== undefined) result.push({ type: 'remove', line: la })
      if (lb !== undefined) result.push({ type: 'add', line: lb })
    }
  }
  return result
}

export default function TextDiff() {
  const [textA, setTextA] = useState('')
  const [textB, setTextB] = useState('')

  const diff = useMemo(() => diffLines(textA, textB), [textA, textB])

  const bgMap = { same: '#fff', add: '#dcfce7', remove: '#fee2e2' }
  const fgMap = { same: '#333', add: '#16a34a', remove: '#dc2626' }
  const prefixMap = { same: '  ', add: '+ ', remove: '- ' }

  return (
    <ToolLayout title="文本对比" description="比较两段文本的差异">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', gap: '16px' }}>
          <textarea
            value={textA}
            onChange={e => setTextA(e.target.value)}
            placeholder="原始文本..."
            style={{ flex: 1, height: '200px', padding: '12px', fontSize: '14px', border: '1px solid #e5e5e5', borderRadius: '8px', resize: 'vertical', fontFamily: 'monospace' }}
          />
          <textarea
            value={textB}
            onChange={e => setTextB(e.target.value)}
            placeholder="修改后的文本..."
            style={{ flex: 1, height: '200px', padding: '12px', fontSize: '14px', border: '1px solid #e5e5e5', borderRadius: '8px', resize: 'vertical', fontFamily: 'monospace' }}
          />
        </div>
        {(textA || textB) && (
          <div style={{ padding: '12px', borderRadius: '8px', fontFamily: 'monospace', fontSize: '13px', lineHeight: '1.6', overflow: 'auto', maxHeight: '400px' }}>
            {diff.map((d, i) => (
              <div key={i} style={{ background: bgMap[d.type], color: fgMap[d.type], padding: '1px 8px' }}>
                <span style={{ userSelect: 'none', opacity: 0.5 }}>{prefixMap[d.type]}</span>{d.line}
              </div>
            ))}
          </div>
        )}
      </div>
    </ToolLayout>
  )
}
