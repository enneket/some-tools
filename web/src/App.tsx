import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Home from './pages/Home'
import JsonFormatter from './pages/JsonFormatter'
import Base64 from './pages/Base64'
import UrlEncoder from './pages/UrlEncoder'
import UuidGenerator from './pages/UuidGenerator'
import TimestampConverter from './pages/TimestampConverter'
import ColorConverter from './pages/ColorConverter'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/tools/json-formatter" element={<JsonFormatter />} />
        <Route path="/tools/base64" element={<Base64 />} />
        <Route path="/tools/url-encoder" element={<UrlEncoder />} />
        <Route path="/tools/uuid-generator" element={<UuidGenerator />} />
        <Route path="/tools/timestamp-converter" element={<TimestampConverter />} />
        <Route path="/tools/color-converter" element={<ColorConverter />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}