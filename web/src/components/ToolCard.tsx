import { Link } from 'react-router-dom'

interface ToolCardProps {
  id: string
  name: string
  description: string
}

export default function ToolCard({ id, name, description }: ToolCardProps) {
  return (
    <Link to={`/tools/${id}`} style={{ textDecoration: 'none', color: 'inherit', cursor: 'pointer', margin: 0 }}>
      <div style={{
        padding: '16px',
        border: '1px solid #e5e5e5',
        borderRadius: '8px',
      }}>
        <h3>{name}</h3>
        <p style={{ color: '#666' }}>{description}</p>
      </div>
    </Link>
  )
}
