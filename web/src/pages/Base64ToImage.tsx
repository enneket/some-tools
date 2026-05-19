import { useState } from 'react'
import ToolLayout from '../components/ToolLayout'

interface ImageResult {
  dataUrl: string
  width: number
  height: number
  size: number
  type: string
}

export default function Base64ToImage() {
  const [input, setInput] = useState('')
  const [image, setImage] = useState<ImageResult | null>(null)
  const [error, setError] = useState('')

  const handleConvert = () => {
    setError('')
    setImage(null)

    try {
      let base64 = input.trim()
      let mimeType = 'image/png'

      if (base64.includes(',')) {
        const [header, data] = base64.split(',')
        base64 = data
        const match = header.match(/data:image\/([^;]+)/)
        if (match) {
          mimeType = 'image/' + match[1]
        }
      }

      const binaryString = atob(base64)
      const bytes = new Uint8Array(binaryString.length)
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i)
      }

      const blob = new Blob([bytes], { type: mimeType })
      const url = URL.createObjectURL(blob)
      const img = new Image()
      img.onload = () => {
        setImage({
          dataUrl: url,
          width: img.width,
          height: img.height,
          size: bytes.length,
          type: mimeType,
        })
      }
      img.onerror = () => {
        setError('无法解析图片，请检查 Base64 编码是否正确')
        URL.revokeObjectURL(url)
      }
      img.src = url
    } catch {
      setError('无效的 Base64 输入')
    }
  }

  const handleClear = () => {
    setInput('')
    setImage(null)
    setError('')
  }

  return (
    <ToolLayout title="Base64 转图片" description="将 Base64 编码字符串转换为图片显示">
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <label style={{ fontWeight: 600 }}>Base64 输入</label>
          <span style={{ fontSize: '13px', color: '#999' }}>支持 data URL 或纯 Base64</span>
        </div>
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="粘贴 Base64 编码，例如：&#10;data:image/png;base64,iVBORw0KGgo...&#10;或&#10;iVBORw0KGgo..."
          style={{
            width: '100%', minHeight: '150px', padding: '12px', fontSize: '12px',
            fontFamily: 'monospace', border: '1px solid #e5e5e5', borderRadius: '8px',
            resize: 'vertical', wordBreak: 'break-all',
          }}
        />
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        <button onClick={handleConvert} style={{
          padding: '10px 20px', background: '#333', color: '#fff',
          border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px',
          fontWeight: 500,
        }}>转换为图片</button>
        <button onClick={handleClear} style={{
          padding: '10px 20px', background: '#fff', color: '#333',
          border: '1px solid #e5e5e5', borderRadius: '8px', cursor: 'pointer', fontSize: '14px',
        }}>清空</button>
      </div>

      {error && (
        <div style={{
          padding: '12px 16px', background: '#fef2f2', border: '1px solid #fecaca',
          borderRadius: '8px', color: '#dc2626', fontSize: '14px', marginBottom: '20px',
        }}>
          {error}
        </div>
      )}

      {image && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
            {[
              { label: '尺寸', value: `${image.width} × ${image.height}` },
              { label: '大小', value: image.size > 1024 ? `${(image.size / 1024).toFixed(1)} KB` : `${image.size} B` },
              { label: '类型', value: image.type },
            ].map(item => (
              <div key={item.label} style={{ padding: '12px', background: '#f8f8f8', borderRadius: '8px' }}>
                <div style={{ fontSize: '12px', color: '#999' }}>{item.label}</div>
                <div style={{ fontSize: '14px', fontWeight: 600, marginTop: '2px' }}>{item.value}</div>
              </div>
            ))}
          </div>

          <div style={{
            padding: '24px', background: '#fafafa', border: '1px solid #e5e5e5',
            borderRadius: '12px', textAlign: 'center',
          }}>
            <img src={image.dataUrl} alt="转换后的图片" style={{
              maxWidth: '100%', maxHeight: '400px', borderRadius: '8px',
            }} />
          </div>
        </div>
      )}
    </ToolLayout>
  )
}