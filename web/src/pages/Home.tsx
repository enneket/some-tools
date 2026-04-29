import { useState, useEffect } from 'react'
import Header from '../components/Header'
import ToolCard from '../components/ToolCard'

interface Tool {
  id: string
  name: string
  description: string
  category: string
}

const CATEGORIES = ['全部', '编解码', '生成器', '转换器']

export default function Home() {
  const [tools, setTools] = useState<Tool[]>([])
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('全部')

  useEffect(() => {
    fetch('/api/tools')
      .then(res => res.json())
      .then(data => setTools(data))
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
        <div style={{ display: 'flex', gap: '12px', marginBottom: '32px' }}>
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
          {filtered.map(tool => (
            <ToolCard key={tool.id} id={tool.id} name={tool.name} description={tool.description} />
          ))}
        </div>
      </div>
    </div>
  )
}