import type { AssetItem, Requirement } from '@/domains/requirement/types'
import type { DeviceEncoding } from '@/domains/device/types'

/**
 * 需求文档（飞书 docx）的"蓝图"中间表示。
 * 纯函数生成，不依赖飞书 SDK。
 * 渲染到真实 docx block 在 integrations/feishu/docx.ts。
 */

export type Blueprint = {
  title: string
  blocks: BlueprintBlock[]
}

export type BlueprintBlock =
  | { kind: 'h2'; text: string }
  | { kind: 'h3'; text: string }
  | { kind: 'p'; text: string }
  | { kind: 'callout'; text: string }
  | {
      kind: 'table'
      columns: string[]
      rows: string[][]
      columnWidths?: number[] // 像素宽，可选
    }

const SPEC_HEADER = ['编号', '涉及环节', '示例', 'Light', 'Dark', '格式', '验收结果']
const SPEC_COL_WIDTHS = [58, 110, 234, 175, 175, 100, 276]

function specCellText(item: AssetItem): string {
  const size = `${item.size.width}*${item.size.height}`
  if (item.assetKind === 'dynamic' && item.fps) {
    return `${item.format}\n${size}\n${item.fps}帧每秒`
  }
  return `${item.format}\n${size}`
}

function groupByCategory(items: AssetItem[]): Map<string, AssetItem[]> {
  const groups = new Map<string, AssetItem[]>()
  for (const item of items) {
    const list = groups.get(item.category) ?? []
    list.push(item)
    groups.set(item.category, list)
  }
  for (const [key, list] of groups) {
    list.sort((a, b) => a.sortOrder - b.sortOrder)
    groups.set(key, list)
  }
  return groups
}

/**
 * 生成需求 docx 的蓝图。
 *
 * 文档结构（参照模板 O3J9dc7O0ouzeTxv7DkcLtfEndf 但简化）：
 *   标题（创建 doc 时的 title 字段，不在 blocks 内）
 *   ## 版本记录    + 4列2行表
 *   ## 需求分工    + 6列2行表
 *   ## 需求背景    + 段落
 *   ## SN 编码规则（若有 encoding）+ 段落 + 表
 *   ## 范围
 *     ### {category}    + 7列表（按该分组的 assetItem 行）
 *     ...
 *   ## 模型 / 附件 / Figma（callout 占位，让设计填）
 */
export function generateRequirementDocBlueprint(args: {
  requirement: Requirement
  assetItems: AssetItem[]
  encoding: DeviceEncoding | null
  /** 文档创建当天（yyyy.MM.dd 风格） */
  today: string
  /** 参考模板 docx URL。生成的文档末尾会贴这个链接，让设计去模板看示例图 */
  templateDocUrl?: string
}): Blueprint {
  const { requirement, assetItems, encoding, today, templateDocUrl } = args
  const pm = requirement.creatorName || '产品经理'
  const blocks: BlueprintBlock[] = []

  // 版本记录
  blocks.push({ kind: 'h2', text: '版本记录' })
  blocks.push({
    kind: 'table',
    columns: ['修订时间', '版本', '修订人', '主要变更内容'],
    columnWidths: [142, 117, 116, 445],
    rows: [[today, 'v1.0', `@${pm}`, '创建文档']],
  })

  // 需求分工
  blocks.push({ kind: 'h2', text: '需求分工' })
  blocks.push({
    kind: 'table',
    columns: ['产品经理', '交互设计师', '视觉设计师', 'GUI开发', '底层开发', '测试'],
    columnWidths: [137, 137, 137, 137, 137, 137],
    rows: [[`@${pm}`, 'xx', 'xx', 'xx', 'xx', 'xx']],
  })

  // 需求背景
  blocks.push({ kind: 'h2', text: '需求背景' })
  const backgroundLines = [
    `即将推出 ${requirement.targetDevice}，app 端需新增相关图片与动画资源。`,
  ]
  if (requirement.successMetric) {
    backgroundLines.push(`需求指标：${requirement.successMetric}`)
  }
  blocks.push({ kind: 'p', text: backgroundLines.join('\n') })

  // SN 编码规则
  if (encoding) {
    blocks.push({ kind: 'h2', text: 'SN 编码规则' })
    blocks.push({
      kind: 'p',
      text: `通过序列号判断是否为 ${encoding.deviceName}（${encoding.deviceCode}），选择对应 UI 资源展示。\n示例 SN：${encoding.example}`,
    })
    blocks.push({
      kind: 'table',
      columns: ['位段', '含义', '编码规则'],
      columnWidths: [80, 160, 480],
      rows: encoding.positions.map((p) => [p.range, p.name, p.rule]),
    })
    if (encoding.note) {
      blocks.push({ kind: 'callout', text: encoding.note })
    }
  } else {
    blocks.push({ kind: 'h2', text: 'SN 编码规则' })
    blocks.push({
      kind: 'callout',
      text: `「${requirement.targetDevice}」的 SN 编码规则待补充。请在工具的「设备编码库」中添加后重新生成本文档。`,
    })
  }

  // 范围（按 category 分组，每组一个表）
  blocks.push({ kind: 'h2', text: '范围' })
  const groups = groupByCategory(assetItems)
  if (groups.size === 0) {
    blocks.push({ kind: 'callout', text: '本需求未勾选任何资源项。' })
  } else {
    for (const [category, items] of groups) {
      blocks.push({ kind: 'h3', text: category })
      const rows: string[][] = items.map((item, i) => [
        String(i + 1),
        item.scene,
        item.assetName, // 示例列：放资源名作为引导，让设计后续替换为示意图
        item.themes.includes('light') ? '' : '—',
        item.themes.includes('dark') ? '' : '—',
        specCellText(item),
        '',
      ])
      blocks.push({
        kind: 'table',
        columns: SPEC_HEADER,
        columnWidths: SPEC_COL_WIDTHS,
        rows,
      })
    }
  }

  // 示例图片参考（v1 不嵌图，给模板链接让设计自己看）
  if (templateDocUrl) {
    blocks.push({ kind: 'h2', text: '示例图片参考' })
    blocks.push({
      kind: 'p',
      text: `本文档暂不直接嵌入示例图。请参考标准模板查看每个资源位的视觉示意：\n${templateDocUrl}`,
    })
  }

  // 附件占位（让设计/PM 补）
  blocks.push({ kind: 'h2', text: '附件' })
  blocks.push({
    kind: 'callout',
    text: '附件区由设计/产品后续补充：\n· 模型文件（CAD / CMF / 平面图）\n· 动态图资源包\n· 静态图资源包\n· Figma 切图链接',
  })

  return { title: requirement.title, blocks }
}

/**
 * 把蓝图渲染成 Lark-flavored Markdown 字符串。
 * v1 实现 lark-cli `docs +create --markdown -` 使用这种格式。
 * 切换到原生 docx block API 时另写一个 renderer，蓝图复用。
 */
export function renderBlueprintAsMarkdown(blueprint: Blueprint): string {
  const lines: string[] = []
  lines.push(`# ${blueprint.title}`, '')

  for (const block of blueprint.blocks) {
    switch (block.kind) {
      case 'h2':
        lines.push(`## ${block.text}`, '')
        break
      case 'h3':
        lines.push(`### ${block.text}`, '')
        break
      case 'p':
        for (const para of block.text.split('\n')) lines.push(para)
        lines.push('')
        break
      case 'callout':
        // Lark markdown 支持 > 引用块；用 💡 emoji 标识
        for (const para of block.text.split('\n')) lines.push(`> ${para}`)
        lines.push('')
        break
      case 'table': {
        // 表格内 cell 里不能有原始换行（会破坏 markdown），用 <br/> 替换
        const escape = (s: string) =>
          (s ?? '').replace(/\|/g, '\\|').replace(/\n/g, '<br/>').trim() || ' '
        lines.push(`| ${block.columns.map(escape).join(' | ')} |`)
        lines.push(`| ${block.columns.map(() => '---').join(' | ')} |`)
        for (const row of block.rows) {
          // 补齐列数（防止 row 数组短于 columns）
          const padded = [...row]
          while (padded.length < block.columns.length) padded.push('')
          lines.push(`| ${padded.map(escape).join(' | ')} |`)
        }
        lines.push('')
        break
      }
    }
  }
  return lines.join('\n')
}

