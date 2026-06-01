/**
 * 环境变量收口 + 启动校验
 * 服务端读取所有飞书相关配置。
 * 缺失必需变量时直接抛错，避免运行时奇怪报错。
 */

type EnvShape = {
  // 飞书自建应用
  FEISHU_APP_ID: string
  FEISHU_APP_SECRET: string

  // 工具自己的 Bitable
  FEISHU_BITABLE_APP_TOKEN: string
  FEISHU_BITABLE_TABLE_REQUIREMENTS: string
  FEISHU_BITABLE_TABLE_ASSET_ITEMS: string
  FEISHU_BITABLE_TABLE_TEMPLATES: string
  FEISHU_BITABLE_TABLE_COLLABORATORS: string
  FEISHU_BITABLE_TABLE_MEMBERS: string
  FEISHU_BITABLE_TABLE_STATUS_LOGS: string

  // 设计需求收单表（待补充）
  DESIGN_INTAKE_BITABLE_APP_TOKEN: string
  DESIGN_INTAKE_TABLE_ID: string

  // 飞书云盘：自动生成需求 docx 的目标文件夹（未配置则跳过 docx 生成，仅 console 提示）
  FEISHU_DOC_FOLDER_TOKEN: string

  // 需求文档模板 URL（生成 docx 里"示例图片参考"段引用，无图时让设计去模板看）
  REQUIREMENT_DOC_TEMPLATE_URL: string

  // 设计提单表单分享 URL（v1 手动提单跳转目标；详情页给个跳转按钮）
  DESIGN_INTAKE_FORM_URL: string

  // 飞书群机器人
  FEISHU_BOT_WEBHOOK: string

  // 飞书项目
  FEISHU_PROJECT_SPACE_URL: string

  // 开发开关
  DATA_SOURCE: 'bitable' | 'mock'
  NEXT_PUBLIC_APP_NAME: string
}

const REQUIRED_KEYS: (keyof EnvShape)[] = [
  'FEISHU_APP_ID',
  'FEISHU_APP_SECRET',
  'FEISHU_BITABLE_APP_TOKEN',
  'FEISHU_BITABLE_TABLE_REQUIREMENTS',
  'FEISHU_BITABLE_TABLE_ASSET_ITEMS',
  'FEISHU_BITABLE_TABLE_TEMPLATES',
  'FEISHU_BITABLE_TABLE_COLLABORATORS',
  'FEISHU_BITABLE_TABLE_MEMBERS',
  'FEISHU_BITABLE_TABLE_STATUS_LOGS',
  'DESIGN_INTAKE_BITABLE_APP_TOKEN',
  'DESIGN_INTAKE_TABLE_ID',
  'FEISHU_BOT_WEBHOOK',
  'FEISHU_PROJECT_SPACE_URL',
]

let cached: EnvShape | null = null

export function getEnv(): EnvShape {
  if (cached) return cached
  const dataSource = (process.env.DATA_SOURCE ?? 'mock') as EnvShape['DATA_SOURCE']
  const env = {
    FEISHU_APP_ID: process.env.FEISHU_APP_ID ?? '',
    FEISHU_APP_SECRET: process.env.FEISHU_APP_SECRET ?? '',
    FEISHU_BITABLE_APP_TOKEN: process.env.FEISHU_BITABLE_APP_TOKEN ?? '',
    FEISHU_BITABLE_TABLE_REQUIREMENTS: process.env.FEISHU_BITABLE_TABLE_REQUIREMENTS ?? '',
    FEISHU_BITABLE_TABLE_ASSET_ITEMS: process.env.FEISHU_BITABLE_TABLE_ASSET_ITEMS ?? '',
    FEISHU_BITABLE_TABLE_TEMPLATES: process.env.FEISHU_BITABLE_TABLE_TEMPLATES ?? '',
    FEISHU_BITABLE_TABLE_COLLABORATORS: process.env.FEISHU_BITABLE_TABLE_COLLABORATORS ?? '',
    FEISHU_BITABLE_TABLE_MEMBERS: process.env.FEISHU_BITABLE_TABLE_MEMBERS ?? '',
    FEISHU_BITABLE_TABLE_STATUS_LOGS: process.env.FEISHU_BITABLE_TABLE_STATUS_LOGS ?? '',
    DESIGN_INTAKE_BITABLE_APP_TOKEN: process.env.DESIGN_INTAKE_BITABLE_APP_TOKEN ?? '',
    DESIGN_INTAKE_TABLE_ID: process.env.DESIGN_INTAKE_TABLE_ID ?? '',
    FEISHU_DOC_FOLDER_TOKEN: process.env.FEISHU_DOC_FOLDER_TOKEN ?? '',
    REQUIREMENT_DOC_TEMPLATE_URL:
      process.env.REQUIREMENT_DOC_TEMPLATE_URL ??
      'https://arashivision.feishu.cn/docx/O3J9dc7O0ouzeTxv7DkcLtfEndf',
    DESIGN_INTAKE_FORM_URL:
      process.env.DESIGN_INTAKE_FORM_URL ??
      'https://arashivision.feishu.cn/share/base/form/shrcnKeoh8KTVG0ZE2O3tecD9Wd',
    FEISHU_BOT_WEBHOOK: process.env.FEISHU_BOT_WEBHOOK ?? '',
    FEISHU_PROJECT_SPACE_URL: process.env.FEISHU_PROJECT_SPACE_URL ?? '',
    DATA_SOURCE: dataSource,
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME ?? '资源适配工作台',
  }
  cached = env
  return env
}

/**
 * 在需要真实飞书后端的地方调用。mock 模式下跳过校验。
 * 抛错时显示缺哪些 key，方便调试。
 */
export function assertFeishuEnv(): void {
  const env = getEnv()
  if (env.DATA_SOURCE === 'mock') return
  const missing = REQUIRED_KEYS.filter((k) => !env[k])
  if (missing.length > 0) {
    throw new Error(
      `[env] Missing required env vars: ${missing.join(', ')}. ` +
        `请在 .env.local 中配置，或将 DATA_SOURCE=mock 进入 mock 模式。`,
    )
  }
}
