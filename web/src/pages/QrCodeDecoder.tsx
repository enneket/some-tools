import { useCallback, useEffect, useRef, useState } from 'react'
import jsQR from 'jsqr'
import ToolLayout from '../components/ToolLayout'

interface DecodeResult {
  name: string
  size: number
  width: number
  height: number
  type: string
  dataUrl: string
  content: string
}

const MAX_DECODE_WIDTH = 2000

/** 解码候选宽度：先按上限取原图，再逐级降采样提升小尺寸二维码的命中率；过小的图额外放大一次 */
function candidateWidths(naturalWidth: number): number[] {
  const widths = [Math.min(naturalWidth, MAX_DECODE_WIDTH)]
  ;[1000, 600, 300].forEach(width => {
    if (width < widths[0]) widths.push(width)
  })
  if (naturalWidth < 400) widths.push(naturalWidth * 2)
  return widths
}

function decodeImage(img: HTMLImageElement): string | null {
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')
  if (!context) return null

  for (const targetWidth of candidateWidths(img.width)) {
    const scale = targetWidth / img.width
    const width = Math.max(1, Math.round(img.width * scale))
    const height = Math.max(1, Math.round(img.height * scale))
    canvas.width = width
    canvas.height = height
    context.drawImage(img, 0, 0, width, height)

    const imageData = context.getImageData(0, 0, width, height)
    const code = jsQR(imageData.data, width, height, { inversionAttempts: 'attemptBoth' })
    if (code) return code.data
  }
  return null
}

export default function QrCodeDecoder() {
  const [result, setResult] = useState<DecodeResult | null>(null)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const objectUrlRef = useRef<string | null>(null)

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current)
      }
    }
  }, [])

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('请选择图片文件')
      return
    }

    setError('')
    setResult(null)
    setCopied(false)

    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current)
    }
    const dataUrl = URL.createObjectURL(file)
    objectUrlRef.current = dataUrl

    const img = new Image()
    img.onload = () => {
      const content = decodeImage(img)
      if (content === null) {
        setError('未识别到二维码，请确认图片清晰且二维码完整')
        return
      }
      setResult({
        name: file.name,
        size: file.size,
        width: img.width,
        height: img.height,
        type: file.type,
        dataUrl,
        content,
      })
    }
    img.onerror = () => setError('图片解析失败，请更换文件重试')
    img.src = dataUrl
  }, [])

  useEffect(() => {
    const handlePaste = (event: ClipboardEvent) => {
      const item = Array.from(event.clipboardData?.items || []).find(i => i.type.startsWith('image/'))
      const file = item?.getAsFile()
      if (file) handleFile(file)
    }
    window.addEventListener('paste', handlePaste)
    return () => window.removeEventListener('paste', handlePaste)
  }, [handleFile])

  const handleCopy = async () => {
    if (!result) return
    try {
      await navigator.clipboard.writeText(result.content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setError('复制失败，请手动选择文本复制')
    }
  }

  const isUrl = !!result && /^https?:\/\//i.test(result.content)

  return (
    <ToolLayout title="二维码识别" description="上传二维码图片，识别其中的内容">
      <div
        onDragOver={e => e.preventDefault()}
        onDrop={e => {
          e.preventDefault()
          const file = e.dataTransfer.files[0]
          if (file) handleFile(file)
        }}
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
          onChange={e => {
            const file = e.target.files?.[0]
            e.target.value = ''
            if (file) handleFile(file)
          }}
          style={{ display: 'none' }}
        />
        {result ? (
          <img src={result.dataUrl} alt="待识别的二维码" style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '8px' }} />
        ) : (
          <div>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>🔍</div>
            <div style={{ fontSize: '16px', color: '#666' }}>点击或拖拽二维码图片到此处</div>
            <div style={{ fontSize: '13px', color: '#999', marginTop: '4px' }}>支持 JPG、PNG、WebP 等格式，也可直接粘贴截图</div>
          </div>
        )}
      </div>

      {error && (
        <div style={{
          padding: '12px 16px', background: '#fef2f2', border: '1px solid #fecaca',
          borderRadius: '8px', color: '#dc2626', fontSize: '14px', marginBottom: '20px',
        }}>
          {error}
        </div>
      )}

      {result && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
            {[
              { label: '文件名', value: result.name || '粘贴的图片' },
              { label: '尺寸', value: `${result.width} × ${result.height}` },
              { label: '大小', value: result.size > 1024 ? `${(result.size / 1024).toFixed(1)} KB` : `${result.size} B` },
              { label: '类型', value: result.type },
            ].map(item => (
              <div key={item.label} style={{ padding: '12px', background: '#f8f8f8', borderRadius: '8px' }}>
                <div style={{ fontSize: '12px', color: '#999' }}>{item.label}</div>
                <div style={{ fontSize: '14px', fontWeight: 600, marginTop: '2px', wordBreak: 'break-all' }}>{item.value}</div>
              </div>
            ))}
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label style={{ fontWeight: 600 }}>识别内容</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <span style={{ fontSize: '13px', color: '#999' }}>{result.content.length} 字符</span>
                {isUrl && (
                  <button onClick={() => window.open(result.content, '_blank', 'noopener')} style={{
                    padding: '4px 12px', border: '1px solid #e5e5e5', borderRadius: '6px',
                    background: '#fff', cursor: 'pointer', fontSize: '13px',
                  }}>打开链接</button>
                )}
                <button onClick={handleCopy} style={{
                  padding: '4px 12px', border: '1px solid #e5e5e5', borderRadius: '6px',
                  background: '#fff', cursor: 'pointer', fontSize: '13px',
                }}>{copied ? '已复制' : '复制'}</button>
              </div>
            </div>
            <textarea
              value={result.content}
              readOnly
              style={{
                width: '100%', minHeight: '120px', padding: '12px', fontSize: '14px',
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