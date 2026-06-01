可以把 Claude Code 的开发过程设计成 **“先定数据模型，再按功能模块拆 Agent 任务”**。不要一上来让它做完整系统，否则容易耦合、文件乱、逻辑散。

下面按你这个工具的核心功能拆。

---

# 一、整体开发原则

这个工具本质分 5 层：

```text
数据层：需求、模板、合作人、提醒、操作记录
业务层：创建需求、生成文档、状态流转、提醒判断
页面层：表单、模板库、看板、详情页
集成层：飞书通知 / 飞书表格 / Teambition 文案
工具层：AI 生成、字段校验、权限判断
```

开发时不要按页面硬写，应该按 **领域模块** 拆：

```text
requirement   换图需求
template      图片位置模板
collaboration 合作人
generator     设计提单 / 开发卡片生成
workflow      状态流转
notification  飞书提醒
dashboard     看板统计
```

这样后面接飞书、Teambition、Figma 都不会把主逻辑弄乱。

---

# 二、推荐代码结构

可以先让 Claude Code 按这个结构建项目：

```text
src/
├── app/
│   ├── requirements/
│   │   ├── create/
│   │   ├── [id]/
│   │   └── page.tsx
│   ├── templates/
│   ├── dashboard/
│   ├── shared-board/
│   └── settings/
│
├── domains/
│   ├── requirement/
│   │   ├── types.ts
│   │   ├── schema.ts
│   │   ├── service.ts
│   │   └── repository.ts
│   ├── template/
│   ├── collaborator/
│   ├── workflow/
│   ├── generator/
│   └── notification/
│
├── integrations/
│   ├── feishu/
│   │   ├── client.ts
│   │   ├── bitable.ts
│   │   └── bot.ts
│   └── teambition/
│       └── formatter.ts
│
├── components/
│   ├── requirement-form/
│   ├── template-selector/
│   ├── status-board/
│   ├── generated-content/
│   └── collaborator-picker/
│
├── lib/
│   ├── date.ts
│   ├── validation.ts
│   └── constants.ts
│
└── tests/
```

重点是：

```text
app：只放页面和路由
components：只放 UI 组件
domains：放核心业务逻辑
integrations：放外部系统对接
```

不要让页面直接写飞书 API、提醒规则、文案生成逻辑。

---

# 三、按核心功能拆开发任务

## 1. 换图需求结构化创建

### 功能目标

让 PM 通过表单创建一条标准换图需求。

### 独立模块

```text
domains/requirement
components/requirement-form
app/requirements/create
```

### 关键数据结构

```ts
type Requirement = {
  id: string
  title: string
  type: RequirementType
  targetDevice: string
  targetVariant?: string
  appModule: string
  pageName: string
  imagePosition: string
  platforms: Platform[]
  status: RequirementStatus
  priority: Priority
  expectedDesignDueDate: string
  expectedDevDueDate: string
  expectedReleaseVersion?: string
  replaceReason: string
  acceptanceCriteria: string
  creatorId: string
  createdAt: string
  updatedAt: string
}
```

### 给 Claude Code 的任务写法

```text
实现换图需求创建模块。

要求：
1. 在 domains/requirement 中定义 Requirement 类型、状态枚举、创建表单 schema。
2. 在 components/requirement-form 中实现分步骤表单。
3. 表单分为：需求类型、图片位置、适配信息、确认提交。
4. 提交后调用 requirement service 创建需求。
5. 页面层不能直接访问数据库或飞书 API，只能调用 service。
6. 使用 mock repository，暂时不接真实飞书。
```

第一阶段先用 mock 数据，不要一开始接飞书。

---

## 2. 页面位置 / 图片尺寸模板库

### 功能目标

产品选页面位置后，自动带出尺寸、格式、命名规则、历史参考。

### 独立模块

```text
domains/template
components/template-selector
app/templates
```

### 关键数据结构

```ts
type ImageTemplate = {
  id: string
  appModule: string
  pageName: string
  imagePosition: string
  defaultSize: {
    width: number
    height: number
  }
  scale: '@1x' | '@2x' | '@3x'
  format: 'png' | 'jpg' | 'webp' | 'lottie'
  namingRule: string
  platforms: Platform[]
  devModule?: string
  referenceUrl?: string
  note?: string
}
```

### 交互重点

```text
APP 模块
↓
页面名称
↓
图片位置
↓
自动填充尺寸 / 格式 / 命名规则
```

### 给 Claude Code 的任务写法

```text
实现图片位置模板库模块。

要求：
1. 在 domains/template 中定义 ImageTemplate 类型和 mock 数据。
2. 实现 template service，支持按模块、页面、关键词筛选模板。
3. 实现 TemplateSelector 组件，支持三级选择：模块、页面、图片位置。
4. 用户选中模板后，将尺寸、格式、命名规则回填到需求创建表单。
5. 模板模块必须独立，不允许把模板数据硬编码在表单组件里。
```

---

## 3. 自动生成设计提单内容

### 功能目标

根据结构化需求，自动生成给设计的提单内容。

### 独立模块

```text
domains/generator
components/generated-content
```

### 输入

```text
Requirement
ImageTemplate
Collaborators
```

### 输出

```text
设计提单 Markdown
```

### 生成内容结构

```text
需求背景
换图范围
页面位置
图片规格
当前资源
目标效果
设计交付要求
验收标准
附件信息
```

### 给 Claude Code 的任务写法

```text
实现设计提单生成器。

要求：
1. 在 domains/generator 中实现 generateDesignBrief 函数。
2. 输入 Requirement 和 ImageTemplate，输出 Markdown 字符串。
3. 生成内容必须包含：需求背景、页面位置、目标机型、图片尺寸、格式、命名规则、设计要求、验收标准。
4. 实现 GeneratedContentPreview 组件，支持预览和复制。
5. 生成器必须是纯函数，不依赖页面状态，不调用 API。
```

这里一定要强调 **纯函数**，这样后面接 AI 生成或模板调整都容易。

---

## 4. 自动生成开发 Teambition 卡片内容

### 功能目标

生成开发可直接复制到 Teambition 的卡片内容。

### 独立模块

```text
domains/generator
integrations/teambition/formatter.ts
```

### 生成内容结构

```text
标题
需求背景
涉及页面
展示规则
资源信息
设计稿链接
兼容范围
验收标准
```

### 示例

```text
标题：
【资源替换】X6 联名款连接页顶部设备图适配

描述：
需求背景：
替换 X6 联名款在连接页顶部的设备展示图。

涉及页面：
连接 / 连接引导页 / 顶部设备图

展示规则：
- 目标机型：X6
- 款式：联名款
- 标准款不受影响
- iOS / Android 双端生效

资源信息：
- 尺寸：750 × 420
- 格式：PNG
- 命名规则：connect_x6_collab_hero.png

验收标准：
1. X6 联名款展示新图
2. X6 标准款仍展示原图
3. 图片无拉伸、模糊、错位
4. iOS / Android 表现一致
```

### 给 Claude Code 的任务写法

```text
实现 Teambition 开发卡片内容生成器。

要求：
1. 在 integrations/teambition/formatter.ts 中实现 formatTeambitionCard。
2. 输入 Requirement 和 ImageTemplate。
3. 输出包含 title 和 description。
4. description 使用 Markdown 格式。
5. 不调用 Teambition API，只生成可复制内容。
6. 在需求详情页增加“开发卡片”tab，支持复制标题和描述。
```

第一版先“生成内容”，不要直接“创建 Teambition 卡”。

---

## 5. 我的需求状态面板 + 到期提醒

### 功能目标

PM 能看到自己提过的需求、状态、负责人、风险。

### 独立模块

```text
domains/workflow
domains/dashboard
domains/notification
components/status-board
app/dashboard
```

### 状态枚举

```ts
type RequirementStatus =
  | 'draft'
  | 'waiting_design_accept'
  | 'designing'
  | 'waiting_design_review'
  | 'waiting_dev_accept'
  | 'developing'
  | 'waiting_test'
  | 'released'
  | 'archived'
```

### 风险判断

不要写在页面里，放到 dashboard service：

```ts
type RiskLevel = 'normal' | 'warning' | 'overdue'
```

判断规则：

```text
截止前 1 天未完成：warning
超过截止时间未完成：overdue
状态 3 天未更新：warning
```

### 给 Claude Code 的任务写法

```text
实现我的需求状态面板。

要求：
1. 在 domains/workflow 中定义状态枚举和状态流转规则。
2. 在 domains/dashboard 中实现 getMyRequirementDashboard。
3. 输出包含：我的需求、待我处理、即将延期、已延期。
4. 实现列表视图和看板视图。
5. 风险状态由 dashboard service 计算，页面只负责展示。
6. 使用 mock 数据完成，不接真实飞书。
```

---

## 6. 添加合作人共享看板

### 功能目标

一个需求可以添加设计、开发、验收、关注人；合作人能看到共享看板。

### 独立模块

```text
domains/collaborator
components/collaborator-picker
app/shared-board
```

### 角色模型

```ts
type CollaboratorRole =
  | 'creator'
  | 'designer'
  | 'developer'
  | 'tester'
  | 'watcher'
```

### 合作人数据结构

```ts
type Collaborator = {
  id: string
  requirementId: string
  userId: string
  name: string
  role: CollaboratorRole
  receiveNotification: boolean
}
```

### 给 Claude Code 的任务写法

```text
实现合作人共享看板。

要求：
1. 在 domains/collaborator 中定义 Collaborator 类型和角色枚举。
2. 实现添加、删除、修改合作人角色的 service。
3. 在需求详情页支持添加合作人。
4. 共享看板展示与当前用户相关的需求，包括我是设计、开发、验收人或关注人的需求。
5. 权限先做前端逻辑：关注人只读，负责人可改对应状态，发起人可编辑全部。
6. 不接真实通讯录，使用 mock 用户数据。
```

---

# 四、推荐开发顺序

不要按页面开发，要按依赖关系开发。

## Phase 0：项目骨架

```text
目标：把目录、路由、类型、mock 数据搭起来
```

Claude Code 任务：

```text
创建项目基础架构。

要求：
1. 使用 Next.js + TypeScript。
2. 建立 app、domains、components、integrations、lib、tests 目录。
3. 配置基础路由：首页、创建需求、模板库、我的看板、共享看板、需求详情页。
4. 使用 mock 数据，不接真实 API。
5. 所有核心类型集中放在 domains 内。
```

---

## Phase 1：核心数据模型

```text
目标：先把需求、模板、合作人、状态流转定义清楚
```

开发内容：

```text
Requirement
ImageTemplate
Collaborator
WorkflowStatus
RiskLevel
```

这一步很重要，后面所有页面都依赖它。

---

## Phase 2：模板库 + 需求创建

```text
目标：能从模板创建一条换图需求
```

开发内容：

```text
模板列表
模板筛选
三级模板选择
换图需求表单
提交需求
```

---

## Phase 3：内容生成器

```text
目标：自动生成设计提单和开发卡片
```

开发内容：

```text
generateDesignBrief
formatTeambitionCard
预览
复制
重新生成
```

---

## Phase 4：需求详情页 + 状态流转

```text
目标：每个需求能被查看、修改状态、记录进展
```

开发内容：

```text
详情页
状态切换
操作记录
设计提单 tab
开发卡片 tab
合作人 tab
```

---

## Phase 5：我的看板 + 共享看板

```text
目标：能管理自己和合作相关的需求
```

开发内容：

```text
我的需求
待我处理
即将延期
看板视图
共享看板
风险标识
```

---

## Phase 6：提醒逻辑

```text
目标：先完成提醒规则，再接飞书机器人
```

开发内容：

```text
提醒规则判断
提醒消息生成
mock notification
飞书机器人接口预留
```

---

## Phase 7：接飞书

```text
目标：把 mock repository 替换为飞书多维表格 repository
```

开发内容：

```text
FeishuBitableRequirementRepository
FeishuBitableTemplateRepository
FeishuBotNotifier
```

关键是 repository 之前已经抽象好了，所以替换数据源不会影响页面。

---

# 五、Claude Code 的工作方式

建议你不要给它一句大需求，而是这样分任务：

```text
每次只做一个模块
每个模块先写类型
再写 service
再写 UI
最后写测试或 mock
```

每次任务控制在这个粒度：

```text
一个 domain
一个 component
一个 page
一个 integration
```

不要一次让它做：

```text
做完整资源适配平台
```

容易失控。

---

# 六、每个任务给 Claude Code 的标准格式

你可以固定用这个模板：

```text
任务目标：
实现 xxx 模块。

业务背景：
这个模块用于 xxx。

开发范围：
1. xxx
2. xxx
3. xxx

代码约束：
1. 页面层不能直接写业务逻辑。
2. 业务逻辑放在 domains/xxx/service.ts。
3. 外部系统调用放在 integrations/xxx。
4. 当前阶段使用 mock 数据。
5. 类型必须集中定义。
6. 不要修改无关模块。

验收标准：
1. xxx 页面可访问。
2. xxx 表单可提交。
3. xxx 内容可生成。
4. xxx 状态可更新。
```

---

# 七、建议先让 Claude Code 生成一份开发协议

在正式开发前，先让 Claude Code 写一个 `DEVELOPMENT_GUIDE.md`。

内容包括：

```text
项目目录说明
模块边界
命名规范
状态枚举
数据流说明
新增功能规则
禁止事项
```

给 Claude Code 的 prompt：

```text
请基于当前产品需求，生成 DEVELOPMENT_GUIDE.md。

要求：
1. 明确项目目录结构。
2. 明确 domains、components、integrations、app 的职责边界。
3. 明确换图需求、模板库、合作人、工作流、提醒、内容生成器的模块边界。
4. 说明新增功能时应该放在哪个目录。
5. 说明页面层不能直接调用外部 API。
6. 说明当前阶段优先使用 mock repository，后续再替换为飞书 repository。
7. 输出中文文档。
```

这个文档很重要，后面你每次让 Claude Code 改功能，都让它先读这个文件。

---

# 八、最小闭环版本

第一版最小闭环可以是：

```text
模板库有数据
↓
PM 选择模板创建需求
↓
系统生成设计提单
↓
系统生成开发卡片
↓
需求进入我的看板
↓
添加合作人
↓
状态流转
↓
到期显示风险
```

不要第一版就做：

```text
飞书 OAuth
Teambition API
Figma 自动读图
图片自动检测
复杂权限系统
```

先把内部工作流跑通。

---

# 九、给 Claude Code 的第一条启动 Prompt

你可以直接这样发：

```text
我们要开发一个飞书内使用的「资源适配工作台」，用于管理 APP 换图需求。

核心功能：
1. 换图需求结构化创建
2. 页面位置 / 图片尺寸模板库
3. 自动生成设计提单内容
4. 自动生成开发 Teambition 卡片内容
5. 我的需求状态面板 + 到期提醒
6. 添加合作人共享看板

请先不要实现完整功能，先完成项目架构设计和代码骨架。

技术要求：
1. 使用 Next.js + TypeScript。
2. 使用模块化架构，按 domains / components / integrations / app 拆分。
3. domains 放业务逻辑，components 放 UI，integrations 放飞书和 Teambition 等外部系统适配。
4. 当前阶段全部使用 mock repository，不要接真实飞书 API。
5. 页面层不能直接写业务逻辑或调用外部 API。
6. 先创建基础路由：首页、创建需求、模板库、我的看板、共享看板、需求详情页。
7. 先定义核心类型：Requirement、ImageTemplate、Collaborator、RequirementStatus、RiskLevel。
8. 生成 DEVELOPMENT_GUIDE.md，说明目录职责、模块边界和后续开发规范。

验收标准：
1. 项目可以启动。
2. 所有基础页面可以访问。
3. 核心类型已经定义。
4. mock 数据可以被页面读取。
5. 文档说明清楚模块边界。
```

---

# 十、你后续开发时的节奏

建议你按这个顺序喂给 Claude Code：

```text
第 1 轮：搭骨架
第 2 轮：做模板库
第 3 轮：做创建需求表单
第 4 轮：做设计提单生成器
第 5 轮：做开发卡片生成器
第 6 轮：做详情页和状态流转
第 7 轮：做我的看板
第 8 轮：做合作人共享看板
第 9 轮：做提醒规则
第 10 轮：替换为飞书数据源
```

每一轮都让它：

```text
先读 DEVELOPMENT_GUIDE.md
只修改本轮相关文件
完成后总结改了哪些文件
说明如何测试
```

这样最不容易失控。
