import { getCollaboratorRepository } from './repository'
import type { AddCollaboratorInput, Collaborator, CollaboratorRole } from './types'

export async function addCollaborator(input: AddCollaboratorInput): Promise<Collaborator> {
  const repo = await getCollaboratorRepository()
  return repo.add(input)
}

export async function listForRequirement(requirementId: string): Promise<Collaborator[]> {
  const repo = await getCollaboratorRepository()
  return repo.listByRequirement(requirementId)
}

export async function listForMember(memberOpenId: string): Promise<Collaborator[]> {
  const repo = await getCollaboratorRepository()
  return repo.listByMember(memberOpenId)
}

export async function updateCollaboratorRole(
  id: string,
  role: CollaboratorRole,
): Promise<Collaborator> {
  const repo = await getCollaboratorRepository()
  return repo.updateRole(id, role)
}
