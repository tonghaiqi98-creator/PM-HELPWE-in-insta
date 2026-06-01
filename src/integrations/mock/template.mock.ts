import { randomUUID } from 'node:crypto'
import type { TemplateRepository } from '@/domains/template/repository'
import type {
  AssetTemplate,
  CreateTemplateInput,
  TemplateFilter,
  UpdateTemplateInput,
} from '@/domains/template/types'
import { getStore } from './store'

export class MockTemplateRepository implements TemplateRepository {
  async list(filter: TemplateFilter): Promise<AssetTemplate[]> {
    const all = Array.from(getStore().templates.values())
    return all
      .filter((t) => {
        if (filter.module && t.module !== filter.module) return false
        if (filter.category && t.category !== filter.category) return false
        if (filter.assetKind && t.assetKind !== filter.assetKind) return false
        if (filter.keyword) {
          const kw = filter.keyword.toLowerCase()
          const hay = `${t.module} ${t.category} ${t.scene} ${t.assetName}`.toLowerCase()
          if (!hay.includes(kw)) return false
        }
        return true
      })
      .sort((a, b) => a.category.localeCompare(b.category) || a.sortOrder - b.sortOrder)
  }
  async get(id: string): Promise<AssetTemplate | null> {
    return getStore().templates.get(id) ?? null
  }
  async create(input: CreateTemplateInput): Promise<AssetTemplate> {
    const t: AssetTemplate = { ...input, id: `tpl_${randomUUID()}` }
    getStore().templates.set(t.id, t)
    return t
  }
  async update(id: string, patch: UpdateTemplateInput): Promise<AssetTemplate> {
    const store = getStore()
    const existing = store.templates.get(id)
    if (!existing) throw new Error(`template not found: ${id}`)
    const updated: AssetTemplate = { ...existing, ...patch }
    store.templates.set(id, updated)
    return updated
  }
  async delete(id: string): Promise<void> {
    getStore().templates.delete(id)
  }
}
