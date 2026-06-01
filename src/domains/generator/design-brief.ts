import type { AssetItem, Requirement } from '@/domains/requirement/types'

function specLine(item: AssetItem): string {
  const size = `${item.size.width}×${item.size.height}`
  const fps = item.assetKind === 'dynamic' && item.fps ? ` ${item.fps}fps` : ''
  const themes = item.themes.length ? ` [${item.themes.join('/')}]` : ''
  return `${item.format} ${size}${fps}${themes}`
}

/**
 * 生成需求的资源清单 markdown（「范围」表）。
 * 用于需求详情页展示 / 备注 / 未来生成飞书 docx。
 * 纯函数。
 */
export function generateAssetTable(
  requirement: Requirement,
  items: AssetItem[],
): string {
  const lines: string[] = [
    `# ${requirement.title}`,
    ``,
    `- 设备：${requirement.targetDevice}`,
    `- 平台：${requirement.appPlatforms.join(' / ')}`,
    `- 需求指标：${requirement.successMetric}`,
    `- 预计完成：${requirement.expectedDueDate}`,
    ``,
    `## 范围`,
    ``,
    `| 编号 | 分组 | 涉及环节 | 资源名称 | 类型 | 规格 |`,
    `| --- | --- | --- | --- | --- | --- |`,
  ]
  const sorted = [...items].sort(
    (a, b) => a.category.localeCompare(b.category) || a.sortOrder - b.sortOrder,
  )
  sorted.forEach((item, i) => {
    lines.push(
      `| ${i + 1} | ${item.category} | ${item.scene} | ${item.assetName} | ${
        item.assetKind === 'dynamic' ? '动图' : '静态图'
      } | ${specLine(item)} |`,
    )
  })
  return lines.join('\n')
}
