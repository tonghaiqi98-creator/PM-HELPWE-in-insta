import type {
  CreateRequirementRecord,
  RequirementRepository,
} from '@/domains/requirement/repository'
import type {
  IntakePlatform,
  Platform,
  Priority,
  Requirement,
  RequirementFilter,
  RequirementStatus,
  RequirementType,
  UpdateRequirementInput,
} from '@/domains/requirement/types'
import { newRequirementId } from '@/domains/requirement/service'
import { getEnv } from '@/lib/env'
import {
  createRecord,
  deleteRecord,
  listRecords,
  updateRecord,
  type BitableRecord,
} from '@/integrations/feishu/bitable'
import {
  decodeDateTime,
  decodeMultiSelect,
  decodeSelect,
  decodeText,
  encodeDateTime,
  eqFilter,
} from './_codec'

// 字段名映射：ts 字段 → base 中文字段名
const F = {
  id: 'id',
  title: '需求标题',
  targetDevice: '目标设备',
  type: '需求类型',
  intakePlatform: '平台',
  appPlatforms: 'APP端',
  successMetric: '成功指标',
  priority: '优先级',
  expectedDueDate: '预计完成日期',
  remark: '备注',
  status: '状态',
  documentToken: '需求文档Token',
  documentUrl: '需求文档链接',
  designIntakeRecordId: '设计收单RecordId',
  designIntakeUrl: '设计收单链接',
  creatorOpenId: '创建人OpenId',
  creatorName: '创建人姓名',
  createdAt: '创建时间',
  updatedAt: '更新时间',
} as const

export class BitableRequirementRepository implements RequirementRepository {
  private app() {
    const env = getEnv()
    return {
      appToken: env.FEISHU_BITABLE_APP_TOKEN,
      tableId: env.FEISHU_BITABLE_TABLE_REQUIREMENTS,
    }
  }

  async list(filter: RequirementFilter): Promise<Requirement[]> {
    const { appToken, tableId } = this.app()
    const items: Requirement[] = []
    let pageToken: string | undefined
    do {
      const res = await listRecords(appToken, tableId, { page_size: 100, page_token: pageToken })
      for (const r of res.items) {
        const req = recordToRequirement(r)
        if (req) items.push(req)
      }
      pageToken = res.hasMore ? res.pageToken : undefined
    } while (pageToken)

    return items
      .filter((r) => {
        if (filter.creatorOpenId && r.creatorOpenId !== filter.creatorOpenId) return false
        if (filter.status?.length && !filter.status.includes(r.status)) return false
        return true
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }

  async get(id: string): Promise<Requirement | null> {
    const { appToken, tableId } = this.app()
    const { items } = await listRecords(appToken, tableId, {
      filter: eqFilter(F.id, id),
      page_size: 1,
    })
    return items[0] ? recordToRequirement(items[0]) : null
  }

  async create(input: CreateRequirementRecord): Promise<Requirement> {
    const { appToken, tableId } = this.app()
    const now = new Date().toISOString()
    const req: Requirement = {
      ...input,
      id: newRequirementId(),
      createdAt: now,
      updatedAt: now,
    }
    await createRecord(appToken, tableId, requirementToFields(req))
    return req
  }

  async update(id: string, patch: UpdateRequirementInput): Promise<Requirement> {
    const { appToken, tableId } = this.app()
    const recordId = await findRecordId(appToken, tableId, id)
    if (!recordId) throw new Error(`requirement not found: ${id}`)
    const current = await this.get(id)
    if (!current) throw new Error(`requirement not found: ${id}`)
    const updated: Requirement = {
      ...current,
      ...patch,
      updatedAt: new Date().toISOString(),
    }
    await updateRecord(appToken, tableId, recordId, requirementToFields(updated))
    return updated
  }

  async delete(id: string): Promise<void> {
    const { appToken, tableId } = this.app()
    const recordId = await findRecordId(appToken, tableId, id)
    if (!recordId) return
    await deleteRecord(appToken, tableId, recordId)
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

function requirementToFields(r: Requirement): Record<string, unknown> {
  return {
    [F.id]: r.id,
    [F.title]: r.title,
    [F.targetDevice]: r.targetDevice,
    [F.type]: r.type,
    [F.intakePlatform]: r.intakePlatform,
    [F.appPlatforms]: r.appPlatforms,
    [F.successMetric]: r.successMetric ?? null,
    [F.priority]: r.priority,
    [F.expectedDueDate]: encodeDateTime(r.expectedDueDate),
    [F.remark]: r.remark ?? null,
    [F.status]: r.status,
    [F.documentToken]: r.documentToken ?? null,
    [F.documentUrl]: r.documentUrl ?? null,
    [F.designIntakeRecordId]: r.designIntakeRecordId ?? null,
    [F.designIntakeUrl]: r.designIntakeUrl ?? null,
    [F.creatorOpenId]: r.creatorOpenId,
    [F.creatorName]: r.creatorName,
    [F.createdAt]: encodeDateTime(r.createdAt),
    [F.updatedAt]: encodeDateTime(r.updatedAt),
  }
}

function recordToRequirement(r: BitableRecord): Requirement | null {
  const f = r.fields
  const id = decodeText(f[F.id])
  if (!id) return null
  return {
    id,
    title: decodeText(f[F.title]) ?? '',
    targetDevice: decodeText(f[F.targetDevice]) ?? '',
    type: (decodeSelect(f[F.type]) ?? 'type_1') as RequirementType,
    intakePlatform: (decodeSelect(f[F.intakePlatform]) ?? '软件') as IntakePlatform,
    appPlatforms: decodeMultiSelect(f[F.appPlatforms]) as Platform[],
    successMetric: decodeText(f[F.successMetric]),
    priority: (decodeSelect(f[F.priority]) ?? 'P1') as Priority,
    expectedDueDate: decodeDateTime(f[F.expectedDueDate])?.slice(0, 10) ?? '',
    remark: decodeText(f[F.remark]),
    status: (decodeSelect(f[F.status]) ?? 'draft') as RequirementStatus,
    documentToken: decodeText(f[F.documentToken]),
    documentUrl: decodeText(f[F.documentUrl]),
    designIntakeRecordId: decodeText(f[F.designIntakeRecordId]),
    designIntakeUrl: decodeText(f[F.designIntakeUrl]),
    creatorOpenId: decodeText(f[F.creatorOpenId]) ?? '',
    creatorName: decodeText(f[F.creatorName]) ?? '',
    createdAt: decodeDateTime(f[F.createdAt]) ?? new Date(0).toISOString(),
    updatedAt: decodeDateTime(f[F.updatedAt]) ?? new Date(0).toISOString(),
  }
}

