import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Home from './pages/Home'
import JsonFormatter from './pages/JsonFormatter'
import Base64 from './pages/Base64'
import UrlEncoder from './pages/UrlEncoder'
import UuidGenerator from './pages/UuidGenerator'
import TimestampConverter from './pages/TimestampConverter'
import ColorConverter from './pages/ColorConverter'
import HashCalculator from './pages/HashCalculator'
import JwtDecoder from './pages/JwtDecoder'
import PasswordGenerator from './pages/PasswordGenerator'
import RegexTester from './pages/RegexTester'
import MarkdownPreview from './pages/MarkdownPreview'
import TextDiff from './pages/TextDiff'
import QrCodeGenerator from './pages/QrCodeGenerator'

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
        <Route path="/tools/hash-calculator" element={<HashCalculator />} />
        <Route path="/tools/jwt-decoder" element={<JwtDecoder />} />
        <Route path="/tools/password-generator" element={<PasswordGenerator />} />
        <Route path="/tools/regex-tester" element={<RegexTester />} />
        <Route path="/tools/markdown-preview" element={<MarkdownPreview />} />
        <Route path="/tools/text-diff" element={<TextDiff />} />
        <Route path="/tools/qrcode-generator" element={<QrCodeGenerator />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
