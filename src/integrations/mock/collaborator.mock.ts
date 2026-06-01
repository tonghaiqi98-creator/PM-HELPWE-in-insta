import { randomUUID } from 'node:crypto'
import type { CollaboratorRepository } from '@/domains/collaborator/repository'
import type {
  AddCollaboratorInput,
  Collaborator,
  CollaboratorRole,
} from '@/domains/collaborator/types'
import { getStore } from './store'

export class MockCollaboratorRepository implements CollaboratorRepository {
  async listByRequirement(requirementId: string): Promise<Collaborator[]> {
    return Array.from(getStore().collaborators.values()).filter(
      (c) => c.requirementId === requirementId,
    )
  }
  async listByMember(memberOpenId: string): Promise<Collaborator[]> {
    return Array.from(getStore().collaborators.values()).filter(
      (c) => c.memberOpenId === memberOpenId,
    )
  }
  async add(input: AddCollaboratorInput): Promise<Collaborator> {
    const c: Collaborator = { id: `col_${randomUUID()}`, ...input }
    getStore().collaborators.set(c.id, c)
    return c
  }
  async updateRole(id: string, role: CollaboratorRole): Promise<Collaborator> {
    const store = getStore()
    const existing = store.collaborators.get(id)
    if (!existing) throw new Error(`collaborator not found: ${id}`)
    const updated = { ...existing, role }
    store.collaborators.set(id, updated)
    return updated
  }
  async remove(id: string): Promise<void> {
    getStore().collaborators.delete(id)
  }
}
