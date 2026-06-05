# M3U8 视频下载工具实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为 ToolHub 开发者工具箱添加一个 M3U8 视频下载工具，支持下载公开和加密的 HLS 流媒体视频。

**Architecture:** 纯前端实现，使用 m3u8-parser 库解析播放列表，Web Crypto API 处理解密，Blob API 合并分片，FileSaver.js 触发下载。

**Tech Stack:** React + TypeScript + m3u8-parser + Web Crypto API + FileSaver.js

---

## 文件结构

在开始实现之前，需要创建或修改以下文件：

**新建文件：**
- `web/src/pages/M3u8Downloader.tsx` - 主组件
- `web/src/utils/m3u8.ts` - M3U8 解析和下载工具函数

**修改文件：**
- `web/src/App.tsx` - 添加路由
- `web/src/pages/Home.tsx` - 添加工具到列表
- `web/package.json` - 添加依赖

## 实施任务

### Task 1: 安装依赖

**Files:**
- Modify: `web/package.json`

- [ ] **Step 1: 安装 m3u8-parser 和 file-saver 依赖**

```bash
cd web
npm install m3u8-parser file-saver
npm install --save-dev @types/file-saver
```

- [ ] **Step 2: 验证依赖安装成功**

```bash
npm list m3u8-parser file-saver @types/file-saver
```

Expected: 显示已安装的依赖版本

- [ ] **Step 3: 提交依赖变更**

```bash
git add web/package.json web/package-lock.json
git commit -m "feat: add m3u8-parser and file-saver dependencies"
```

### Task 2: 创建 M3U8 工具函数

**Files:**
- Create: `web/src/utils/m3u8.ts`

- [ ] **Step 1: 创建 m3u8.ts 文件并定义类型**

```typescript
export interface M3u8Playlist {
  segments: Segment[]
  encryption?: EncryptionInfo
}

export interface Segment {
  uri: string
  duration: number
  title?: string
}

export interface EncryptionInfo {
  method: 'AES-128' | 'NONE'
  uri: string
  iv?: ArrayBuffer
}

export type DownloadStatus = 
  | 'idle' 
  | 'parsing' 
  | 'downloading' 
  | 'decrypting' 
  | 'merging' 
  | 'completed' 
  | 'error'

export interface DownloadState {
  status: DownloadStatus
  progress: number
  currentSegment: number
  totalSegments: number
  error?: Error
  speed?: number
}
```

- [ ] **Step 2: 实现 parseM3u8 函数**

```typescript
import { Parser } from 'm3u8-parser'

export async function parseM3u8(url: string): Promise<M3u8Playlist> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`获取 M3U8 文件失败: ${response.status} ${response.statusText}`)
  }
  
  const text = await response.text()
  const parser = new Parser()
  parser.push(text)
  parser.end()
  
  const manifest = parser.manifest
  
  if (!manifest.segments || manifest.segments.length === 0) {
    throw new Error('M3U8 文件中没有找到视频分片')
  }
  
  return {
    segments: manifest.segments.map((segment: any) => ({
      uri: new URL(segment.uri, url).href,
      duration: segment.duration,
      title: segment.title
    })),
    encryption: manifest.encryption ? {
      method: manifest.encryption.method,
      uri: new URL(manifest.encryption.uri, url).href,
      iv: manifest.encryption.iv
    } : undefined
  }
}
```

- [ ] **Step 3: 实现 downloadSegment 函数**

```typescript
export async function downloadSegment(url: string): Promise<ArrayBuffer> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`下载分片失败: ${response.status} ${response.statusText}`)
  }
  return await response.arrayBuffer()
}
```

- [ ] **Step 4: 实现 decryptSegment 函数**

```typescript
export async function decryptSegment(
  data: ArrayBuffer,
  key: ArrayBuffer,
  iv: ArrayBuffer
): Promise<ArrayBuffer> {
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    key,
    { name: 'AES-CBC' },
    false,
    ['decrypt']
  )
  
  return await crypto.subtle.decrypt(
    { name: 'AES-CBC', iv },
    cryptoKey,
    data
  )
}
```

- [ ] **Step 5: 实现 mergeSegments 函数**

```typescript
export function mergeSegments(segments: ArrayBuffer[]): Blob {
  return new Blob(segments, { type: 'video/mp2t' })
}
```

- [ ] **Step 6: 实现 triggerDownload 函数**

```typescript
import { saveAs } from 'file-saver'

export function triggerDownload(blob: Blob, filename: string): void {
  saveAs(blob, filename)
}
```

- [ ] **Step 7: 实现 downloadM3u8 主函数**

```typescript
export async function downloadM3u8(
  url: string,
  onProgress?: (state: DownloadState) => void
): Promise<void> {
  const updateState = (state: Partial<DownloadState>) => {
    if (onProgress) {
      onProgress({
        status: 'idle',
        progress: 0,
        currentSegment: 0,
        totalSegments: 0,
        ...state
      })
    }
  }
  
  try {
    // 解析阶段
    updateState({ status: 'parsing' })
    const playlist = await parseM3u8(url)
    
    const totalSegments = playlist.segments.length
    updateState({ 
      status: 'downloading', 
      totalSegments,
      currentSegment: 0,
      progress: 0
    })
    
    // 下载密钥（如果需要）
    let encryptionKey: ArrayBuffer | undefined
    if (playlist.encryption && playlist.encryption.method === 'AES-128') {
      const keyResponse = await fetch(playlist.encryption.uri)
      if (!keyResponse.ok) {
        throw new Error(`下载加密密钥失败: ${keyResponse.status}`)
      }
      encryptionKey = await keyResponse.arrayBuffer()
    }
    
    // 下载分片
    const segments: ArrayBuffer[] = []
    const startTime = Date.now()
    
    for (let i = 0; i < totalSegments; i++) {
      const segmentData = await downloadSegment(playlist.segments[i].uri)
      
      // 解密（如果需要）
      if (playlist.encryption && playlist.encryption.method === 'AES-128' && encryptionKey) {
        updateState({ status: 'decrypting' })
        const decrypted = await decryptSegment(
          segmentData,
          encryptionKey,
          playlist.encryption.iv!
        )
        segments.push(decrypted)
      } else {
        segments.push(segmentData)
      }
      
      // 更新进度
      const elapsed = (Date.now() - startTime) / 1000
      const speed = (i + 1) / elapsed
      
      updateState({
        status: 'downloading',
        currentSegment: i + 1,
        progress: ((i + 1) / totalSegments) * 100,
        speed
      })
    }
    
    // 合并阶段
    updateState({ status: 'merging' })
    const blob = mergeSegments(segments)
    
    // 触发下载
    const filename = `video_${Date.now()}.ts`
    triggerDownload(blob, filename)
    
    updateState({ status: 'completed', progress: 100 })
    
  } catch (error) {
    updateState({ 
      status: 'error', 
      error: error instanceof Error ? error : new Error(String(error))
    })
    throw error
  }
}
```

- [ ] **Step 8: 提交工具函数**

```bash
git add web/src/utils/m3u8.ts
git commit -m "feat: add M3U8 download utility functions"
```

### Task 3: 创建 M3u8Downloader 组件

**Files:**
- Create: `web/src/pages/M3u8Downloader.tsx`

- [ ] **Step 1: 创建基本组件结构**

```typescript
import { useState } from 'react'
import Header from '../components/Header'
import { downloadM3u8, DownloadState } from '../utils/m3u8'

export default function M3u8Downloader() {
  const [url, setUrl] = useState('')
  const [state, setState] = useState<DownloadState>({
    status: 'idle',
    progress: 0,
    currentSegment: 0,
    totalSegments: 0
  })
  
  return (
    <div>
      <Header />
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px' }}>
        <h1>M3U8 视频下载工具</h1>
        {/* 组件内容将在这里实现 */}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: 实现输入区域**

```typescript
// 在 return 语句中添加输入区域
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
```

- [ ] **Step 3: 实现下载处理函数**

```typescript
const handleDownload = async () => {
  if (!url) return
  
  try {
    await downloadM3u8(url, setState)
  } catch (error) {
    console.error('下载失败:', error)
  }
}
```

- [ ] **Step 4: 实现进度显示区域**

```typescript
// 在 return 语句中添加进度显示
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
```

- [ ] **Step 5: 添加提示信息**

```typescript
// 在 return 语句中添加提示信息
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
```

- [ ] **Step 6: 完整组件代码**

```typescript
import { useState } from 'react'
import Header from '../components/Header'
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
    <div>
      <Header />
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px' }}>
        <h1 style={{ marginBottom: '24px' }}>M3U8 视频下载工具</h1>
        
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
      </div>
    </div>
  )
}
```

- [ ] **Step 7: 提交组件**

```bash
git add web/src/pages/M3u8Downloader.tsx
git commit -m "feat: add M3U8 downloader component"
```

### Task 4: 更新路由配置

**Files:**
- Modify: `web/src/App.tsx:1-57`

- [ ] **Step 1: 添加 M3u8Downloader 导入**

```typescript
import M3u8Downloader from './pages/M3u8Downloader'
```

- [ ] **Step 2: 添加路由配置**

在 `<Routes>` 内添加：
```typescript
<Route path="/tools/m3u8-downloader" element={<M3u8Downloader />} />
```

- [ ] **Step 3: 提交路由变更**

```bash
git add web/src/App.tsx
git commit -m "feat: add M3U8 downloader route"
```

### Task 5: 更新工具列表

**Files:**
- Modify: `web/src/pages/Home.tsx:26-124`

- [ ] **Step 1: 添加 M3U8 工具到分类映射**

在 `CATEGORY_MAP` 中添加：
```typescript
'm3u8': '生成器',
```

- [ ] **Step 2: 添加路由映射**

在 `ROUTE_MAP` 中添加：
```typescript
'm3u8': 'm3u8-downloader',
```

- [ ] **Step 3: 添加名称映射**

在 `NAME_MAP` 中添加：
```typescript
'm3u8': 'M3U8 下载',
```

- [ ] **Step 4: 添加描述映射**

在 `DESC_MAP` 中添加：
```typescript
'm3u8': '下载 M3U8 格式的视频流',
```

- [ ] **Step 5: 提交工具列表变更**

```bash
git add web/src/pages/Home.tsx
git commit -m "feat: add M3U8 downloader to tools list"
```

### Task 6: 测试和验证

- [ ] **Step 1: 启动开发服务器**

```bash
cd web
npm run dev
```

- [ ] **Step 2: 测试基本功能**

1. 访问 http://localhost:5173/tools/m3u8-downloader
2. 输入一个公开的 M3U8 链接
3. 点击下载按钮
4. 验证下载过程和进度显示

- [ ] **Step 3: 测试错误处理**

1. 输入无效的 URL
2. 输入需要跨域的 URL
3. 验证错误消息显示

- [ ] **Step 4: 测试加密视频**

1. 输入一个 AES-128 加密的 M3U8 链接
2. 验证解密和下载功能

- [ ] **Step 5: 提交测试结果**

```bash
git add .
git commit -m "test: verify M3U8 downloader functionality"
```

### Task 7: 最终提交

- [ ] **Step 1: 检查所有变更**

```bash
git status
git diff --cached
```

- [ ] **Step 2: 最终提交**

```bash
git add .
git commit -m "feat: complete M3U8 video downloader tool

- Add m3u8-parser and file-saver dependencies
- Create M3U8 utility functions for parsing, downloading, decrypting, and merging
- Create M3U8 downloader component with progress display
- Add route and tool registration
- Support both unencrypted and AES-128 encrypted M3U8 videos"
```

## 测试用例

### 测试用例 1: 公开 M3U8 视频

**输入:** 
```
https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8
```

**预期结果:** 
- 成功解析 M3U8 文件
- 下载所有分片
- 合并并下载视频文件

### 测试用例 2: 加密 M3U8 视频

**输入:**
```
https://example.com/encrypted-video.m3u8
```

**预期结果:**
- 成功解析 M3U8 文件
- 下载加密密钥
- 解密所有分片
- 合并并下载视频文件

### 测试用例 3: 无效 URL

**输入:**
```
https://invalid-url-that-does-not-exist.m3u8
```

**预期结果:**
- 显示错误消息："获取 M3U8 文件失败"

### 测试用例 4: 跨域限制

**输入:**
```
https://restricted-cors-domain.com/video.m3u8
```

**预期结果:**
- 显示跨域错误消息
- 提示可能需要服务器代理

## 注意事项

1. **跨域限制**: 某些 M3U8 资源可能有跨域限制，需要服务器代理或 CORS 支持
2. **内存管理**: 大文件处理时注意内存使用，可能需要流式处理
3. **浏览器兼容性**: 确保 Web Crypto API、Blob API、Fetch API 的兼容性
4. **错误处理**: 完善各种错误情况的处理和用户提示
5. **进度显示**: 确保进度条和状态文本的实时更新