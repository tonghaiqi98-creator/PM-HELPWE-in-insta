import type {
  CreateRequirementRecord,
  RequirementRepository,
} from '@/domains/requirement/repository'
import type {
  Requirement,
  RequirementFilter,
  UpdateRequirementInput,
} from '@/domains/requirement/types'
import { newRequirementId } from '@/domains/requirement/service'
import { getStore } from './store'

export class MockRequirementRepository implements RequirementRepository {
  async list(filter: RequirementFilter): Promise<Requirement[]> {
    const all = Array.from(getStore().requirements.values())
    return all
      .filter((r) => {
        if (filter.creatorOpenId && r.creatorOpenId !== filter.creatorOpenId) return false
        if (filter.status?.length && !filter.status.includes(r.status)) return false
        return true
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }
  async get(id: string): Promise<Requirement | null> {
    return getStore().requirements.get(id) ?? null
  }
  async create(input: CreateRequirementRecord): Promise<Requirement> {
    const now = new Date().toISOString()
    const req: Requirement = { ...input, id: newRequirementId(), createdAt: now, updatedAt: now }
    getStore().requirements.set(req.id, req)
    return req
  }
  async update(id: string, patch: UpdateRequirementInput): Promise<Requirement> {
    const store = getStore()
    const existing = store.requirements.get(id)
    if (!existing) throw new Error(`requirement not found: ${id}`)
    const updated: Requirement = { ...existing, ...patch, updatedAt: new Date().toISOString() }
    store.requirements.set(id, updated)
    return updated
  }
  async delete(id: string): Promise<void> {
    getStore().requirements.delete(id)
  }
}
