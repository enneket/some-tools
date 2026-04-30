import { useState, useRef } from 'react'
import ToolLayout from '../components/ToolLayout'

interface ImageInfo {
  name: string
  size: number
  width: number
  height: number
  type: string
  base64: string
  dataUrl: string
}

export default function ImageToBase64() {
  const [image, setImage] = useState<ImageInfo | null>(null)
  const [prefix, setPrefix] = useState(true)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string
      const img = new Image()
      img.onload = () => {
        setImage({
          name: file.name,
          size: file.size,
          width: img.width,
          height: img.height,
          type: file.type,
          base64: dataUrl.split(',')[1],
          dataUrl,
        })
      }
      img.src = dataUrl
    }
    reader.readAsDataURL(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const output = image ? (prefix ? image.dataUrl : image.base64) : ''

  return (
    <ToolLayout title="图片转 Base64" description="将图片转换为 Base64 编码字符串">
      <div
        onDragOver={e => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => fileRef.current?.click()}
        style={{
          padding: '40px', border: '2px dashed #e5e5e5', borderRadius: '12px',
          textAlign: 'center', cursor: 'pointer', marginBottom: '24px',
          background: '#fafafa', transition: 'border-color 0.2s',
        }}
      >
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
          style={{ display: 'none' }}
        />
        {image ? (
          <img src={image.dataUrl} alt="" style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '8px' }} />
        ) : (
          <div>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>📷</div>
            <div style={{ fontSize: '16px', color: '#666' }}>点击或拖拽图片到此处</div>
            <div style={{ fontSize: '13px', color: '#999', marginTop: '4px' }}>支持 JPG、PNG、GIF、WebP</div>
          </div>
        )}
      </div>

      {image && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
            {[
              { label: '文件名', value: image.name },
              { label: '尺寸', value: `${image.width} × ${image.height}` },
              { label: '大小', value: image.size > 1024 ? `${(image.size / 1024).toFixed(1)} KB` : `${image.size} B` },
              { label: '类型', value: image.type },
            ].map(item => (
              <div key={item.label} style={{ padding: '12px', background: '#f8f8f8', borderRadius: '8px' }}>
                <div style={{ fontSize: '12px', color: '#999' }}>{item.label}</div>
                <div style={{ fontSize: '14px', fontWeight: 600, marginTop: '2px', wordBreak: 'break-all' }}>{item.value}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            <button onClick={() => setPrefix(true)} style={{
              padding: '6px 14px', border: '1px solid #e5e5e5', borderRadius: '16px',
              background: prefix ? '#333' : '#fff', color: prefix ? '#fff' : '#333',
              cursor: 'pointer', fontSize: '13px',
            }}>含 Data URL 前缀</button>
            <button onClick={() => setPrefix(false)} style={{
              padding: '6px 14px', border: '1px solid #e5e5e5', borderRadius: '16px',
              background: !prefix ? '#333' : '#fff', color: !prefix ? '#fff' : '#333',
              cursor: 'pointer', fontSize: '13px',
            }}>纯 Base64</button>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label style={{ fontWeight: 600 }}>Base64 输出</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <span style={{ fontSize: '13px', color: '#999' }}>{(output.length / 1024).toFixed(1)} KB</span>
                <button onClick={() => navigator.clipboard.writeText(output)} style={{
                  padding: '4px 12px', border: '1px solid #e5e5e5', borderRadius: '6px',
                  background: '#fff', cursor: 'pointer', fontSize: '13px',
                }}>复制</button>
              </div>
            </div>
            <textarea
              value={output}
              readOnly
              style={{
                width: '100%', minHeight: '150px', padding: '12px', fontSize: '12px',
                fontFamily: 'monospace', border: '1px solid #e5e5e5', borderRadius: '8px',
                background: '#f9f9f9', resize: 'vertical', wordBreak: 'break-all',
              }}
            />
          </div>
        </>
      )}
    </ToolLayout>
  )
}
