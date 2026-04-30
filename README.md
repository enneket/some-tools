# ToolHub - 开发者工具箱

在线开发者工具集合，提供 JSON 格式化、Base64 编解码、Hash 计算等常用工具。

## 功能列表

| 工具 | 说明 | 类型 |
|------|------|------|
| JSON 格式化 | 格式化、压缩、验证 JSON 数据 | API |
| Base64 编解码 | Base64 编码和解码 | API |
| URL 编解码 | URL 编码和解码 | API |
| UUID 生成 | 生成随机 UUID | API |
| 时间戳转换 | 时间戳与日期时间互转 | API |
| 颜色转换 | HEX 与 RGB 颜色值互转 | API |
| Hash 计算 | MD5/SHA1/SHA256/SHA512 摘要 | API |
| JWT 解析 | 解码 JWT Token | API |
| 密码生成器 | 生成安全随机密码 | API |
| 正则测试 | 测试正则表达式匹配 | 前端 |
| Markdown 预览 | 实时预览 Markdown 渲染 | 前端 |
| 文本对比 | 比较两段文本的差异 | 前端 |
| 二维码生成 | 文本或链接转二维码 | 前端 |

## 技术栈

- **前端**: React + TypeScript + Vite
- **后端**: Go (net/http)
- **部署**: Docker 单容器

## 快速开始

### Docker 部署

```bash
docker compose up -d
```

访问 http://localhost:5561

### 本地开发

**前端**

```bash
cd web
npm install
npm run dev
```

**后端**

```bash
cd server
go run main.go
```

## 项目结构

```
some-tools/
├── docker-compose.yml
├── Dockerfile
├── web/                  # React 前端
│   ├── src/
│   │   ├── components/   # 公共组件
│   │   └── pages/        # 工具页面
│   └── public/
└── server/               # Go 后端
    ├── main.go
    └── tools/            # API handlers
```

## API 接口

所有 API 均为 POST 请求，Content-Type: application/json。

| 端点 | 参数 | 说明 |
|------|------|------|
| `/api/format/json` | `{input}` | JSON 格式化 |
| `/api/encode/base64` | `{input, mode}` | Base64 编解码 |
| `/api/encode/url` | `{input, mode}` | URL 编解码 |
| `/api/generate/uuid` | `{count}` | 生成 UUID |
| `/api/convert/timestamp` | `{input, to}` | 时间戳转换 |
| `/api/convert/color` | `{input}` | 颜色转换 |
| `/api/hash` | `{input, alg}` | Hash 计算 |
| `/api/jwt/decode` | `{input}` | JWT 解析 |
| `/api/password/generate` | `{length, upper, digits, symbols}` | 密码生成 |

## License

MIT
