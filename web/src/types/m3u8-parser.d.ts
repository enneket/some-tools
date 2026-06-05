declare module 'm3u8-parser' {
  interface Segment {
    uri: string
    duration: number
    title?: string
    key?: {
      method: string
      uri: string
      iv?: string
    }
  }

  interface Manifest {
    segments: Segment[]
    targetDuration?: number
    version?: number
    endList?: boolean
  }

  export class Parser {
    manifest: Manifest
    constructor(opts?: { uri?: string })
    push(chunk: string): void
    end(): void
  }
}
