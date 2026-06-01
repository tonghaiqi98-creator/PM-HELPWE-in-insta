import { randomUUID } from 'node:crypto'
import type { TemplateRepository } from '@/domains/template/repository'
import type {
  AssetKind,
  AssetTemplate,
  CreateTemplateInput,
  ImageFormat,
  TemplateFilter,
  UpdateTemplateInput,
} from '@/domains/template/types'
import { getEnv } from '@/lib/env'
import {
  createRecord,
  deleteRecord,
  listRecords,
  updateRecord,
  type BitableRecord,
} from '@/integrations/feishu/bitable'
import {
  decodeBoolean,
  decodeNumber,
  decodeSelect,
  decodeText,
  eqFilter,
} from './_codec'

export class BitableTemplateRepository implements TemplateRepository {
  private app() {
    const env = getEnv()
    return {
      appToken: env.FEISHU_BITABLE_APP_TOKEN,
      tableId: env.FEISHU_BITABLE_TABLE_TEMPLATES,
    }
  }

  async list(filter: TemplateFilter): Promise<AssetTemplate[]> {
    const { appToken, tableId } = this.app()
    const items: AssetTemplate[] = []
    let pageToken: string | undefined
    do {
      const res = await listRecords(appToken, tableId, { page_size: 100, page_token: pageToken })
      for (const r of res.items) {
        const t = recordToTemplate(r)
        if (t) items.push(t)
      }
      pageToken = res.hasMore ? res.pageToken : undefined
    } while (pageToken)

    return items
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
    const { appToken, tableId } = this.app()
    const { items } = await listRecords(appToken, tableId, {
      filter: eqFilter('id', id),
      page_size: 1,
    })
    return items[0] ? recordToTemplate(items[0]) : null
  }

  async create(input: CreateTemplateInput): Promise<AssetTemplate> {
    const { appToken, tableId } = this.app()
    const t: AssetTemplate = { ...input, id: `tpl_${randomUUID()}` }
    await createRecord(appToken, tableId, templateToFields(t))
    return t
  }

  async update(id: string, patch: UpdateTemplateInput): Promise<AssetTemplate> {
    const { appToken, tableId } = this.app()
    const recordId = await findRecordId(appToken, tableId, id)
    if (!recordId) throw new Error(`template not found: ${id}`)
    const current = await this.get(id)
    if (!current) throw new Error(`template not found: ${id}`)
    const updated: AssetTemplate = { ...current, ...patch }
    await updateRecord(appToken, tableId, recordId, templateToFields(updated))
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
    filter: eqFilter('id', id),
    page_size: 1,
  })
  return items[0]?.record_id ?? null
}

function templateToFields(t: AssetTemplate): Record<string, unknown> {
  return {
    id: t.id,
    module: t.module,
    category: t.category,
    scene: t.scene,
    assetName: t.assetName,
    assetKind: t.assetKind,
    format: t.format,
    defaultWidth: t.defaultSize.width,
    defaultHeight: t.defaultSize.height,
    fps: t.fps ?? null,
    hasThemeVariants: t.hasThemeVariants,
    namingRule: t.namingRule ?? null,
    devModule: t.devModule ?? null,
    exampleImageToken: t.exampleImageToken ?? null,
    note: t.note ?? null,
    sortOrder: t.sortOrder,
  }
}

function recordToTemplate(r: BitableRecord): AssetTemplate | null {
  const f = r.fields
  const id = decodeText(f.id)
  if (!id) return null
  return {
    id,
    module: decodeText(f.module) ?? '',
    category: decodeText(f.category) ?? '',
    scene: decodeText(f.scene) ?? '',
    assetName: decodeText(f.assetName) ?? '',
    assetKind: (decodeSelect(f.assetKind) ?? 'static') as AssetKind,
    format: (decodeSelect(f.format) ?? 'png') as ImageFormat,
    defaultSize: {
      width: decodeNumber(f.defaultWidth) ?? 0,
      height: decodeNumber(f.defaultHeight) ?? 0,
    },
    fps: decodeNumber(f.fps),
    hasThemeVariants: decodeBoolean(f.hasThemeVariants) ?? false,
    namingRule: decodeText(f.namingRule),
    devModule: decodeText(f.devModule),
    exampleImageToken: decodeText(f.exampleImageToken),
    note: decodeText(f.note),
    sortOrder: decodeNumber(f.sortOrder) ?? 0,
  }
}
