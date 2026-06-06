import { useState, useEffect } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable'
import Header from '../components/Header'
import ToolCard from '../components/ToolCard'

interface Tool {
  id: string
  name: string
  description: string
  category: string
}

const CATEGORY_MAP: Record<string, string> = {
  'json': '编解码',
  'base64': '编解码',
  'url': '编解码',
  'hash': '编解码',
  'jwt': '编解码',
  'uuid': '生成器',
  'password': '生成器',
  'qrcode': '生成器',
  'timestamp': '转换器',
  'color': '转换器',
  'regex': '文本',
  'markdown': '文本',
  'diff': '文本',
  'cron': '转换器',
  'html-entity': '编解码',
  'unicode': '编解码',
  'base': '转换器',
  'wordcount': '文本',
  'img2base64': '生成器',
  'base64toimg': '生成器',
  'httpstatus': '文本',
  'sql': '文本',
  'm3u8': '媒体',
  'portrait': '生成器',
}

const ROUTE_MAP: Record<string, string> = {
  'json': 'json-formatter',
  'base64': 'base64',
  'url': 'url-encoder',
  'uuid': 'uuid-generator',
  'timestamp': 'timestamp-converter',
  'color': 'color-converter',
  'hash': 'hash-calculator',
  'jwt': 'jwt-decoder',
  'password': 'password-generator',
  'regex': 'regex-tester',
  'markdown': 'markdown-preview',
  'diff': 'text-diff',
  'qrcode': 'qrcode-generator',
  'cron': 'cron-parser',
  'html-entity': 'html-entity',
  'unicode': 'unicode-converter',
  'base': 'base-converter',
  'wordcount': 'word-counter',
  'img2base64': 'image-to-base64',
  'base64toimg': 'base64-to-image',
  'httpstatus': 'http-status-codes',
  'sql': 'sql-formatter',
  'm3u8': 'm3u8-downloader',
  'portrait': 'portrait-segmenter',
}

const NAME_MAP: Record<string, string> = {
  'json': 'JSON 格式化',
  'base64': 'Base64 编解码',
  'url': 'URL 编解码',
  'uuid': 'UUID 生成',
  'timestamp': '时间戳转换',
  'color': '颜色转换',
  'hash': 'Hash 计算',
  'jwt': 'JWT 解析',
  'password': '密码生成器',
  'regex': '正则测试',
  'markdown': 'Markdown 预览',
  'diff': '文本对比',
  'qrcode': '二维码生成',
  'cron': 'Cron 解析',
  'html-entity': 'HTML 实体',
  'unicode': 'Unicode 编解码',
  'base': '进制转换',
  'wordcount': '字数统计',
  'img2base64': '图片转 Base64',
  'base64toimg': 'Base64 转图片',
  'httpstatus': 'HTTP 状态码',
  'sql': 'SQL 格式化',
  'm3u8': 'M3U8 下载',
  'portrait': '人像抠图',
}

const DESC_MAP: Record<string, string> = {
  'json': '格式化、压缩、验证 JSON 数据',
  'base64': 'Base64 编码和解码',
  'url': 'URL 编码和解码',
  'uuid': '生成随机 UUID',
  'timestamp': '时间戳与日期时间互转',
  'color': 'HEX 与 RGB 颜色值互转',
  'hash': '计算 MD5/SHA1/SHA256/SHA512 摘要',
  'jwt': '解码 JWT Token',
  'password': '生成安全随机密码',
  'regex': '测试正则表达式匹配',
  'markdown': '实时预览 Markdown 渲染',
  'diff': '比较两段文本的差异',
  'qrcode': '文本或链接转二维码',
  'cron': '解析 Cron 表达式，查看执行计划',
  'html-entity': 'HTML 特殊字符编码和解码',
  'unicode': 'Unicode 字符编码和解码',
  'base': '二进制、八进制、十进制、十六进制互转',
  'wordcount': '统计字符数、词数、行数、字节数',
  'img2base64': '将图片转换为 Base64 编码',
  'base64toimg': '将 Base64 编码转换为图片显示',
  'httpstatus': '快速查询 HTTP 状态码含义',
  'sql': '规范化并格式化 SQL 语句',
  'm3u8': '下载 M3U8 格式的视频流',
  'portrait': '使用 AI 模型进行人像分割',
}

const CATEGORIES = ['全部', '编解码', '生成器', '转换器', '文本', '媒体']

const STORAGE_KEY = 'some-tools-order'

export default function Home() {
  const [tools, setTools] = useState<Tool[]>([])
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('全部')

  const sensors = useSensors(
    useSensor(PointerSensor, {
      preventDefault: false,
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  useEffect(() => {
    fetch('/api/tools')
      .then(res => res.json())
      .then(data => {
        const mapped = (data.tools || []).map((t: { name: string; description: string; endpoint: string }) => ({
          id: ROUTE_MAP[t.name] || t.name,
          name: NAME_MAP[t.name] || t.name,
          description: DESC_MAP[t.name] || t.description,
          category: CATEGORY_MAP[t.name] || '其他',
        }))

        // Load saved order from localStorage
        const savedOrder = localStorage.getItem(STORAGE_KEY)
        if (savedOrder) {
          try {
            const orderMap: Record<string, number> = JSON.parse(savedOrder)
            mapped.sort((a: Tool, b: Tool) => {
              const orderA = orderMap[a.id] ?? 9999
              const orderB = orderMap[b.id] ?? 9999
              return orderA - orderB
            })
          } catch {
            // Ignore parse errors
          }
        }

        setTools(mapped)
      })
      .catch(console.error)
  }, [])

  const filtered = tools.filter(tool => {
    const matchSearch = tool.name.toLowerCase().includes(search.toLowerCase())
    const matchCategory = category === '全部' || tool.category === category
    return matchSearch && matchCategory
  })

  return (
    <div>
      <Header />
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px' }}>
        <div style={{ marginBottom: '32px' }}>
          <input
            type="text"
            placeholder="搜索工具..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 16px',
              fontSize: '16px',
              border: '1px solid #e5e5e5',
              borderRadius: '8px',
            }}
          />
        </div>
        <div style={{ display: 'flex', gap: '12px', marginBottom: '32px', flexWrap: 'wrap' }}>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              style={{
                padding: '8px 16px',
                border: 'none',
                borderRadius: '20px',
                background: category === cat ? '#333' : '#f5f5f5',
                color: category === cat ? '#fff' : '#333',
                cursor: 'pointer',
              }}
            >
              {cat}
            </button>
          ))}
        </div>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={(event) => {
            const { active, over } = event

            if (over && active.id !== over.id) {
              setTools((items) => {
                const oldIndex = items.findIndex(t => t.id === active.id)
                const newIndex = items.findIndex(t => t.id === over.id)
                const newItems = arrayMove(items, oldIndex, newIndex)

                const orderMap: Record<string, number> = {}
                newItems.forEach((item, index) => {
                  orderMap[item.id] = index
                })
                localStorage.setItem(STORAGE_KEY, JSON.stringify(orderMap))

                return newItems
              })
            }
          }}
        >
          <SortableContext items={filtered.map(t => t.id)} strategy={rectSortingStrategy}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
              {filtered.map(tool => (
                <ToolCard key={tool.id} id={tool.id} name={tool.name} description={tool.description} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>
    </div>
  )
}