import { useState } from 'react'
import ToolLayout from '../components/ToolLayout'
import { downloadM3u8, DownloadState } from '../utils/m3u8'

export default function M3u8Downloader() {
  const [url, setUrl] = useState('')
  const [state, setState] = useState<DownloadState>({
    status: 'idle',
    progress: 0,
    currentSegment: 0,
    totalSegments: 0
  })

  const handleDownload = async () => {
    if (!url) return

    try {
      await downloadM3u8(url, setState)
    } catch (error) {
      console.error('下载失败:', error)
    }
  }

  return (
    <ToolLayout
      title="M3U8 视频下载工具"
      description="下载 M3U8 格式的视频流，支持未加密和 AES-128 加密的视频。"
    >
      <div style={{ marginBottom: '24px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
          M3U8 播放列表 URL
        </label>
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://example.com/video.m3u8"
          style={{
            width: '100%',
            padding: '12px 16px',
            fontSize: '16px',
            border: '1px solid #e5e5e5',
            borderRadius: '8px',
            marginBottom: '16px'
          }}
        />
        <button
          onClick={handleDownload}
          disabled={!url || state.status === 'downloading' || state.status === 'parsing'}
          style={{
            width: '100%',
            padding: '12px 24px',
            fontSize: '16px',
            backgroundColor: '#333',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            opacity: (!url || state.status === 'downloading' || state.status === 'parsing') ? 0.5 : 1
          }}
        >
          {state.status === 'downloading' || state.status === 'parsing' ? '下载中...' : '开始下载'}
        </button>
      </div>

      {state.status !== 'idle' && (
        <div style={{
          marginTop: '24px',
          padding: '20px',
          backgroundColor: '#f5f5f5',
          borderRadius: '8px'
        }}>
          <div style={{ marginBottom: '12px' }}>
            <strong>状态: </strong>
            {state.status === 'parsing' && '正在解析 M3U8 文件...'}
            {state.status === 'downloading' && `下载中 (${state.currentSegment}/${state.totalSegments})`}
            {state.status === 'decrypting' && '正在解密视频分片...'}
            {state.status === 'merging' && '正在合并视频分片...'}
            {state.status === 'completed' && '下载完成！'}
            {state.status === 'error' && '下载失败'}
          </div>

          {(state.status === 'downloading' || state.status === 'decrypting') && (
            <div style={{ marginBottom: '12px' }}>
              <div style={{
                width: '100%',
                height: '20px',
                backgroundColor: '#e5e5e5',
                borderRadius: '10px',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${state.progress}%`,
                  height: '100%',
                  backgroundColor: '#4CAF50',
                  transition: 'width 0.3s ease'
                }} />
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginTop: '8px',
                fontSize: '14px',
                color: '#666'
              }}>
                <span>{Math.round(state.progress)}%</span>
                {state.speed && <span>{state.speed.toFixed(1)} 片/秒</span>}
              </div>
            </div>
          )}

          {state.status === 'error' && state.error && (
            <div style={{
              color: '#d32f2f',
              backgroundColor: '#ffebee',
              padding: '12px',
              borderRadius: '4px',
              marginBottom: '12px'
            }}>
              {state.error.message}
            </div>
          )}

          {state.status === 'completed' && (
            <button
              onClick={() => setState({
                status: 'idle',
                progress: 0,
                currentSegment: 0,
                totalSegments: 0
              })}
              style={{
                padding: '8px 16px',
                backgroundColor: '#4CAF50',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              重新下载
            </button>
          )}
        </div>
      )}

      <div style={{
        marginTop: '24px',
        padding: '16px',
        backgroundColor: '#e3f2fd',
        borderRadius: '8px',
        fontSize: '14px',
        color: '#1976d2'
      }}>
        <strong>提示:</strong> 支持未加密和 AES-128 加密的 M3U8 视频。由于浏览器跨域限制，某些视频源可能无法直接下载。
      </div>
    </ToolLayout>
  )
}
