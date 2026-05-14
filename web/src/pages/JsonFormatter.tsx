import { useState, useRef, useEffect } from 'react'
import ToolLayout from '../components/ToolLayout'

function preprocessJson(raw: string): string {
  let s = raw
  // 去掉单行注释
  s = s.replace(/\/\/.*$/gm, '')
  // 去掉多行注释
  s = s.replace(/\/\*[\s\S]*?\*\//g, '')
  // 去掉尾逗号  ,] 或 ,}
  s = s.replace(/,\s*([}\]])/g, '$1')
  // 单引号换双引号
  s = s.replace(/'/g, '"')
  // 无引号的 key 加双引号
  s = s.replace(/([{,]\s*)([a-zA-Z_]\w*)\s*:/g, '$1"$2":')
  return s
}

function parseLenient(raw: string): unknown {
  const trimmed = raw.trim()
  if (!trimmed) throw new Error('请输入 JSON')
  // 先尝试标准解析
  try {
    let result: unknown = JSON.parse(trimmed)
    // 如果 parse 出来是字符串，说明输入是 "转义JSON"，再解一层
    if (typeof result === 'string') {
      try { result = JSON.parse(result) } catch { /* 不是就用原值 */ }
    }
    return result
  } catch {
    // 预处理后再试
    return JSON.parse(preprocessJson(trimmed))
  }
}

export default function JsonFormatter() {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')
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

  const handleFormat = () => {
    setError('')
    try {
      setOutput(JSON.stringify(parseLenient(input), null, 2))
    } catch (err) {
      setError('无法解析: ' + (err as Error).message)
    }
  }

  const handleMinify = () => {
    setError('')
    try {
      setOutput(JSON.stringify(parseLenient(input)))
    } catch (err) {
      setError('无法解析: ' + (err as Error).message)
    }
  }

  return (
    <ToolLayout title="JSON 格式化" description="格式化、压缩、验证 JSON">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder='粘贴 JSON，例如: {"_source":true,"from":0,"query":{"bool":{"must":[{"term":{"deleted_at":0}}]}}}'
            style={{ width: '100%', height: '200px', padding: '12px', fontSize: '14px', border: '1px solid #e5e5e5', borderRadius: '8px', resize: 'vertical', fontFamily: 'monospace' }}
          />
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={handleFormat} style={{ padding: '12px 24px', background: '#333', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
              格式化
            </button>
            <button onClick={handleMinify} style={{ padding: '12px 24px', background: '#666', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
              压缩
            </button>
          </div>
          {error && <div style={{ color: '#ef4444', fontSize: '14px' }}>{error}</div>}
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
                ref={outputRef}
                value={output}
                readOnly
                style={{ width: '100%', minHeight: '120px', maxHeight: '1000px', padding: '12px', fontSize: '14px', border: '1px solid #e5e5e5', borderRadius: '8px', resize: 'vertical', fontFamily: 'monospace', background: '#f9f9f9', overflow: 'auto' }}
              />
            </div>
          )}
        </div>
      </ToolLayout>
  )
}