import type { AssetItem, Requirement } from '@/domains/requirement/types'
import type { DeviceEncoding } from '@/domains/device/types'
import { generateAssetTable } from './design-brief'
import { generateEncodingSection } from './device-encoding'

export type DevFeishuProjectCard = {
  title: string
  description: string
}

/**
 * 把需求格式化成飞书项目「需求」工作项的标题 + 描述。
 * v1 用于一键复制，v2 用于 API submit。纯函数。
 * encoding：目标机型的 SN 编码规则，开发靠它识别机型选资源。
 */
export function generateDevFeishuProjectCard(
  requirement: Requirement,
  items: AssetItem[],
  encoding?: DeviceEncoding | null,
): DevFeishuProjectCard {
  const title = `【资源替换】${requirement.title}`
  const description = [
    `## 需求背景`,
    requirement.remark ?? '（无）',
    ``,
    `## 需求指标`,
    requirement.successMetric ?? '（待补充）',
    ``,
    `## 适配范围`,
    `- 设备：${requirement.targetDevice}`,
    `- 平台：${requirement.appPlatforms.join(' / ')}`,
    `- 其他设备/款式不受影响`,
    ``,
    generateEncodingSection(encoding),
    ``,
    generateAssetTable(requirement, items),
    ``,
    `## 期望完成`,
    requirement.expectedDueDate,
  ].join('\n')
  return { title, description }
}
