import type {
  AssetTemplate,
  CreateTemplateInput,
  TemplateFilter,
  UpdateTemplateInput,
} from './types'

export interface TemplateRepository {
  list(filter: TemplateFilter): Promise<AssetTemplate[]>
  get(id: string): Promise<AssetTemplate | null>
  create(input: CreateTemplateInput): Promise<AssetTemplate>
  update(id: string, patch: UpdateTemplateInput): Promise<AssetTemplate>
  delete(id: string): Promise<void>
}

export async function getTemplateRepository(): Promise<TemplateRepository> {
  const { shouldUseBitableFor } = await import('@/lib/repo-source')
  if (shouldUseBitableFor('FEISHU_BITABLE_TABLE_TEMPLATES')) {
    const m = await import('@/integrations/feishu/repositories/template.bitable')
    return new m.BitableTemplateRepository()
  }
  const m = await import('@/integrations/mock/template.mock')
  return new m.MockTemplateRepository()
}
