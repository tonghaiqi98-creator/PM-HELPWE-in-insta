import type { AssetKind, ImageFormat, Theme } from '@/domains/template/types'

// APP 端平台（文档里的「双端」），内部使用
export type Platform = 'ios' | 'android'

// 设计收单表「平台」业务线
export type IntakePlatform = '软件' | '硬件' | '零售' | '设计'

// 需求类型（4 占位下拉）
export type RequirementType = 'type_1' | 'type_2' | 'type_3' | 'type_4'

export type Priority = 'P0' | 'P1' | 'P2'

export type RequirementStatus =
  | 'draft'
  | 'submitted'
  | 'designing'
  | 'waiting_design_review'
  | 'waiting_dev_accept'
  | 'developing'
  | 'waiting_test'
  | 'released'
  | 'archived'

/**
 * 一个设备一份需求（批次）。
 * 资源明细见 AssetItem（一份需求挂 N 个）。
 */
export type Requirement = {
  id: string
  title: string // 如「新增C9连接图片资源」
  targetDevice: string // 如 C9 / Z03
  type: RequirementType
  intakePlatform: IntakePlatform // 提单写入收单表的「平台」，默认 软件
  appPlatforms: Platform[] // iOS / Android
  successMetric?: string // 需求指标：创建草稿时可空，一键提单给设计前必填（没指标打回）
  priority: Priority
  expectedDueDate: string // 预计完成时间 yyyy-MM-dd
  remark?: string

  status: RequirementStatus

  // 自动生成的需求 docx（创建草稿时即生成；权限/folder 未配时为空，详情页降级显示）
  documentToken?: string
  documentUrl?: string

  // 提单结果（一键提单后回填）
  designIntakeRecordId?: string
  designIntakeUrl?: string

  creatorOpenId: string
  creatorName: string
  createdAt: string
  updatedAt: string
}

export type AssetItemStatus = 'pending' | 'delivered' | 'accepted'

/**
 * 需求下的单个资源项（「范围」表的一行）。
 * 创建时从 AssetTemplate 拷贝规格快照，之后可独立修改。
 */
export type AssetItem = {
  id: string
  requirementId: string
  templateId?: string

  // 设备维度（反范式化自 Requirement.targetDevice，方便在 base 列表里直接看到机型）
  targetDevice: string

  // 规格快照
  module: string
  category: string
  scene: string
  assetName: string
  assetKind: AssetKind
  format: ImageFormat
  size: { width: number; height: number }
  fps?: number
  themes: Theme[] // 需要哪些主题（不分主题时为空数组）

  // 交付 / 验收
  status: AssetItemStatus
  deliveredUrl?: string
  acceptanceNote?: string
  sortOrder: number
}

/**
 * 创建明细行输入：表单不传 targetDevice / requirementId / id / status — 由 service 层注入。
 */
export type CreateAssetItemInput = Omit<
  AssetItem,
  'id' | 'requirementId' | 'targetDevice' | 'status'
> & { status?: AssetItemStatus }

export type CreateRequirementInput = {
  title: string
  targetDevice: string
  type: RequirementType
  intakePlatform: IntakePlatform
  appPlatforms: Platform[]
  successMetric?: string
  priority: Priority
  expectedDueDate: string
  remark?: string
  creatorOpenId: string
  creatorName: string
  assetItems: CreateAssetItemInput[]
}

export type UpdateRequirementInput = Partial<
  Omit<Requirement, 'id' | 'creatorOpenId' | 'createdAt'>
>

export type RequirementFilter = {
  creatorOpenId?: string
  status?: RequirementStatus[]
}

export type RequirementWithItems = Requirement & { assetItems: AssetItem[] }
