import type { DesignTicketInput, DesignTicketResult } from './types'

/**
 * 设计提单 adapter 接口。
 * v1 实现：BitableFormAdapter（写入飞书多维表格的「设计需求收单表」）
 * 未来可换：飞书表单 / 飞书项目「需求」 / Jira / 任何系统
 *
 * 实现约束：
 * - 失败必须返回 { success: false, error }，不要 throw
 * - 不要在 adapter 里发通知或写其他系统（编排在 service.ts）
 */
export interface DesignTicketAdapter {
  readonly name: string
  submit(input: DesignTicketInput): Promise<DesignTicketResult>
}
