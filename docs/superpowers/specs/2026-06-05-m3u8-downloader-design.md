# M3U8 视频下载工具设计文档

## 概述

为 ToolHub 开发者工具箱添加一个 M3U8 视频下载工具，支持下载公开和加密的 HLS 流媒体视频。该工具采用纯前端实现，使用 m3u8-parser 库解析播放列表，Web Crypto API 处理解密，Blob API 合并分片。

## 目标

1. 支持下载未加密的 M3U8 视频
2. 支持下载 AES-128 加密的 M3U8 视频
3. 提供下载进度显示
4. 提供简洁易用的用户界面
5. 兼容性优先，使用成熟稳定的第三方库

## 技术栈

- **前端框架**: React + TypeScript
- **构建工具**: Vite
- **M3U8 解析**: m3u8-parser 库
- **解密**: Web Crypto API
- **文件处理**: Blob API + FileSaver.js
- **样式**: 与现有工具保持一致的 UI 风格

## 架构设计

### 整体架构

```
用户输入 URL
    ↓
解析 M3U8 文件 (m3u8-parser)
    ↓
提取分片 URL 和加密信息
    ↓
下载所有分片 (fetch API)
    ↓
解密分片 (Web Crypto API, 如果需要)
    ↓
合并分片 (Blob API)
    ↓
触发下载 (FileSaver.js)
```

### 组件设计

#### M3u8Downloader 主组件

主要功能：
- 状态管理：loading, progress, error, status
- 协调整个下载流程
- 错误处理和重试逻辑

子组件：
1. **输入区域**
   - M3U8 URL 输入框
   - 下载按钮
   - 示例链接提示

2. **进度显示**
   - 下载进度条
   - 当前状态文本（解析中/下载中/合并中/完成）
   - 下载速度显示

3. **错误处理**
   - 错误消息显示
   - 重试按钮

### 数据流

1. **输入阶段**
   - 用户输入 M3U8 URL
   - 验证 URL 格式

2. **解析阶段**
   - 使用 m3u8-parser 解析播放列表
   - 提取分片 URL 和加密信息
   - 更新状态：解析中

3. **下载阶段**
   - 顺序下载所有分片
   - 如果有加密信息，下载密钥
   - 更新进度：当前分片/总分片
   - 更新状态：下载中

4. **解密阶段**（如果需要）
   - 使用 Web Crypto API 解密分片
   - 更新状态：解密中

5. **合并阶段**
   - 使用 Blob API 合并所有分片
   - 更新状态：合并中

6. **下载触发**
   - 创建下载链接
   - 触发浏览器下载
   - 更新状态：完成

### 错误处理

1. **网络错误**
   - 显示网络错误消息
   - 提供重试按钮
   - 支持断点续传（如果可能）

2. **解析错误**
   - 显示解析失败消息
   - 提示检查 URL 是否正确
   - 显示具体解析错误信息

3. **解密错误**
   - 显示解密失败消息
   - 提示可能是加密方式不支持
   - 提供跳过解密选项（如果可能）

4. **跨域错误**
   - 显示跨域错误消息
   - 提示可能需要服务器代理
   - 建议使用支持 CORS 的链接

5. **通用错误处理**
   - 捕获所有未处理的错误
   - 显示友好的错误消息
   - 记录错误到控制台用于调试

## 文件结构

```
web/src/pages/
├── M3u8Downloader.tsx          # 主组件
└── components/                 # 子组件（如果需要）
    ├── M3u8Input.tsx           # 输入区域
    ├── M3u8Progress.tsx        # 进度显示
    └── M3u8Error.tsx           # 错误显示
```

样式将采用与现有工具一致的方式，使用 Tailwind CSS 或内联样式。

## 依赖项

### npm 依赖

```json
{
  "m3u8-parser": "^4.8.0",
  "file-saver": "^2.0.5"
}
```

### 类型定义

```json
{
  "@types/file-saver": "^2.0.5"
}
```

## API 设计

### 主要函数

```typescript
// 解析 M3U8 文件
async function parseM3u8(url: string): Promise<M3u8Playlist>

// 下载分片
async function downloadSegment(url: string): Promise<ArrayBuffer>

// 解密分片
async function decryptSegment(
  data: ArrayBuffer, 
  key: ArrayBuffer, 
  iv: ArrayBuffer
): Promise<ArrayBuffer>

// 合并分片
function mergeSegments(segments: ArrayBuffer[]): Blob

// 触发下载
function triggerDownload(blob: Blob, filename: string): void
```

### 类型定义

```typescript
interface M3u8Playlist {
  segments: Segment[]
  encryption?: EncryptionInfo
}

interface Segment {
  uri: string
  duration: number
  title?: string
}

interface EncryptionInfo {
  method: 'AES-128' | 'NONE'
  uri: string
  iv?: ArrayBuffer
}

type DownloadStatus = 
  | 'idle' 
  | 'parsing' 
  | 'downloading' 
  | 'decrypting' 
  | 'merging' 
  | 'completed' 
  | 'error'

interface DownloadState {
  status: DownloadStatus
  progress: number
  currentSegment: number
  totalSegments: number
  error?: Error
  speed?: number
}
```

## 用户界面

### 布局设计

```
┌─────────────────────────────────────────────┐
│  M3U8 视频下载工具                           │
├─────────────────────────────────────────────┤
│                                             │
│  ┌─────────────────────────────────────┐    │
│  │ 请输入 M3U8 播放列表 URL            │    │
│  │ https://example.com/video.m3u8      │    │
│  └─────────────────────────────────────┘    │
│                                             │
│  ┌─────────────────────────────────────┐    │
│  │           开始下载                   │    │
│  └─────────────────────────────────────┘    │
│                                             │
│  状态: 下载中 (45/120)                      │
│  ████████████░░░░░░░░░░░░░░░░░░░░░░░░░ 37% │
│  速度: 2.5 MB/s                             │
│                                             │
│  提示: 支持未加密和 AES-128 加密的 M3U8 视频 │
│                                             │
└─────────────────────────────────────────────┘
```

### 状态显示

1. **空闲状态**: 显示输入框和下载按钮
2. **解析中**: 显示"正在解析 M3U8 文件..."
3. **下载中**: 显示进度条、当前分片/总分片、下载速度
4. **解密中**: 显示"正在解密视频分片..."
5. **合并中**: 显示"正在合并视频分片..."
6. **完成**: 显示"下载完成"，提供重新下载按钮
7. **错误**: 显示错误消息和重试按钮

## 实现细节

### M3U8 解析

使用 m3u8-parser 库解析 M3U8 文件：

```typescript
import { Parser } from 'm3u8-parser'

async function parseM3u8(url: string): Promise<M3u8Playlist> {
  const response = await fetch(url)
  const text = await response.text()
  
  const parser = new Parser()
  parser.push(text)
  parser.end()
  
  const manifest = parser.manifest
  
  return {
    segments: manifest.segments.map(segment => ({
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

### 分片下载

使用 fetch API 下载分片：

```typescript
async function downloadSegment(url: string): Promise<ArrayBuffer> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`下载失败: ${response.status} ${response.statusText}`)
  }
  return await response.arrayBuffer()
}
```

### 解密处理

使用 Web Crypto API 解密：

```typescript
async function decryptSegment(
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

### 分片合并

使用 Blob API 合并分片：

```typescript
function mergeSegments(segments: ArrayBuffer[]): Blob {
  return new Blob(segments, { type: 'video/mp2t' })
}
```

### 下载触发

使用 FileSaver.js 触发下载：

```typescript
import { saveAs } from 'file-saver'

function triggerDownload(blob: Blob, filename: string): void {
  saveAs(blob, filename)
}
```

## 性能优化

1. **并行下载**: 考虑使用 Promise.all 并行下载多个分片（但要注意并发限制）
2. **内存管理**: 大文件处理时注意内存使用，考虑流式处理
3. **进度计算**: 基于已下载字节数计算进度，而不仅仅是分片数
4. **断点续传**: 使用 localStorage 保存下载进度，支持断点续传

## 兼容性考虑

1. **浏览器支持**: 现代浏览器（Chrome 60+, Firefox 55+, Safari 11+, Edge 79+）
2. **API 支持**: Web Crypto API, Blob API, Fetch API
3. **polyfill**: 如有需要，提供必要的 polyfill

## 测试策略

1. **单元测试**: 测试各个函数模块
2. **集成测试**: 测试完整下载流程
3. **边界测试**: 测试各种边界情况（空文件、大文件、加密文件等）
4. **兼容性测试**: 测试不同浏览器的兼容性

## 未来扩展

1. **批量下载**: 支持批量下载多个 M3U8 链接
2. **画质选择**: 支持选择不同画质的流
3. **下载队列**: 实现下载队列管理
4. **历史记录**: 保存下载历史记录
5. **自定义命名**: 支持自定义下载文件名

## 风险评估

1. **跨域限制**: 某些 M3U8 资源可能有跨域限制
2. **加密支持**: 某些加密方式可能不被 Web Crypto API 支持
3. **内存限制**: 大文件可能导致内存不足
4. **浏览器兼容性**: 旧版浏览器可能不支持某些 API

## 实施计划

1. **阶段一**: 基础功能实现
   - 创建基本组件结构
   - 实现 M3U8 解析
   - 实现分片下载
   - 实现分片合并

2. **阶段二**: 加密支持
   - 实现密钥下载
   - 实现 AES-128 解密
   - 错误处理完善

3. **阶段三**: 用户体验优化
   - 实现进度显示
   - 实现错误处理
   - 实现重试逻辑

4. **阶段四**: 测试和优化
   - 单元测试
   - 集成测试
   - 性能优化
   - 兼容性测试