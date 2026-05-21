# 聚合工具站设计文档

> 日期：2026-04-28
> 状态：已批准

---

## 1. 项目概述

- **项目名称**：聚合工具站（ToolHub）
- **项目类型**：Web 应用，单 Docker 部署
- **核心功能**：聚合常用工具（开发/办公/生活），无数据存储
- **目标用户**：开发者、运营、产品、普通用户

---

## 2. 技术架构

### 2.1 架构模式

前后端完全分离，Go 后端 + React 前端分开容器部署，通过 Docker Compose 统一管理。

```
┌─────────────────────────────────────────────┐
│         Docker Compose                      │
│  ┌─────────────┐    ┌─────────────────┐    │
│  │  React SPA  │    │   Go HTTP API   │    │
│  │  (:3000)     │    │   (:8080)       │    │
│  └─────────────┘    └─────────────────┘    │
└─────────────────────────────────────────────┘
```

- React 前端：端口 3000
- Go 后端：端口 8080
- 无状态，不存储任何数据

### 2.2 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | React 18 + Vite + TypeScript |
| 后端 | Go 1.22 + net/http |
| 部署 | Docker + Docker Compose |

### 2.3 目录结构

```
project/
├── server/
│   ├── main.go           # 入口，HTTP 服务
│   ├── tools/             # 各工具 handler
│   │   ├── json.go
│   │   ├── base64.go
│   │   ├── url.go
│   │   ├── uuid.go
│   │   ├── timestamp.go
│   │   └── color.go
│   └── go.mod
├── web/
│   ├── src/
│   │   ├── pages/        # 各工具页面
│   │   │   ├── Home.tsx
│   │   │   ├── JsonFormatter.tsx
│   │   │   ├── Base64.tsx
│   │   │   ├── UrlEncoder.tsx
│   │   │   ├── UuidGenerator.tsx
│   │   │   ├── TimestampConverter.tsx
│   │   │   └── ColorConverter.tsx
│   │   ├── components/
│   │   │   ├── ToolCard.tsx
│   │   │   ├── ToolLayout.tsx
│   │   │   └── Header.tsx
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
├── Dockerfile.server
├── Dockerfile.web
└── docker-compose.yml
```

---

## 3. 功能设计

### 3.1 第一期工具（开发核心套件）

| 分类 | 工具 | 路由 |
|------|------|------|
| 编解码 | JSON 格式化 | `/tools/json-formatter` |
| 编解码 | Base64 编解码 | `/tools/base64` |
| 编解码 | URL 编解码 | `/tools/url-encoder` |
| 生成器 | UUID 生成 | `/tools/uuid-generator` |
| 生成器 | 时间戳转换 | `/tools/timestamp-converter` |
| 转换器 | 颜色转换 | `/tools/color-converter` |

### 3.2 首页设计

- 搜索框：支持工具名称搜索
- 分类标签：全部 / 编解码 / 生成器 / 转换器
- 工具卡片网格：图标 + 名称 + 简介
- 布局：极简，大量留白，黑白灰主色

### 3.3 工具页设计

- URL 变化：`/tools/:tool-id`
- 左侧：工具说明 + 使用示例
- 右侧：输入区 + 输出区 + 操作按钮
- 风格：极简，与首页一致

---

## 4. API 设计

### 4.1 工具列表

```
GET /api/tools
Response: [
  { "id": "json-formatter", "name": "JSON 格式化", "category": "encoder" },
  ...
]
```

### 4.2 工具详情

```
GET /api/tools/:id
Response: { "id": "...", "name": "...", "description": "...", "params": [...] }
```

### 4.3 工具 API

```
POST /api/format/json
Body: { "input": "{}" }
Response: { "output": "{ }" }

POST /api/encode/base64
Body: { "input": "hello", "action": "encode" }
Response: { "output": "aGVsbG8=" }

POST /api/encode/url
Body: { "input": "hello world", "action": "encode" }
Response: { "output": "hello%20world" }

POST /api/generate/uuid
Body: {}
Response: { "uuid": "xxxx-xxxx-xxxx" }

POST /api/convert/timestamp
Body: { "timestamp": 1714291200, "to": "date" }
Response: { "output": "2026-04-28 00:00:00" }

POST /api/convert/color
Body: { "input": "#ffffff", "from": "hex", "to": "rgb" }
Response: { "output": "rgb(255, 255, 255)" }
```

---

## 5. Docker 部署

### 5.1 Dockerfile.server

```dockerfile
FROM golang:1.22-alpine
WORKDIR /app
COPY server/ .
RUN go build -o server .
EXPOSE 8080
CMD ["./server"]
```

### 5.2 Dockerfile.web

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY web/ .
RUN npm install && npm run build
EXPOSE 3000
CMD ["npx", "serve", "dist", "-p", "3000"]
```

### 5.3 docker-compose.yml

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

---

## 6. 设计原则

- **极简风格**：大量留白，黑白灰主色，无多余装饰
- **模块化**：工具独立页面，URL 可分享
- **可扩展**：预留插件机制，后续新增工具不影响现有结构
- **无状态**：不存储任何数据，每次请求独立处理

---

## 7. 验收标准

- [ ] 首页展示 6 个工具卡片，支持分类过滤
- [ ] 搜索框可搜索工具名称
- [ ] 每个工具页面 URL 唯一且可分享
- [ ] 所有工具功能正常运行
- [ ] Docker Compose 一键部署成功
- [ ] 前后端独立容器，端口清晰