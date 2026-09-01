import { Link } from 'react-router-dom'

export default function Header() {
  return (
    <header style={{ padding: '20px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <Link to="/" style={{ textDecoration: 'none', fontSize: '24px', fontWeight: 'bold', color: '#333' }}>
        ToolHub
      </Link>
      <nav style={{ display: 'flex', gap: '16px' }}>
        <Link to="/" style={{ textDecoration: 'none', fontSize: '14px', color: '#666' }}>
          首页
        </Link>
        <Link to="/all" style={{ textDecoration: 'none', fontSize: '14px', color: '#666' }}>
          全部工具
        </Link>
      </nav>
    </header>
  )
}
