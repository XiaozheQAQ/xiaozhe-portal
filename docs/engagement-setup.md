# 文章互动配置说明（浏览量 / 点赞 / 评论）

本文档说明如何为 Xiaozhe Portal 启用两项需要外部服务的功能：

| 功能 | 依赖服务 | 需要配置的变量 | 当前状态（2026-10-09 核实） |
| --- | --- | --- | --- |
| 文章浏览量 | Upstash Redis（REST） | `UPSTASH_REDIS_REST_URL`、`UPSTASH_REDIS_REST_TOKEN` | **未配置**：线上不渲染计数器；本地开发用进程内计数并在悬停时标注 |
| 文章点赞 | GitHub Reactions（由 giscus 处理） | 与「文章评论」同一套 giscus 配置 | **已配置**，点赞量随评论区一起加载 |
| 文章评论 | giscus + GitHub Discussions | `PUBLIC_GISCUS_REPO`、`PUBLIC_GISCUS_REPO_ID`、`PUBLIC_GISCUS_CATEGORY`、`PUBLIC_GISCUS_CATEGORY_ID` | **已配置**，评论区正常加载 |

未配置时项目**照常构建、照常运行**：页面不渲染任何计数，也不会留下占位符或错误提示。开发环境改用进程内计数（响应里带 `ephemeral: true`，悬停可看到说明），部署环境没有这一兜底——任何情况下都不会伪造数字。

---

## 一、文章浏览量（Upstash Redis）

浏览量保存在 Upstash Redis 中，通过 REST 访问，服务端路由为
`src/routes/api/articles/[slug]/engagement/+server.ts`。

> 点赞**不走**这里：一次点赞就是文章 GitHub Discussion 上的一个 GitHub Reaction，
> 必须登录 GitHub，由 giscus 完成（见下节）。因此接口只接受 `{"action":"view"}`，
> 传 `like` / `unlike` 会返回 `400 invalid_action`。

### 1. 创建 Upstash Redis 实例

1. 打开 <https://console.upstash.com> 并登录。
2. **Create Database**：Region 选离 Vercel 部署区域最近的一个，类型保持默认（Regional / 免费额度足够个人站点使用）。
3. 进入数据库详情页，找到 **REST API** 区块，复制：
   - `UPSTASH_REDIS_REST_URL`（形如 `https://xxx-12345.upstash.io`）
   - `UPSTASH_REDIS_REST_TOKEN`（一长串令牌，仅服务端使用）

### 2. 本地配置

```bash
cp .env.example .env
```

在 `.env` 中填写：

```
UPSTASH_REDIS_REST_URL=https://xxx-12345.upstash.io
UPSTASH_REDIS_REST_TOKEN=********
```

`.env` 已被 `.gitignore` 忽略；请勿提交真实令牌。

> **Windows 提示**：用 PowerShell 的 `Set-Content -Encoding utf8` / `Out-File` 写 `.env` 会带上 UTF-8 BOM，Vite 解析时第一行的键名会变成 `\uFEFFUPSTASH_...`，表现为"只读到了第二个变量"。请用无 BOM 的方式写：
>
> ```powershell
> [System.IO.File]::WriteAllText((Resolve-Path .env), "UPSTASH_REDIS_REST_URL=...`nUPSTASH_REDIS_REST_TOKEN=...`n", (New-Object System.Text.UTF8Encoding($false)))
> ```

### 3. 配置 Vercel

Vercel 控制台 → 项目 → **Settings → Environment Variables**，分别添加：

| Name | Value | Environments |
| --- | --- | --- |
| `UPSTASH_REDIS_REST_URL` | 第 1 步的 URL | Production、Preview、（可选）Development |
| `UPSTASH_REDIS_REST_TOKEN` | 第 1 步的 Token | Production、Preview、（可选）Development |

保存后需要 **Redeploy** 才会生效。Production 与 Preview 建议使用**不同的数据库**，避免预览流量污染正式统计。

> Preview 与 Production 共用同一个数据库也可以，但两个环境的浏览会互相累加。

### 4. 验证

本地启动开发服务器后：

```bash
# 部署环境未配置：HTTP 200 + {"available":false,"reason":"unconfigured"}
curl -i http://localhost:5173/api/articles/why-personal-portal/engagement

# 已配置：HTTP 200 + {"available":true,"slug":"...","ephemeral":false,"views":0}
curl -i http://localhost:5173/api/articles/why-personal-portal/engagement

# 未配置但处于开发环境：{"available":true,"ephemeral":true,"views":1}（进程内计数）
curl -i http://localhost:5173/api/articles/why-personal-portal/engagement

# 登记一次浏览（同一 Cookie 访客 6 小时内只计一次）
curl -i -X POST http://localhost:5173/api/articles/why-personal-portal/engagement \
  -H 'content-type: application/json' -d '{"action":"view"}'
```

在 Upstash 控制台的 Data Browser 中应能看到这些键：

```
xz:v1:article:<slug>:views      # 字符串计数器
xz:v1:article:<slug>:view:<vid> # 浏览去重键，TTL 6 小时
xz:v1:rate:<vid>                # 限流计数，TTL 60 秒
```

### 5. 接口约定

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| `GET` | `/api/articles/:slug/engagement` | 读取 `views`，不计浏览 |
| `POST` | `/api/articles/:slug/engagement` | `{"action":"view"}` 登记浏览；其他 action 一律 `400` |

- slug 必须是真实存在的已发布文章，否则返回 `404`；`hasArticle` 会拿 `getPost(slug)` 做校验，客户端无法构造任意 key。
- 浏览去重：`SET NX EX 21600`，同一访客 6 小时内每篇文章只计一次；刷新、客户端导航重复进入都不会重复累加。
- 匿名点赞不受支持：所有点赞都发生在 giscus 内（GitHub Reaction），没有第二套计数。
- 访客标识：服务端下发的 `xz_visitor` httpOnly Cookie（`crypto.randomUUID()`），**不是 IP、不是浏览器指纹**，也不长期保存 IP。
- 限流：按访客 60 次 / 分钟（`xz:v1:rate:*`），超出返回 `429`。
- 响应头 `cache-control: no-store`，因为数据与访客相关。
- 令牌只在服务端通过 `$app/env/private` 读取（在 `src/env.ts` 中声明为私有、非静态变量），永远不会进入浏览器包。
- 所有环境变量都在 `src/env.ts` 里用 `defineEnvVars` 声明，schema 会把「未设置」转成空字符串，因此**没有任何配置时项目依旧可以正常构建和运行**。

### 6. 状态语义

| 情况 | HTTP | 响应体 | 前端表现 |
| --- | --- | --- | --- |
| 未配置（部署环境） | `GET` 200 / `POST` 503 | `{"available":false,"reason":"unconfigured"}` | 不渲染任何东西 |
| 未配置（开发环境） | `200` | `{"available":true,"ephemeral":true,"views":n}` | 正常显示数字，悬停标注「开发环境本地计数」 |
| 存储不可用 | `502` | `{"available":false,"reason":"store_error"}` | 不渲染任何东西 |
| slug 不存在 | `404` | `{"error":"unknown_article"}` | 不渲染任何东西 |
| 触发限流 | `429` | `{"error":"rate_limited"}` | 不渲染任何东西 |

### 7. 为什么未配置时什么都不显示

取数组件（[`ArticleEngagement.svelte`](../src/lib/components/common/ArticleEngagement.svelte)）只在拿到**真实数字**时才渲染：

- 未配置、请求失败、被限流、slug 不存在 —— 一律不渲染：没有占位符、没有 loading 图标，也没有「统计暂不可用」这类错误行。作者信息行里多一行报错，比少一个数字更难看。
- 因此「页面上没有计数器」不区分原因；要排查请看接口响应（上一节的 `curl`）。

唯一的非持久化例外是**开发环境**：`import.meta.env.DEV` 为真且两个变量都没配时，
[`+server.ts`](../src/routes/api/articles/[slug]/engagement/+server.ts) 退回
[`memory.ts`](../src/lib/server/engagement/memory.ts) 的进程内存储，并在响应里带 `ephemeral: true`。
这样 `npm run dev` 下能看到真实计数（重启清零、只统计本进程收到的访问），
组件会把标题写成「浏览量 · 开发环境本地计数，未配置持久化存储」，不会让人误以为线上也在记。

> 部署环境**不会**退回进程内存储：Serverless 多实例不共享内存，同一个页面在不同实例上会得到不同数字，
> 那比不显示更容易误导。线上要数字，就必须完成第一节的配置。

---

## 二、文章评论（giscus + GitHub Discussions）

评论使用 [giscus](https://giscus.app)，数据存放在仓库的 GitHub Discussions 中，用户用 GitHub 账号登录即可发言。
**不需要**自建 OAuth，也不需要在浏览器里放任何密钥。

### 当前配置

仓库已启用 Discussions，giscus App 也已安装，下列取值来自 <https://giscus.app> 生成的嵌入片段，
以默认值形式写入 [`src/lib/config/comments.ts`](../src/lib/config/comments.ts)（可用同名环境变量覆盖）：

| 项 | 值 |
| --- | --- |
| 仓库 | `XiaozheQAQ/xiaozhe-portal`（public） |
| Repository ID | `R_kgDOVAl-3A`（与 GitHub REST API 的 `node_id` 一致） |
| `has_discussions` | `true` |
| Category | `General` |
| Category ID | `DIC_kwDOVAl-3M4DHaRM` |
| `data-strict` | `1`（见下方「评论隔离」） |

这些都是公开标识符，不是密钥。`repo` / `category` 若被环境变量换成别的仓库，代码会退回空值而不是错配 ID。

### 点赞量从哪来

文章大纲下方的「点赞」按钮**不自建计数**：一次点赞就是该文章 Discussion 上的一个 GitHub Reaction，
**必须登录 GitHub**，由 giscus 自己完成。页面只负责显示 giscus 上报的数字：

- giscus 在 `data-emit-metadata="1"` 且 Discussion 存在时，会向父页面 postMessage 一份 `giscus.discussion`
  （即 `IMetadataMessage`）。其中 `reactionCount` 就是点赞量，`totalCommentCount + totalReplyCount` 就是评论数，
  由 `src/lib/comments/discussion-stats.ts` 接收并镜像给按钮。
- 因此 [`src/lib/config/comments.ts`](../src/lib/config/comments.ts) 里的 `emitMetadata` **不能改回 `'0'`**，
  否则按钮只显示文字、永远没有数字。
- Discussion 还不存在时（还没有人评论或点赞），giscus 会报 `Discussion not found` —— 这不是错误，
  此时两个数字是真实的 `0`。若 Discussion 已存在但页面还没滚动到评论区（iframe 是 `loading="lazy"`），
  按钮保持「未上报」状态，不会先用 `0` 冒充。

> 于是同一篇文章全站只有一套点赞机制（GitHub Reaction），浏览量则保持匿名，两者互不影响。

### 更换仓库时的参考步骤

当前无需执行；仅在换成另一个仓库时按顺序操作：

1. **启用 Discussions**
   仓库 → **Settings → General → Features → Discussions** 勾选启用。
2. **安装 giscus App**
   打开 <https://github.com/apps/giscus> → **Install** → 选择 `XiaozheQAQ/xiaozhe-portal`（只授权这一个仓库即可）。
3. **创建评论分类**
   仓库 → **Discussions → Categories**，建议新建一个分类，例如 `Comments`（类型选 Announcements 或 Open-ended discussion）。
4. **获取 Category ID**
   打开 <https://giscus.app/#repository=XiaozheQAQ/xiaozhe-portal>，在 *Repository* 填入仓库后：
   - *Discussion Category* 选择上一步的分类；
   - 页面下方 *Enable giscus* 会给出完整的 `<script>` 片段，其中 `data-repo-id` 与 `data-category-id` 就是需要的两个 ID。
5. **写入配置**（二选一）
   - 直接改 `src/lib/config/comments.ts` 里的 `category` / `categoryId`；或
   - 设置环境变量 `PUBLIC_GISCUS_CATEGORY` / `PUBLIC_GISCUS_CATEGORY_ID`（以及可选的 `PUBLIC_GISCUS_REPO` / `PUBLIC_GISCUS_REPO_ID`）。

   > 覆盖 `PUBLIC_GISCUS_REPO` 时请一并提供 `PUBLIC_GISCUS_REPO_ID`，否则默认 ID 会与新仓库不匹配（代码在这种情况下会退回空值，不会错配）。

### 评论隔离

`mapping` 固定为 `pathname` 且 `strict=1`，因此 `/blog/a` 与 `/blog/b` 是两条独立讨论，不会共用串。

### 已实现的行为

- 中文界面用 `data-lang=zh-CN`，切换站点语言会重新加载评论区。
- 跟随站点深浅色：首次加载按 `html.dark` 决定 `data-theme`，之后用 `MutationObserver` + `postMessage` 同步切换。
- **懒加载**：giscus 的 iframe 带 `loading="lazy"`，只有滚动到评论区附近才开始请求。所以「正在加载评论…」会一直显示到你滚下去，这是浏览器行为，不是故障。
- **「Discussion not found」不是错误**：文章还没人评论过时 giscus 会发这条提示，它自己的客户端也只当警告处理（*A new discussion will be created if a comment/reaction is submitted.*）。组件把它视为就绪；只有真正的错误才显示「评论加载失败」+ 重试按钮。
- 只有在脚本被拦截、或 15 秒内根本没有生成 iframe 时才判定失败，**不会影响文章本身**。
- 未配置时显示明确的待配置说明与 giscus 配置页链接。

---

## 三、相关文件

| 文件 | 作用 |
| --- | --- |
| `src/lib/server/engagement/types.ts` | 存储接口定义 |
| `src/lib/server/engagement/service.ts` | 统计业务逻辑（浏览去重、限流、slug 校验） |
| `src/lib/server/engagement/upstash.ts` | Upstash Redis REST 适配器（零依赖） |
| `src/routes/api/articles/[slug]/engagement/+server.ts` | API 路由与访客 Cookie |
| `src/lib/components/common/ArticleEngagement.svelte` | 浏览量 UI |
| `src/lib/components/common/ArticleActions.svelte` | 大纲下方的「跳转到评论 + 点赞量」按钮 |
| `src/lib/comments/discussion-stats.ts` | giscus 上报的点赞量 / 评论数（只读镜像） |
| `src/lib/config/comments.ts` | giscus 配置（唯一修改点） |
| `src/lib/components/common/GiscusComments.svelte` | 评论区组件 |

## 四、测试

```bash
npm run test:engagement   # 接口与并发/去重逻辑（内存存储替身）
npm run test:content      # 字数与阅读时长
npm run check
npm run build
```
