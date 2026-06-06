import { useState, useRef } from 'react'
import ToolLayout from '../components/ToolLayout'
import {
  initSegmenter,
  segmentPortrait,
  applyMask,
  imageToImageData,
  imageDataToBlob,
  triggerDownload,
  ProcessingState,
} from '../utils/portrait'

export default function PortraitSegmenter() {
  const [image, setImage] = useState<HTMLImageElement | null>(null)
  const [result, setResult] = useState<ImageData | null>(null)
  const [state, setState] = useState<ProcessingState>({ status: 'idle' })
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFile = (file: File) => {
    if (!file.type.match(/^image\/(jpeg|png|webp)$/)) {
      setState({
        status: 'error',
        error: new Error('不支持的图片格式，请使用 JPG、PNG 或 WebP'),
      })
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        setImage(img)
        setResult(null)
        setState({ status: 'idle' })
      }
      img.src = e.target?.result as string
    }
    reader.readAsDataURL(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const handleSegment = async () => {
    if (!image) return

    try {
      setState({ status: 'loading' })

      const segmenter = await initSegmenter()

      setState({ status: 'processing' })

      const mask = await segmentPortrait(segmenter, image)

      const originalData = imageToImageData(image)

      const resultData = applyMask(originalData, mask)

      setResult(resultData)
      setState({ status: 'completed' })
    } catch (error) {
      setState({
        status: 'error',
        error: error instanceof Error ? error : new Error(String(error)),
      })
    }
  }

  const handleDownload = async () => {
    if (!result) return

    try {
      const blob = await imageDataToBlob(result)
      triggerDownload(blob, 'portrait_segmented.png')
    } catch (error) {
      setState({
        status: 'error',
        error: error instanceof Error ? error : new Error(String(error)),
      })
    }
  }

  return (
    <ToolLayout title="人像抠图" description="使用 MediaPipe Selfie Segmentation 模型进行人像分割">
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => fileRef.current?.click()}
        style={{
          padding: '40px',
          border: '2px dashed #e5e5e5',
          borderRadius: '12px',
          textAlign: 'center',
          cursor: 'pointer',
          marginBottom: '24px',
          background: '#fafafa',
          transition: 'border-color 0.2s',
        }}
      >
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          style={{ display: 'none' }}
        />
        {image ? (
          <img
            src={image.src}
            alt=""
            style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '8px' }}
          />
        ) : (
          <div>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>
              Portrait
            </div>
            <div style={{ fontSize: '16px', color: '#666' }}>
              点击或拖拽图片到此处
            </div>
            <div style={{ fontSize: '13px', color: '#999', marginTop: '4px' }}>
              支持 JPG、PNG、WebP
            </div>
          </div>
        )}
      </div>

      {image && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '20px',
            marginBottom: '24px',
          }}
        >
          <div>
            <h3 style={{ marginBottom: '8px', fontSize: '14px', color: '#666' }}>
              原图
            </h3>
            <img
              src={image.src}
              alt="原图"
              style={{
                width: '100%',
                borderRadius: '8px',
                border: '1px solid #e5e5e5',
              }}
            />
          </div>
          <div>
            <h3 style={{ marginBottom: '8px', fontSize: '14px', color: '#666' }}>
              抠图结果
            </h3>
            {result ? (
              <canvas
                ref={(canvas) => {
                  if (canvas && result) {
                    canvas.width = result.width
                    canvas.height = result.height
                    const ctx = canvas.getContext('2d')!
                    ctx.putImageData(result, 0, 0)
                  }
                }}
                style={{
                  width: '100%',
                  borderRadius: '8px',
                  border: '1px solid #e5e5e5',
                  background:
                    'repeating-conic-gradient(#f0f0f0 0% 25%, #fff 0% 50%) 50% / 20px 20px',
                }}
              />
            ) : (
              <div
                style={{
                  width: '100%',
                  height: '200px',
                  borderRadius: '8px',
                  border: '1px solid #e5e5e5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#999',
                  background: '#fafafa',
                }}
              >
                等待处理
              </div>
            )}
          </div>
        </div>
      )}

      {image && (
        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
          <button
            onClick={handleSegment}
            disabled={state.status === 'loading' || state.status === 'processing'}
            style={{
              flex: 1,
              padding: '12px 24px',
              fontSize: '16px',
              backgroundColor: '#333',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              opacity:
                state.status === 'loading' || state.status === 'processing'
                  ? 0.5
                  : 1,
            }}
          >
            {state.status === 'loading'
              ? '正在加载模型...'
              : state.status === 'processing'
                ? '正在处理...'
                : '开始抠图'}
          </button>

          {result && (
            <button
              onClick={handleDownload}
              style={{
                padding: '12px 24px',
                fontSize: '16px',
                backgroundColor: '#4CAF50',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
              }}
            >
              下载 PNG
            </button>
          )}

          <button
            onClick={() => {
              setImage(null)
              setResult(null)
              setState({ status: 'idle' })
            }}
            style={{
              padding: '12px 24px',
              fontSize: '16px',
              backgroundColor: '#f5f5f5',
              color: '#333',
              border: '1px solid #e5e5e5',
              borderRadius: '8px',
              cursor: 'pointer',
            }}
          >
            重新上传
          </button>
        </div>
      )}

      {state.status === 'loading' && (
        <div
          style={{
            padding: '16px',
            backgroundColor: '#e3f2fd',
            borderRadius: '8px',
            marginBottom: '24px',
            textAlign: 'center',
          }}
        >
          正在加载 MediaPipe 模型...
        </div>
      )}

      {state.status === 'processing' && (
        <div
          style={{
            padding: '16px',
            backgroundColor: '#fff3e0',
            borderRadius: '8px',
            marginBottom: '24px',
            textAlign: 'center',
          }}
        >
          正在处理图片，请稍候...
        </div>
      )}

      {state.status === 'error' && state.error && (
        <div
          style={{
            padding: '16px',
            backgroundColor: '#ffebee',
            borderRadius: '8px',
            marginBottom: '24px',
            color: '#d32f2f',
          }}
        >
          {state.error.message}
        </div>
      )}

      {state.status === 'completed' && result && (
        <div
          style={{
            padding: '16px',
            backgroundColor: '#e8f5e9',
            borderRadius: '8px',
            marginBottom: '24px',
            textAlign: 'center',
          }}
        >
          抠图完成！点击"下载 PNG"保存结果。
        </div>
      )}

      <div
        style={{
          marginTop: '24px',
          padding: '16px',
          backgroundColor: '#e3f2fd',
          borderRadius: '8px',
          fontSize: '14px',
          color: '#1976d2',
        }}
      >
        <strong>提示:</strong> 使用 MediaPipe Selfie Segmentation 模型进行人像分割。首次使用需要下载模型（约 1MB）。
      </div>
    </ToolLayout>
  )
}
