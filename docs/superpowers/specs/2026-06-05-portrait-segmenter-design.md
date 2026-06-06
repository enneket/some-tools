# 人像抠图工具设计文档

## 概述

为 ToolHub 开发者工具箱添加一个人像抠图工具，使用 MediaPipe Selfie Segmentation 模型在前端实现人像分割，生成透明背景的 PNG 图片。

## 目标

1. 支持上传 JPG、PNG、WebP 格式的图片
2. 使用 MediaPipe Selfie Segmentation 模型进行人像分割
3. 生成透明背景的 PNG 图片
4. 提供简洁易用的用户界面
5. 纯前端实现，无需服务器

## 技术栈

- **前端框架**: React + TypeScript
- **构建工具**: Vite
- **人像分割**: MediaPipe Vision (Selfie Segmentation)
- **图片处理**: Canvas API
- **样式**: 与现有工具保持一致的 UI 风格

## 架构设计

### 整体架构

```
用户上传图片
    ↓
验证图片格式
    ↓
显示原图预览
    ↓
加载 MediaPipe 模型
    ↓
调用 Selfie Segmentation
    ↓
获取分割掩码
    ↓
应用掩码生成透明背景
    ↓
生成 PNG Blob
    ↓
触发下载
```

### 组件设计

#### PortraitSegmenter 主组件

主要功能：
- 状态管理：loading, processing, result, error
- 协调整个抠图流程
- 错误处理和重试逻辑

子组件：
1. **图片上传区域**
   - 拖拽上传
   - 点击上传
   - 支持 JPG、PNG、WebP

2. **预览区域**
   - 原图预览
   - 抠图结果预览
   - 对比显示

3. **操作按钮**
   - 下载 PNG
   - 重新上传

### 数据流

1. **上传阶段**
   - 用户上传图片
   - 验证图片格式
   - 显示原图预览

2. **加载阶段**
   - 加载 MediaPipe 模型
   - 显示加载动画

3. **处理阶段**
   - 将图片绘制到 Canvas
   - 调用 Selfie Segmentation
   - 获取分割掩码
   - 应用掩码生成透明背景
   - 显示处理动画

4. **输出阶段**
   - 生成 PNG Blob
   - 创建下载链接
   - 触发下载

### 错误处理

1. **模型加载失败**
   - 显示模型加载错误消息
   - 提供重试按钮

2. **图片格式错误**
   - 显示不支持的格式消息
   - 提示支持的格式列表

3. **处理失败**
   - 显示处理失败消息
   - 提供重试按钮

4. **浏览器兼容性**
   - 检测 WebAssembly 支持
   - 显示不支持的浏览器消息

## 文件结构

```
web/src/
├── pages/
│   └── PortraitSegmenter.tsx          # 主组件
└── utils/
    └── portrait.ts                    # 人像分割工具函数
```

## 依赖项

### npm 依赖

```json
{
  "@mediapipe/tasks-vision": "^0.10.0"
}
```

### 模型文件

需要将 Selfie Segmentation 模型文件打包到项目中：
- `selfie_segmenter.tflite` (~1MB)

## API 设计

### 主要函数

```typescript
// 初始化人像分割器
async function initSegmenter(): Promise<ImageSegmenter>

// 分割人像
async function segmentPortrait(
  segmenter: ImageSegmenter,
  image: HTMLImageElement
): Promise<ImageData>

// 应用掩码生成透明背景
function applyMask(
  image: ImageData,
  mask: ImageData
): ImageData

// 触发下载
function triggerDownload(blob: Blob, filename: string): void
```

### 类型定义

```typescript
type ProcessingStatus = 
  | 'idle' 
  | 'loading' 
  | 'processing' 
  | 'completed' 
  | 'error'

interface ProcessingState {
  status: ProcessingStatus
  error?: Error
}

interface SegmentationResult {
  originalImage: HTMLImageElement
  mask: ImageData
  resultImage: ImageData
}
```

## 用户界面

### 布局设计

```
┌─────────────────────────────────────────────┐
│  人像抠图工具                                │
├─────────────────────────────────────────────┤
│                                             │
│  ┌─────────────────────────────────────┐    │
│  │                                     │    │
│  │      点击或拖拽图片到此处            │    │
│  │      支持 JPG、PNG、WebP            │    │
│  │                                     │    │
│  └─────────────────────────────────────┘    │
│                                             │
│  ┌─────────────────┬─────────────────┐      │
│  │    原图预览      │   抠图结果      │      │
│  │                 │                 │      │
│  │                 │                 │      │
│  └─────────────────┴─────────────────┘      │
│                                             │
│  ┌─────────────────────────────────────┐    │
│  │           下载 PNG                   │    │
│  └─────────────────────────────────────┘    │
│                                             │
│  提示: 使用 MediaPipe Selfie Segmentation   │
│        模型进行人像分割                      │
│                                             │
└─────────────────────────────────────────────┘
```

### 状态显示

1. **空闲状态**: 显示上传区域
2. **加载中**: 显示"正在加载模型..."
3. **处理中**: 显示"正在处理图片..."
4. **完成**: 显示原图和结果对比，提供下载按钮
5. **错误**: 显示错误消息和重试按钮

## 实现细节

### 模型初始化

使用 MediaPipe Vision 初始化 Selfie Segmentation：

```typescript
import { ImageSegmenter, FilesetResolver } from '@mediapipe/tasks-vision'

async function initSegmenter(): Promise<ImageSegmenter> {
  const vision = await FilesetResolver.forVisionTasks(
    'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm'
  )
  
  const segmenter = await ImageSegmenter.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: '/models/selfie_segmenter.tflite',
      delegate: 'GPU'
    },
    runningMode: 'IMAGE',
    outputCategoryMask: true
  })
  
  return segmenter
}
```

### 人像分割

使用 Selfie Segmentation 分割人像：

```typescript
async function segmentPortrait(
  segmenter: ImageSegmenter,
  image: HTMLImageElement
): Promise<ImageData> {
  const result = segmenter.segment(image)
  const mask = result.categoryMask
  
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

### 应用掩码

应用掩码生成透明背景：

```typescript
function applyMask(
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

### 下载触发

使用 Blob API 触发下载：

```typescript
function triggerDownload(blob: Blob, filename: string): void {
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

## 性能优化

1. **模型缓存**: 初始化后缓存模型实例，避免重复加载
2. **GPU 加速**: 使用 GPU delegate 加速推理
3. **图片压缩**: 大图片先压缩再处理，减少内存占用
4. **异步处理**: 使用 Web Worker 避免阻塞主线程

## 兼容性考虑

1. **浏览器支持**: 现代浏览器（Chrome 90+, Firefox 90+, Safari 15+, Edge 90+）
2. **API 支持**: WebAssembly, Canvas API, Blob API
3. **WebAssembly**: 检测 WebAssembly 支持，提供降级提示

## 测试策略

1. **单元测试**: 测试各个函数模块
2. **集成测试**: 测试完整抠图流程
3. **边界测试**: 测试各种边界情况（大图片、小图片、不同格式等）
4. **兼容性测试**: 测试不同浏览器的兼容性

## 未来扩展

1. **批量处理**: 支持批量抠图
2. **背景替换**: 支持替换背景颜色或图片
3. **视频抠图**: 支持视频人像分割
4. **模型选择**: 支持选择不同的分割模型
5. **精度调节**: 支持调节分割精度

## 风险评估

1. **模型加载失败**: 网络问题可能导致模型加载失败
2. **浏览器兼容性**: 旧版浏览器可能不支持 WebAssembly
3. **内存限制**: 大图片可能导致内存不足
4. **处理速度**: 大图片处理可能较慢

## 实施计划

1. **阶段一**: 基础功能实现
   - 创建基本组件结构
   - 实现图片上传
   - 实现模型加载
   - 实现人像分割

2. **阶段二**: 用户体验优化
   - 实现预览对比
   - 实现下载功能
   - 实现错误处理
   - 实现加载动画

3. **阶段三**: 测试和优化
   - 单元测试
   - 集成测试
   - 性能优化
   - 兼容性测试