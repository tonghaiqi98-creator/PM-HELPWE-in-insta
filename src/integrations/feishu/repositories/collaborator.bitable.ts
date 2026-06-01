import { randomUUID } from 'node:crypto'
import type { CollaboratorRepository } from '@/domains/collaborator/repository'
import type {
  AddCollaboratorInput,
  Collaborator,
  CollaboratorRole,
} from '@/domains/collaborator/types'
import { getEnv } from '@/lib/env'
import {
  createRecord,
  deleteRecord,
  listRecords,
  updateRecord,
  type BitableRecord,
} from '@/integrations/feishu/bitable'
import { decodeBoolean, decodeSelect, decodeText, eqFilter } from './_codec'

const F = {
  id: 'id',
  requirementId: '关联需求ID',
  memberOpenId: '成员OpenId',
  role: '角色',
  receiveNotification: '接收通知',
} as const

export class BitableCollaboratorRepository implements CollaboratorRepository {
  private app() {
    const env = getEnv()
    return {
      appToken: env.FEISHU_BITABLE_APP_TOKEN,
      tableId: env.FEISHU_BITABLE_TABLE_COLLABORATORS,
    }
  }

  async listByRequirement(requirementId: string): Promise<Collaborator[]> {
    const { appToken, tableId } = this.app()
    const { items } = await listRecords(appToken, tableId, {
      filter: eqFilter(F.requirementId, requirementId),
      page_size: 100,
    })
    return items.map(recordToCollaborator).filter((c): c is Collaborator => c !== null)
  }

  async listByMember(memberOpenId: string): Promise<Collaborator[]> {
    const { appToken, tableId } = this.app()
    const { items } = await listRecords(appToken, tableId, {
      filter: eqFilter(F.memberOpenId, memberOpenId),
      page_size: 100,
    })
    return items.map(recordToCollaborator).filter((c): c is Collaborator => c !== null)
  }

  async add(input: AddCollaboratorInput): Promise<Collaborator> {
    const { appToken, tableId } = this.app()
    const c: Collaborator = { id: `col_${randomUUID()}`, ...input }
    await createRecord(appToken, tableId, collaboratorToFields(c))
    return c
  }

  async updateRole(id: string, role: CollaboratorRole): Promise<Collaborator> {
    const { appToken, tableId } = this.app()
    const recordId = await findRecordId(appToken, tableId, id)
    if (!recordId) throw new Error(`collaborator not found: ${id}`)
    const current = await this.findById(id)
    if (!current) throw new Error(`collaborator not found: ${id}`)
    const updated: Collaborator = { ...current, role }
    await updateRecord(appToken, tableId, recordId, collaboratorToFields(updated))
    return updated
  }

  async remove(id: string): Promise<void> {
    const { appToken, tableId } = this.app()
    const recordId = await findRecordId(appToken, tableId, id)
    if (!recordId) return
    await deleteRecord(appToken, tableId, recordId)
  }

  private async findById(id: string): Promise<Collaborator | null> {
    const { appToken, tableId } = this.app()
    const { items } = await listRecords(appToken, tableId, {
      filter: eqFilter(F.id, id),
      page_size: 1,
    })
    return items[0] ? recordToCollaborator(items[0]) : null
  }
}

async function findRecordId(
  appToken: string,
  tableId: string,
  id: string,
): Promise<string | null> {
  const { items } = await listRecords(appToken, tableId, {
    filter: eqFilter(F.id, id),
    page_size: 1,
  })
  return items[0]?.record_id ?? null
}

function collaboratorToFields(c: Collaborator): Record<string, unknown> {
  return {
    [F.id]: c.id,
    [F.requirementId]: c.requirementId,
    [F.memberOpenId]: c.memberOpenId,
    [F.role]: c.role,
    [F.receiveNotification]: c.receiveNotification,
  }
}

function recordToCollaborator(r: BitableRecord): Collaborator | null {
  const f = r.fields
  const id = decodeText(f[F.id])
  if (!id) return null
  return {
    id,
    requirementId: decodeText(f[F.requirementId]) ?? '',
    memberOpenId: decodeText(f[F.memberOpenId]) ?? '',
    role: (decodeSelect(f[F.role]) ?? 'watcher') as CollaboratorRole,
    receiveNotification: decodeBoolean(f[F.receiveNotification]) ?? true,
  }
}
