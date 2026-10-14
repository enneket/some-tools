import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom'
import Home from './pages/Home'
import AllTools from './pages/AllTools'
import { TOOLS } from './data/tools'

function ToolRoute() {
  const { id } = useParams()
  const tool = TOOLS.find(t => t.id === id)
  if (!tool) return <Navigate to="/" replace />
  const Tool = tool.component
  return <Tool />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/all" element={<AllTools />} />
        <Route path="/tools/:id" element={<ToolRoute />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}