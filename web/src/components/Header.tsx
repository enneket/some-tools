import { Link } from 'react-router-dom'

export default function Header() {
  return (
    <header style={{ padding: '20px', borderBottom: '1px solid #eee' }}>
      <Link to="/" style={{ textDecoration: 'none', fontSize: '24px', fontWeight: 'bold', color: '#333' }}>
        ToolHub
      </Link>
    </header>
  )
}
