import { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'

interface ToolLayoutProps {
  title: string
  description: string
  children: ReactNode
}

export default function ToolLayout({ title, description, children }: ToolLayoutProps) {
  const navigate = useNavigate()

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px' }}>
      <button
        onClick={() => navigate(-1)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '8px 16px',
          marginBottom: '24px',
          background: '#f5f5f5',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '14px',
          color: '#333',
        }}
      >
        ← 返回
      </button>
      <div style={{ display: 'flex', gap: '48px' }}>
        <div style={{ flex: '0 0 240px' }}>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
        <div style={{ flex: 1 }}>{children}</div>
      </div>
    </div>
  )
}
