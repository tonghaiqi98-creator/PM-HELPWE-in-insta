# 资源适配工作台

飞书内的 APP 换图需求结构化工作台：模板化建需求 → 一键提单（设计 + 飞书项目）→ 看板跟踪 → 飞书提醒。

---

## 先读这些

| 文件 | 作用 |
| --- | --- |
| [`PRD.md`](./PRD.md) | 产品需求文档（v1.2）：定位、范围、数据模型、收单表字段映射、待补清单 |
| [`CLAUDE.md`](./CLAUDE.md) | 开发指南：目录边界、Adapter / Repository 抽象、Phase 计划、约束与禁止事项、当前进度 |
| [`AGENTS.md`](./AGENTS.md) | Next.js 16 给 AI agent 的提示（和训练数据有 breaking changes，写代码前先看 `node_modules/next/dist/docs/`） |
| [`before.md`](./before.md) | 项目最初的思路草稿，已被 PRD / CLAUDE 取代，保留作历史 |

---

## 顶层目录 / 文件

| 路径 | 内容 |
| --- | --- |
| `src/` | 全部源代码（页面、业务逻辑、集成层、UI 组件） |
| `pictures/` | 机型 SN 编码规则参考图（Z03 / Z05 / TRC），DeviceEncoding seed 来源 |
| `public/` | 静态资源（图标等） |
| `.env.example` | 环境变量模板，复制为 `.env.local` 填值；详见 CLAUDE.md §十二 |
| `.npmrc` | 镜像源（npmmirror，国内拉包不超时） |
| `next.config.ts` / `tsconfig.json` / `eslint.config.mjs` / `postcss.config.mjs` | Next.js / TS / lint / Tailwind 配置 |
| `package.json` | 依赖与 npm scripts |
| `.next/` | Next.js 构建缓存（gitignore） |
| `node_modules/` | 依赖（gitignore） |

---

## `src/` 结构

```text
src/
├── app/                # 路由 + 页面 + API（薄层，不写业务逻辑）
├── components/         # UI 组件（不调 service / API）
├── domains/            # 业务逻辑核心（不依赖 React / 不调外部 SDK）
├── integrations/       # 外部系统适配（飞书 / mock）
├── lib/                # 工具：env / 日期 / session / cn 等
└── tests/              # 单测（domains / generator 重点）
```

### `src/app/`

| 路径 | 作用 |
| --- | --- |
| `app/layout.tsx` / `globals.css` | 根布局 + Tailwind v4 入口 + `.input` 组件类 |
| `app/(feishu)/` | 飞书 H5 路由组：共享导航布局；未来挂免登中间件 |
| `app/(feishu)/page.tsx` | 工作台首页 |
| `app/(feishu)/requirements/` | 需求：`create` 创建、`[id]` 详情、列表 |
| `app/(feishu)/templates/` | 模板库（资源位目录浏览 + 增删改） |
| `app/(feishu)/dashboard/` `shared-board/` `settings/` | 看板 / 共享看板 / 设置（Phase 5+ 占位） |
| `app/api/health/` | 健康检查（`?probe=feishu` / `?probe=bitable` 探活） |
| `app/api/auth/feishu/` | 免登 `code → user_info`（Phase 0 骨架，待联调） |
| `app/api/requirements/` | 需求 CRUD（GET 列表 / POST 创建批次 + 资源项） |
| `app/api/templates/` `templates/[id]/` | 模板 CRUD |
| `app/api/tickets/{design,dev}/` | 一键提单端点（Phase 4 实现） |
| `app/api/{collaborators,members,notifications,cron}/` | 合作人 / 成员 / 提醒 / 定时（Phase 7/8 占位） |

### `src/domains/`

业务逻辑核心。每个 domain 通常含 `types.ts` / `schema.ts` / `service.ts` / `repository.ts`。

| 路径 | 作用 |
| --- | --- |
| `domains/requirement/` | 需求批次 + AssetItem（明细行）。`types.ts` 是模型 SSOT，含 `Requirement` / `AssetItem` / `RequirementStatus` |
| `domains/template/` | 资源位目录（AssetTemplate，跨设备稳定）+ CRUD |
| `domains/device/` | 机型 SN 编码规则（DeviceEncoding，Z03/Z05/TRC seed）+ `getEncodingForDevice` |
| `domains/collaborator/` | 合作人（角色、订阅）|
| `domains/member/` | 项目成员名册（缓存 open_id） |
| `domains/workflow/` | 状态枚举 + 流转规则 + 权限判断 |
| `domains/dashboard/` | 看板聚合 + 风险计算（normal / warning / overdue） |
| `domains/generator/` | **纯函数**：`design-brief.ts` 资源清单 markdown / `dev-feishu-project.ts` 飞书项目需求卡片 / `device-encoding.ts` 编码规则段 |
| `domains/ticket/` | **提单 Adapter 抽象**：`design-adapter.ts` / `dev-adapter.ts` 接口 + `service.ts` 工厂（业务只依赖接口） |
| `domains/notification/` | 提醒事件 → 文案（纯函数），发送由 integrations/feishu/bot.ts 做 |

### `src/integrations/`

外部系统适配层。**禁止**被 `app/` 或 `components/` 直接 import。

| 路径 | 作用 |
| --- | --- |
| `integrations/feishu/client.ts` | 服务端 `tenant_access_token` 管理（带缓存） |
| `integrations/feishu/bitable.ts` | Bitable 最小 CRUD 封装（list / get / create / update / delete） |
| `integrations/feishu/auth.ts` | 服务端 code → user info |
| `integrations/feishu/jsapi.ts` | 客户端飞书 JS-SDK 加载 + 免登 |
| `integrations/feishu/bot.ts` | 群机器人 webhook |
| `integrations/feishu/project.ts` | 飞书项目（v1 仅给跳转 URL，v2 接 API 占位） |
| `integrations/feishu/adapters/design-bitable.adapter.ts` | **v1 设计提单**：写设计需求收单表（9 字段映射） |
| `integrations/feishu/adapters/dev-content.adapter.ts` | **v1 开发提单**：生成飞书项目「需求」格式 markdown + 复制 + 跳转（自动注入 SN 编码规则） |
| `integrations/feishu/adapters/dev-project-api.adapter.ts` | v2 占位：直接调飞书项目 API 创建工作项 |
| `integrations/feishu/repositories/*.bitable.ts` | Bitable 版 Repository 实现（待真实凭证联调） |
| `integrations/mock/store.ts` | 进程内 mock store + 种子数据（25 资源位 + 3 机型编码） |
| `integrations/mock/*.mock.ts` | mock Repository 实现，`DATA_SOURCE=mock` 时启用 |

### `src/components/`

纯 UI 组件，不调 service / 不读 cookie / 不调 API（接 props 即可）。

| 路径 | 作用 |
| --- | --- |
| `components/template-selector/template-manager.tsx` | 模板库管理（新增 / 编辑 / 删除弹窗） |
| `components/template-selector/spec-badge.tsx` | `KindBadge`（动/静态徽章）+ `specText`（规格文本） |
| `components/requirement-form/create-form.tsx` | 需求创建表单（顶部批次字段 + 下方资源位勾选） |
| `components/{status-board,ticket-result-dialog,collaborator-picker,ui}/` | Phase 5+ 占位（未实现） |

### `src/lib/`

| 文件 | 作用 |
| --- | --- |
| `env.ts` | 环境变量收口 + `assertFeishuEnv()` 校验 |
| `session.ts` | cookie session 读写 + `getCurrentUser()`（mock 模式回退到童海奇） |
| `constants.ts` | 平台 / 优先级 / 资源类别 / 需求类型占位 等枚举常量 |
| `date.ts` | 日期工具（today / plusDays / daysUntil / isOverdue） |
| `validation.ts` | 通用 zod 校验（openId / dateISO / optionalUrl） |
| `clipboard.ts` | 客户端复制到剪贴板 |
| `utils.ts` | `cn(...)` className 合并 |

### `src/tests/`

`domains/` `generator/` 占位目录，单测尚未铺开。

---

## 跑起来

```bash
# 首次：装依赖
npm install

# mock 模式（无需飞书凭证，可完整跑模板库 + 需求创建）
DATA_SOURCE=mock npm run dev
# → http://localhost:3000

# 真实 bitable 模式：复制 .env.example → .env.local，填飞书凭证后
DATA_SOURCE=bitable npm run dev
```

> mock 数据是进程内存，dev 重启会重置回种子（25 资源位 + Z03/Z05/TRC 编码）。

---

## 飞书数据怎么读

本机已装 `@larksuite/cli`（已认证 `cli_a9746473eaba1bea`），用它读 docx / 列 Bitable 字段：

```bash
# 读飞书文档全文
npx --no-install @larksuite/cli docs +fetch --doc <docToken> --format pretty

# 列多维表字段
npx --no-install @larksuite/cli base +field-list --base-token <app_token> --table-id <tblxxx>
```

WebFetch 拿不到登录态资源，飞书 docx / Bitable 一律走 CLI。
