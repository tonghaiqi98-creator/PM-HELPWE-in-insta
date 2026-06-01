import type { AssetItem, Requirement } from './types'
import type { DeviceEncoding } from '@/domains/device/types'
import {
  generateRequirementDocBlueprint,
  renderBlueprintAsMarkdown,
} from '@/domains/generator/design-docx'

/**
 * 需求 docx 生成器：把 requirement + assetItems + encoding 写成飞书 docx。
 *
 * v1 实现：lark-cli subprocess（用童海奇个人身份）
 * 切换路径：拿到 PM helper 应用的 docx OpenAPI 权限后，新增 FeishuApiDocxGenerator 实现并改下面工厂
 */
export interface DocxGenerator {
  readonly name: string
  generate(input: GenerateDocxInput): Promise<GenerateDocxResult>
}

export type GenerateDocxInput = {
  requirement: Requirement
  assetItems: AssetItem[]
  encoding: DeviceEncoding | null
  folderToken?: string
  /** 参考模板 docx URL，会嵌到生成的文档末尾"示例图片参考"段 */
  templateDocUrl?: string
}

export type GenerateDocxResult =
  | { ok: true; documentToken: string; documentUrl: string }
  | { ok: false; error: string; skipped?: boolean }

function todayYmd(): string {
  const d = new Date()
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}.${mm}.${dd}`
}

class LarkCliDocxGenerator implements DocxGenerator {
  readonly name = 'lark-cli'

  async generate(input: GenerateDocxInput): Promise<GenerateDocxResult> {
    try {
      const { createDocxViaLarkCli } = await import('@/integrations/lark-cli/docx')
      const blueprint = generateRequirementDocBlueprint({
        requirement: input.requirement,
        assetItems: input.assetItems,
        encoding: input.encoding,
        today: todayYmd(),
        templateDocUrl: input.templateDocUrl,
      })
      const markdown = renderBlueprintAsMarkdown(blueprint)
      const result = await createDocxViaLarkCli({
        folderToken: input.folderToken,
        title: blueprint.title,
        markdown,
      })
      return {
        ok: true,
        documentToken: result.documentToken,
        documentUrl: result.documentUrl,
      }
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : String(err) }
    }
  }
}

let cached: DocxGenerator | null = null

export function getDocxGenerator(): DocxGenerator {
  if (cached) return cached
  cached = new LarkCliDocxGenerator()
  return cached
}
