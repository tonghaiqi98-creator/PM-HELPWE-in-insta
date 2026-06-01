import type { DevTicketAdapter } from '@/domains/ticket/dev-adapter'
import type { DevTicketInput, DevTicketResult } from '@/domains/ticket/types'
import { generateDevFeishuProjectCard } from '@/domains/generator/dev-feishu-project'
import { getEncodingForDevice } from '@/domains/device/service'
import { getProjectSpaceUrl } from '@/integrations/feishu/project'

/**
 * v1：生成飞书项目「需求」工作项的标题 + 描述，给前端复制。不调 API。
 * 自动带入目标机型的 SN 编码规则。
 */
export class DevContentAdapter implements DevTicketAdapter {
  readonly name = 'dev-content'

  async prepare(input: DevTicketInput): Promise<DevTicketResult> {
    try {
      const encoding = await getEncodingForDevice(input.requirement.targetDevice)
      const card = generateDevFeishuProjectCard(input.requirement, input.assetItems, encoding)
      const content = `# ${card.title}\n\n${card.description}`
      const redirectUrl = getProjectSpaceUrl()
      return { success: true, content, redirectUrl: redirectUrl || undefined }
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : String(err) }
    }
  }
}
