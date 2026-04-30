import { Link } from 'react-router-dom'

interface ToolCardProps {
  id: string
  name: string
  description: string
}

export default function ToolCard({ id, name, description }: ToolCardProps) {
  return (
    <Link to={`/tools/${id}`} style={{ textDecoration: 'none', color: 'inherit', cursor: 'pointer', display: 'block' }}>
      <div style={{
        padding: '20px',
        border: '1px solid #e5e5e5',
        borderRadius: '12px',
        height: '120px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        transition: 'border-color 0.2s, box-shadow 0.2s',
      }}>
        <h3 style={{ margin: 0, fontSize: '16px' }}>{name}</h3>
        <p style={{ color: '#666', margin: 0, fontSize: '14px', lineHeight: 1.5 }}>{description}</p>
      </div>
    </Link>
  )
}
