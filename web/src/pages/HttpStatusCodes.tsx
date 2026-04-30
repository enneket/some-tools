import { useState } from 'react'
import ToolLayout from '../components/ToolLayout'

interface StatusCode {
  code: number
  name: string
  description: string
  category: string
}

const CODES: StatusCode[] = [
  // 1xx
  { code: 100, name: 'Continue', description: '服务器已收到请求头，客户端应继续发送请求体', category: '1xx 信息' },
  { code: 101, name: 'Switching Protocols', description: '服务器同意切换协议', category: '1xx 信息' },
  { code: 102, name: 'Processing', description: '服务器正在处理请求，尚无响应可用', category: '1xx 信息' },
  { code: 103, name: 'Early Hints', description: '用于在最终响应之前发送一些响应头', category: '1xx 信息' },
  // 2xx
  { code: 200, name: 'OK', description: '请求成功', category: '2xx 成功' },
  { code: 201, name: 'Created', description: '请求成功并创建了新资源', category: '2xx 成功' },
  { code: 202, name: 'Accepted', description: '请求已接受但尚未处理完成', category: '2xx 成功' },
  { code: 204, name: 'No Content', description: '请求成功但无返回内容', category: '2xx 成功' },
  { code: 206, name: 'Partial Content', description: '服务器已成功处理了部分 GET 请求', category: '2xx 成功' },
  // 3xx
  { code: 301, name: 'Moved Permanently', description: '请求的资源已永久移动到新 URL', category: '3xx 重定向' },
  { code: 302, name: 'Found', description: '请求的资源临时从不同的 URL 响应', category: '3xx 重定向' },
  { code: 303, name: 'See Other', description: '对应当前请求的响应可以在另一个 URL 上被找到', category: '3xx 重定向' },
  { code: 304, name: 'Not Modified', description: '资源未修改，可使用缓存版本', category: '3xx 重定向' },
  { code: 307, name: 'Temporary Redirect', description: '请求临时重定向，保持原请求方法', category: '3xx 重定向' },
  { code: 308, name: 'Permanent Redirect', description: '请求永久重定向，保持原请求方法', category: '3xx 重定向' },
  // 4xx
  { code: 400, name: 'Bad Request', description: '服务器无法理解请求的格式', category: '4xx 客户端错误' },
  { code: 401, name: 'Unauthorized', description: '请求要求用户的身份认证', category: '4xx 客户端错误' },
  { code: 403, name: 'Forbidden', description: '服务器拒绝执行此请求', category: '4xx 客户端错误' },
  { code: 404, name: 'Not Found', description: '服务器无法根据请求找到资源', category: '4xx 客户端错误' },
  { code: 405, name: 'Method Not Allowed', description: '请求方法对指定资源不适用', category: '4xx 客户端错误' },
  { code: 408, name: 'Request Timeout', description: '请求超时', category: '4xx 客户端错误' },
  { code: 409, name: 'Conflict', description: '请求与服务器当前状态冲突', category: '4xx 客户端错误' },
  { code: 410, name: 'Gone', description: '请求的资源已永久删除', category: '4xx 客户端错误' },
  { code: 413, name: 'Payload Too Large', description: '请求体超过服务器限制', category: '4xx 客户端错误' },
  { code: 415, name: 'Unsupported Media Type', description: '请求的媒体类型不受支持', category: '4xx 客户端错误' },
  { code: 422, name: 'Unprocessable Entity', description: '请求格式正确但语义错误', category: '4xx 客户端错误' },
  { code: 429, name: 'Too Many Requests', description: '客户端请求频率超过限制', category: '4xx 客户端错误' },
  // 5xx
  { code: 500, name: 'Internal Server Error', description: '服务器遇到未知错误', category: '5xx 服务端错误' },
  { code: 501, name: 'Not Implemented', description: '服务器不支持请求的功能', category: '5xx 服务端错误' },
  { code: 502, name: 'Bad Gateway', description: '服务器作为网关收到了无效响应', category: '5xx 服务端错误' },
  { code: 503, name: 'Service Unavailable', description: '服务器暂时不可用（过载或维护）', category: '5xx 服务端错误' },
  { code: 504, name: 'Gateway Timeout', description: '网关或代理服务器超时', category: '5xx 服务端错误' },
]

const CATEGORY_COLORS: Record<string, string> = {
  '1xx 信息': '#3b82f6',
  '2xx 成功': '#10b981',
  '3xx 重定向': '#f59e0b',
  '4xx 客户端错误': '#ef4444',
  '5xx 服务端错误': '#8b5cf6',
}

export default function HttpStatusCodes() {
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<StatusCode | null>(null)

  const filtered = CODES.filter(c =>
    search === '' ||
    c.code.toString().includes(search) ||
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.description.includes(search)
  )

  const categories = [...new Set(CODES.map(c => c.category))]

  return (
    <ToolLayout title="HTTP 状态码查询" description="快速查询 HTTP 状态码含义">
      <div style={{ marginBottom: '20px' }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="搜索状态码或描述..."
          style={{
            width: '100%', padding: '12px 16px', fontSize: '16px',
            border: '1px solid #e5e5e5', borderRadius: '8px',
          }}
        />
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {categories.map(cat => (
          <button key={cat} onClick={() => setSearch(cat.split(' ')[0])} style={{
            padding: '4px 12px', border: 'none', borderRadius: '16px',
            background: CATEGORY_COLORS[cat] + '20', color: CATEGORY_COLORS[cat],
            cursor: 'pointer', fontSize: '13px', fontWeight: 600,
          }}>{cat}</button>
        ))}
        {search && (
          <button onClick={() => setSearch('')} style={{
            padding: '4px 12px', border: '1px solid #e5e5e5', borderRadius: '16px',
            background: '#fff', cursor: 'pointer', fontSize: '13px',
          }}>清除筛选</button>
        )}
      </div>

      {selected && (
        <div style={{
          padding: '20px', marginBottom: '20px', borderRadius: '12px',
          background: CATEGORY_COLORS[selected.category] + '10',
          border: `2px solid ${CATEGORY_COLORS[selected.category]}40`,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{
                fontSize: '36px', fontWeight: 800,
                color: CATEGORY_COLORS[selected.category],
              }}>{selected.code}</span>
              <span style={{ fontSize: '20px', fontWeight: 600, marginLeft: '12px' }}>{selected.name}</span>
            </div>
            <button onClick={() => setSelected(null)} style={{
              border: 'none', background: 'none', fontSize: '20px', cursor: 'pointer', color: '#999',
            }}>×</button>
          </div>
          <div style={{ fontSize: '15px', marginTop: '8px', color: '#555' }}>{selected.description}</div>
        </div>
      )}

      <div style={{ display: 'grid', gap: '4px' }}>
        {filtered.map(c => (
          <div
            key={c.code}
            onClick={() => setSelected(c)}
            style={{
              display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 16px',
              borderRadius: '8px', cursor: 'pointer',
              background: selected?.code === c.code ? '#f0f0f0' : 'transparent',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = '#f8f8f8')}
            onMouseLeave={e => (e.currentTarget.style.background = selected?.code === c.code ? '#f0f0f0' : 'transparent')}
          >
            <span style={{
              fontWeight: 800, fontSize: '16px', minWidth: '40px',
              color: CATEGORY_COLORS[c.category],
            }}>{c.code}</span>
            <span style={{ fontWeight: 600, minWidth: '160px' }}>{c.name}</span>
            <span style={{ color: '#666', fontSize: '14px' }}>{c.description}</span>
          </div>
        ))}
      </div>
    </ToolLayout>
  )
}
