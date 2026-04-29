import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

function Home() {
  return <div>Home</div>
}

function JsonFormatter() {
  return <div>JsonFormatter</div>
}

function Base64() {
  return <div>Base64</div>
}

function UrlEncoder() {
  return <div>UrlEncoder</div>
}

function UuidGenerator() {
  return <div>UuidGenerator</div>
}

function TimestampConverter() {
  return <div>TimestampConverter</div>
}

function ColorConverter() {
  return <div>ColorConverter</div>
}

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
