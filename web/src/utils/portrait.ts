import { ImageSegmenter, FilesetResolver } from '@mediapipe/tasks-vision'

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
      delegate: 'GPU',
    },
    runningMode: 'IMAGE',
    outputCategoryMask: true,
  })

  return segmenterInstance
}

export async function segmentPortrait(
  segmenter: ImageSegmenter,
  image: HTMLImageElement
): Promise<ImageData> {
  const result = segmenter.segment(image)
  const mask = result.categoryMask

  if (!mask) {
    throw new Error('分割失败：无法获取掩码')
  }

  const canvas = document.createElement('canvas')
  canvas.width = mask.width
  canvas.height = mask.height
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

export function applyMask(image: ImageData, mask: ImageData): ImageData {
  const result = new ImageData(image.width, image.height)

  for (let i = 0; i < image.data.length; i += 4) {
    const maskValue = mask.data[i]

    if (maskValue === 255) {
      result.data[i] = image.data[i]
      result.data[i + 1] = image.data[i + 1]
      result.data[i + 2] = image.data[i + 2]
      result.data[i + 3] = 255
    } else {
      result.data[i] = 0
      result.data[i + 1] = 0
      result.data[i + 2] = 0
      result.data[i + 3] = 0
    }
  }

  return result
}

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

export function imageToImageData(image: HTMLImageElement): ImageData {
  const canvas = document.createElement('canvas')
  canvas.width = image.naturalWidth
  canvas.height = image.naturalHeight
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(image, 0, 0)
  return ctx.getImageData(0, 0, canvas.width, canvas.height)
}

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
