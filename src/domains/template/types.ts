export type AssetKind = 'static' | 'dynamic'

export type ImageFormat = 'png' | 'jpg' | 'webp' | 'lottie'

export type Theme = 'light' | 'dark'

/**
 * 资源位目录项（跨设备稳定）。
 * 对应需求文档「范围」表里的一行「资源位定义」，与具体设备无关。
 * 例：连接-动图 / 连接过程中 / 正视图顺时针旋转 / webp 500x500 20fps
 */
export type AssetTemplate = {
  id: string
  module: string // 业务模块：连接 / 云存储 ...
  category: string // 资源分组（场景大类），见 ASSET_CATEGORIES
  scene: string // 涉及环节，如「连接过程中」
  assetName: string // 资源名称，如「正视图顺时针旋转」
  assetKind: AssetKind
  format: ImageFormat
  defaultSize: { width: number; height: number }
  fps?: number // 仅动图
  hasThemeVariants: boolean // 是否区分 Light / Dark
  namingRule?: string
  devModule?: string
  exampleImageToken?: string // 飞书图片 token（参考示例）
  note?: string
  sortOrder: number // 分组内排序（对应文档编号）
}

export type TemplateFilter = {
  module?: string
  category?: string
  assetKind?: AssetKind
  keyword?: string
}

export type CreateTemplateInput = Omit<AssetTemplate, 'id'>
export type UpdateTemplateInput = Partial<Omit<AssetTemplate, 'id'>>
