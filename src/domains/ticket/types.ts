import type { AssetItem, Requirement } from '@/domains/requirement/types'

export type DesignTicketInput = {
  requirement: Requirement
  assetItems: AssetItem[]
  /** 需求文档链接：指向本工具的需求详情页（飞书内可打开） */
  detailUrl: string
  designerOpenId?: string
}

export type DesignTicketResult = {
  success: boolean
  recordId?: string
  url?: string
  error?: string
}

export type DevTicketInput = {
  requirement: Requirement
  assetItems: AssetItem[]
  developerOpenId?: string
}

export type DevTicketResult = {
  success: boolean
  content?: string
  redirectUrl?: string
  workitemUrl?: string
  error?: string
}
