import type { ComponentType } from 'react'
import JsonFormatter from '../pages/JsonFormatter'
import Base64 from '../pages/Base64'
import UrlEncoder from '../pages/UrlEncoder'
import UuidGenerator from '../pages/UuidGenerator'
import TimestampConverter from '../pages/TimestampConverter'
import ColorConverter from '../pages/ColorConverter'
import HashCalculator from '../pages/HashCalculator'
import JwtDecoder from '../pages/JwtDecoder'
import PasswordGenerator from '../pages/PasswordGenerator'
import RegexTester from '../pages/RegexTester'
import MarkdownPreview from '../pages/MarkdownPreview'
import TextDiff from '../pages/TextDiff'
import QrCodeGenerator from '../pages/QrCodeGenerator'
import CronParser from '../pages/CronParser'
import HtmlEntity from '../pages/HtmlEntity'
import UnicodeConverter from '../pages/UnicodeConverter'
import BaseConverter from '../pages/BaseConverter'
import WordCounter from '../pages/WordCounter'
import ImageToBase64 from '../pages/ImageToBase64'
import Base64ToImage from '../pages/Base64ToImage'
import HttpStatusCodes from '../pages/HttpStatusCodes'
import SqlFormatter from '../pages/SqlFormatter'
import M3u8Downloader from '../pages/M3u8Downloader'
import PortraitSegmenter from '../pages/PortraitSegmenter'

export const CATEGORIES = ['编解码', '生成器', '转换器', '文本', '媒体']

export interface ToolEntry {
  /** 路由 id，对应 /tools/:id */
  id: string
  /** 后端 /api/tools 返回的 name */
  backendName: string
  name: string
  description: string
  category: string
  component: ComponentType
}

export const TOOLS: ToolEntry[] = [
  // 编解码
  { id: 'json-formatter', backendName: 'json', name: 'JSON 格式化', description: '格式化、压缩、验证 JSON 数据', category: '编解码', component: JsonFormatter },
  { id: 'base64', backendName: 'base64', name: 'Base64 编解码', description: 'Base64 编码和解码', category: '编解码', component: Base64 },
  { id: 'url-encoder', backendName: 'url', name: 'URL 编解码', description: 'URL 编码和解码', category: '编解码', component: UrlEncoder },
  { id: 'hash-calculator', backendName: 'hash', name: 'Hash 计算', description: '计算 MD5/SHA1/SHA256/SHA512 摘要', category: '编解码', component: HashCalculator },
  { id: 'jwt-decoder', backendName: 'jwt', name: 'JWT 解析', description: '解码 JWT Token', category: '编解码', component: JwtDecoder },
  { id: 'html-entity', backendName: 'html-entity', name: 'HTML 实体', description: 'HTML 特殊字符编码和解码', category: '编解码', component: HtmlEntity },
  { id: 'unicode-converter', backendName: 'unicode', name: 'Unicode 编解码', description: 'Unicode 字符编码和解码', category: '编解码', component: UnicodeConverter },
  // 生成器
  { id: 'uuid-generator', backendName: 'uuid', name: 'UUID 生成', description: '生成随机 UUID', category: '生成器', component: UuidGenerator },
  { id: 'password-generator', backendName: 'password', name: '密码生成器', description: '生成安全随机密码', category: '生成器', component: PasswordGenerator },
  { id: 'qrcode-generator', backendName: 'qrcode', name: '二维码生成', description: '文本或链接转二维码', category: '生成器', component: QrCodeGenerator },
  { id: 'image-to-base64', backendName: 'img2base64', name: '图片转 Base64', description: '将图片转换为 Base64 编码', category: '生成器', component: ImageToBase64 },
  { id: 'base64-to-image', backendName: 'base64toimg', name: 'Base64 转图片', description: '将 Base64 编码转换为图片显示', category: '生成器', component: Base64ToImage },
  { id: 'portrait-segmenter', backendName: 'portrait', name: '人像抠图', description: '使用 AI 模型进行人像分割', category: '生成器', component: PortraitSegmenter },
  // 转换器
  { id: 'timestamp-converter', backendName: 'timestamp', name: '时间戳转换', description: '时间戳与日期时间互转', category: '转换器', component: TimestampConverter },
  { id: 'color-converter', backendName: 'color', name: '颜色转换', description: 'HEX 与 RGB 颜色值互转', category: '转换器', component: ColorConverter },
  { id: 'cron-parser', backendName: 'cron', name: 'Cron 解析', description: '解析 Cron 表达式，查看执行计划', category: '转换器', component: CronParser },
  { id: 'base-converter', backendName: 'base', name: '进制转换', description: '二进制、八进制、十进制、十六进制互转', category: '转换器', component: BaseConverter },
  // 文本
  { id: 'regex-tester', backendName: 'regex', name: '正则测试', description: '测试正则表达式匹配', category: '文本', component: RegexTester },
  { id: 'markdown-preview', backendName: 'markdown', name: 'Markdown 预览', description: '实时预览 Markdown 渲染', category: '文本', component: MarkdownPreview },
  { id: 'text-diff', backendName: 'diff', name: '文本对比', description: '比较两段文本的差异', category: '文本', component: TextDiff },
  { id: 'word-counter', backendName: 'wordcount', name: '字数统计', description: '统计字符数、词数、行数、字节数', category: '文本', component: WordCounter },
  { id: 'http-status-codes', backendName: 'httpstatus', name: 'HTTP 状态码', description: '快速查询 HTTP 状态码含义', category: '文本', component: HttpStatusCodes },
  { id: 'sql-formatter', backendName: 'sql', name: 'SQL 格式化', description: '规范化并格式化 SQL 语句', category: '文本', component: SqlFormatter },
  // 媒体
  { id: 'm3u8-downloader', backendName: 'm3u8', name: 'M3U8 下载', description: '下载 M3U8 格式的视频流', category: '媒体', component: M3u8Downloader },
]

/** 按分类分组，保持 CATEGORIES 顺序 */
export function groupToolsByCategory(): Record<string, ToolEntry[]> {
  const grouped: Record<string, ToolEntry[]> = {}
  CATEGORIES.forEach(cat => {
    grouped[cat] = []
  })
  TOOLS.forEach(tool => {
    ;(grouped[tool.category] || (grouped[tool.category] = [])).push(tool)
  })
  return grouped
}
