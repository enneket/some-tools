import { useNavigate } from 'react-router-dom'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface ToolCardProps {
  id: string
  name: string
  description: string
}

export default function ToolCard({ id, name, description }: ToolCardProps) {
  const navigate = useNavigate()

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => navigate(`/tools/${id}`)}
    >
      <div
        draggable={false}
        style={{
          padding: '20px',
          border: '1px solid #e5e5e5',
          borderRadius: '12px',
          height: '120px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          transition: 'border-color 0.2s, box-shadow 0.2s',
          background: isDragging ? '#f9f9f9' : '#fff',
          boxShadow: isDragging ? '0 4px 12px rgba(0,0,0,0.15)' : 'none',
          cursor: isDragging ? 'grabbing' : 'grab',
        }}
      >
        <h3 style={{ margin: 0, fontSize: '16px' }}>{name}</h3>
        <p style={{ color: '#666', margin: 0, fontSize: '14px', lineHeight: 1.5 }}>{description}</p>
      </div>
    </div>
  )
}
