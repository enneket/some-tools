import { Link } from 'react-router-dom'

interface ToolCardProps {
  id: string
  name: string
  description: string
}

export default function ToolCard({ id, name, description }: ToolCardProps) {
  return (
    <Link
      to={`/tools/${id}`}
      style={{
        display: 'block',
        padding: '16px',
        border: '1px solid #e5e5e5',
        borderRadius: '8px',
        textDecoration: 'none',
        color: 'inherit',
      }}
    >
      <h3>{name}</h3>
      <p>{description}</p>
    </Link>
  )
}
