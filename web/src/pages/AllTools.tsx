import { useMemo } from 'react'
import Header from '../components/Header'
import { EmbeddedContext } from '../components/ToolLayout'
import { CATEGORIES, groupToolsByCategory } from '../data/tools'

export default function AllTools() {
  const grouped = useMemo(() => groupToolsByCategory(), [])

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div>
      <Header />
      <div style={{ display: 'flex', gap: '40px', maxWidth: '1200px', margin: '0 auto', padding: '40px', alignItems: 'flex-start' }}>
        <aside style={{ flex: '0 0 200px', position: 'sticky', top: '40px' }}>
          {CATEGORIES.map(cat => (
            <div key={cat} style={{ marginBottom: '24px' }}>
              <div style={{ fontSize: '13px', color: '#999', marginBottom: '8px' }}>{cat}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {(grouped[cat] || []).map(tool => (
                  <button
                    key={tool.id}
                    onClick={() => scrollTo(tool.id)}
                    style={{
                      padding: '8px 12px',
                      border: 'none',
                      borderRadius: '8px',
                      background: '#f5f5f5',
                      color: '#333',
                      cursor: 'pointer',
                      fontSize: '14px',
                      textAlign: 'left',
                    }}
                  >
                    {tool.name}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </aside>
        <main style={{ flex: 1, minWidth: 0 }}>
          <EmbeddedContext.Provider value={true}>
            {CATEGORIES.map(cat => (
              <section key={cat} style={{ marginBottom: '48px' }}>
                <h2 style={{ margin: '0 0 24px', paddingBottom: '8px', borderBottom: '1px solid #eee', fontSize: '20px' }}>{cat}</h2>
                {(grouped[cat] || []).map(tool => {
                  const Tool = tool.component
                  return (
                    <section key={tool.id} id={tool.id} style={{ marginBottom: '40px' }}>
                      <h3 style={{ margin: '0 0 4px', fontSize: '17px' }}>{tool.name}</h3>
                      <p style={{ color: '#666', margin: '0 0 16px', fontSize: '14px' }}>{tool.description}</p>
                      <Tool />
                    </section>
                  )
                })}
              </section>
            ))}
          </EmbeddedContext.Provider>
        </main>
      </div>
    </div>
  )
}
