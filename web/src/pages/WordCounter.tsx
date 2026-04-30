import { useState } from 'react'
import ToolLayout from '../components/ToolLayout'

interface Stats {
  chars: number
  charsNoSpace: number
  words: number
  lines: number
  paragraphs: number
  bytes: number
  chinese: number
  english: number
  numbers: number
  punctuation: number
}

function countStats(text: string): Stats {
  const chars = text.length
  const charsNoSpace = text.replace(/\s/g, '').length
  const words = text.trim() ? text.trim().split(/\s+/).length : 0
  const lines = text ? text.split('\n').length : 0
  const paragraphs = text.trim() ? text.trim().split(/\n\s*\n/).length : 0
  const bytes = new TextEncoder().encode(text).length
  const chinese = (text.match(/[\u4e00-\u9fff]/g) || []).length
  const english = (text.match(/[a-zA-Z]/g) || []).length
  const numbers = (text.match(/\d/g) || []).length
  const punctuation = (text.match(/[^\w\s\u4e00-\u9fff]/g) || []).length

  return { chars, charsNoSpace, words, lines, paragraphs, bytes, chinese, english, numbers, punctuation }
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div style={{
      padding: '16px', background: '#f8f8f8', borderRadius: '8px', textAlign: 'center',
    }}>
      <div style={{ fontSize: '28px', fontWeight: 700, color: '#333' }}>{value.toLocaleString()}</div>
      <div style={{ fontSize: '13px', color: '#999', marginTop: '4px' }}>{label}</div>
    </div>
  )
}

export default function WordCounter() {
  const [text, setText] = useState('')
  const stats = countStats(text)

  return (
    <ToolLayout title="字数统计" description="统计字符数、词数、行数、字节数等">
      <div style={{ marginBottom: '24px' }}>
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="在此粘贴或输入文本..."
          style={{
            width: '100%', minHeight: '200px', padding: '16px', fontSize: '15px',
            border: '1px solid #e5e5e5', borderRadius: '8px', resize: 'vertical',
            lineHeight: 1.6,
          }}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '24px' }}>
        <StatCard label="总字符" value={stats.chars} />
        <StatCard label="不含空格" value={stats.charsNoSpace} />
        <StatCard label="单词数" value={stats.words} />
        <StatCard label="行数" value={stats.lines} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '24px' }}>
        <StatCard label="段落数" value={stats.paragraphs} />
        <StatCard label="字节数" value={stats.bytes} />
        <StatCard label="中文字符" value={stats.chinese} />
        <StatCard label="英文字母" value={stats.english} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div style={{ padding: '16px', background: '#f8f8f8', borderRadius: '8px' }}>
          <div style={{ fontWeight: 600, marginBottom: '8px' }}>字符分布</div>
          {[
            { label: '中文', count: stats.chinese, color: '#3b82f6' },
            { label: '英文', count: stats.english, color: '#10b981' },
            { label: '数字', count: stats.numbers, color: '#f59e0b' },
            { label: '标点', count: stats.punctuation, color: '#ef4444' },
          ].map(item => (
            <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <div style={{ width: '40px', fontSize: '13px', color: '#666' }}>{item.label}</div>
              <div style={{ flex: 1, height: '8px', background: '#e5e5e5', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{
                  height: '100%', background: item.color, borderRadius: '4px',
                  width: stats.charsNoSpace > 0 ? `${(item.count / stats.charsNoSpace) * 100}%` : '0%',
                  transition: 'width 0.3s',
                }} />
              </div>
              <div style={{ width: '40px', textAlign: 'right', fontSize: '13px', color: '#666' }}>{item.count}</div>
            </div>
          ))}
        </div>

        <div style={{ padding: '16px', background: '#f8f8f8', borderRadius: '8px' }}>
          <div style={{ fontWeight: 600, marginBottom: '8px' }}>阅读时间估算</div>
          <div style={{ marginBottom: '12px' }}>
            <div style={{ fontSize: '13px', color: '#666' }}>中文阅读（500字/分钟）</div>
            <div style={{ fontSize: '20px', fontWeight: 600 }}>
              {stats.chinese > 0 ? Math.ceil(stats.chinese / 500) : 0} 分钟
            </div>
          </div>
          <div style={{ marginBottom: '12px' }}>
            <div style={{ fontSize: '13px', color: '#666' }}>英文阅读（200词/分钟）</div>
            <div style={{ fontSize: '20px', fontWeight: 600 }}>
              {stats.words > 0 ? Math.ceil(stats.words / 200) : 0} 分钟
            </div>
          </div>
          <div>
            <div style={{ fontSize: '13px', color: '#666' }}>语音朗读（150字/分钟）</div>
            <div style={{ fontSize: '20px', fontWeight: 600 }}>
              {Math.ceil((stats.chinese + stats.words) / 150)} 分钟
            </div>
          </div>
        </div>
      </div>
    </ToolLayout>
  )
}
