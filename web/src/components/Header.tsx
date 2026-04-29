import { Link } from 'react-router-dom'

export default function Header() {
  return (
    <header style={{ padding: '16px 0' }}>
      <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
        ToolHub
      </Link>
    </header>
  )
}
