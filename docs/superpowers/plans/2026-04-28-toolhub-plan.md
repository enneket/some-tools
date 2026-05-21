# ToolHub 聚合工具站实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 搭建聚合工具站，包含 6 个开发核心工具，前后端分离部署

**Architecture:** Go 后端提供 REST API，React 前端单页应用，前后端独立容器通过 Docker Compose 部署

**Tech Stack:** Go 1.22 + net/http, React 18 + Vite + TypeScript, Docker + Docker Compose

---

## 文件结构

```
some-tools/
├── server/
│   ├── go.mod
│   ├── main.go              # HTTP 服务入口，/api/* 路由
│   └── tools/
│       ├── json.go          # JSON 格式化 API
│       ├── base64.go        # Base64 编解码 API
│       ├── url.go           # URL 编解码 API
│       ├── uuid.go          # UUID 生成 API
│       ├── timestamp.go     # 时间戳转换 API
│       └── color.go         # 颜色转换 API
├── web/
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── src/
│       ├── main.tsx
│       ├── App.tsx
│       ├── components/
│       │   ├── Header.tsx
│       │   ├── ToolCard.tsx
│       │   └── ToolLayout.tsx
│       └── pages/
│           ├── Home.tsx
│           ├── JsonFormatter.tsx
│           ├── Base64.tsx
│           ├── UrlEncoder.tsx
│           ├── UuidGenerator.tsx
│           ├── TimestampConverter.tsx
│           └── ColorConverter.tsx
├── Dockerfile.server
├── Dockerfile.web
└── docker-compose.yml
```

---

### Task 1: 初始化 Go 后端项目

**Files:**
- Create: `server/go.mod`
- Create: `server/main.go`

- [ ] **Step 1: 创建 go.mod**

```go
module toolhub

go 1.22
```

- [ ] **Step 2: 创建 main.go，基础 HTTP 服务**

```go
package main

import (
	"embed"
	"log"
	"net/http"
)

func main() {
	mux := http.NewServeMux()

	// 工具 API 路由
	mux.HandleFunc("/api/tools", handleTools)
	mux.HandleFunc("/api/format/json", handleJSON)
	mux.HandleFunc("/api/encode/base64", handleBase64)
	mux.HandleFunc("/api/encode/url", handleURL)
	mux.HandleFunc("/api/generate/uuid", handleUUID)
	mux.HandleFunc("/api/convert/timestamp", handleTimestamp)
	mux.HandleFunc("/api/convert/color", handleColor)

	log.Println("Server started at :8080")
	log.Fatal(http.ListenAndServe(":8080", mux))
}
```

- [ ] **Step 3: 创建空文件占位 tools/**

Create: `server/tools/json.go`, `server/tools/base64.go`, `server/tools/url.go`, `server/tools/uuid.go`, `server/tools/timestamp.go`, `server/tools/color.go`

每个文件内容：

```go
package tools

// 占位文件，后续实现具体逻辑
```

- [ ] **Step 4: 提交**

```bash
cd server && go mod init toolhub && cd ..
git add server/go.mod server/main.go server/tools/
git commit -m "chore: init Go backend project structure"
```

---

### Task 2: 实现 Go 工具 API

**Files:**
- Modify: `server/main.go` - 添加路由处理函数注册
- Create: `server/tools/json.go`
- Create: `server/tools/base64.go`
- Create: `server/tools/url.go`
- Create: `server/tools/uuid.go`
- Create: `server/tools/timestamp.go`
- Create: `server/tools/color.go`

- [ ] **Step 1: 实现 handleTools (GET /api/tools)**

在 main.go 中添加：

```go
func handleTools(w http.ResponseWriter, r *http.Request) {
	tools := []map[string]string{
		{"id": "json-formatter", "name": "JSON 格式化", "category": "encoder"},
		{"id": "base64", "name": "Base64 编解码", "category": "encoder"},
		{"id": "url-encoder", "name": "URL 编解码", "category": "encoder"},
		{"id": "uuid-generator", "name": "UUID 生成", "category": "generator"},
		{"id": "timestamp-converter", "name": "时间戳转换", "category": "generator"},
		{"id": "color-converter", "name": "颜色转换", "category": "converter"},
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(tools)
}
```

- [ ] **Step 2: 实现 JSON 格式化 (server/tools/json.go)**

```go
package tools

import (
	"bytes"
	"encoding/json"
	"net/http"
)

func HandleJSON(w http.ResponseWriter, r *http.Request) {
	var req struct{ Input string }
	json.NewDecoder(r.Body).Decode(&req)

	var buf bytes.Buffer
	encoder := json.NewEncoder(&buf)
	encoder.SetIndent("", "  ")
	encoder.Encode(req.Input)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"output": buf.String()})
}
```

- [ ] **Step 3: 实现 Base64 编解码 (server/tools/base64.go)**

```go
package tools

import (
	"encoding/base64"
	"encoding/json"
	"net/http"
)

func HandleBase64(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Input string `json:"input"`
		Action string `json:"action"` // "encode" or "decode"
	}
	json.NewDecoder(r.Body).Decode(&req)

	var output string
	if req.Action == "decode" {
		data, err := base64.StdEncoding.DecodeString(req.Input)
		if err != nil {
			output = "解码错误"
		} else {
			output = string(data)
		}
	} else {
		output = base64.StdEncoding.EncodeToString([]byte(req.Input))
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"output": output})
}
```

- [ ] **Step 4: 实现 URL 编解码 (server/tools/url.go)**

```go
package tools

import (
	"encoding/json"
	"net/http"
	"net/url"
)

func HandleURL(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Input string `json:"input"`
		Action string `json:"action"`
	}
	json.NewDecoder(r.Body).Decode(&req)

	var output string
	if req.Action == "decode" {
		s, err := url.QueryUnescape(req.Input)
		if err != nil {
			output = "解码错误"
		} else {
			output = s
		}
	} else {
		output = url.QueryEscape(req.Input)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"output": output})
}
```

- [ ] **Step 5: 实现 UUID 生成 (server/tools/uuid.go)**

```go
package tools

import (
	"encoding/json"
	"net/http"

	"github.com/google/uuid"
)

func HandleUUID(w http.ResponseWriter, r *http.Request) {
	id := uuid.New().String()
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"uuid": id})
}
```

- [ ] **Step 6: 实现时间戳转换 (server/tools/timestamp.go)**

```go
package tools

import (
	"encoding/json"
	"net/http"
	"time"
)

func HandleTimestamp(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Timestamp int64 `json:"timestamp"`
		To        string `json:"to"` // "date" or "unix"
	}
	json.NewDecoder(r.Body).Decode(&req)

	var output string
	if req.To == "unix" {
		output = time.Now().Format("2006-01-02 15:04:05")
	} else {
		t := time.Unix(req.Timestamp, 0)
		output = t.Format("2006-01-02 15:04:05")
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"output": output})
}
```

- [ ] **Step 7: 实现颜色转换 (server/tools/color.go)**

```go
package tools

import (
	"encoding/json"
	"net/http"
	"regexp"
	"strconv"
)

func HandleColor(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Input string `json:"input"`
		From  string `json:"from"` // "hex" or "rgb"
		To    string `json:"to"`
	}
	json.NewDecoder(r.Body).Decode(&req)

	var output string
	if req.From == "hex" && req.To == "rgb" {
		hex := req.Input
		if hex[0] == '#' {
			hex = hex[1:]
		}
		r := strconv.ParseInt(hex[0:2], 16, 64)
		g := strconv.ParseInt(hex[2:4], 16, 64)
		b := strconv.ParseInt(hex[4:6], 16, 64)
		output = "rgb(" + strconv.FormatInt(r, 10) + ", " + strconv.FormatInt(g, 10) + ", " + strconv.FormatInt(b, 10) + ")"
	} else {
		re := regexp.MustCompile(`rgb\((\d+),\s*(\d+),\s*(\d+)\)`)
		matches := re.FindStringSubmatch(req.Input)
		if len(matches) == 4 {
			r, _ := strconv.ParseInt(matches[1], 10, 64)
			g, _ := strconv.ParseInt(matches[2], 10, 64)
			b, _ := strconv.ParseInt(matches[3], 10, 64)
			output = "#" + strconv.FormatInt(r, 16) + strconv.FormatInt(g, 16) + strconv.FormatInt(b, 16)
		} else {
			output = "格式错误"
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"output": output})
}
```

- [ ] **Step 8: 更新 main.go 注册工具路由**

```go
import (
	"toolhub/tools"
)

// 在 main() 中替换路由注册：
mux.HandleFunc("/api/format/json", tools.HandleJSON)
mux.HandleFunc("/api/encode/base64", tools.HandleBase64)
mux.HandleFunc("/api/encode/url", tools.HandleURL)
mux.HandleFunc("/api/generate/uuid", tools.HandleUUID)
mux.HandleFunc("/api/convert/timestamp", tools.HandleTimestamp)
mux.HandleFunc("/api/convert/color", tools.HandleColor)
```

- [ ] **Step 9: 提交**

```bash
git add server/main.go server/tools/
git commit -m "feat: implement all tool APIs"
```

---

### Task 3: 初始化 React 前端项目

**Files:**
- Create: `web/package.json`
- Create: `web/tsconfig.json`
- Create: `web/vite.config.ts`
- Create: `web/src/main.tsx`
- Create: `web/src/App.tsx`

- [ ] **Step 1: 创建 package.json**

```json
{
  "name": "toolhub-web",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.22.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@vitejs/plugin-react": "^4.2.0",
    "typescript": "^5.3.0",
    "vite": "^5.1.0"
  }
}
```

- [ ] **Step 2: 创建 tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"]
}
```

- [ ] **Step 3: 创建 vite.config.ts**

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': 'http://localhost:8080'
    }
  }
})
```

- [ ] **Step 4: 创建 src/main.tsx**

```tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
```

- [ ] **Step 5: 创建 src/App.tsx (带路由)**

```tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Header from './components/Header'
import Home from './pages/Home'
import JsonFormatter from './pages/JsonFormatter'
import Base64 from './pages/Base64'
import UrlEncoder from './pages/UrlEncoder'
import UuidGenerator from './pages/UuidGenerator'
import TimestampConverter from './pages/TimestampConverter'
import ColorConverter from './pages/ColorConverter'

function App() {
  return (
    <BrowserRouter>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/tools/json-formatter" element={<JsonFormatter />} />
        <Route path="/tools/base64" element={<Base64 />} />
        <Route path="/tools/url-encoder" element={<UrlEncoder />} />
        <Route path="/tools/uuid-generator" element={<UuidGenerator />} />
        <Route path="/tools/timestamp-converter" element={<TimestampConverter />} />
        <Route path="/tools/color-converter" element={<ColorConverter />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
```

- [ ] **Step 6: 创建 index.html 占位**

```html
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>ToolHub</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 7: 提交**

```bash
git add web/package.json web/tsconfig.json web/vite.config.ts web/index.html web/src/
git commit -m "chore: init React frontend project"
```

---

### Task 4: 实现 React 公共组件

**Files:**
- Create: `web/src/components/Header.tsx`
- Create: `web/src/components/ToolCard.tsx`
- Create: `web/src/components/ToolLayout.tsx`

- [ ] **Step 1: 实现 Header.tsx**

```tsx
import { Link } from 'react-router-dom'

export default function Header() {
  return (
    <header style={{ padding: '20px', borderBottom: '1px solid #eee' }}>
      <Link to="/" style={{ fontSize: '24px', fontWeight: 'bold', textDecoration: 'none', color: '#333' }}>
        ToolHub
      </Link>
    </header>
  )
}
```

- [ ] **Step 2: 实现 ToolCard.tsx**

```tsx
import { Link } from 'react-router-dom'

interface ToolCardProps {
  id: string
  name: string
  description: string
}

export default function ToolCard({ id, name, description }: ToolCardProps) {
  return (
    <Link to={`/tools/${id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
      <div style={{
        padding: '24px',
        border: '1px solid #eee',
        borderRadius: '8px',
        cursor: 'pointer',
      }}>
        <h3 style={{ margin: '0 0 8px 0' }}>{name}</h3>
        <p style={{ margin: 0, color: '#666' }}>{description}</p>
      </div>
    </Link>
  )
}
```

- [ ] **Step 3: 实现 ToolLayout.tsx**

```tsx
import { ReactNode } from 'react'

interface ToolLayoutProps {
  title: string
  description: string
  children: ReactNode
}

export default function ToolLayout({ title, description, children }: ToolLayoutProps) {
  return (
    <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '8px' }}>{title}</h1>
      <p style={{ color: '#666', marginBottom: '32px' }}>{description}</p>
      {children}
    </div>
  )
}
```

- [ ] **Step 4: 提交**

```bash
git add web/src/components/
git commit -m "feat: implement Header, ToolCard, ToolLayout components"
```

---

### Task 5: 实现 React 页面

**Files:**
- Create: `web/src/pages/Home.tsx`
- Create: `web/src/pages/JsonFormatter.tsx`
- Create: `web/src/pages/Base64.tsx`
- Create: `web/src/pages/UrlEncoder.tsx`
- Create: `web/src/pages/UuidGenerator.tsx`
- Create: `web/src/pages/TimestampConverter.tsx`
- Create: `web/src/pages/ColorConverter.tsx`

- [ ] **Step 1: 实现 Home.tsx**

```tsx
import { useState, useEffect } from 'react'
import ToolCard from '../components/ToolCard'

interface Tool {
  id: string
  name: string
  category: string
}

const categoryMap: Record<string, string> = {
  encoder: '编解码',
  generator: '生成器',
  converter: '转换器',
}

export default function Home() {
  const [tools, setTools] = useState<Tool[]>([])
  const [filter, setFilter] = useState<string>('all')
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetch('/api/tools')
      .then(res => res.json())
      .then(setTools)
  }, [])

  const filtered = tools.filter(tool => {
    const matchCategory = filter === 'all' || tool.category === filter
    const matchSearch = tool.name.includes(search)
    return matchCategory && matchSearch
  })

  return (
    <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
      <input
        type="text"
        placeholder="搜索工具..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        style={{ width: '100%', padding: '12px', marginBottom: '24px', border: '1px solid #eee', borderRadius: '8px' }}
      />
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        {['all', 'encoder', 'generator', 'converter'].map(cat => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            style={{
              padding: '8px 16px',
              border: filter === cat ? '1px solid #333' : '1px solid #eee',
              borderRadius: '8px',
              background: filter === cat ? '#333' : '#fff',
              color: filter === cat ? '#fff' : '#333',
              cursor: 'pointer',
            }}
          >
            {cat === 'all' ? '全部' : categoryMap[cat]}
          </button>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
        {filtered.map(tool => (
          <ToolCard key={tool.id} id={tool.id} name={tool.name} description={categoryMap[tool.category]} />
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: 实现 JsonFormatter.tsx**

```tsx
import { useState } from 'react'
import ToolLayout from '../components/ToolLayout'

export default function JsonFormatter() {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')

  const handleFormat = async () => {
    const res = await fetch('/api/format/json', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input }),
    })
    const data = await res.json()
    setOutput(data.output)
  }

  return (
    <ToolLayout title="JSON 格式化" description="格式化 JSON 字符串，方便阅读和调试">
      <textarea
        value={input}
        onChange={e => setInput(e.target.value)}
        placeholder="输入 JSON..."
        style={{ width: '100%', height: '120px', padding: '12px', border: '1px solid #eee', borderRadius: '8px', marginBottom: '16px', fontFamily: 'monospace' }}
      />
      <button onClick={handleFormat} style={{ padding: '12px 24px', background: '#333', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', marginBottom: '16px' }}>
        格式化
      </button>
      <textarea
        value={output}
        readOnly
        placeholder="输出结果..."
        style={{ width: '100%', height: '120px', padding: '12px', border: '1px solid #eee', borderRadius: '8px', fontFamily: 'monospace', background: '#f9f9f9' }}
      />
    </ToolLayout>
  )
}
```

- [ ] **Step 3: 实现 Base64.tsx**

```tsx
import { useState } from 'react'
import ToolLayout from '../components/ToolLayout'

export default function Base64() {
  const [input, setInput] = useState('')
  const [action, setAction] = useState('encode')
  const [output, setOutput] = useState('')

  const handleConvert = async () => {
    const res = await fetch('/api/encode/base64', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input, action }),
    })
    const data = await res.json()
    setOutput(data.output)
  }

  return (
    <ToolLayout title="Base64 编解码" description="对字符串进行 Base64 编码或解码">
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <button onClick={() => setAction('encode')} style={{ padding: '8px 16px', background: action === 'encode' ? '#333' : '#fff', color: action === 'encode' ? '#fff' : '#333', border: '1px solid #eee', borderRadius: '8px', cursor: 'pointer' }}>编码</button>
        <button onClick={() => setAction('decode')} style={{ padding: '8px 16px', background: action === 'decode' ? '#333' : '#fff', color: action === 'decode' ? '#fff' : '#333', border: '1px solid #eee', borderRadius: '8px', cursor: 'pointer' }}>解码</button>
      </div>
      <textarea value={input} onChange={e => setInput(e.target.value)} placeholder="输入..." style={{ width: '100%', height: '100px', padding: '12px', border: '1px solid #eee', borderRadius: '8px', marginBottom: '16px', fontFamily: 'monospace' }} />
      <button onClick={handleConvert} style={{ padding: '12px 24px', background: '#333', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', marginBottom: '16px' }}>转换</button>
      <textarea value={output} readOnly placeholder="输出..." style={{ width: '100%', height: '100px', padding: '12px', border: '1px solid #eee', borderRadius: '8px', fontFamily: 'monospace', background: '#f9f9f9' }} />
    </ToolLayout>
  )
}
```

- [ ] **Step 4: 实现 UrlEncoder.tsx**

```tsx
import { useState } from 'react'
import ToolLayout from '../components/ToolLayout'

export default function UrlEncoder() {
  const [input, setInput] = useState('')
  const [action, setAction] = useState('encode')
  const [output, setOutput] = useState('')

  const handleConvert = async () => {
    const res = await fetch('/api/encode/url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input, action }),
    })
    const data = await res.json()
    setOutput(data.output)
  }

  return (
    <ToolLayout title="URL 编解码" description="对 URL 进行编码或解码">
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <button onClick={() => setAction('encode')} style={{ padding: '8px 16px', background: action === 'encode' ? '#333' : '#fff', color: action === 'encode' ? '#fff' : '#333', border: '1px solid #eee', borderRadius: '8px', cursor: 'pointer' }}>编码</button>
        <button onClick={() => setAction('decode')} style={{ padding: '8px 16px', background: action === 'decode' ? '#333' : '#fff', color: action === 'decode' ? '#fff' : '#333', border: '1px solid #eee', borderRadius: '8px', cursor: 'pointer' }}>解码</button>
      </div>
      <textarea value={input} onChange={e => setInput(e.target.value)} placeholder="输入 URL..." style={{ width: '100%', height: '100px', padding: '12px', border: '1px solid #eee', borderRadius: '8px', marginBottom: '16px', fontFamily: 'monospace' }} />
      <button onClick={handleConvert} style={{ padding: '12px 24px', background: '#333', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', marginBottom: '16px' }}>转换</button>
      <textarea value={output} readOnly placeholder="输出..." style={{ width: '100%', height: '100px', padding: '12px', border: '1px solid #eee', borderRadius: '8px', fontFamily: 'monospace', background: '#f9f9f9' }} />
    </ToolLayout>
  )
}
```

- [ ] **Step 5: 实现 UuidGenerator.tsx**

```tsx
import { useState } from 'react'
import ToolLayout from '../components/ToolLayout'

export default function UuidGenerator() {
  const [uuid, setUuid] = useState('')

  const handleGenerate = async () => {
    const res = await fetch('/api/generate/uuid', { method: 'POST' })
    const data = await res.json()
    setUuid(data.uuid)
  }

  return (
    <ToolLayout title="UUID 生成" description="生成随机 UUID">
      <button onClick={handleGenerate} style={{ padding: '12px 24px', background: '#333', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', marginBottom: '16px' }}>
        生成 UUID
      </button>
      <div style={{ padding: '16px', background: '#f9f9f9', borderRadius: '8px', fontFamily: 'monospace', fontSize: '16px' }}>
        {uuid || '点击按钮生成'}
      </div>
    </ToolLayout>
  )
}
```

- [ ] **Step 6: 实现 TimestampConverter.tsx**

```tsx
import { useState } from 'react'
import ToolLayout from '../components/ToolLayout'

export default function TimestampConverter() {
  const [timestamp, setTimestamp] = useState('')
  const [output, setOutput] = useState('')

  const handleConvert = async () => {
    const res = await fetch('/api/convert/timestamp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ timestamp: parseInt(timestamp), to: 'date' }),
    })
    const data = await res.json()
    setOutput(data.output)
  }

  return (
    <ToolLayout title="时间戳转换" description="转换时间戳为可读日期格式">
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <input
          type="number"
          value={timestamp}
          onChange={e => setTimestamp(e.target.value)}
          placeholder="输入时间戳..."
          style={{ flex: 1, padding: '12px', border: '1px solid #eee', borderRadius: '8px', fontFamily: 'monospace' }}
        />
        <button onClick={handleConvert} style={{ padding: '12px 24px', background: '#333', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
          转换
        </button>
      </div>
      <div style={{ padding: '16px', background: '#f9f9f9', borderRadius: '8px', fontFamily: 'monospace' }}>
        {output || '结果'}
      </div>
    </ToolLayout>
  )
}
```

- [ ] **Step 7: 实现 ColorConverter.tsx**

```tsx
import { useState } from 'react'
import ToolLayout from '../components/ToolLayout'

export default function ColorConverter() {
  const [input, setInput] = useState('')
  const [from, setFrom] = useState('hex')
  const [output, setOutput] = useState('')

  const handleConvert = async () => {
    const res = await fetch('/api/convert/color', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input, from, to: from === 'hex' ? 'rgb' : 'hex' }),
    })
    const data = await res.json()
    setOutput(data.output)
  }

  return (
    <ToolLayout title="颜色转换" description="HEX 与 RGB 颜色格式互转">
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <button onClick={() => setFrom('hex')} style={{ padding: '8px 16px', background: from === 'hex' ? '#333' : '#fff', color: from === 'hex' ? '#fff' : '#333', border: '1px solid #eee', borderRadius: '8px', cursor: 'pointer' }}>HEX → RGB</button>
        <button onClick={() => setFrom('rgb')} style={{ padding: '8px 16px', background: from === 'rgb' ? '#333' : '#fff', color: from === 'rgb' ? '#fff' : '#333', border: '1px solid #eee', borderRadius: '8px', cursor: 'pointer' }}>RGB → HEX</button>
      </div>
      <input
        type="text"
        value={input}
        onChange={e => setInput(e.target.value)}
        placeholder={from === 'hex' ? '#ffffff' : 'rgb(255, 255, 255)'}
        style={{ width: '100%', padding: '12px', border: '1px solid #eee', borderRadius: '8px', marginBottom: '16px', fontFamily: 'monospace' }}
      />
      <button onClick={handleConvert} style={{ padding: '12px 24px', background: '#333', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', marginBottom: '16px' }}>转换</button>
      <div style={{ padding: '16px', background: '#f9f9f9', borderRadius: '8px', fontFamily: 'monospace' }}>
        {output || '结果'}
      </div>
    </ToolLayout>
  )
}
```

- [ ] **Step 8: 提交**

```bash
git add web/src/pages/
git commit -m "feat: implement all tool pages"
```

---

### Task 6: 创建 Docker 部署文件

**Files:**
- Create: `Dockerfile.server`
- Create: `Dockerfile.web`
- Create: `docker-compose.yml`

- [ ] **Step 1: 创建 Dockerfile.server**

```dockerfile
FROM golang:1.22-alpine
WORKDIR /app
COPY server/ .
RUN go mod download
RUN go build -o server .
EXPOSE 8080
CMD ["./server"]
```

- [ ] **Step 2: 创建 Dockerfile.web**

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY web/package.json web/tsconfig.json web/vite.config.ts ./
COPY web/src ./src
COPY web/index.html ./
RUN npm install && npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
RUN npm install -g serve
EXPOSE 3000
CMD ["serve", "dist", "-p", "3000"]
```

- [ ] **Step 3: 创建 docker-compose.yml**

```yaml
version: '3.8'
services:
  web:
    build:
      context: .
      dockerfile: Dockerfile.web
    ports:
      - "3000:3000"
  api:
    build:
      context: .
      dockerfile: Dockerfile.server
    ports:
      - "8080:8080"
```

- [ ] **Step 4: 提交**

```bash
git add Dockerfile.server Dockerfile.web docker-compose.yml
git commit -m "chore: add Docker deployment files"
```

---

## 验收标准自检

- [ ] 首页展示 6 个工具卡片，支持分类过滤
- [ ] 搜索框可搜索工具名称
- [ ] 每个工具页面 URL 唯一且可分享
- [ ] 所有工具功能正常运行
- [ ] Docker Compose 一键部署成功
- [ ] 前后端独立容器，端口清晰

---

**Plan complete and saved to `docs/superpowers/plans/2026-04-28-toolhub-plan.md`. Two execution options:**

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**