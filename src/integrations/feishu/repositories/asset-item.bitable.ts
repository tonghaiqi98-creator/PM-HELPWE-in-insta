import { randomUUID } from 'node:crypto'
import type { AssetItemRepository } from '@/domains/requirement/asset-item-repository'
import type {
  AssetItem,
  AssetItemStatus,
  CreateAssetItemInput,
} from '@/domains/requirement/types'
import type { AssetKind, ImageFormat, Theme } from '@/domains/template/types'
import { getEnv } from '@/lib/env'
import {
  createRecord,
  deleteRecord,
  listRecords,
  updateRecord,
  type BitableRecord,
} from '@/integrations/feishu/bitable'
import {
  decodeMultiSelect,
  decodeNumber,
  decodeSelect,
  decodeText,
  eqFilter,
} from './_codec'

const F = {
  id: 'id',
  requirementId: '关联需求ID',
  templateId: '关联模板ID',
  targetDevice: '目标设备',
  module: '模块',
  category: '目录',
  scene: '场景',
  assetName: '资源名',
  assetKind: '资源类型',
  format: '格式',
  width: '宽度',
  height: '高度',
  fps: '帧率',
  themes: '主题',
  status: '交付状态',
  deliveredUrl: '交付链接',
  acceptanceNote: '验收备注',
  sortOrder: '排序',
} as const

export class BitableAssetItemRepository implements AssetItemRepository {
  private app() {
    const env = getEnv()
    return {
      appToken: env.FEISHU_BITABLE_APP_TOKEN,
      tableId: env.FEISHU_BITABLE_TABLE_ASSET_ITEMS,
    }
  }

  async listByRequirement(requirementId: string): Promise<AssetItem[]> {
    const { appToken, tableId } = this.app()
    const out: AssetItem[] = []
    let pageToken: string | undefined
    do {
      const res = await listRecords(appToken, tableId, {
        filter: eqFilter(F.requirementId, requirementId),
        page_size: 100,
        page_token: pageToken,
      })
      for (const r of res.items) {
        const it = recordToAssetItem(r)
        if (it) out.push(it)
      }
      pageToken = res.hasMore ? res.pageToken : undefined
    } while (pageToken)
    return out.sort((a, b) => a.sortOrder - b.sortOrder)
  }

  async batchCreate(
    requirementId: string,
    targetDevice: string,
    items: CreateAssetItemInput[],
  ): Promise<AssetItem[]> {
    const { appToken, tableId } = this.app()
    const created: AssetItem[] = []
    for (const input of items) {
      const item: AssetItem = {
        ...input,
        id: `ai_${randomUUID()}`,
        requirementId,
        targetDevice,
        status: input.status ?? 'pending',
      }
      await createRecord(appToken, tableId, assetItemToFields(item))
      created.push(item)
    }
    return created
  }

  async update(id: string, patch: Partial<AssetItem>): Promise<AssetItem> {
    const { appToken, tableId } = this.app()
    const recordId = await findRecordId(appToken, tableId, id)
    if (!recordId) throw new Error(`asset item not found: ${id}`)
    const current = await this.findById(id)
    if (!current) throw new Error(`asset item not found: ${id}`)
    const updated = { ...current, ...patch }
    await updateRecord(appToken, tableId, recordId, assetItemToFields(updated))
    return updated
  }

  async delete(id: string): Promise<void> {
    const { appToken, tableId } = this.app()
    const recordId = await findRecordId(appToken, tableId, id)
    if (!recordId) return
    await deleteRecord(appToken, tableId, recordId)
  }

  private async findById(id: string): Promise<AssetItem | null> {
    const { appToken, tableId } = this.app()
    const { items } = await listRecords(appToken, tableId, {
      filter: eqFilter(F.id, id),
      page_size: 1,
    })
    return items[0] ? recordToAssetItem(items[0]) : null
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

function assetItemToFields(it: AssetItem): Record<string, unknown> {
  return {
    [F.id]: it.id,
    [F.requirementId]: it.requirementId,
    [F.templateId]: it.templateId ?? null,
    [F.targetDevice]: it.targetDevice,
    [F.module]: it.module,
    [F.category]: it.category,
    [F.scene]: it.scene,
    [F.assetName]: it.assetName,
    [F.assetKind]: it.assetKind,
    [F.format]: it.format,
    [F.width]: it.size.width,
    [F.height]: it.size.height,
    [F.fps]: it.fps ?? null,
    [F.themes]: it.themes,
    [F.status]: it.status,
    [F.deliveredUrl]: it.deliveredUrl ?? null,
    [F.acceptanceNote]: it.acceptanceNote ?? null,
    [F.sortOrder]: it.sortOrder,
  }
}

function recordToAssetItem(r: BitableRecord): AssetItem | null {
  const f = r.fields
  const id = decodeText(f[F.id])
  if (!id) return null
  return {
    id,
    requirementId: decodeText(f[F.requirementId]) ?? '',
    templateId: decodeText(f[F.templateId]),
    targetDevice: decodeText(f[F.targetDevice]) ?? '',
    module: decodeText(f[F.module]) ?? '',
    category: decodeText(f[F.category]) ?? '',
    scene: decodeText(f[F.scene]) ?? '',
    assetName: decodeText(f[F.assetName]) ?? '',
    assetKind: (decodeSelect(f[F.assetKind]) ?? 'static') as AssetKind,
    format: (decodeSelect(f[F.format]) ?? 'png') as ImageFormat,
    size: {
      width: decodeNumber(f[F.width]) ?? 0,
      height: decodeNumber(f[F.height]) ?? 0,
    },
    fps: decodeNumber(f[F.fps]),
    themes: decodeMultiSelect(f[F.themes]) as Theme[],
    status: (decodeSelect(f[F.status]) ?? 'pending') as AssetItemStatus,
    deliveredUrl: decodeText(f[F.deliveredUrl]),
    acceptanceNote: decodeText(f[F.acceptanceNote]),
    sortOrder: decodeNumber(f[F.sortOrder]) ?? 0,
  }
}
