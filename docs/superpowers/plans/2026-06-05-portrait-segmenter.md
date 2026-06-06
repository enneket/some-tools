# 人像抠图工具实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为 ToolHub 开发者工具箱添加一个人像抠图工具，使用 MediaPipe Selfie Segmentation 模型在前端实现人像分割，生成透明背景的 PNG 图片。

**Architecture:** 纯前端实现，使用 MediaPipe Vision 的 Selfie Segmentation 模型进行人像分割，Canvas API 处理图片，生成透明背景的 PNG 图片。

**Tech Stack:** React + TypeScript + MediaPipe Vision + Canvas API

---

## 文件结构

在开始实现之前，需要创建或修改以下文件：

**新建文件：**
- `web/src/pages/PortraitSegmenter.tsx` - 主组件
- `web/src/utils/portrait.ts` - 人像分割工具函数
- `web/public/models/selfie_segmenter.tflite` - 模型文件

**修改文件：**
- `web/src/App.tsx` - 添加路由
- `web/src/pages/Home.tsx` - 添加工具到列表
- `web/package.json` - 添加依赖

## 实施任务

### Task 1: 安装依赖

**Files:**
- Modify: `web/package.json`

- [ ] **Step 1: 安装 MediaPipe Vision 依赖**

```bash
cd web
npm install @mediapipe/tasks-vision
```

- [ ] **Step 2: 验证依赖安装成功**

```bash
npm list @mediapipe/tasks-vision
```

Expected: 显示已安装的依赖版本

- [ ] **Step 3: 提交依赖变更**

```bash
git add web/package.json web/package-lock.json
git commit -m "feat: add MediaPipe Vision dependency"
```

### Task 2: 下载模型文件

**Files:**
- Create: `web/public/models/selfie_segmenter.tflite`

- [ ] **Step 1: 创建模型目录**

```bash
mkdir -p web/public/models
```

- [ ] **Step 2: 下载 Selfie Segmentation 模型**

```bash
curl -L -o web/public/models/selfie_segmenter.tflite \
  "https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_segmenter/float16/latest/selfie_segmenter.tflite"
```

- [ ] **Step 3: 验证模型文件**

```bash
ls -lh web/public/models/selfie_segmenter.tflite
```

Expected: 文件大小约 1MB

- [ ] **Step 4: 提交模型文件**

```bash
git add web/public/models/selfie_segmenter.tflite
git commit -m "feat: add Selfie Segmentation model file"
```

### Task 3: 创建人像分割工具函数

**Files:**
- Create: `web/src/utils/portrait.ts`

- [ ] **Step 1: 创建 portrait.ts 文件并定义类型**

```typescript
export type ProcessingStatus = 
  | 'idle' 
  | 'loading' 
  | 'processing' 
  | 'completed' 
  | 'error'

export interface ProcessingState {
  status: ProcessingStatus
  error?: Error
}

export interface SegmentationResult {
  originalImage: HTMLImageElement
  mask: ImageData
  resultImage: ImageData
}
```

- [ ] **Step 2: 实现 initSegmenter 函数**

```typescript
import { ImageSegmenter, FilesetResolver } from '@mediapipe/tasks-vision'

let segmenterInstance: ImageSegmenter | null = null

export async function initSegmenter(): Promise<ImageSegmenter> {
  if (segmenterInstance) {
    return segmenterInstance
  }
  
  const vision = await FilesetResolver.forVisionTasks(
    'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm'
  )
  
  segmenterInstance = await ImageSegmenter.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: '/models/selfie_segmenter.tflite',
      delegate: 'GPU'
    },
    runningMode: 'IMAGE',
    outputCategoryMask: true
  })
  
  return segmenterInstance
}
```

- [ ] **Step 3: 实现 segmentPortrait 函数**

```typescript
export async function segmentPortrait(
  segmenter: ImageSegmenter,
  image: HTMLImageElement
): Promise<ImageData> {
  const result = segmenter.segment(image)
  const mask = result.categoryMask
  
  if (!mask) {
    throw new Error('分割失败：无法获取掩码')
  }
  
  // 将掩码转换为 ImageData
  const canvas = document.createElement('canvas')
  canvas.width = mask.getWidth()
  canvas.height = mask.getHeight()
  const ctx = canvas.getContext('2d')!
  
  const imageData = ctx.createImageData(canvas.width, canvas.height)
  const maskData = mask.getAsUint8Array()
  
  for (let i = 0; i < maskData.length; i++) {
    const value = maskData[i] === 0 ? 255 : 0
    imageData.data[i * 4] = value
    imageData.data[i * 4 + 1] = value
    imageData.data[i * 4 + 2] = value
    imageData.data[i * 4 + 3] = 255
  }
  
  return imageData
}
```

- [ ] **Step 4: 实现 applyMask 函数**

```typescript
export function applyMask(
  image: ImageData,
  mask: ImageData
): ImageData {
  const result = new ImageData(image.width, image.height)
  
  for (let i = 0; i < image.data.length; i += 4) {
    const maskValue = mask.data[i]
    
    if (maskValue === 255) {
      // 人像部分，保留原图
      result.data[i] = image.data[i]
      result.data[i + 1] = image.data[i + 1]
      result.data[i + 2] = image.data[i + 2]
      result.data[i + 3] = 255
    } else {
      // 背景部分，设置为透明
      result.data[i] = 0
      result.data[i + 1] = 0
      result.data[i + 2] = 0
      result.data[i + 3] = 0
    }
  }
  
  return result
}
```

- [ ] **Step 5: 实现 triggerDownload 函数**

```typescript
export function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
```

- [ ] **Step 6: 实现 imageToImageData 函数**

```typescript
export function imageToImageData(image: HTMLImageElement): ImageData {
  const canvas = document.createElement('canvas')
  canvas.width = image.naturalWidth
  canvas.height = image.naturalHeight
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(image, 0, 0)
  return ctx.getImageData(0, 0, canvas.width, canvas.height)
}
```

- [ ] **Step 7: 实现 imageDataToBlob 函数**

```typescript
export async function imageDataToBlob(imageData: ImageData): Promise<Blob> {
  const canvas = document.createElement('canvas')
  canvas.width = imageData.width
  canvas.height = imageData.height
  const ctx = canvas.getContext('2d')!
  ctx.putImageData(imageData, 0, 0)
  
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob)
        } else {
          reject(new Error('无法生成 PNG Blob'))
        }
      },
      'image/png'
    )
  })
}
```

- [ ] **Step 8: 提交工具函数**

```bash
git add web/src/utils/portrait.ts
git commit -m "feat: add portrait segmentation utility functions"
```

### Task 4: 创建 PortraitSegmenter 组件

**Files:**
- Create: `web/src/pages/PortraitSegmenter.tsx`

- [ ] **Step 1: 创建基本组件结构**

```typescript
import { useState, useRef } from 'react'
import ToolLayout from '../components/ToolLayout'
import {
  initSegmenter,
  segmentPortrait,
  applyMask,
  imageToImageData,
  imageDataToBlob,
  triggerDownload,
  ProcessingState
} from '../utils/portrait'

export default function PortraitSegmenter() {
  const [image, setImage] = useState<HTMLImageElement | null>(null)
  const [result, setResult] = useState<ImageData | null>(null)
  const [state, setState] = useState<ProcessingState>({ status: 'idle' })
  const fileRef = useRef<HTMLInputElement>(null)
  
  return (
    <ToolLayout title="人像抠图" description="使用 MediaPipe Selfie Segmentation 模型进行人像分割">
      {/* 组件内容将在这里实现 */}
    </ToolLayout>
  )
}
```

- [ ] **Step 2: 实现图片上传区域**

```typescript
// 在 return 语句中添加上传区域
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
    accept="image/jpeg,image/png,image/webp"
    onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
    style={{ display: 'none' }}
  />
  {image ? (
    <img src={image.src} alt="" style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '8px' }} />
  ) : (
    <div>
      <div style={{ fontSize: '48px', marginBottom: '12px' }}> Portrait</div>
      <div style={{ fontSize: '16px', color: '#666' }}>点击或拖拽图片到此处</div>
      <div style={{ fontSize: '13px', color: '#999', marginTop: '4px' }}>支持 JPG、PNG、WebP</div>
    </div>
  )}
</div>
```

- [ ] **Step 3: 实现文件处理函数**

```typescript
const handleFile = (file: File) => {
  if (!file.type.match(/^image\/(jpeg|png|webp)$/)) {
    setState({ status: 'error', error: new Error('不支持的图片格式，请使用 JPG、PNG 或 WebP') })
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
```

- [ ] **Step 4: 实现抠图处理函数**

```typescript
const handleSegment = async () => {
  if (!image) return
  
  try {
    setState({ status: 'loading' })
    
    // 初始化分割器
    const segmenter = await initSegmenter()
    
    setState({ status: 'processing' })
    
    // 分割人像
    const mask = await segmentPortrait(segmenter, image)
    
    // 获取原图数据
    const originalData = imageToImageData(image)
    
    // 应用掩码
    const resultData = applyMask(originalData, mask)
    
    setResult(resultData)
    setState({ status: 'completed' })
  } catch (error) {
    setState({ 
      status: 'error', 
      error: error instanceof Error ? error : new Error(String(error))
    })
  }
}
```

- [ ] **Step 5: 实现下载函数**

```typescript
const handleDownload = async () => {
  if (!result) return
  
  try {
    const blob = await imageDataToBlob(result)
    triggerDownload(blob, 'portrait_segmented.png')
  } catch (error) {
    setState({ 
      status: 'error', 
      error: error instanceof Error ? error : new Error(String(error))
    })
  }
}
```

- [ ] **Step 6: 实现预览区域**

```typescript
// 在 return 语句中添加预览区域
{image && (
  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
    <div>
      <h3 style={{ marginBottom: '8px', fontSize: '14px', color: '#666' }}>原图</h3>
      <img 
        src={image.src} 
        alt="原图" 
        style={{ 
          width: '100%', 
          borderRadius: '8px',
          border: '1px solid #e5e5e5'
        }} 
      />
    </div>
    <div>
      <h3 style={{ marginBottom: '8px', fontSize: '14px', color: '#666' }}>抠图结果</h3>
      {result ? (
        <canvas
          ref={canvas => {
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
            background: 'repeating-conic-gradient(#f0f0f0 0% 25%, #fff 0% 50%) 50% / 20px 20px'
          }}
        />
      ) : (
        <div style={{ 
          width: '100%', 
          height: '200px', 
          borderRadius: '8px',
          border: '1px solid #e5e5e5',
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          color: '#999',
          background: '#fafafa'
        }}>
          等待处理
        </div>
      )}
    </div>
  </div>
)}
```

- [ ] **Step 7: 实现操作按钮**

```typescript
// 在 return 语句中添加操作按钮
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
        opacity: (state.status === 'loading' || state.status === 'processing') ? 0.5 : 1
      }}
    >
      {state.status === 'loading' ? '正在加载模型...' : 
       state.status === 'processing' ? '正在处理...' : 
       '开始抠图'}
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
          cursor: 'pointer'
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
        cursor: 'pointer'
      }}
    >
      重新上传
    </button>
  </div>
)}
```

- [ ] **Step 8: 实现状态显示和错误处理**

```typescript
// 在 return 语句中添加状态显示
{state.status === 'loading' && (
  <div style={{ 
    padding: '16px', 
    backgroundColor: '#e3f2fd', 
    borderRadius: '8px',
    marginBottom: '24px',
    textAlign: 'center'
  }}>
    正在加载 MediaPipe 模型...
  </div>
)}

{state.status === 'processing' && (
  <div style={{ 
    padding: '16px', 
    backgroundColor: '#fff3e0', 
    borderRadius: '8px',
    marginBottom: '24px',
    textAlign: 'center'
  }}>
    正在处理图片，请稍候...
  </div>
)}

{state.status === 'error' && state.error && (
  <div style={{ 
    padding: '16px', 
    backgroundColor: '#ffebee', 
    borderRadius: '8px',
    marginBottom: '24px',
    color: '#d32f2f'
  }}>
    {state.error.message}
  </div>
)}

{state.status === 'completed' && result && (
  <div style={{ 
    padding: '16px', 
    backgroundColor: '#e8f5e9', 
    borderRadius: '8px',
    marginBottom: '24px',
    textAlign: 'center'
  }}>
    抠图完成！点击"下载 PNG"保存结果。
  </div>
)}
```

- [ ] **Step 9: 添加提示信息**

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
  <strong>提示:</strong> 使用 MediaPipe Selfie Segmentation 模型进行人像分割。首次使用需要下载模型（约 1MB）。
</div>
```

- [ ] **Step 10: 提交组件**

```bash
git add web/src/pages/PortraitSegmenter.tsx
git commit -m "feat: add Portrait Segmenter component"
```

### Task 5: 更新路由配置

**Files:**
- Modify: `web/src/App.tsx`

- [ ] **Step 1: 添加 PortraitSegmenter 导入**

```typescript
import PortraitSegmenter from './pages/PortraitSegmenter'
```

- [ ] **Step 2: 添加路由配置**

在 `<Routes>` 内添加：
```typescript
<Route path="/tools/portrait-segmenter" element={<PortraitSegmenter />} />
```

- [ ] **Step 3: 提交路由变更**

```bash
git add web/src/App.tsx
git commit -m "feat: add Portrait Segmenter route"
```

### Task 6: 更新工具列表

**Files:**
- Modify: `web/src/pages/Home.tsx`

- [ ] **Step 1: 添加人像抠图工具到分类映射**

在 `CATEGORY_MAP` 中添加：
```typescript
'portrait': '生成器',
```

- [ ] **Step 2: 添加路由映射**

在 `ROUTE_MAP` 中添加：
```typescript
'portrait': 'portrait-segmenter',
```

- [ ] **Step 3: 添加名称映射**

在 `NAME_MAP` 中添加：
```typescript
'portrait': '人像抠图',
```

- [ ] **Step 4: 添加描述映射**

在 `DESC_MAP` 中添加：
```typescript
'portrait': '使用 AI 模型进行人像分割',
```

- [ ] **Step 5: 提交工具列表变更**

```bash
git add web/src/pages/Home.tsx
git commit -m "feat: add Portrait Segmenter to tools list"
```

### Task 7: 更新后端工具注册

**Files:**
- Modify: `server/main.go`

- [ ] **Step 1: 添加人像抠图工具到后端**

在 tools 列表中添加：
```go
{"name": "portrait", "endpoint": "", "method": "", "description": "Portrait segmentation using AI"},
```

- [ ] **Step 2: 提交后端变更**

```bash
git add server/main.go
git commit -m "feat: add Portrait Segmenter to backend tools"
```

### Task 8: 测试和验证

- [ ] **Step 1: 启动开发服务器**

```bash
cd web
npm run dev
```

- [ ] **Step 2: 测试基本功能**

1. 访问 http://localhost:5173/tools/portrait-segmenter
2. 上传一张人像图片
3. 点击"开始抠图"按钮
4. 验证抠图过程和结果显示

- [ ] **Step 3: 测试错误处理**

1. 上传非图片文件
2. 上传不支持的图片格式
3. 验证错误消息显示

- [ ] **Step 4: 测试下载功能**

1. 完成抠图后点击"下载 PNG"按钮
2. 验证下载的 PNG 文件是否透明背景

- [ ] **Step 5: 提交测试结果**

```bash
git add .
git commit -m "test: verify Portrait Segmenter functionality"
```

### Task 9: 最终提交

- [ ] **Step 1: 检查所有变更**

```bash
git status
git diff --cached
```

- [ ] **Step 2: 最终提交**

```bash
git add .
git commit -m "feat: complete Portrait Segmenter tool

- Add MediaPipe Vision dependency
- Add Selfie Segmentation model file
- Create portrait segmentation utility functions
- Create Portrait Segmenter component with preview and download
- Add route and tool registration
- Support JPG, PNG, WebP input formats
- Generate transparent PNG output"
```

## 测试用例

### 测试用例 1: 人像图片

**输入:**
一张清晰的人像图片

**预期结果:**
- 成功分割人像
- 背景变为透明
- 可以下载 PNG 文件

### 测试用例 2: 无人像图片

**输入:**
一张没有人的风景图片

**预期结果:**
- 分割完成，但可能没有明显效果
- 整个图片可能变为透明或保持原样

### 测试用例 3: 不支持的格式

**输入:**
一个 GIF 图片或非图片文件

**预期结果:**
- 显示错误消息："不支持的图片格式，请使用 JPG、PNG 或 WebP"

### 测试用例 4: 大图片

**输入:**
一张高分辨率图片（如 4K 图片）

**预期结果:**
- 处理时间可能较长
- 最终完成抠图并显示结果

## 注意事项

1. **模型加载**: 首次使用需要下载模型文件（约 1MB），需要网络连接
2. **浏览器兼容性**: 需要支持 WebAssembly 的现代浏览器
3. **内存限制**: 大图片可能导致内存不足，建议限制图片大小
4. **处理速度**: 处理时间取决于图片大小和设备性能
5. **GPU 加速**: 如果支持，使用 GPU 加速推理