# Xiaozhe Portal

[English](README.md) | **简体中文**

Xiaozhe（[@XiaozheQAQ](https://github.com/XiaozheQAQ)）的个人技术门户——文章写作、项目展示、实时状态页，以及 maimai DX 成绩档案。内容以 Markdown 驱动，在构建期全量内联；不依赖任何 CMS、数据库或外部内容源。

基于 **SvelteKit 3 + Svelte 5 + TypeScript + Tailwind CSS 4** 构建。默认部署到 **Vercel**，同时支持 **腾讯 EdgeOne Makers** 作为可选的第二目标。

- 规范域名（canonical）：`https://xiaozhe.dev`
- 源码：<https://github.com/XiaozheQAQ/xiaozhe-portal>

## 功能特性

- **博客** — Markdown 文章，支持代码高亮、行号与行高亮、一键复制、脚注、标注块（callout）、图片尺寸标注、阅读时长/字数统计，以及带锚点的文章目录。
- **实验室（Lab）** — 以紧凑卡片展示 GitHub / 应用 / 软件类项目（`repository` / `app` / `software` 链接类型），分为「维护中」与「开发中」两组，点击在新标签页打开。
- **状态页** — 课程表与作息（上海时区）、同源站点健康探测，以及 maimai DX 档案（个人资料、Best 50、Rating 曲线、最近游玩）。
- **文章互动** — 匿名浏览量（Upstash Redis，同一访客 6 小时内只计一次、每分钟 60 次限流），以及 giscus 评论与点赞数。
- **主题** — 明/暗/跟随系统三态主题、16 种 OKLCh 强调色（可读色对比度 ≥ 4.5:1），切换时带 View Transitions 圆形擦除动效，并对「减少动态效果」偏好降级。
- **i18n** — 完整的中英双语字典。
- **SEO 与 PWA** — canonical、Open Graph / Twitter 卡片、JSON-LD、RSS、sitemap、robots.txt，以及可离线运行的 Service Worker。
- **页脚 Tips** — 每次访问随机展示一条作者提供的提示，其中包含一条实时本地时钟。

## 技术栈

| 领域 | 选择 |
| --- | --- |
| 框架 | SvelteKit **3.0.1**（精确锁定）+ Svelte 5（runes） |
| 语言 | TypeScript 6（strict） |
| 样式 | Tailwind CSS 4 + `src/app.css` 中的单文件设计系统 |
| 构建 | Vite 8 |
| 内容 | marked（自定义白名单 renderer）+ highlight.js + gray-matter + Zod |
| 适配器 | `@sveltejs/adapter-vercel`（默认）、`@edgeone/sveltekit`（经 `adapters/edgeone.js` 包装） |
| 测试 | `node --test`（9 个套件、112 个用例）+ `svelte-check` |

## 本地运行

需要 Node.js >= 22.17。

```bash
npm install
npm run dev
```

项目在**零配置**下即可构建和运行：所有环境变量缺失时回退为空字符串，相关功能会自行报告「不可用」，而不是伪造数据。

## 常用命令

| 命令 | 作用 |
| --- | --- |
| `npm run dev` | 启动开发服务器 |
| `npm run build` | 生产构建（Vercel 产物） |
| `npm run build:edgeone` | 构建腾讯 EdgeOne Makers 产物（`--mode edgeone`） |
| `npm run preview` | 预览生产构建 |
| `npm run check` | `svelte-kit sync` + `svelte-check`（必须 0 error） |
| `npm run test:<suite>` | 运行 9 个测试套件之一（见下） |

测试套件：`schedule`、`images`、`content`、`engagement`、`theme`、`accent`、`icons`、`maimai`、`seo`。没有聚合的 `npm test`，需逐个运行。任何改动后，`npm run check` 与全部 9 个套件都必须保持通过。

## 内容模型

Frontmatter 由 Zod 校验（`src/lib/content/schema.ts`）。加载器（`src/lib/content/loader.ts`）在构建期内联全部 Markdown 文件，并归一化为首页、列表页与详情页共用的模型。

- `src/content/blog/*.md` — 一个文件一篇文章；文件名即 URL slug。
- `src/lib/features/lab/projects.ts` — 在实验室、首页和搜索中展示的项目卡片。`url` 填目标地址，`linkType` 取 `repository`、`app` 或 `software`。已有可用版本的项目用 `maintenance`，尚未有成品版本的用 `development`。
- `src/content/{lab,projects}/*.md` — 仍在各自 `/lab/{slug}` 详情地址上提供的旧记录（`/projects` 会重定向到 `/lab`）。

## 目录结构

```
src/
  app.html               首屏主题/强调色引导脚本（首帧绘制前执行）
  app.css                单文件设计系统
  env.ts                 defineEnvVars：私有 + 公共环境变量，缺失即 ""
  service-worker.ts      PWA（预缓存外壳、页面 network-first、媒体缓存）
  content/               Markdown 内容源（blog / lab / projects）
  lib/
    content/             加载器、Zod schema、阅读统计、图片尺寸
    server/              engagement（Upstash）与 maimai（LXNS）服务端逻辑
    features/            blog / lab / maimai 组件
    components/          通用、布局与内容组件
    seo/meta.ts          canonical / OG / JSON-LD 的单一来源
    theme/               三态主题 + 16 色强调色调色板
    i18n/                中英双语字典
    status/schedule.ts   课程表与站点探测定义（数据硬编码）
  routes/
    (site)/              预渲染页面
    api/                 运行时 JSON 端点（engagement、maimai）
static/                  字体、图标、图片、manifest
tests/                   9 个 node:test 套件
adapters/edgeone.js      EdgeOne 适配器（官方适配器 + 2 处兼容补丁）
```

## 部署

| 平台 | 触发方式 | 说明 |
| --- | --- | --- |
| **Vercel**（默认） | `npm run build` | `@sveltejs/adapter-vercel`，运行时 `nodejs24.x` |
| **腾讯 EdgeOne Makers** | `npm run build:edgeone` | `adapters/edgeone.js` 产出 Build Output API v3 结构；`edgeone.json` 指定构建命令 |

## 环境变量

完整清单见 `.env.example`。全部可选——未设置的值会变为空字符串，对应功能自行报告不可用。

- `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` — **私有**，文章浏览量。生产环境未配置：不渲染计数；开发环境：退回进程内计数并标注为临时（ephemeral）。
- `LXNS_DEVELOPER_API_KEY` / `MAIMAI_FRIEND_CODE` — **私有**，maimai DX 档案。未配置：页面显示「数据待接入」，绝不显示假数据。
- `PUBLIC_GISCUS_REPO` / `_REPO_ID` / `_CATEGORY` / `_CATEGORY_ID` — 公共 giscus 标识（内置可用默认值，不配置也能显示评论区）。

私有变量在 `src/env.ts` 中声明，仅在 `src/routes/api/*/+server.ts` 中读取，永远不会进入浏览器。

## 内容真实性

本站应当读起来像一个真实的人在长期维护的技术空间。结构、排版与事实核对可以由 Agent 协助，但作者的身份、经历、项目故事与成就必须来自作者本人——绝不能编造。规则见 `CONTENT_AUTHORSHIP_AUDIT.md`，待作者提供的内容见 `CONTENT_TODO.md`。
