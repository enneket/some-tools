# ToolHub - 开发者工具箱

在线开发者工具集合，提供 JSON 格式化、Base64 编解码、Hash 计算、SQL 格式化、AI 人像抠图等 25 种常用工具。首页支持拖拽排序、分类筛选和搜索。

## 首页特性

- **拖拽排序**: 长按工具卡片拖动调整顺序，排序自动保存到 localStorage
- **分类筛选**: 按编解码、生成器、转换器、文本、媒体五大类筛选
- **搜索**: 实时搜索工具名称

## 全部工具视图

访问 `/all`（或点击 Header 右侧"全部工具"），所有工具按分类平铺展开在同一个长页面：

- 每个工具一个区块（标题 + 说明 + 功能主体），纵向依次排列
- 左侧固定锚点目录，点击平滑滚动到对应工具
- 工具内联渲染，不跳转路由，页面内直接使用

## 功能列表

### 编解码

| 工具 | 说明 | 类型 |
|------|------|------|
| JSON 格式化 | 格式化、压缩、验证 JSON 数据 | API |
| Base64 编解码 | Base64 编码和解码 | API |
| URL 编解码 | URL 编码和解码 | API |
| Hash 计算 | MD5/SHA1/SHA256/SHA512 摘要 | API |
| JWT 解析 | 解码 JWT Token | API |
| HTML 实体 | HTML 特殊字符编码和解码 | 前端 |
| Unicode 编解码 | Unicode 字符编码和解码 | 前端 |

### 生成器

| 工具 | 说明 | 类型 |
|------|------|------|
| UUID 生成 | 生成随机 UUID | API |
| 密码生成器 | 生成安全随机密码 | API |
| 二维码生成 | 文本或链接转二维码 | 前端 |
| 图片转 Base64 | 将图片转换为 Base64 编码 | 前端 |
| Base64 转图片 | 将 Base64 编码转换为图片显示 | 前端 |
| 人像抠图 | 使用 AI 模型将人像从背景中分割出来 | 前端 |

### 转换器

| 工具 | 说明 | 类型 |
|------|------|------|
| 时间戳转换 | 时间戳与日期时间互转 | API |
| 颜色转换 | HEX 与 RGB 颜色值互转 | API |
| 进制转换 | 二进制、八进制、十进制、十六进制互转 | 前端 |
| Cron 解析 | 解析 Cron 表达式，查看执行计划 | 前端 |

### 文本

| 工具 | 说明 | 类型 |
|------|------|------|
| SQL 格式化 | 规范化并格式化 SQL 语句 | API |
| 文本翻译 | 多语言互译，支持自动检测源语言 | API |
| 正则测试 | 测试正则表达式匹配 | 前端 |
| Markdown 预览 | 实时预览 Markdown 渲染 | 前端 |
| 文本对比 | 比较两段文本的差异 | 前端 |
| 字数统计 | 统计字符数、词数、行数、字节数 | 前端 |
| HTTP 状态码 | 快速查询 HTTP 状态码含义 | 前端 |

### 媒体

| 工具 | 说明 | 类型 |
|------|------|------|
| M3U8 下载 | 下载 M3U8 视频流并合并为 MP4 | 前端 |

## 技术栈

- **前端**: React + TypeScript + Vite
- **AI 能力**: MediaPipe (人像抠图)
- **后端**: Go (net/http)
- **部署**: Docker 多阶段构建的单容器

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
│   │   ├── components/   # 公共组件 (Header, ToolCard, ToolLayout)
│   │   └── pages/        # 工具页面 (25 个工具)
│   └── public/
└── server/               # Go 后端
    ├── main.go
    └── tools/            # API handlers (12 个接口)
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
| `/api/convert/color` | `{input, from, to}` | 颜色转换（`from`/`to` 取 `hex` 或 `rgb`） |
| `/api/hash` | `{input, alg}` | Hash 计算 |
| `/api/jwt/decode` | `{input}` | JWT 解析 |
| `/api/password/generate` | `{length, upper, digits, symbols}` | 密码生成 |
| `/api/format/sql` | `{input}` | SQL 格式化 |
| `/api/translate` | `{input, from, to}` | 文本翻译（`from` 传 `auto` 自动检测源语言） |
| `/api/translate/languages` | 无（GET） | 返回支持的语言清单 |

## 翻译服务

`/api/translate` 依次尝试两个服务，第一个成功的即采用：

1. **Google 免费端点**（非官方）— 主服务，支持 `from=auto` 自动检测源语言
2. **MyMemory**（官方免费）— 主服务失败时降级使用

MyMemory 不接受 `Autodetect` 作为源语言，降级时会先在本地判断语种（先看文字系统，再看变音符号，最后统计虚词）。判断不出来时接口返回 502 并提示手动指定源语言，而不是猜一个。该服务单次请求上限为 500 字符，超长文本会自动按句号、标点、空格依次切分后分段翻译再拼接。

| 环境变量 | 默认值 | 说明 |
|---|---|---|
| `PORT` | `8080` | 服务端口 |
| `GOOGLE_TRANSLATE_ENDPOINT` | `https://translate.googleapis.com/translate_a/single` | 覆盖主服务地址，可指向自建代理 |

## License

MIT
