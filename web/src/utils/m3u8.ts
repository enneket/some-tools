import { Parser } from 'm3u8-parser'
import { saveAs } from 'file-saver'

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

function hexToArrayBuffer(hex: string): ArrayBuffer {
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16)
  }
  return bytes.buffer
}

export async function parseM3u8(url: string): Promise<M3u8Playlist> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`获取 M3U8 文件失败: ${response.status} ${response.statusText}`)
  }

  const text = await response.text()
  const parser = new Parser({ uri: url })
  parser.push(text)
  parser.end()

  const manifest = parser.manifest

  if (!manifest.segments || manifest.segments.length === 0) {
    throw new Error('M3U8 文件中没有找到视频分片')
  }

  const firstSegmentWithKey = manifest.segments.find((s) => s.key)
  const encryption = firstSegmentWithKey?.key
    ? {
        method: (firstSegmentWithKey.key.method as 'AES-128' | 'NONE') || 'AES-128',
        uri: new URL(firstSegmentWithKey.key.uri, url).href,
        iv: firstSegmentWithKey.key.iv
          ? hexToArrayBuffer(firstSegmentWithKey.key.iv)
          : undefined,
      }
    : undefined

  return {
    segments: manifest.segments.map((segment) => ({
      uri: new URL(segment.uri, url).href,
      duration: segment.duration,
      title: segment.title,
    })),
    encryption,
  }
}

export async function downloadSegment(url: string): Promise<ArrayBuffer> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`下载分片失败: ${response.status} ${response.statusText}`)
  }
  return await response.arrayBuffer()
}

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

export function mergeSegments(segments: ArrayBuffer[]): Blob {
  return new Blob(segments, { type: 'video/mp2t' })
}

export function triggerDownload(blob: Blob, filename: string): void {
  saveAs(blob, filename)
}

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
        ...state,
      })
    }
  }

  try {
    updateState({ status: 'parsing' })
    const playlist = await parseM3u8(url)

    const totalSegments = playlist.segments.length
    updateState({
      status: 'downloading',
      totalSegments,
      currentSegment: 0,
      progress: 0,
    })

    let encryptionKey: ArrayBuffer | undefined
    if (playlist.encryption && playlist.encryption.method === 'AES-128') {
      const keyResponse = await fetch(playlist.encryption.uri)
      if (!keyResponse.ok) {
        throw new Error(`下载加密密钥失败: ${keyResponse.status}`)
      }
      encryptionKey = await keyResponse.arrayBuffer()
    }

    const segments: ArrayBuffer[] = []
    const startTime = Date.now()

    for (let i = 0; i < totalSegments; i++) {
      const segmentData = await downloadSegment(playlist.segments[i].uri)

      if (playlist.encryption?.method === 'AES-128' && encryptionKey && playlist.encryption.iv) {
        updateState({ status: 'decrypting' })
        const decrypted = await decryptSegment(
          segmentData,
          encryptionKey,
          playlist.encryption.iv
        )
        segments.push(decrypted)
      } else {
        segments.push(segmentData)
      }

      const elapsed = (Date.now() - startTime) / 1000
      const speed = (i + 1) / elapsed

      updateState({
        status: 'downloading',
        currentSegment: i + 1,
        progress: ((i + 1) / totalSegments) * 100,
        speed,
      })
    }

    updateState({ status: 'merging' })
    const blob = mergeSegments(segments)

    const filename = `video_${Date.now()}.ts`
    triggerDownload(blob, filename)

    updateState({ status: 'completed', progress: 100 })
  } catch (error) {
    updateState({
      status: 'error',
      error: error instanceof Error ? error : new Error(String(error)),
    })
    throw error
  }
}
