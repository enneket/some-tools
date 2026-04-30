import { useState, useMemo } from 'react'
import { marked } from 'marked'
import ToolLayout from '../components/ToolLayout'

export default function MarkdownPreview() {
  const [input, setInput] = useState('# Hello\n\n这是 **Markdown** 预览。\n\n- 列表项 1\n- 列表项 2\n\n```js\nconsole.log("Hello")\n```')

  const html = useMemo(() => {
    try {
      return marked.parse(input) as string
    } catch {
      return '<p style="color:red">解析错误</p>'
    }
  }, [input])

  return (
    <ToolLayout title="Markdown 预览" description="实时预览 Markdown 渲染效果">
      <div style={{ display: 'flex', gap: '16px', height: '500px' }}>
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="输入 Markdown..."
          style={{ flex: 1, padding: '16px', fontSize: '14px', border: '1px solid #e5e5e5', borderRadius: '8px', resize: 'none', fontFamily: 'monospace' }}
        />
        <div
          style={{ flex: 1, padding: '16px', border: '1px solid #e5e5e5', borderRadius: '8px', overflow: 'auto', background: '#fff' }}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
    </ToolLayout>
  )
}
