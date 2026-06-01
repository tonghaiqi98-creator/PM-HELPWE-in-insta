import type { DevTicketInput, DevTicketResult } from './types'

/**
 * 开发提单 adapter 接口。
 * - prepare()：生成内容 + 给跳转链接（v1 必实现）
 * - submit()：直接调 API 创建工作项（v2 才实现，目前 optional）
 *
 * 实现约束同 DesignTicketAdapter。
 */
export interface DevTicketAdapter {
  readonly name: string
  prepare(input: DevTicketInput): Promise<DevTicketResult>
  submit?(input: DevTicketInput): Promise<DevTicketResult>
}
