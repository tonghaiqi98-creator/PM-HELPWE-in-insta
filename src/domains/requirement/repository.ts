import type {
  Requirement,
  RequirementFilter,
  UpdateRequirementInput,
} from './types'

export type CreateRequirementRecord = Omit<
  Requirement,
  'id' | 'createdAt' | 'updatedAt'
>

export interface RequirementRepository {
  list(filter: RequirementFilter): Promise<Requirement[]>
  get(id: string): Promise<Requirement | null>
  create(input: CreateRequirementRecord): Promise<Requirement>
  update(id: string, patch: UpdateRequirementInput): Promise<Requirement>
  delete(id: string): Promise<void>
}

export async function getRequirementRepository(): Promise<RequirementRepository> {
  const { shouldUseBitableFor } = await import('@/lib/repo-source')
  if (shouldUseBitableFor('FEISHU_BITABLE_TABLE_REQUIREMENTS')) {
    const m = await import('@/integrations/feishu/repositories/requirement.bitable')
    return new m.BitableRequirementRepository()
  }
  const m = await import('@/integrations/mock/requirement.mock')
  return new m.MockRequirementRepository()
}
