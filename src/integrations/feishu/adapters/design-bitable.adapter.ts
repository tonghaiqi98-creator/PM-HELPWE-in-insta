import type { DesignTicketAdapter } from '@/domains/ticket/design-adapter'
import type { DesignTicketInput, DesignTicketResult } from '@/domains/ticket/types'
import { REQUIREMENT_TYPES } from '@/lib/constants'
import { createRecord } from '@/integrations/feishu/bitable'
import { getEnv, assertFeishuEnv } from '@/lib/env'

/**
 * v1：把整份需求写入设计需求收单表「一行」。
 * 资源明细不进表，通过「需求文档链接」指向本工具详情页。
 *
 * 收单表字段（来自实际表单）：
 *   需求名 / 平台 / 需求文档链接 / 需求类型 / 需求指标 / 拟定优先级 / 产品经理 / 预计完成时间 / 备注
 *
 * 字段 key 用飞书 Bitable「显示名」。等拿到 base 本体后用 field-list 校准。
 */
export class BitableFormAdapter implements DesignTicketAdapter {
  readonly name = 'bitable-form'

  async submit(input: DesignTicketInput): Promise<DesignTicketResult> {
    try {
      assertFeishuEnv()
      const { DESIGN_INTAKE_BITABLE_APP_TOKEN, DESIGN_INTAKE_TABLE_ID } = getEnv()
      if (!DESIGN_INTAKE_BITABLE_APP_TOKEN || !DESIGN_INTAKE_TABLE_ID) {
        return { success: false, error: '设计需求收单表的 app_token / table_id 未配置' }
      }
      const record = await createRecord(
        DESIGN_INTAKE_BITABLE_APP_TOKEN,
        DESIGN_INTAKE_TABLE_ID,
        this.toIntakeFields(input),
      )
      const url = `https://feishu.cn/base/${DESIGN_INTAKE_BITABLE_APP_TOKEN}?table=${DESIGN_INTAKE_TABLE_ID}&record=${record.record_id}`
      return { success: true, recordId: record.record_id, url }
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : String(err) }
    }
  }

  private toIntakeFields(input: DesignTicketInput): Record<string, unknown> {
    const { requirement, assetItems, detailUrl } = input
    const typeLabel =
      REQUIREMENT_TYPES.find((t) => t.value === requirement.type)?.label ?? requirement.type
    return {
      需求名: requirement.title,
      平台: requirement.intakePlatform,
      需求文档链接: { link: detailUrl, text: requirement.title },
      需求类型: typeLabel,
      需求指标: requirement.successMetric ?? '',
      拟定优先级: requirement.priority,
      产品经理: requirement.creatorName,
      预计完成时间: requirement.expectedDueDate,
      备注: `${requirement.remark ?? ''}（共 ${assetItems.length} 个资源项，明细见文档链接）`,
    }
  }
}
