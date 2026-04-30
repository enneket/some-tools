import { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import ToolLayout from '../components/ToolLayout'

export default function QrCodeGenerator() {
  const [input, setInput] = useState('https://example.com')

  return (
    <ToolLayout title="二维码生成" description="文本或链接转二维码">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="输入文本或链接..."
          style={{ width: '100%', height: '100px', padding: '12px', fontSize: '14px', border: '1px solid #e5e5e5', borderRadius: '8px', resize: 'vertical', fontFamily: 'monospace' }}
        />
        {input && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '32px', background: '#fff', borderRadius: '12px', border: '1px solid #e5e5e5' }}>
            <QRCodeSVG value={input} size={200} level="M" />
          </div>
        )}
      </div>
    </ToolLayout>
  )
}
