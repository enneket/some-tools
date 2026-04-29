import { ReactNode } from 'react'

interface ToolLayoutProps {
  title: string
  description: string
  children: ReactNode
}

export default function ToolLayout({ title, description, children }: ToolLayoutProps) {
  return (
    <div style={{ display: 'flex', gap: '48px', padding: '24px 0' }}>
      <div style={{ flex: '0 0 240px' }}>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      <div style={{ flex: 1 }}>{children}</div>
    </div>
  )
}
