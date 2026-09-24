import { useState, useRef, useEffect } from 'react'
import ToolLayout from '../components/ToolLayout'
import JsonTree, { collectPaths } from '../components/JsonTree'

const INITIAL_DEPTH = 2
const MAX_EXPAND_DEPTH = 5

function preprocessJson(raw: string): string {
  let s = raw
  s = s.replace(/\/\/.*$/gm, '')
  s = s.replace(/\/\*[\s\S]*?\*\//g, '')
  s = s.replace(/,\s*([}\]])/g, '$1')
  s = s.replace(/'/g, '"')
  s = s.replace(/([{,]\s*)([a-zA-Z_]\w*)\s*:/g, '$1"$2":')
  return s
}

function parseLenient(raw: string): unknown {
  const trimmed = raw.trim()
  if (!trimmed) throw new Error('请输入 JSON')
  try {
    let result: unknown = JSON.parse(trimmed)
    if (typeof result === 'string') {
      try { result = JSON.parse(result) } catch { /* keep original */ }
    }
    return result
  } catch {
    return JSON.parse(preprocessJson(trimmed))
  }
}

export default function JsonFormatter() {
  const [input, setInput] = useState('')
  const [parsed, setParsed] = useState<unknown>(null)
  const [output, setOutput] = useState('')
  const [viewMode, setViewMode] = useState<'text' | 'tree'>('text')
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set())
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')
  const outputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (viewMode !== 'text' || !outputRef.current) return
    outputRef.current.style.height = 'auto'
    outputRef.current.style.height = Math.min(outputRef.current.scrollHeight, 1000) + 'px'
  }, [output, viewMode])

  const refreshParsed = (): unknown => {
    setError('')
    try {
      const p = parseLenient(input)
      setParsed(p)
      setExpanded(collectPaths(p, INITIAL_DEPTH))
      return p
    } catch (err) {
      setError('无法解析: ' + (err as Error).message)
      setParsed(null)
      setExpanded(new Set())
      return null
    }
  }

  const handleFormat = () => {
    const p = refreshParsed()
    if (p !== null) setOutput(JSON.stringify(p, null, 2))
  }

  const handleMinify = () => {
    const p = refreshParsed()
    if (p !== null) setOutput(JSON.stringify(p))
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(output)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleToggle = (path: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(path)) next.delete(path)
      else next.add(path)
      return next
    })
  }

  const handleExpandAll = () => {
    if (parsed === null) return
    setExpanded((prev) => {
      const next = collectPaths(parsed, MAX_EXPAND_DEPTH)
      for (const p of prev) if (!next.has(p)) next.add(p)
      return next
    })
  }

  const handleCollapseAll = () => {
    setExpanded(new Set())
  }

  const hasParsed = parsed !== null

  const viewToggleBtn = (mode: 'text' | 'tree', label: string) => {
    const active = viewMode === mode
    return (
      <button
        onClick={() => setViewMode(mode)}
        style={{
          padding: '6px 14px',
          background: active ? '#333' : '#fff',
          color: active ? '#fff' : '#333',
          border: '1px solid #333',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '13px',
        }}
      >
        {label}
      </button>
    )
  }

  return (
    <ToolLayout title="JSON 格式化" description="格式化、压缩、验证 JSON，支持树形展开 / 合并">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder='粘贴 JSON，例如: {"_source":true,"from":0,"query":{"bool":{"must":[{"term":{"deleted_at":0}}]}}}'
          style={{ width: '100%', height: '200px', padding: '12px', fontSize: '14px', border: '1px solid #e5e5e5', borderRadius: '8px', resize: 'vertical', fontFamily: 'monospace' }}
        />
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button onClick={handleFormat} style={{ padding: '12px 24px', background: '#333', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
            格式化
          </button>
          <button onClick={handleMinify} style={{ padding: '12px 24px', background: '#666', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
            压缩
          </button>
          {hasParsed && (
            <div style={{ display: 'flex', gap: '6px', marginLeft: 'auto' }}>
              {viewToggleBtn('text', '文本视图')}
              {viewToggleBtn('tree', '树形视图')}
            </div>
          )}
        </div>
        {error && <div style={{ color: '#ef4444', fontSize: '14px' }}>{error}</div>}
        {hasParsed && viewMode === 'text' && (
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
        {hasParsed && viewMode === 'tree' && (
          <div style={{ border: '1px solid #e5e5e5', borderRadius: '8px', background: '#f9f9f9', padding: '12px', maxHeight: '600px', overflow: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', paddingBottom: '8px', borderBottom: '1px solid #e5e5e5' }}>
              <button
                onClick={handleExpandAll}
                style={{ padding: '4px 12px', background: '#fff', color: '#333', border: '1px solid #333', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}
              >
                全部展开
              </button>
              <button
                onClick={handleCollapseAll}
                style={{ padding: '4px 12px', background: '#fff', color: '#333', border: '1px solid #333', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}
              >
                全部折叠
              </button>
              <span style={{ marginLeft: 'auto', fontSize: '12px', color: '#666' }}>
                已展开 {expanded.size} 节点
              </span>
            </div>
            <JsonTree value={parsed} expanded={expanded} onToggle={handleToggle} />
          </div>
        )}
      </div>
    </ToolLayout>
  )
}