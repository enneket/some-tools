import { Link } from 'react-router-dom'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface ToolCardProps {
  id: string
  name: string
  description: string
  isDragging?: boolean
}

export default function ToolCard({ id, name, description, isDragging }: ToolCardProps) {
  const {
    attributes,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id })

  const dragging = isDragging || isSortableDragging

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: dragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <Link
        to={`/tools/${id}`}
        draggable={false}
        style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
        onClick={(e) => {
          if (dragging) {
            e.preventDefault()
          }
        }}
      >
        <div
          style={{
            padding: '20px',
            border: '1px solid #e5e5e5',
            borderRadius: '12px',
            height: '120px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            transition: 'border-color 0.2s, box-shadow 0.2s',
            background: dragging ? '#f9f9f9' : '#fff',
            boxShadow: dragging ? '0 4px 12px rgba(0,0,0,0.15)' : 'none',
            cursor: dragging ? 'grabbing' : 'grab',
          }}
        >
          <h3 style={{ margin: 0, fontSize: '16px' }}>{name}</h3>
          <p style={{ color: '#666', margin: 0, fontSize: '14px', lineHeight: 1.5 }}>{description}</p>
        </div>
      </Link>
    </div>
  )
}