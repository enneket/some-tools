import { useState, useRef, useEffect } from 'react'
import ToolLayout from '../components/ToolLayout'

export default function SqlFormatter() {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [copied, setCopied] = useState(false)
  const outputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.style.height = 'auto'
      outputRef.current.style.height = Math.min(outputRef.current.scrollHeight, 1000) + 'px'
    }
  }, [output])

  const handleCopy = async () => {
    await navigator.clipboard.writeText(output)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleFormat = async () => {
    if (!input.trim()) return
    try {
      const res = await fetch('/api/format/sql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input }),
      })
      const data = await res.json()
      setOutput(data.output || '')
    } catch {
      setOutput('请求失败')
    }
  }

  return (
    <ToolLayout title="SQL 格式化" description="规范化并格式化 SQL 语句">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="粘贴 SQL，例如: SELECT*FROM users WHERE id=1; SELECT name FROM orders WHERE status='active'"
          style={{
            width: '100%',
            height: '200px',
            padding: '12px',
            fontSize: '14px',
            border: '1px solid #e5e5e5',
            borderRadius: '8px',
            resize: 'vertical',
            fontFamily: 'monospace',
          }}
        />
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={handleFormat}
            style={{
              padding: '12px 24px',
              background: '#333',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
            }}
          >
            格式化
          </button>
        </div>
        {output && (
          <div style={{ position: 'relative' }}>
            <button
              onClick={handleCopy}
              style={{
                position: 'absolute',
                top: '8px',
                right: '8px',
                padding: '6px 14px',
                background: copied ? '#22c55e' : '#333',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '13px',
                zIndex: 1,
              }}
            >
              {copied ? '已复制' : '复制'}
            </button>
            <textarea
              ref={outputRef}
              value={output}
              readOnly
              style={{
                width: '100%',
                minHeight: '120px',
                maxHeight: '1000px',
                padding: '12px',
                fontSize: '14px',
                border: '1px solid #e5e5e5',
                borderRadius: '8px',
                resize: 'vertical',
                fontFamily: 'monospace',
                background: '#f9f9f9',
                overflow: 'auto',
              }}
            />
          </div>
        )}
      </div>
    </ToolLayout>
  )
}
