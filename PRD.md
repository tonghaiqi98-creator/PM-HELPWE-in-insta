# 资源适配工作台 PRD（v1）

> 版本：v1.1 草案
> 更新：2026-05-26
> 状态：**v1 范围已锁定**，含【待补充】标记的项需要后续提供资料

---

## 一、产品定位

### 1.1 一句话定义

飞书内的「APP 换图需求」结构化工作台：**PM 脑里有想法 → 点几下选完 → 一键提单到设计 + 开发 → 看板自动跟踪 → 飞书自动提醒**。

### 1.2 核心设计原则（v1 一切设计向这三条让步）

1. **集成进飞书**：不是独立网站，是飞书 H5 应用，工作台一键打开（免登降为 P2，见 §2.4）
2. **最小操作量**：PM 脑里知道要换哪张图，点几个选项就有提单
3. **一键到位**：提单不让 PM 复制粘贴跨系统，设计走 API 直接落库，开发走「一键复制 + 预留 API」

### 1.3 解决的问题

| 现状痛点 | 工具如何解决 |
| --- | --- |
| 每次换图都要手填一堆字段（尺寸、命名、机型、款式） | 选模板 + 选机型款式，80% 字段自动带出 |
| 提单跨系统：设计填一份表单，开发去飞书项目再提一份 | 一次提交，系统**自动**写设计表 + 生成开发需求内容 |
| 需求散落在飞书消息/文档，PM 自己也记不清进度 | 我的看板 + 状态流转 + 风险标识 |
| 设计/开发没提醒，到期才发现没做 | 合作人订阅 + 飞书机器人到期推送 |

### 1.4 用户与规模

- **主要用户**：PM 小组 5–10 人（发起需求）
- **次要用户**：设计师、开发、测试（合作人身份，看共享看板和接收提醒）
- **不为这些场景设计**：跨公司协作、外包流程、复杂审批、客户提需求

---

## 二、v1 范围

### 2.1 v1 包含的核心功能

1. **飞书 H5 应用** —— 作为飞书内的工具入口（**免登联调降为 P2**，单独排 Phase 9，详见 §2.4）
2. **换图需求一页式表单** —— 不分步骤，模板带出绝大部分字段
3. **图片位置模板库** —— 三级选择：APP 模块 → 页面 → 图片位置
4. **一键提单**
   - 设计：直接写入飞书 Bitable「设计需求收单表」
   - 开发：按飞书项目「需求」工作项格式生成内容 + 一键复制 + 跳转飞书项目（v2 接 API 自动创建）
5. **我的看板 + 状态流转** —— 我提的、待我处理、即将延期、已延期
6. **合作人共享看板** —— 添加设计/开发/测试/关注人，对方在共享看板能看到
7. **飞书群机器人提醒** —— 创建、状态变更、到期、逾期共 4 类事件

### 2.2 v1 明确**不做**

- 飞书项目 API 自动创建工作项（权限暂未到位，adapter 预留）
- 飞书通讯录 API（v1 合作人通过项目成员名册下拉选）
- 飞书应用消息推送（v1 用群机器人 webhook 兜底）
- Teambition / Figma / Jira 集成
- AI 生成或润色文案（v1 纯模板拼接）
- 图片本身上传 / 自动识图 / 像素校验
- 复杂权限矩阵（前端逻辑控制：发起人可编辑、负责人可改对应状态、关注人只读）
- 数据导出 / BI 报表
- 移动端适配（v1 桌面端飞书容器即可）

### 2.3 v1 最小闭环（验收基线）

```
PM 打开飞书工作台 → 点「资源适配工作台」→ 免登进入
   ↓
模板库已有 ≥ 10 条真实数据
   ↓
PM 选模板 → 选目标机型/款式/平台 → 填标题和到期日 → 添加合作人
   ↓
点「一键提单」
   ├── 系统自动写入设计需求收单表（Bitable API）
   ├── 系统生成开发提单内容（飞书项目「需求」格式）+ 复制到剪贴板 + 给一个跳转链接
   └── 系统在内部建一条需求记录，进入「我的看板」
   ↓
合作人在「共享看板」能看到这条需求
   ↓
状态从 draft → 流转到 released
   ↓
到期前 1 天 / 超期，飞书群机器人推消息
```

任一环节断掉，v1 不算完成。

### 2.4 v1 阶段性降级（P2，单独排 Phase 9）

**飞书容器免登** 在 v1 范围内但**不阻塞核心闭环开发与联调**，单独排期到 **Phase 9** 收尾。

| 维度 | v1 开发期（当前） | P2 上线前（Phase 9） |
| --- | --- | --- |
| 用户身份 | mock 兜底（创建人 = 童海奇 open_id） | 飞书 H5 JSAPI 免登取真实用户 |
| 应用状态 | "待上线"，可加载但 `tt.requestAccess` 调用受限 | 已发版（先内测范围，再扩到 PM 小组） |
| 验证入口 | 浏览器直接访问 `http://localhost:3000` | 飞书工作台「PM helper」入口 |
| "我的需求 / 共享看板"过滤 | 按兜底童海奇 open_id（单人测试不影响） | 按真实当前用户 |
| 设计收单表「产品经理」字段 | 写童海奇 | 写当前免登用户 |

**为什么可以推后**：服务端调飞书 API（写 Bitable、创建文档、提单、群机器人）只依赖 `tenant_access_token`，与免登无关。免登只解决"知道操作者是谁"，单人调试期 mock 兜底完全够用。

**不可推后的事**：开放平台 App ID/Secret 配置、`tenant_access_token` 验证、各 Bitable 应用授权 — 这些 Phase 0 / Phase 1 已经覆盖。

---

## 三、v1 锁定的技术与部署方案

| 项 | 选型 |
| --- | --- |
| 形态 | **飞书 H5 应用**（容器内打开，不做独立网站） |
| 前端 | Next.js 15 (App Router) + TypeScript |
| UI | Tailwind + shadcn/ui |
| 用户身份 | **飞书免登**（jsapi `tt.requestAccess` / 后端 `code → user_id`）。v1 开发期 mock 兜底，正式联调列入 **Phase 9（P2）**，见 §2.4 |
| 数据后端 | **飞书多维表格（Bitable）** |
| 设计提单出口 | **飞书 Bitable「设计需求收单表」**（v1 调 add_record API） |
| 开发提单出口 | **v1 生成飞书项目「需求」格式内容 + 一键复制**，adapter 预留 v2 API |
| 选合作人 | v1 项目成员名册下拉（Bitable 维护），v2 升级为 jsapi 联系人选择器 |
| 提醒通道 | **飞书自定义群机器人 Webhook**（v1），v2 升级为应用消息 |
| 内容生成 | **纯模板字符串拼接**，不接 AI |
| 部署 | 飞书 H5 应用打包（公司内可访问的静态托管 + 服务端 API） |

---

## 四、关键集成点

### 4.1 飞书 H5 应用与免登

**v1 实施策略**：H5 应用容器是核心，免登降为 P2 独立 Phase（见 §2.4）。当前骨架已就绪：

- ✅ 在飞书开放平台注册「企业自建应用」（App ID `cli_aa9d7f736b399cd4`）
- ✅ 前端 `loadFeishuSdk` + `getLoginCode(appId)` 调 `tt.requestAccess`（含 `h5sdk.ready` 包装与错误码解析）
- ✅ 后端 `/api/auth/feishu` 用 code 换 user_info，写 httpOnly cookie session
- ✅ `app/(feishu)/layout.tsx` 挂 `FeishuBootstrap` 客户端钩子，免登失败静默兜底 mock 用户
- ⏳ **Phase 9（P2）**：应用发版（"待上线" → "已上线"）、权限申请（`authen:user.id` 等）、webview 内真实免登联调、多人 PM 测试

### 4.2 设计提单出口

**v1 实施路径降级（P2 拿权限后再恢复自动）**：

| 阶段 | 实现 | 状态 |
| --- | --- | --- |
| **v1 当前** | 详情页给「打开设计提单表单 →」按钮，PM 手动复制 docx 链接粘贴到表单 | ✅ 已实现 |
| **v2（拿到权限后）** | `BitableFormAdapter.submit()` 自动写收单表一行；ticket service 编排 | ⏸️ 代码已写，缺设计 base 的 app_token / table_id / 应用授权 |

**入口表单**：`https://arashivision.feishu.cn/share/base/form/shrcnKeoh8KTVG0ZE2O3tecD9Wd`（env `DESIGN_INTAKE_FORM_URL`）

**粒度**：整份需求一行（批次级）。资源项明细由「需求文档链接」字段指向**自动生成的飞书 docx**（详见 §4.5）。

**v1 手动提单 PM 流程**（详情页引导）：
1. 工具创建草稿后进详情页 → 自动生成 docx 完成
2. 点「复制 docx 链接」
3. 点「打开设计提单表单 →」新窗口打开
4. 表单里填字段，「需求文档链接」字段粘贴上面复制的 docx 链接，提交

**字段映射（v2 自动写时用；v1 手动也需要 PM 自己照着填）**：

| 收单表字段 | 类型 | 来源 |
| --- | --- | --- |
| 需求名 | 键入 | `Requirement.title` |
| 平台 | 下拉(软件/硬件/零售/设计) | `intakePlatform`，本工具固定「软件」 |
| 需求文档链接 | 链接 | `requirement.documentUrl`（自动生成的飞书 docx，见 §4.5） |
| 需求类型 | 下拉(4占位) | `type` → label |
| 需求指标 | 键入 | `successMetric`（**必填**，没指标打回）|
| 拟定优先级 | — | `priority` |
| 产品经理 | — | `creatorName`（v1 开发期 mock 兜底 = 童海奇；Phase 9 后取免登真实用户）|
| 预计完成时间 | — | `expectedDueDate` |
| 备注 | 键入 | `remark` +「共 N 个资源项」 |

**待补充**【你需要给我】：该 Bitable 的 `app_token` + `table_id`；「平台」「需求类型」下拉的真实选项值；应用是否已授权访问该表。

**架构**：
```ts
interface DesignTicketAdapter {
  submit(input: DesignTicketInput): Promise<DesignTicketResult>
}

class BitableFormAdapter implements DesignTicketAdapter { ... }    // v1
class FeishuFormAdapter implements DesignTicketAdapter { ... }     // 预留
class FeishuProjectAdapter implements DesignTicketAdapter { ... }  // 预留
```

未来设计部门改用别的工具，只换 adapter 实现，不动业务层。

### 4.5 需求文档自动生成（飞书 docx）

**目标**：PM 点「创建草稿」 → 系统按模板自动生成一份飞书 docx，链接回填到 requirement，详情页可点开；后续提单时作为「需求文档链接」字段送入设计收单表。

**参考模板**：[O3J9dc7O0ouzeTxv7DkcLtfEndf](https://arashivision.feishu.cn/docx/O3J9dc7O0ouzeTxv7DkcLtfEndf) — 真实换图需求文档样式。

**生成内容**（蓝图 → markdown）：
- 标题 = `requirement.title`
- 版本记录表（修订时间 / 版本 / 修订人 / 变更内容）
- 需求分工表（产品经理 / 交互 / 视觉 / GUI / 底层 / 测试；PM 自动填，其他列待填）
- 需求背景段
- SN 编码规则表（按 `targetDevice` 自动注入；未配则提示补充）
- 范围（**按资源分组生成多张表**，每组一张 7 列表：编号 / 涉及环节 / 示例 / Light / Dark / 格式 / 验收。图片列空着让设计填）
- **示例图片参考段**：v1 不嵌图，文档末尾贴标准模板 URL（env `REQUIREMENT_DOC_TEMPLATE_URL`，当前指向 `O3J9dc7O0ouzeTxv7DkcLtfEndf`），让设计去模板看每个资源位的视觉示意（lark-cli 路径下图片无法落进 table cell，详见 §4.5 末注）
- 附件区 callout（让设计/PM 后续补 CAD / Figma / 切图等）

**v1 实现路径**（开发期捷径）：调本机 `lark-cli docs +create --markdown` subprocess。
- lark-cli 走飞书 MCP（`mcp.feishu.cn`），用童海奇个人身份（已认证），文档归属其个人云盘
- 优点：一次 spawn 把 markdown 转 docx，无需对接 docx OpenAPI 的 block 级 API（cells/嵌套很复杂）
- 缺点：依赖本机 lark-cli + 童海奇身份，不能多用户/不能云部署

**生产路径**：拿到 PM helper 应用的 `docx:document` + `drive:drive` 权限并发版后，新增 `FeishuApiDocxGenerator` 实现，工厂切换；当前 `domains/requirement/docx-generator.ts` 已留接口边界。

**架构**：
```ts
// domains/requirement/docx-generator.ts
interface DocxGenerator {
  generate(input: GenerateDocxInput): Promise<GenerateDocxResult>
}
// v1 唯一实现：LarkCliDocxGenerator → integrations/lark-cli/docx.ts (spawn)
// v2 实现：FeishuApiDocxGenerator → integrations/feishu/docx.ts (PM helper 应用调 OpenAPI)
```

**容错策略**：`FEISHU_DOC_FOLDER_TOKEN` 未配 / lark-cli 未装 / 飞书 API 错 → console.warn + 草稿照常落库，详情页显示"飞书 docx 待生成"提示，不阻塞创建动作。

**待补充**：~~飞书云盘建「PM helper 需求文档」文件夹 → 拿 folder_token 填 `.env.local`~~ ✅ 已配置 `XVdzfFWYIlXO0Odk1fNc1YuNnth`

**关于嵌入示例图（P2 决策记录）**：lark-cli `+media-insert` 的 `--selection-with-ellipsis` 文档明确写"media lands at the **top-level ancestor** of the matched block — when selection is inside a table cell, media lands **outside** that container, not inside it"。所以 lark-cli 路径**无法把图片塞进表格 cell**。v1 决定：不嵌图，文档末尾贴模板链接让设计自查。Phase 9 之后切到 PM helper 应用原生 docx OpenAPI 时，image block 可以正确进入 cell，那时再做。

### 4.3 开发提单出口（v1 一键复制 + 跳转，v2 API）

**v1 流程**：
1. 系统按飞书项目「需求」格式生成内容（Markdown 富文本）
2. 点「一键提单给开发」→ 内容自动写入剪贴板 + 弹出飞书项目空间链接 + 操作提示
3. PM 跳到飞书项目，点击「新建需求」，Ctrl+V 粘贴描述，确认提交

**v2（待权限）**：直接调飞书项目 OpenAPI `bizsuite.openapi.workitem.create` 创建需求工作项

**架构**：
```ts
interface DevTicketAdapter {
  prepare(input: DevTicketInput): Promise<DevTicketResult>   // 生成内容
  submit?(input: DevTicketInput): Promise<DevTicketResult>   // 可选：直接提交，v1 不实现
}
```

### 4.4 飞书机器人提醒

- 4 类事件：创建、状态变更、到期前 1 天、逾期
- 一个固定的「资源适配工作台」群，机器人发到这个群
- @ 人通过群成员 open_id 实现；项目成员表里维护 open_id（用户首次免登时自动写入）

---

## 五、核心数据模型（v1）

> ⚠️ v1.2 重大调整（依据 Z03/Z05、C9 两份真实需求文档）：
> **一个设备 = 一份需求（批次）**，下挂 N 个资源项。模板库是「资源位目录」（跨设备稳定）。

三层结构：

```text
AssetTemplate  资源位目录（与设备无关，跨设备复用）
      │ 提需求时按设备实例化、拷贝规格快照
      ▼
Requirement    一个设备一份需求（批次）── 提单写入设计收单表「一行」
      │ 1 : N
      ▼
AssetItem      需求下的单个资源项（「范围」表的每一行，逐项可交付/验收）
```

```ts
// 1. 资源位目录（跨设备稳定）
type AssetTemplate = {
  id: string
  module: string                 // 业务模块：连接 / 云存储
  category: string               // 资源分组：连接-动图 / 连接-静态图 / 资源库基础配置 / 线稿图 / 云存储
  scene: string                  // 涉及环节：连接过程中 / 设备开机引导 ...
  assetName: string              // 资源名称：正视图顺时针旋转 / 新设备发现 ...
  assetKind: 'static' | 'dynamic'
  format: 'png' | 'jpg' | 'webp' | 'lottie'
  defaultSize: { width: number; height: number }
  fps?: number                   // 仅动图（如 20）
  hasThemeVariants: boolean      // 是否区分 Light / Dark
  namingRule?: string
  devModule?: string
  exampleImageToken?: string     // 飞书图片 token（参考示例）
  sortOrder: number              // 分组内编号
}

// 2. 换图需求（批次：一个设备一份）
type Requirement = {
  id: string
  title: string                  // 「新增C9连接图片资源」
  targetDevice: string           // C9 / Z03
  type: RequirementType          // 4 占位下拉
  intakePlatform: IntakePlatform // 收单表「平台」业务线，本工具固定「软件」
  appPlatforms: Platform[]       // iOS / Android（双端）
  successMetric: string          // 需求指标（必填！没指标打回）
  priority: 'P0' | 'P1' | 'P2'
  expectedDueDate: string        // 预计完成时间
  remark?: string

  status: RequirementStatus
  documentToken?: string         // 自动生成的飞书 docx（创建草稿时填，见 §4.5）
  documentUrl?: string
  designIntakeRecordId?: string  // 提单写入收单表后回填
  designIntakeUrl?: string

  creatorOpenId: string
  creatorName: string
  createdAt: string
  updatedAt: string
}

// 3. 资源项（需求下的明细行）
type AssetItem = {
  id: string
  requirementId: string
  templateId?: string
  // 规格快照（创建时从模板拷贝，之后可独立改）
  module: string
  category: string
  scene: string
  assetName: string
  assetKind: 'static' | 'dynamic'
  format: 'png' | 'jpg' | 'webp' | 'lottie'
  size: { width: number; height: number }
  fps?: number
  themes: ('light' | 'dark')[]   // 需要哪些主题
  // 交付 / 验收
  status: 'pending' | 'delivered' | 'accepted'
  deliveredUrl?: string
  acceptanceNote?: string
  sortOrder: number
}

// 4. 合作人 / 5. 成员 / 6. 状态日志（同前，略，详见 src/domains/*/types.ts）

type RequirementType = 'type_1' | 'type_2' | 'type_3' | 'type_4'  // 4 占位，待定 label
type IntakePlatform = '软件' | '硬件' | '零售' | '设计'
type Platform = 'ios' | 'android'
type RequirementStatus =
  | 'draft' | 'submitted' | 'designing' | 'waiting_design_review'
  | 'waiting_dev_accept' | 'developing' | 'waiting_test' | 'released' | 'archived'
type RiskLevel = 'normal' | 'warning' | 'overdue'
```

### Bitable 表结构（v1 至少 6 张）

| 表 | 用途 | 来源 |
| --- | --- | --- |
| `requirements` | 需求批次主表 | **新建** |
| `asset_items` | 资源项明细（挂需求） | **新建** |
| `templates` | 资源位目录 | **新建** |
| `collaborators` | 需求-合作人关系 | **新建** |
| `members` | 项目成员名册（缓存 open_id） | **新建** |
| `status_logs` | 状态流转日志 | **新建** |
| `devices` | 机型 SN 编码规则（Z03/Z05/TRC…） | **新建** |
| `design_intake`（设计需求收单） | 一键提单写入对象 | **已存在**（待补 app_token） |

### 机型 SN 编码规则（DeviceEncoding）

需求文档要求「通过序列号判断机型，选对应 UI 资源」。每个机型有一套产品序列号编码规则（14 位：产品代码/厂商/产品类型/预留/年份/月份/流水号），开发靠它从 SN 识别机型。

```ts
type DeviceEncoding = {
  id: string
  deviceCode: string          // Z03 / Z05 / TRC
  deviceName: string
  example: string             // 示例 SN
  positions: { range: string; name: string; rule: string }[]
  note?: string
}
```

- 已 seed：Z03、Z05、TRC（来自实物编码规则图）
- **自动带入**：按 `Requirement.targetDevice` 匹配 → 出现在需求详情页（=设计看的文档）+ 开发提单内容；未匹配则提示「编码规则待补充」
- 提需求时「目标设备」带已知机型 datalist 建议

---

## 六、关键交互流程

### 6.1 创建需求（单页表单，**目标 ≤ 60 秒完成**）

```
┌─ 页面：提换图需求 ───────────────────────────────────┐
│  左：勾选资源位（来自资源位目录）      右：批次字段     │
│  ┌────────────────────────────┐  ┌──────────────────┐ │
│  │ 连接·连接-动图       [全选] │  │ 目标设备* [C9   ] │ │
│  │  ☑ 正视图旋转 动 webp500..  │  │ 标题(自动生成)    │ │
│  │  ☑ 设备开机   动 webp300..  │  │ 需求类型 [▼占位]  │ │
│  │ 连接·连接-静态图     [全选] │  │ 平台 ☑iOS ☑And   │ │
│  │  ☑ 新设备发现 静 png112 L/D │  │ 需求指标* [....]  │ │
│  │  ☐ 设备列表   静 png128 L/D │  │ 优先级 [P1]       │ │
│  │  ...                        │  │ 预计完成 [date]   │ │
│  │ 资源库基础配置 / 线稿图 ... │  │ 备注 [....]       │ │
│  └────────────────────────────┘  │ [创建草稿(N项)]   │ │
│                                   └──────────────────┘ │
└────────────────────────────────────────────────────────┘
```

**字段精简策略**：
- 标题：从设备自动生成「新增{设备}连接图片资源」，允许编辑
- 资源位：勾选即从模板拷贝规格快照（尺寸/格式/帧率/主题），无需手填
- 主题：模板标 `hasThemeVariants` 的，默认带 Light + Dark
- 平台：默认 iOS + Android
- 优先级：默认 P1
- 需求指标：**必填**，placeholder 给软件/门店示例
- 创建后进详情页 → 下一步一键提单（Phase 4）

### 6.2 一键提单流程

```
PM 点「一键提单」
   ↓
前端校验必填
   ↓
后端 service：
   1. 写入 requirements 表（status = 'submitted'）
   2. 写入 collaborators 表
   3. 调 BitableFormAdapter.submit() → 写入 design_intake 表
   4. 调 DevContentAdapter.prepare() → 生成开发提单 markdown
   5. 调 NotificationService → 群机器人推消息「@设计 新需求 xxx 已提交」
   ↓
前端展示结果：
   ✓ 设计需求已提交（链接到 design_intake 那行）
   ✓ 开发提单内容已复制到剪贴板（按钮）
   ✓ 跳转飞书项目（链接）
   ✓ 需求已加入「我的看板」（链接）
```

### 6.3 状态流转规则

```
draft → submitted                   (PM 一键提单，写设计表)
       → designing                  (设计开始)
       → waiting_design_review      (设计完成，等 PM 验)
       → waiting_dev_accept         (PM 验过，通知开发)
       → developing                 (开发开始)
       → waiting_test               (开发提测)
       → released                   (测试通过，已上线)
       → archived                   (归档)
```

权限：
- `draft → submitted`：发起人
- `submitted → designing → waiting_design_review`：设计
- `waiting_design_review → waiting_dev_accept`：发起人（验收设计稿）
- `waiting_dev_accept → developing → waiting_test`：开发
- `waiting_test → released`：测试 / 发起人
- 任一节点 → `archived`：发起人

### 6.4 风险计算（dashboard 实时算）

```
截止时间前 1 天内 + 状态未完成 → warning
超过截止时间 + 状态未完成         → overdue
状态停留 ≥ 3 天未更新              → warning
```

### 6.5 飞书提醒（v1 群机器人）

| 事件 | 接收人 | 文案模板 |
| --- | --- | --- |
| 一键提单完成 | 设计（@） | `📌 新换图需求\n标题：{title}\n发起人：{pm}\n机型：{device} {variant}\n设计到期：{date}` |
| 状态变更到「待我处理」 | 下游负责人（@） | `🔄 需求 {title} 进入「{新状态}」，请处理` |
| 设计/开发到期前 1 天 | 对应负责人 + PM（@） | `⏰ 需求 {title} 明天到期，当前状态 {status}` |
| 已逾期 | 对应负责人 + PM（@） | `🚨 需求 {title} 已逾期 {N} 天` |

到期/逾期检查走定时任务，每天早 9 点跑一次。

---

## 七、非功能要求

| 项 | 要求 |
| --- | --- |
| 性能 | 看板加载 < 2s（v1 数据量 < 1000 条）|
| 容器 | 飞书桌面端 / 网页版 H5 容器，Chrome 内核最新版 |
| 错误处理 | Bitable / 飞书 API 失败要明确提示，「一键提单」中任一步失败可重试，不能让数据残留半提交状态 |
| 日志 | 关键操作（创建、提单、状态流转、提醒）写 console + `status_logs` 表 |
| 安全 | `FEISHU_APP_SECRET` 仅服务端，前端不暴露任何 token |
| 幂等 | 一键提单按钮 5 秒内重复点击只触发一次 |

---

## 八、v1 验收清单

- [ ] 应用注册成功，工作台入口可见（**免登拿到当前 PM** 移至 Phase 9 P2 验收，见 §2.4）
- [ ] 模板库 ≥ 10 条真实数据
- [ ] 单页表单从打开到一键提单 ≤ 60 秒（资深 PM）
- [ ] 一键提单后：设计需求收单表新增一行；开发提单 markdown 自动复制；需求进入我的看板
- [ ] 我的看板能看到自己的需求 + 风险标识
- [ ] 添加合作人后，合作人在共享看板能看到
- [ ] 飞书群机器人收到 4 类提醒（提单、状态变更、到期、逾期）
- [ ] 所有数据真实落 Bitable，PM 可在 Bitable 里兜底修改

---

## 九、待补充的关键信息（开始开发前需要拿到）

| # | 信息 | 谁提供 | 必需阶段 | 状态 |
| --- | --- | --- | --- | --- |
| 1 | 设计收单表的 `app_token` + `table_id` | 你 | Phase 4 前 | 待补（字段已知，见 §4.2）|
| 1b | 收单表「平台」「需求类型」下拉的真实选项值 | 你 / 设计 | Phase 4 前 | 待补（类型先 4 占位）|
| 2 | 飞书「企业自建应用」`app_id` / `app_secret` | 你 / IT | Bitable 联调前 | 待补（CLI 已有 `cli_a9746473eaba1bea` 可复用）|
| 3 | 装本工具数据的 Bitable `app_token`（新建一个）| 你 | Bitable 联调前 | 待补 |
| 4 | 应用被授权访问上述两个 Bitable | 你 / owner | Bitable 联调前 | 待补 |
| 5 | 飞书项目空间 URL（开发提单跳转用）| 开发 | Phase 4 | 待补 |
| 6 | 群机器人 webhook URL | 你创建 | Phase 8 | 待补 |
| 7 | 飞书项目「需求」工作项字段 | 开发 | v2 | 待补 |

> 注：v1 用 `DATA_SOURCE=mock` 已能完整跑通模板库 + 需求创建（含两份文档提炼的真实资源位种子数据）。上述凭证用于切到真实 Bitable + 提单联调。

---

## 十、v2+ 候选（不做承诺）

- 飞书项目 OpenAPI 一键自动创建需求工作项
- 飞书联系人选择器 jsapi 替代项目成员下拉
- 飞书应用消息替代群机器人（更精准、可点击进 H5）
- AI 自动生成验收标准、自动补充提单内容
- 历史相似需求推荐
- 设计稿验收（飞书云文档 / Figma 嵌入预览）
- 移动端 / 数据导出 / 报表
