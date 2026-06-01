export const APP_NAME = '资源适配工作台'

export const DEFAULT_DUE_LEAD_DAYS = 10

export const RISK_WARNING_DAYS = 1
export const STATUS_STALE_DAYS = 3

export const PRIORITIES = ['P0', 'P1', 'P2'] as const

// 内部：APP 端平台（文档里的「双端」）
export const APP_PLATFORMS = ['ios', 'android'] as const

// 设计收单表「平台」下拉（业务线）。本工具提单固定填「软件」。
export const INTAKE_PLATFORMS = ['软件', '硬件', '零售', '设计'] as const
export const DEFAULT_INTAKE_PLATFORM = '软件'

// 需求类型：先留 4 个占位下拉，确定后改 label
export const REQUIREMENT_TYPES = [
  { value: 'type_1', label: '类型一（占位）' },
  { value: 'type_2', label: '类型二（占位）' },
  { value: 'type_3', label: '类型三（占位）' },
  { value: 'type_4', label: '类型四（占位）' },
] as const

// 资源分组（场景大类），来自需求文档「范围」表的分组标题
export const ASSET_CATEGORIES = [
  '连接-动图',
  '连接-静态图',
  '资源库基础配置',
  '线稿图',
  '云存储',
] as const

export const ASSET_FORMATS = ['png', 'jpg', 'webp', 'lottie'] as const
export const ASSET_KINDS = ['static', 'dynamic'] as const
export const THEMES = ['light', 'dark'] as const
