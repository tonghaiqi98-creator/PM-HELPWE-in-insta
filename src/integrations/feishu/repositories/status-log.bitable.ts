import { randomUUID } from 'node:crypto'
import type {
  CreateStatusLogInput,
  StatusLogRepository,
} from '@/domains/workflow/repository'
import type { StatusLog } from '@/domains/workflow/types'
import type { RequirementStatus } from '@/domains/requirement/types'
import { getEnv } from '@/lib/env'
import {
  createRecord,
  listRecords,
  type BitableRecord,
} from '@/integrations/feishu/bitable'
import {
  decodeDateTime,
  decodeSelect,
  decodeText,
  encodeDateTime,
  eqFilter,
} from './_codec'

const F = {
  id: 'id',
  requirementId: '关联需求ID',
  fromStatus: '原状态',
  toStatus: '新状态',
  operatorOpenId: '操作人OpenId',
  note: '备注',
  createdAt: '创建时间',
} as const

export class BitableStatusLogRepository implements StatusLogRepository {
  private app() {
    const env = getEnv()
    return {
      appToken: env.FEISHU_BITABLE_APP_TOKEN,
      tableId: env.FEISHU_BITABLE_TABLE_STATUS_LOGS,
    }
  }

  async listByRequirement(requirementId: string): Promise<StatusLog[]> {
    const { appToken, tableId } = this.app()
    const { items } = await listRecords(appToken, tableId, {
      filter: eqFilter(F.requirementId, requirementId),
      page_size: 100,
    })
    return items
      .map(recordToStatusLog)
      .filter((l): l is StatusLog => l !== null)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  }

  async create(input: CreateStatusLogInput): Promise<StatusLog> {
    const { appToken, tableId } = this.app()
    const log: StatusLog = {
      id: `log_${randomUUID()}`,
      ...input,
      createdAt: new Date().toISOString(),
    }
    await createRecord(appToken, tableId, statusLogToFields(log))
    return log
  }
}

function statusLogToFields(l: StatusLog): Record<string, unknown> {
  return {
    [F.id]: l.id,
    [F.requirementId]: l.requirementId,
    [F.fromStatus]: l.fromStatus,
    [F.toStatus]: l.toStatus,
    [F.operatorOpenId]: l.operatorOpenId,
    [F.note]: l.note ?? null,
    [F.createdAt]: encodeDateTime(l.createdAt),
  }
}

function recordToStatusLog(r: BitableRecord): StatusLog | null {
  const f = r.fields
  const id = decodeText(f[F.id])
  if (!id) return null
  return {
    id,
    requirementId: decodeText(f[F.requirementId]) ?? '',
    fromStatus: (decodeSelect(f[F.fromStatus]) ?? 'draft') as RequirementStatus,
    toStatus: (decodeSelect(f[F.toStatus]) ?? 'draft') as RequirementStatus,
    operatorOpenId: decodeText(f[F.operatorOpenId]) ?? '',
    note: decodeText(f[F.note]),
    createdAt: decodeDateTime(f[F.createdAt]) ?? new Date(0).toISOString(),
  }
}
