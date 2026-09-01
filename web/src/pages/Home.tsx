import { useState, useEffect } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable'
import Header from '../components/Header'
import ToolCard from '../components/ToolCard'
import { TOOLS, type ToolEntry } from '../data/tools'

interface Tool {
  id: string
  name: string
  description: string
  category: string
}

const CATEGORIES = ['全部', ...new Set(TOOLS.map(t => t.category))]

const BY_BACKEND_NAME = new Map(TOOLS.map((t: ToolEntry) => [t.backendName, t]))

const STORAGE_KEY = 'some-tools-order'

export default function Home() {
  const [tools, setTools] = useState<Tool[]>([])
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('全部')

  const sensors = useSensors(
    useSensor(PointerSensor, {
      preventDefault: false,
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  useEffect(() => {
    fetch('/api/tools')
      .then(res => res.json())
      .then(data => {
        const mapped = (data.tools || []).map((t: { name: string; description: string }) => {
          const meta = BY_BACKEND_NAME.get(t.name)
          return {
            id: meta?.id || t.name,
            name: meta?.name || t.name,
            description: meta?.description || t.description,
            category: meta?.category || '其他',
          }
        })

        // Load saved order from localStorage
        const savedOrder = localStorage.getItem(STORAGE_KEY)
        if (savedOrder) {
          try {
            const orderMap: Record<string, number> = JSON.parse(savedOrder)
            mapped.sort((a: Tool, b: Tool) => {
              const orderA = orderMap[a.id] ?? 9999
              const orderB = orderMap[b.id] ?? 9999
              return orderA - orderB
            })
          } catch {
            // Ignore parse errors
          }
        }

        setTools(mapped)
      })
      .catch(console.error)
  }, [])

  const filtered = tools.filter(tool => {
    const matchSearch = tool.name.toLowerCase().includes(search.toLowerCase())
    const matchCategory = category === '全部' || tool.category === category
    return matchSearch && matchCategory
  })

  return (
    <div>
      <Header />
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px' }}>
        <div style={{ marginBottom: '32px' }}>
          <input
            type="text"
            placeholder="搜索工具..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 16px',
              fontSize: '16px',
              border: '1px solid #e5e5e5',
              borderRadius: '8px',
            }}
          />
        </div>
        <div style={{ display: 'flex', gap: '12px', marginBottom: '32px', flexWrap: 'wrap' }}>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              style={{
                padding: '8px 16px',
                border: 'none',
                borderRadius: '20px',
                background: category === cat ? '#333' : '#f5f5f5',
                color: category === cat ? '#fff' : '#333',
                cursor: 'pointer',
              }}
            >
              {cat}
            </button>
          ))}
        </div>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={(event) => {
            const { active, over } = event

            if (over && active.id !== over.id) {
              setTools((items) => {
                const oldIndex = items.findIndex(t => t.id === active.id)
                const newIndex = items.findIndex(t => t.id === over.id)
                const newItems = arrayMove(items, oldIndex, newIndex)

                const orderMap: Record<string, number> = {}
                newItems.forEach((item, index) => {
                  orderMap[item.id] = index
                })
                localStorage.setItem(STORAGE_KEY, JSON.stringify(orderMap))

                return newItems
              })
            }
          }}
        >
          <SortableContext items={filtered.map(t => t.id)} strategy={rectSortingStrategy}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
              {filtered.map(tool => (
                <ToolCard key={tool.id} id={tool.id} name={tool.name} description={tool.description} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>
    </div>
  )
}