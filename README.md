# ToolHub - 开发者工具箱

在线开发者工具集合，提供 JSON 格式化、Base64 编解码、Hash 计算、SQL 格式化、AI 人像抠图等 26 种常用工具。首页支持拖拽排序、分类筛选和搜索。

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
| 二维码识别 | 上传二维码图片识别其中的内容 | 前端 |

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
npm ci        # 用 lockfile 锁定版本，与 Docker 构建保持一致
npm run dev
```

**后端**

```bash
cd server
go run main.go
```

前端开发服务器在 `3000` 端口，并把 `/api` 代理到 `http://api:8080`（见 `web/vite.config.ts`）。脱离 Docker 时需要把该地址改成本机后端地址，或直接访问后端的 8080 端口。

## 测试

```bash
cd server && go test ./...   # Go 后端
cd web && npm test           # 前端（vitest）
```

Go 侧覆盖 SQL 格式化、翻译、语种检测、颜色、时间戳，以及 JSON/Base64/URL/UUID/JWT/Hash/密码生成这几个接口。前端只覆盖纯函数（JSON 宽松解析、进制转换、Cron 匹配、文本对比），UI 组件目前没有测试。

## 项目结构

```
some-tools/
├── docker-compose.yml
├── Dockerfile               # 多阶段构建：前端 → Go → 单容器
├── web/                     # React 前端
│   ├── src/
│   │   ├── components/      # 公共组件 (Header, ToolCard, ToolLayout, JsonTree)
│   │   ├── data/tools.ts    # 工具清单：id / 名称 / 分类 / 组件，路由由它生成
│   │   ├── pages/           # 工具页面 (26 个工具)
│   │   └── utils/           # m3u8 解析下载、人像分割
│   └── public/models/       # MediaPipe 模型文件
└── server/                  # Go 后端
    ├── main.go              # 路由注册、请求体上限、优雅退出
    └── tools/               # API handlers (12 个接口)
```

## API 接口

除 `/api/translate/languages` 外，所有 API 均为 POST 请求，Content-Type: application/json。响应是 JSON，绝大多数接口为 `{"output": "..."}`（`/api/translate` 额外带 `detected`，`/api/jwt/decode` 的 `output` 是含 header/payload/signature 的对象）；出错时返回非 2xx 状态码与纯文本说明。

| 端点 | 参数 | 说明 |
|------|------|------|
| `/api/format/json` | `{input}` | JSON 格式化（前端未调用，JSON 工具在浏览器内完成） |
| `/api/encode/base64` | `{input, action}` | Base64 编解码，`action` 取 `encode` 或 `decode` |
| `/api/encode/url` | `{input, action}` | URL 编解码，`action` 取 `encode` 或 `decode` |
| `/api/generate/uuid` | 无 | 生成一个随机 UUID（v4） |
| `/api/convert/timestamp` | `{input, to, timezone}` | 时间戳转换，`to` 取 `date` 或 `timestamp`，`timezone` 为 IANA 时区名，留空用服务器本地时区 |
| `/api/convert/color` | `{input, from, to}` | 颜色转换，`from`/`to` 取 `hex` 或 `rgb`；rgb 分量必须在 0-255 |
| `/api/hash` | `{input, alg}` | Hash 计算，`alg` 取 `md5`/`sha1`/`sha256`/`sha512`/`all` |
| `/api/jwt/decode` | `{input}` | JWT 解析（仅解码，不校验签名） |
| `/api/password/generate` | `{length, upper, digits, symbols}` | 密码生成；`length` 缺省或非正数取 16，超过 128 按 128 截断 |
| `/api/format/sql` | `{sql}` 或 `{input}` | SQL 格式化，两者同时给出时以 `sql` 为准 |
| `/api/translate` | `{input, from, to}` | 文本翻译，`from` 传 `auto` 自动检测源语言，待翻译文本不超过 5000 字 |
| `/api/translate/languages` | 无（GET） | 返回支持的语言清单 |

## 翻译服务

`/api/translate` 依次尝试两个服务，第一个成功的即采用：

1. **Google 免费端点**（非官方）— 主服务，支持 `from=auto` 自动检测源语言
2. **MyMemory**（官方免费）— 主服务失败时降级使用

MyMemory 不接受 `Autodetect` 作为源语言，降级时会先在本地判断语种（先看文字系统，再看变音符号，最后统计虚词）。判断不出来时接口返回 502 并提示手动指定源语言，而不是猜一个。该服务单次请求上限为 500 字符，超长文本会自动按句号、标点、空格依次切分后分段翻译再拼接。

单次 `/api/translate` 请求的待翻译文本上限为 5000 字（按字符计），超出返回 400。降级路径每 450 字切一片且每片失败会重试一次，不设这个上限的话一个请求能放大成数千次上游请求，把本服务变成对第三方免费额度的放大器。

| 环境变量 | 默认值 | 说明 |
|---|---|---|
| `PORT` | `8080` | 服务端口 |
| `GOOGLE_TRANSLATE_ENDPOINT` | `https://translate.googleapis.com/translate_a/single` | 覆盖主服务地址，可指向自建代理 |

## License

MIT
