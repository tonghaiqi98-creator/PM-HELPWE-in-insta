import type { DevTicketAdapter } from '@/domains/ticket/dev-adapter'
import type { DevTicketInput, DevTicketResult } from '@/domains/ticket/types'

/**
 * v2 占位：直接调飞书项目 OpenAPI 创建需求工作项。
 * 等拿到 plugin_id / plugin_secret + 空间 ID 后实现。
 */
export class DevProjectApiAdapter implements DevTicketAdapter {
  readonly name = 'dev-project-api'

  async prepare(_input: DevTicketInput): Promise<DevTicketResult> {
    return { success: false, error: 'v2 未实现：DevProjectApiAdapter' }
  }

  async submit(_input: DevTicketInput): Promise<DevTicketResult> {
    return { success: false, error: 'v2 未实现：DevProjectApiAdapter.submit' }
  }
}
