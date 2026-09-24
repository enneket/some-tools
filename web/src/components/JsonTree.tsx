import { Fragment, useState } from 'react'

interface JsonTreeProps {
  value: unknown
  expanded: Set<string>
  onToggle: (path: string) => void
}

type Kind = 'i' | 'k'

function pathOf(parent: string, kind: Kind, key: string | number): string {
  return `${parent}/${kind}${String(key)}`
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function summary(v: unknown): string {
  if (Array.isArray(v)) {
    return `${v.length} ${v.length === 1 ? 'item' : 'items'}`
  }
  if (isPlainObject(v)) {
    const n = Object.keys(v).length
    return `${n} ${n === 1 ? 'key' : 'keys'}`
  }
  return ''
}

function StringLeaf({ value }: { value: string }) {
  const [expanded, setExpanded] = useState(false)
  const tooLong = value.length > 120
  const display = tooLong && !expanded ? value.slice(0, 120) + '…' : value
  return (
    <span
      style={{ color: '#16a34a', cursor: tooLong ? 'pointer' : 'default' }}
      onClick={tooLong ? (e) => { e.stopPropagation(); setExpanded((v) => !v) } : undefined}
      title={tooLong ? (expanded ? '点击折叠' : '点击展开完整内容') : undefined}
    >
      "{display}"
    </span>
  )
}

function Leaf({ value }: { value: unknown }) {
  if (value === null) return <span style={{ color: '#9ca3af' }}>null</span>
  switch (typeof value) {
    case 'string':
      return <StringLeaf value={value} />
    case 'number':
      return <span style={{ color: '#2563eb' }}>{String(value)}</span>
    case 'boolean':
      return <span style={{ color: '#9333ea' }}>{String(value)}</span>
    default:
      return <span>{String(value)}</span>
  }
}

interface Entry {
  kind: Kind
  key: string
  value: unknown
}

interface NodeProps {
  value: unknown
  path: string
  depth: number
  keyName?: string
  keyKind?: Kind
  expanded: Set<string>
  onToggle: (path: string) => void
}

function Node({ value, path, depth, keyName, keyKind, expanded, onToggle }: NodeProps) {
  const isContainer = Array.isArray(value) || isPlainObject(value)
  if (!isContainer) {
    return (
      <div
        style={{
          paddingLeft: depth * 14,
          fontFamily: 'monospace',
          fontSize: '13px',
          lineHeight: '20px',
          whiteSpace: 'nowrap',
        }}
      >
        {keyKind === 'k' && keyName && (
          <span style={{ color: '#6b7280' }}>"{keyName}": </span>
        )}
        <Leaf value={value} />
      </div>
    )
  }

  const isOpen = expanded.has(path)
  const isArray = Array.isArray(value)
  const open = isArray ? '[' : '{'
  const close = isArray ? ']' : '}'
  const entries: Entry[] = isArray
    ? (value as unknown[]).map((v, i) => ({ kind: 'i', key: String(i), value: v }))
    : Object.entries(value as Record<string, unknown>).map(([k, v]) => ({ kind: 'k', key: k, value: v }))

  return (
    <Fragment>
      <div
        onClick={() => onToggle(path)}
        style={{
          paddingLeft: depth * 14,
          fontFamily: 'monospace',
          fontSize: '13px',
          lineHeight: '20px',
          whiteSpace: 'nowrap',
          cursor: 'pointer',
          userSelect: 'none',
        }}
      >
        {keyKind === 'k' && keyName && (
          <span style={{ color: '#6b7280' }}>"{keyName}": </span>
        )}
        <span style={{ color: '#9ca3af', display: 'inline-block', width: 14 }}>
          {isOpen ? '▼' : '▶'}
        </span>
        <span style={{ color: '#333' }}>{open}</span>
        {!isOpen && (
          <Fragment>
            <span style={{ color: '#9ca3af' }}> {summary(value)} </span>
            <span style={{ color: '#333' }}>{close}</span>
          </Fragment>
        )}
      </div>
      {isOpen && (
        <>
          {entries.map((e) => (
            <Node
              key={`${e.kind}-${e.key}`}
              value={e.value}
              path={pathOf(path, e.kind, e.key)}
              depth={depth + 1}
              keyName={e.kind === 'k' ? e.key : undefined}
              keyKind={e.kind}
              expanded={expanded}
              onToggle={onToggle}
            />
          ))}
          <div
            style={{
              paddingLeft: depth * 14,
              fontFamily: 'monospace',
              fontSize: '13px',
              lineHeight: '20px',
              color: '#333',
            }}
          >
            {close}
          </div>
        </>
      )}
    </Fragment>
  )
}

export default function JsonTree({ value, expanded, onToggle }: JsonTreeProps) {
  if (!Array.isArray(value) && !isPlainObject(value)) {
    return (
      <div style={{ fontFamily: 'monospace', fontSize: '13px', lineHeight: '20px' }}>
        <Leaf value={value} />
      </div>
    )
  }

  const isArray = Array.isArray(value)
  const open = isArray ? '[' : '{'
  const close = isArray ? ']' : '}'
  const entries: Entry[] = isArray
    ? (value as unknown[]).map((v, i) => ({ kind: 'i', key: String(i), value: v }))
    : Object.entries(value as Record<string, unknown>).map(([k, v]) => ({ kind: 'k', key: k, value: v }))

  return (
    <div style={{ fontFamily: 'monospace', fontSize: '13px', lineHeight: '20px' }}>
      <div
        style={{
          paddingLeft: 0,
          fontFamily: 'monospace',
          fontSize: '13px',
          lineHeight: '20px',
          color: '#333',
        }}
      >
        {open}
      </div>
      {entries.map((e) => (
        <Node
          key={`${e.kind}-${e.key}`}
          value={e.value}
          path={pathOf('', e.kind, e.key)}
          depth={1}
          keyName={e.kind === 'k' ? e.key : undefined}
          keyKind={e.kind}
          expanded={expanded}
          onToggle={onToggle}
        />
      ))}
      <div
        style={{
          paddingLeft: 0,
          fontFamily: 'monospace',
          fontSize: '13px',
          lineHeight: '20px',
          color: '#333',
        }}
      >
        {close}
      </div>
    </div>
  )
}

export function collectPaths(value: unknown, maxDepth: number): Set<string> {
  const out = new Set<string>()
  function walk(v: unknown, parentPath: string, depth: number) {
    if (depth > maxDepth) return
    if (Array.isArray(v)) {
      v.forEach((child, i) => {
        const p = pathOf(parentPath, 'i', i)
        out.add(p)
        walk(child, p, depth + 1)
      })
    } else if (isPlainObject(v)) {
      for (const [k, child] of Object.entries(v)) {
        const p = pathOf(parentPath, 'k', k)
        out.add(p)
        walk(child, p, depth + 1)
      }
    }
  }
  walk(value, '', 1)
  return out
}