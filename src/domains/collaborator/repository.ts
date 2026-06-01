import type { Collaborator, AddCollaboratorInput, CollaboratorRole } from './types'

export interface CollaboratorRepository {
  listByRequirement(requirementId: string): Promise<Collaborator[]>
  listByMember(memberOpenId: string): Promise<Collaborator[]>
  add(input: AddCollaboratorInput): Promise<Collaborator>
  updateRole(id: string, role: CollaboratorRole): Promise<Collaborator>
  remove(id: string): Promise<void>
}

export async function getCollaboratorRepository(): Promise<CollaboratorRepository> {
  const { shouldUseBitableFor } = await import('@/lib/repo-source')
  if (shouldUseBitableFor('FEISHU_BITABLE_TABLE_COLLABORATORS')) {
    const m = await import('@/integrations/feishu/repositories/collaborator.bitable')
    return new m.BitableCollaboratorRepository()
  }
  const m = await import('@/integrations/mock/collaborator.mock')
  return new m.MockCollaboratorRepository()
}
