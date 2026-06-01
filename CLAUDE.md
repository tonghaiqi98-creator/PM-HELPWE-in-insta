# CLAUDE.md — 项目开发指南

> Claude Code 每次开工前先读这份文件 + `AGENTS.md`（Next.js 16 breaking changes 提示）。配套 PRD.md。
> 本项目核心目标：让 PM 在飞书内**最少操作**完成 APP 换图需求的发起、提单、跟踪。

@AGENTS.md

---

## 一、产品快读（详见 PRD.md）

- **形态**：飞书 H5 应用（不是独立网站）
- **用户**：5–10 人 PM 小组 + 设计/开发/测试为合作人
- **核心功能**：模板化创建需求 → 一键提单（设计写库 + 开发生成内容） → 看板跟踪 → 飞书提醒
- **设计原则**：最少操作量、一键到位、模板带出 80% 字段
- **v1 不做**：飞书项目 API、AI 生成、图片上传、复杂权限

---

## 二、技术栈

| 层 | 选型 |
| --- | --- |
| 框架 | Next.js 16 (App Router) + TypeScript（注意：和训练数据有 breaking changes，写代码前读 AGENTS.md） |
| UI | Tailwind CSS v4 + shadcn/ui |
| 表单 | react-hook-form + zod |
| 数据 | 飞书多维表格（Bitable）API |
| 飞书集成 | 飞书 JS-SDK（免登）+ 服务端 OpenAPI |
| 提醒 | 飞书群机器人 Webhook + 定时任务（Vercel Cron 或自托管 cron） |
| 部署 | 飞书 H5 应用，配套服务端 API（Next.js 一体化） |

---

## 三、目录结构

```text
src/
├── app/                                # 仅放页面/路由/API，不写业务逻辑
│   ├── (feishu)/                       # 飞书 H5 入口：免登中间件
│   │   ├── layout.tsx                  # 引入飞书 JS-SDK，处理免登
│   │   ├── page.tsx                    # 首页（工作台入口）
│   │   ├── requirements/
│   │   │   ├── create/page.tsx         # 单页表单
│   │   │   ├── [id]/page.tsx           # 详情
│   │   │   └── page.tsx                # 我的需求列表
│   │   ├── templates/page.tsx
│   │   ├── dashboard/page.tsx          # 我的看板
│   │   ├── shared-board/page.tsx       # 共享看板
│   │   └── settings/page.tsx
│   └── api/
│       ├── auth/feishu/route.ts        # 免登 code → user_id
│       ├── requirements/route.ts
│       ├── templates/route.ts
│       ├── collaborators/route.ts
│       ├── tickets/                    # 一键提单
│       │   ├── design/route.ts         # 调 BitableFormAdapter
│       │   └── dev/route.ts            # 调 DevContentAdapter
│       ├── members/route.ts
│       ├── notifications/route.ts
│       └── cron/route.ts               # 到期检查定时任务
│
├── domains/                            # 核心业务逻辑（不依赖 React、不调外部 API 客户端）
│   ├── requirement/
│   │   ├── types.ts
│   │   ├── schema.ts                   # zod 校验
│   │   ├── service.ts
│   │   └── repository.ts               # 接口 + 实现注入
│   ├── template/
│   ├── collaborator/
│   ├── member/
│   ├── workflow/                       # 状态枚举 + 流转规则 + 权限判断
│   ├── dashboard/                      # 看板聚合 + 风险计算
│   ├── generator/                      # 设计/开发提单内容生成（纯函数）
│   │   ├── design-brief.ts
│   │   └── dev-feishu-project.ts
│   ├── ticket/                         # 提单 adapter 抽象（关键）
│   │   ├── types.ts
│   │   ├── design-adapter.ts           # interface DesignTicketAdapter
│   │   ├── dev-adapter.ts              # interface DevTicketAdapter
│   │   └── service.ts                  # submitDesignTicket / prepareDevTicket
│   └── notification/                   # 提醒规则 + 文案（不发请求）
│
├── integrations/                       # 外部系统适配层
│   ├── feishu/
│   │   ├── client.ts                   # tenant_access_token 管理（服务端）
│   │   ├── bitable.ts                  # Bitable CRUD 封装
│   │   ├── jsapi.ts                    # 客户端：免登、(预留) 联系人选择
│   │   ├── auth.ts                     # 服务端：code → user_id → user info
│   │   ├── bot.ts                      # 群机器人 webhook
│   │   ├── project.ts                  # 飞书项目 API（v1 仅占位）
│   │   ├── adapters/
│   │   │   ├── design-bitable.adapter.ts    # v1: 写设计需求收单表
│   │   │   ├── dev-content.adapter.ts       # v1: 生成内容 + 复制 + 跳转
│   │   │   └── dev-project-api.adapter.ts   # v2 预留：调飞书项目 API
│   │   └── repositories/
│   │       ├── requirement.bitable.ts
│   │       ├── template.bitable.ts
│   │       ├── collaborator.bitable.ts
│   │       ├── member.bitable.ts
│   │       └── status-log.bitable.ts
│   └── mock/                           # 开发期 mock，DATA_SOURCE=mock 时启用
│       └── ...
│
├── components/                         # 纯 UI，不写业务逻辑
│   ├── requirement-form/               # 单页表单（关键）
│   ├── template-selector/              # 三级模板选择
│   ├── status-board/
│   ├── ticket-result-dialog/           # 一键提单结果展示
│   ├── collaborator-picker/
│   └── ui/                             # shadcn/ui 基础组件
│
├── lib/
│   ├── date.ts
│   ├── validation.ts
│   ├── constants.ts
│   ├── env.ts                          # 环境变量收口（启动校验）
│   ├── session.ts                      # cookie / 当前用户读取
│   └── clipboard.ts                    # 复制到剪贴板
│
└── tests/
    ├── domains/                        # 业务逻辑单测（重点）
    └── generator/                      # 生成器快照
```

---

## 四、分层职责（强约束，违反即拒绝合并）

```
app/         只渲染页面 + 调 service。禁止：写业务规则、直接调 Bitable / 飞书 API
components/  只接收 props 渲染。禁止：调 service、调 API、读 cookie
domains/     业务逻辑核心。禁止：import React、调 fetch、调外部 SDK
integrations/外部系统适配。禁止：暴露给 components/app 层直接调用
api/         薄薄一层：参数解析 → 调 service → 返回 JSON。禁止：写业务逻辑
```

**数据流（单向）**：

```
UI (page / component)
     ↓
app/api/* route handler
     ↓
domains/{x}/service.ts
     ↓ 通过接口调用
domains/{x}/repository.ts  或  domains/ticket/*-adapter.ts
     ↓ 注入具体实现
integrations/feishu/repositories/x.bitable.ts  或  integrations/feishu/adapters/*
```

**为什么这样**：
- 换提单渠道（设计的 Bitable 换成飞书表单 / 飞书项目）只换 adapter
- 接 mock 调试只换 repository
- UI 完全不感知

---

## 五、提单 Adapter（v1 架构最关键的部分）

### 5.1 接口定义

```ts
// domains/ticket/types.ts
export type DesignTicketInput = {
  requirement: Requirement
  template?: ImageTemplate
  designerOpenId?: string
}

export type DesignTicketResult = {
  success: boolean
  recordId?: string
  url?: string
  error?: string
}

// domains/ticket/design-adapter.ts
export interface DesignTicketAdapter {
  submit(input: DesignTicketInput): Promise<DesignTicketResult>
}

// domains/ticket/dev-adapter.ts
export interface DevTicketAdapter {
  prepare(input: DevTicketInput): Promise<DevTicketResult>   // 生成内容
  submit?(input: DevTicketInput): Promise<DevTicketResult>   // v2 才实现
}
```

### 5.2 实现选择

```ts
// domains/ticket/service.ts
export function getDesignAdapter(): DesignTicketAdapter {
  return new BitableFormAdapter()   // v1 唯一实现
}

export function getDevAdapter(): DevTicketAdapter {
  return new DevContentAdapter()    // v1: 生成内容 + 复制
  // 未来：return new DevProjectApiAdapter()
}
```

### 5.3 业务约束

- **业务 service 只依赖接口，不 import 具体 adapter**
- **adapter 实现失败必须返回结构化错误，不能 throw**（提单不能让需求半提交）
- **一键提单是一个事务**：内部 requirement 落库 → 调 design adapter → 调 dev adapter → 发通知，任一失败都要回滚或标记
- **adapter 实现里允许 import feishu/bitable.ts**，但 adapter 不能引用 domains 之外的 UI/路由

---

## 六、Repository 抽象

每个数据 domain 都有 repository 接口 + Bitable 实现 + mock 实现：

```ts
// domains/requirement/repository.ts
export interface RequirementRepository {
  list(filter: RequirementFilter): Promise<Requirement[]>
  get(id: string): Promise<Requirement | null>
  create(input: CreateRequirementInput): Promise<Requirement>
  update(id: string, patch: UpdateRequirementInput): Promise<Requirement>
  delete(id: string): Promise<void>
}

export function getRequirementRepository(): RequirementRepository {
  return process.env.DATA_SOURCE === 'mock'
    ? new MockRequirementRepository()
    : new BitableRequirementRepository()
}
```

**开发期可用 `DATA_SOURCE=mock`，但每个 Phase 完成必须用 Bitable 回归一次。**

---

## 七、模块边界（要加东西去哪？）

| 我要加的东西 | 放哪 |
| --- | --- |
| 新页面 / 新路由 | `app/(feishu)/` |
| 新 UI 组件 | `components/` |
| 新业务规则（如新增状态） | `domains/workflow/` |
| 新字段校验 | `domains/{对应}/schema.ts` |
| 新提单渠道（如对接 Jira） | 新建 `integrations/{xxx}/adapters/...` 实现 ticket adapter 接口 |
| 新提醒事件 | `domains/notification/`（规则）+ `integrations/feishu/bot.ts`（发送） |
| 新飞书 API 调用 | `integrations/feishu/` |
| 新常量 | `lib/constants.ts` 或 `domains/{x}/types.ts` |

---

## 八、命名规范

| 类型 | 约定 | 示例 |
| --- | --- | --- |
| 文件 | kebab-case | `requirement-form.tsx` |
| 组件 | PascalCase | `RequirementForm` |
| service / 函数 | camelCase | `createRequirement` |
| 类型 | PascalCase | `Requirement` |
| 枚举字符串值 | snake_case | `'waiting_design_review'` |
| 常量 | UPPER_SNAKE | `MAX_TITLE_LENGTH` |
| Bitable 字段 | ts 字段同名小驼峰，中文显示名在 mapping 文件单独维护 |

---

## 九、开发阶段

> 按依赖关系，不按页面。每阶段独立可验收。

### Phase 0：项目骨架 + 飞书应用注册 + Bitable 连通

**目标**：能在飞书工作台打开应用，免登成功，能读到 Bitable 一条测试数据。

任务：
1. 初始化 Next.js + TS + Tailwind + shadcn/ui
2. 建目录骨架（空文件占位 + 路径正确）
3. 飞书开放平台注册「企业自建应用」，配置 H5 入口、Bitable 权限
4. `lib/env.ts` 收口并校验所有必需 env
5. `integrations/feishu/client.ts`：服务端 tenant_access_token 管理（带缓存）
6. `integrations/feishu/auth.ts`：服务端 code → user_info
7. `integrations/feishu/jsapi.ts`：客户端 SDK 引入 + 免登 hook
8. `app/(feishu)/layout.tsx`：免登中间件
9. `integrations/feishu/bitable.ts`：最小 CRUD
10. `app/api/health/route.ts`：读 Bitable 一条记录验证

验收：飞书工作台打开 → 自动免登 → 健康检查通过显示当前用户名

### Phase 1：核心类型 + 成员/模板 Bitable 表

任务：
1. 所有 `domains/*/types.ts` 定义完
2. 在 Bitable 里手动建表：`members`、`templates`（先录入测试数据）
3. `MemberRepository` + `TemplateRepository`
4. 用户首次免登 → 自动写入/更新 `members` 表

验收：Bitable 里能看到 members 自动新增、templates 能读

### Phase 2：模板库浏览 + 三级筛选

任务：
1. `app/(feishu)/templates/page.tsx`
2. `components/template-selector/`：三级联动下拉
3. `domains/template/service.ts`：按模块/页面/位置筛选

验收：能看到模板列表 + 三级筛选正确

### Phase 3：需求单页表单（最小操作量 ⚡）

**重点**：把 PRD §6.1 的单页表单做出来，目标 60 秒完成。

任务：
1. `app/(feishu)/requirements/create/page.tsx`
2. `components/requirement-form/`：单页所有字段
3. 模板选完 → 自动带出尺寸/格式/命名规则，并智能拼标题
4. 默认值策略：优先级 P1、平台都选、到期日 = 今天+7/+14
5. `domains/requirement/service.ts#createRequirement`（暂存草稿用）
6. `BitableRequirementRepository`

验收：能创建草稿，Bitable 看到一行 `status=draft`

### Phase 4：一键提单（v1 价值核心 🔥）

**重点**：把单页表单的「一键提单」做通。

任务：
1. `domains/generator/design-brief.ts`：纯函数，输出设计需要的内容
2. `domains/generator/dev-feishu-project.ts`：纯函数，输出飞书项目「需求」格式 markdown
3. `integrations/feishu/adapters/design-bitable.adapter.ts`：实现 `DesignTicketAdapter`
4. `integrations/feishu/adapters/dev-content.adapter.ts`：实现 `DevTicketAdapter.prepare`
5. `domains/ticket/service.ts`：编排「写 requirement → 调 design adapter → 调 dev adapter → 发通知」
6. `app/api/tickets/design/route.ts` + `dev/route.ts`
7. `components/ticket-result-dialog/`：展示提单结果（设计链接 + 开发内容复制 + 跳转飞书项目）

**前置**：需要 PRD §九 的 1、4、5、7（设计表 app_token、字段映射、飞书项目空间 URL、需求工作项字段）

验收：点「一键提单」→ 设计需求收单表新增一行 + 剪贴板有开发内容 + 内部 requirement.status=submitted

### Phase 5：需求详情页 + 状态流转

任务：
1. `app/(feishu)/requirements/[id]/page.tsx`：Tab 结构（基础信息 / 设计提单 / 开发提单 / 合作人 / 操作记录）
2. `domains/workflow/`：状态枚举 + 流转规则 + 权限判断
3. 状态变更写 `status_logs` 表

验收：能改状态、看到历史

### Phase 6：我的看板 + 风险计算

任务：
1. `app/(feishu)/dashboard/page.tsx`
2. `domains/dashboard/`：聚合「我提的 / 待我处理 / 即将延期 / 已延期」+ 风险计算
3. 列表 / 看板 双视图

验收：看板能正确分组 + 风险标识

### Phase 7：合作人 + 共享看板

任务：
1. `domains/collaborator/`
2. `components/collaborator-picker/`（从 `members` 表下拉）
3. `app/(feishu)/shared-board/page.tsx`
4. 前端权限：发起人 / 负责人 / 关注人 三种

验收：合作人在共享看板能看到对应需求

### Phase 8：飞书机器人提醒

任务：
1. `domains/notification/`：4 类事件 → 规则 + 文案
2. `integrations/feishu/bot.ts`：webhook 发送（含 @ open_id）
3. 事件触发：service 关键操作后调用
4. `app/api/cron/route.ts`：每日 09:00 跑到期检查

验收：4 类提醒在群里都能看到，@ 准确

### Phase 9：飞书容器免登 + 应用发版（P2，v1 上线前）

**目标**：把"待上线"的 PM helper 应用推到内测可用、PM 小组能在飞书内打开并按真实身份使用。

**前置**：Phase 0–8 在浏览器普通模式（`http://localhost:3000`）已跑通；服务端调飞书 API（tenant_access_token、Bitable、提单、机器人）稳定。

**任务**：
1. 开放平台权限申请：`authen:user.id`、`contact:user.base:readonly` 等免登所需权限；重新发版生效
2. 应用版本发布：先发到「测试企业和人员」验证免登，再扩到 PM 小组可见范围
3. 真实容器联调：飞书桌面端 webview 打开 → `FeishuBootstrap` 拿到真实 user_id → cookie session 替换 mock 兜底
4. 多人验证：拉 1-2 个 PM 同事进测试范围，验证「我的需求 / 共享看板」按真实用户过滤正确
5. 把「创建人 / 发起人」字段从 mock 兜底（童海奇 open_id）切换到 session 真实用户；设计收单表「产品经理」字段同步

**为什么独立 Phase**：服务端 API 调用全部不依赖免登；免登只解决用户身份识别，是上线前的最后一英里。详见 PRD §2.4。

**验收**：PM 小组 5–10 人各自在飞书工作台打开应用 → 顶部显示自己真实姓名 → 创建需求、看板均按自己身份正确过滤

### Phase 10：联调 + 部署 + 验收清单

- 真实数据回归
- 部署到目标环境
- 跑 PRD §八 的清单

---

## 十、给 Claude Code 的任务模板

```text
任务目标：
实现 xxx 模块。

业务背景：
（一两句，说明这个模块在系统中的作用）

开发范围：
1. xxx
2. xxx

代码约束：
1. 先读 CLAUDE.md 确认目录边界。
2. 业务逻辑在 domains/xxx/service.ts，不要写在页面里。
3. 外部系统调用在 integrations/xxx，不直接出现在 components/app。
4. 当前阶段使用 Bitable repository（或 mock，看环境变量）。
5. 类型集中在 domains/xxx/types.ts。
6. 不修改本任务范围外的文件。

验收标准：
1. xxx 页面/API 可工作
2. xxx 数据能正确落 Bitable
3. tsc 通过、lint 通过
4. （如涉及 UI）在飞书容器里走一遍闭环

输出要求：
完成后列出：改了哪些文件、如何手动测试、遗留 TODO。
```

---

## 十一、禁止事项（违反即重做）

1. **不要**在 `app/` 或 `components/` 里直接 `import` 飞书 SDK 或 `fetch` Bitable
2. **不要**在 generator 里调 API 或读 React state
3. **不要**把业务规则硬编码在 UI（如「P0 显示红色」可以，「P0 自动延期 1 天」必须在 service）
4. **不要**为单条需求改通用类型；类型变更必须同步 schema 和 Bitable 字段
5. **不要**跳过 zod 校验直接信任前端数据
6. **不要**把 `FEISHU_APP_SECRET` 暴露给客户端
7. **不要**一次性跳 Phase；每个 Phase 完成必须用真实 Bitable 数据跑一次
8. **不要**让「一键提单」失败时留下半提交状态：必须明确成功/失败/部分成功并提示用户
9. **不要**直接 import `BitableFormAdapter` 到业务 service —— 必须通过 `getDesignAdapter()` 工厂

---

## 十二、环境变量清单

```bash
# .env.local
# 飞书应用
FEISHU_APP_ID=cli_xxx
FEISHU_APP_SECRET=xxx

# 工具自己的 Bitable（存 requirements / templates / members 等）
FEISHU_BITABLE_APP_TOKEN=xxx
FEISHU_BITABLE_TABLE_REQUIREMENTS=tblxxx
FEISHU_BITABLE_TABLE_TEMPLATES=tblxxx
FEISHU_BITABLE_TABLE_COLLABORATORS=tblxxx
FEISHU_BITABLE_TABLE_MEMBERS=tblxxx
FEISHU_BITABLE_TABLE_STATUS_LOGS=tblxxx

# 设计需求收单表（设计部门维护，待补）
DESIGN_INTAKE_BITABLE_APP_TOKEN=xxx
DESIGN_INTAKE_TABLE_ID=tblxxx

# 飞书群机器人
FEISHU_BOT_WEBHOOK=https://open.feishu.cn/open-apis/bot/v2/hook/xxx

# 飞书项目（v1 仅用于跳转链接，v2 接 API 时再加 plugin_id/secret）
FEISHU_PROJECT_SPACE_URL=https://project.feishu.cn/xxx

# 飞书云盘文件夹：自动生成需求 docx 的归属（创建草稿时调用，详见 PRD §4.5）
# 未配置时跳过 docx 生成，不阻塞草稿落库
FEISHU_DOC_FOLDER_TOKEN=xxx

# 需求文档模板 URL（生成 docx 末尾"示例图片参考"段引用，让设计去模板看图）
REQUIREMENT_DOC_TEMPLATE_URL=https://arashivision.feishu.cn/docx/xxx

# 设计提单表单 URL（v1 手动提单跳转目标，详情页给跳转按钮；v2 自动写收单表权限到位后保留作为兜底）
DESIGN_INTAKE_FORM_URL=https://arashivision.feishu.cn/share/base/form/shrxxx

# 开发开关
DATA_SOURCE=bitable                    # bitable | mock
NEXT_PUBLIC_APP_NAME=资源适配工作台
```

`lib/env.ts` 启动时必须校验所有必需变量，缺失直接抛错。

---

## 十三、当前进度

### 阶段性总结（更新于 2026-05-31 · 第二轮 Bitable 化收尾）

**已闭环的最小价值流**：
> PM 浏览模板库 → 创建一份草稿（勾选资源位 + 填批次字段）→ 系统自动生成飞书 docx 到指定文件夹 → 需求 + 明细同步落 base → 详情页能复制 docx 链接 + 一键跳转设计提单表单 → PM 手动粘贴提交

整条链路 + 6 张表全部走真 base 持久化（lark-cli 用户身份路径）。`/data` 页面能直接看每张表的真数据。

**关键路径选型**：
- 飞书 docx 生成走 **lark-cli subprocess**（童海奇个人身份），不是 PM helper 应用原生 OpenAPI；Phase 9 切原生 API 时换 `DocxGenerator` 工厂实现即可
- **Bitable CRUD 走 lark-cli 用户身份**（env 开关 `BITABLE_VIA_LARK_CLI=true`）：飞书不允许把应用加为 base 协作者，base owner 也只能加「人类用户」，所以单人开发期借 lark-cli 童海奇身份直接读写；多人 / 上线再切回 `tenant_access_token` 应用身份。详见 memory `reference_bitable_via_lark_cli.md`
- **Bitable 持久化用 hybrid factory**（`lib/repo-source.ts`）：每张表的 env 填了 table_id 就走 bitable，没填仍 mock；当前 6 张表全填，等价 `DATA_SOURCE=bitable`
- 设计提单 v1 走 **详情页链接跳转 + 手动提交**；`BitableFormAdapter` 代码已就位，等设计 base 授权才能切自动
- 飞书容器免登骨架已写但 **联调推迟到 Phase 9 P2**，开发期 mock 兜底童海奇足够

### 代码索引（改东西先看这里）

| 想改的事 | 改这里 |
| --- | --- |
| Bitable CRUD 底层（API ↔ lark-cli 分支） | `src/integrations/feishu/bitable.ts`（env 开关），`src/integrations/lark-cli/bitable.ts`（lark-cli 实现 + filter in-memory 解析 + datetime 字符串兼容） |
| 字段读写 codec | `src/integrations/feishu/repositories/_codec.ts`（text/number/boolean/select/multiSelect/datetime/user） |
| 6 个 BitableRepository | `src/integrations/feishu/repositories/{template,member,requirement,asset-item,collaborator,status-log}.bitable.ts`；每个文件顶部 `const F = {...}` 是 ts 字段 → base 字段名映射 |
| 6 个 factory（mock vs bitable 选择） | `src/domains/{template,member,requirement,collaborator,workflow}/repository.ts` + `src/domains/requirement/asset-item-repository.ts`，都用 `shouldUseBitableFor(envKey)` |
| 加新 base 表 / 加字段 | `scripts/seed-tables.ts`（字段规格 + 字段类型映射，注意 `multiSelect` 要写成 `select + multiple:true`）；跑 `npm run seed:tables`（幂等） |
| 灌模板种子 | `scripts/seed-templates.ts`，跑 `npm run seed:templates`（幂等） |
| 创建需求 → 多表落库的编排 | `src/domains/requirement/service.ts#createRequirement`：repo.create → itemRepo.batchCreate(reqId, targetDevice, items) → 生成 docx → repo.update(docMeta) |
| ts 类型源头 | `src/domains/requirement/types.ts`（Requirement / AssetItem / 状态枚举），`src/domains/template/types.ts`（AssetTemplate / Theme），`src/domains/collaborator/types.ts`，`src/domains/workflow/types.ts`（StatusLog） |
| zod 校验 | `src/domains/requirement/schema.ts`（注意 CreateAssetItemInput 不收 targetDevice，service 内部注入） |
| 数据库可视化页 | `src/app/(feishu)/data/page.tsx`，server component 用 `listRawTable(appToken, tableId)` 通用渲染 |
| 创建需求 API | `src/app/api/requirements/route.ts`（GET 列表 / POST 创建），走 session 拿 creator |
| 全局顶部 nav | `src/app/(feishu)/layout.tsx`，NAV 数组 |

### 6 张 base 表速查

| 表 | table_id | 字段名约定 | 备注 |
| --- | --- | --- | --- |
| `templates` | `tblVbCy9d2wXOG4O` | **英文小驼峰**（历史） | 25 条种子；模板库 CRUD |
| `members` | `tblNFkJvfIumAZVH` | 英文小驼峰（历史） | 免登首次注入 |
| `requirements` | `tblRk1zPyRHS1N8a` | **中文业务名 + 英文技术名** | 需求批次（19 字段） |
| `asset_items` | `tblRbrFPKkG6Hk44` | 中文业务名 | 明细行（18 字段，含 `目标设备`） |
| `collaborators` | `tbldyhIEjN7s5Nkr` | 中文 | 5 字段 |
| `status_logs` | `tblY6xqpKQx4t0ud` | 中文 | 7 字段，状态变更日志 |

字段名约定（2026-05-31 起新表）：业务字段中文（"需求标题"/"状态"），技术字段保留英文（"ID"/"id"/"OpenId"/"Token"/"URL"）；Select 选项值跟 ts type union 完全一致（draft/static/P0/软件/...），不做转换层。

base URL：`https://arashivision.feishu.cn/base/D9RQbNlG0aTjiosQknicVqH0nGd?table=<table_id>`

### 已完成（截至本次记录）

**Phase 0-3 骨架**
- [x] 项目骨架（Next.js 16 + TS + Tailwind v4，分层目录、Repository / Adapter 抽象）
- [x] 飞书应用注册 PM helper（App ID `cli_aa9d7f736b399cd4`）
- [x] 免登骨架代码就绪（`FeishuBootstrap` + cookie session）；真实联调推迟到 Phase 9
- [x] 三层数据模型（AssetTemplate / Requirement / AssetItem）
- [x] 模板库浏览 + CRUD + 25 条真实种子
- [x] 需求单页表单（顶部批次 + 下方资源位勾选 → 创建草稿）
- [x] 机型 SN 编码规则（Z03/Z05/TRC seed）+ `targetDevice` 自动注入详情页和开发提单
- [x] 需求 docx 自动生成（lark-cli `docs +create`）；folder_token 已配

**Bitable 持久化（第一轮：templates / members）**
- [x] base「PM helper 数据」已建（`D9RQbNlG0aTjiosQknicVqH0nGd`，云盘根目录）
- [x] `templates` / `members` 两张表 + BitableRepository + 种子灌入
- [x] hybrid factory（`lib/repo-source.ts`）

**Bitable 持久化（第二轮 · 本次 · lark-cli 用户身份路径）**
- [x] lark-cli bitable wrapper（`src/integrations/lark-cli/bitable.ts`）：record-list/get/batch-create/batch-update/delete；listRecords 收到 filter 自动全表扫 + in-memory eqFilter 解析
- [x] env 开关 `BITABLE_VIA_LARK_CLI=true` 透明切换 API ↔ lark-cli
- [x] `decodeDateTime` 兼容 lark-cli 的字符串 datetime（`yyyy-MM-dd HH:mm:ss`）
- [x] 4 张新表已建（中文字段名）：requirements / asset_items / collaborators / status_logs
- [x] 4 个 BitableRepository 实现（`requirement.bitable.ts` / `asset-item.bitable.ts` / `collaborator.bitable.ts` / `status-log.bitable.ts`），每个顶部 `const F` 集中字段映射
- [x] 4 个 factory 切到 hybrid（之前是 `DATA_SOURCE === 'mock'` 二选一）
- [x] `asset_items` 加 `目标设备` 列；`AssetItem.targetDevice` 必填；`batchCreate(reqId, targetDevice, items)` 接口由 service 注入；前端表单不重复填
- [x] 建表脚本 `scripts/seed-tables.ts`（幂等，命令 `npm run seed:tables`）
- [x] 端到端验证：curl POST `/api/requirements` → requirements / asset_items 真落 base，docx 生成 + 文档链接回填正常
- [x] `/data` 数据库查看页：6 张表 tab + server component 直接读 base raw row 渲染 + 「在飞书 base 打开」外链按钮

**手动提单链路（v1）**
- [x] 详情页「提单给设计」section：复制 docx 链接 + 跳转设计提单表单（env `DESIGN_INTAKE_FORM_URL`）；自动写收单表降级为 P2

**Phase 5/6 收尾：我的看板 + 确认交付动作（2026-06-01）**

设计原则：状态产生路径必须可解释 —— 已交付/已逾期/待交付不只是 UI 分组，每个都有清晰来源（手动动作 vs 自动派生）。

- [x] 派生定义（`domains/dashboard/service.ts`）
  - **已交付** = `status === 'released'`；PM 在详情页点过「确认交付」才会进入此态。`archived` 也是终态但默认从看板过滤掉（归档=移出视野）
  - **已逾期** = 非终态 + `expectedDueDate < today`，看板渲染时实时算，不入 status 枚举（避免定时任务 + 迁回逻辑）
  - **待交付** = 其余非终态；内部 ≤ `RISK_WARNING_DAYS` 天到期的卡片左侧加琥珀色条（"X 天内到期"）
- [x] `domains/workflow/types.ts`：导出 `NON_TERMINAL_STATUSES` / `TERMINAL_STATUSES` 常量；TRANSITIONS 追加 6 条 `非终态 → released, allowedRoles ['creator']`（PM 任意环节都能"确认交付"，不必走完测试）
- [x] `domains/workflow/service.ts`：新增 `resolveOperatorRoles(req, openId)` + `applyStatusTransition({requirementId, toStatus, operatorOpenId, note?})`，失败返结构化 `{ok:false, code: 'not_found'|'forbidden'|'invalid_transition'}` 不抛错
- [x] `app/api/requirements/[id]/status/route.ts`：POST 薄壳，session + zod 枚举校验，成功后 `revalidatePath('/dashboard'|'/requirements'|`/requirements/${id}`)`
- [x] `components/confirm-delivery-button.tsx`：client，`window.confirm` 二次确认 + 错误内联 + `router.refresh()`
- [x] 详情页 `app/(feishu)/requirements/[id]/page.tsx`：右上角换成 `DeliveryBadge`（已交付绿/已逾期红/待交付灰）+ creator + 非终态时显示「确认交付」按钮（替代原"草稿（一键提单 Phase 4）"chip）
- [x] `app/(feishu)/dashboard/page.tsx`：3 section（已逾期红 / 待交付灰 / 已交付绿），右上角顶部一行小字简述派生规则；整页空时引导提需求
- [x] `components/requirement-card.tsx`：风险等级简化为 `'normal' | 'warning'`（overdue 升级到 section 级），调用方传 `showRisk` 才显示色条
- [x] 端到端验证：详情页确认交付 → status_logs 表新增一行 from→to → 看板该需求挪到「已交付」

### 已知坑（避免重踩）

1. **lark-cli `type:"multiSelect"` 静默 fallback 单选**：多选必须用 `type:"select" + multiple:true`。`seed-tables.ts` 的 `specToFieldJson` 已经做映射。
2. **lark-cli json 模式 datetime 是字符串不是 ms timestamp**：`_codec.ts#decodeDateTime` 已兼容两种格式。跨时区部署要小心。
3. **lark-cli `+record-list` 不支持 filter 参数**：`listRecords` wrapper 收到 filter 时强制走 listAll + in-memory eqFilter 解析。
4. **更新记录回写覆盖创建时间**：之前 decodeDateTime 失败 fallback epoch 0，update 把整条 record 写回时把 createdAt 也覆盖成 1970；坑 1+2 修了之后这条不再出现。
5. **lark-cli 子进程一次 timeout 可能服务端实际成功**：会在 base 产生 ghost 记录。再次触发同样请求时 newRequirementId() 拿到新 id 不会撞主键，但 base 里会留 2 条相似数据，注意清理。

### 下一步候选

**不依赖外部阻塞**
- [ ] 机型编码库管理 UI：参考模板库 CRUD 模式，PM 在工具内加 C9/X7 等新机型，不用改 seed
- [ ] 详情页其余 Tab：操作记录（读 status_logs 已就绪）/ 合作人管理 UI / 中间环节状态流转动作（waiting_design_review → waiting_dev_accept 等，「确认交付」已通）
- [ ] BitableRepository 关键路径加单测：datetime 编解码、filter 路径、batchCreate(targetDevice) 注入
- [ ] `/data` 页面增强：列宽自适应、单元格 popover 显示完整 JSON、按列搜索
- [x] ~~RequirementCard 上的 `r.status` 当前还是英文（"released"/"developing"），加 status → 中文 label 映射~~（2026-06-01 完成：`domains/requirement/labels.ts` 导出 `STATUS_LABELS` + `formatStatus()`，RequirementCard 和详情页头部都已切）

**等外部阻塞解除（PM helper 应用授权 base）才能做**
- [ ] BITABLE_VIA_LARK_CLI 切回 false，验证应用身份路径仍工作
- [ ] Phase 4 真"一键提单"：等设计部门给 base 的 `app_token` + `table_id` + 把 PM helper 应用授权可编辑 + 「平台」「需求类型」下拉真实选项值
- [ ] Phase 9（P2，v1 上线前）：飞书容器免登联调 + 应用发版 + 多人 PM 测试（PRD §2.4）

**P2 改进**
- [ ] docx 示例图嵌入 cell：等切到 PM helper 原生 docx OpenAPI；走 lark-cli 路径做不到
- [ ] base 加双向关联字段：用飞书 base 的"关联"列把 requirements ↔ asset_items 用 record_id 关联，base UI 体验更好；当前是 id 字符串关联

### 运行状态

- 默认配置：`DATA_SOURCE=mock` + `BITABLE_VIA_LARK_CLI=true` → 6 张表实际都走 lark-cli 真 base（hybrid factory 看到 env 里 table_id 都填了）
- 飞书读写借本机 `@larksuite/cli` 1.0.26（已认证 `cli_a9746473eaba1bea` / 童海奇 `ou_8339dd5f96ae885f2dd5554b59b98a4e`）
- 跑 dev：`npm run dev`（占 3000 端口）
- 灌表 / 灌种子：`npm run seed:tables`（幂等）、`npm run seed:templates`（幂等）
- 浏览器入口：`/`（首页）、`/templates`、`/requirements/create`、`/requirements`、`/dashboard`、`/data`（base 查看页）
