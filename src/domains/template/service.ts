import { getTemplateRepository } from './repository'
import { templateSchema, updateTemplateSchema } from './schema'
import type {
  AssetTemplate,
  CreateTemplateInput,
  TemplateFilter,
  UpdateTemplateInput,
} from './types'

export async function listTemplates(filter: TemplateFilter = {}): Promise<AssetTemplate[]> {
  const repo = await getTemplateRepository()
  return repo.list(filter)
}

export async function getTemplate(id: string): Promise<AssetTemplate | null> {
  const repo = await getTemplateRepository()
  return repo.get(id)
}

export async function createTemplate(input: CreateTemplateInput): Promise<AssetTemplate> {
  const parsed = templateSchema.parse(input)
  const repo = await getTemplateRepository()
  return repo.create(parsed)
}

export async function updateTemplate(
  id: string,
  patch: UpdateTemplateInput,
): Promise<AssetTemplate> {
  const parsed = updateTemplateSchema.parse(patch)
  const repo = await getTemplateRepository()
  return repo.update(id, parsed)
}

export async function deleteTemplate(id: string): Promise<void> {
  const repo = await getTemplateRepository()
  return repo.delete(id)
}

/** 按 module → category 分组，UI 用 */
export function groupByCategory(
  templates: AssetTemplate[],
): { module: string; category: string; items: AssetTemplate[] }[] {
  const map = new Map<string, AssetTemplate[]>()
  for (const t of templates) {
    const key = `${t.module}__${t.category}`
    const arr = map.get(key) ?? []
    arr.push(t)
    map.set(key, arr)
  }
  return Array.from(map.entries()).map(([key, items]) => {
    const [module, category] = key.split('__')
    return {
      module,
      category,
      items: items.sort((a, b) => a.sortOrder - b.sortOrder),
    }
  })
}
