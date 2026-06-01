/**
 * 一次性脚本：把 mock store 里的 25 条 templates 种子灌进 PM helper 数据 base。
 *
 * 跑法：npm run seed:templates
 *
 * 依赖：env BITABLE_VIA_LARK_CLI=true（让底层走 lark-cli 用户身份）
 *        FEISHU_BITABLE_APP_TOKEN + FEISHU_BITABLE_TABLE_TEMPLATES
 *
 * 行为：
 *  1. 拉当前 base 里现有 templates，按 id 去重（同 id 跳过，已存在不重复插）
 *  2. 同时清理之前 smoke test 留下的 tpl_smoke 记录
 *  3. 逐条 batch_create 新 record
 *
 * 不会破坏现有数据。再跑一遍是幂等的（已存在就跳过）。
 */

import { MockTemplateRepository } from '@/integrations/mock/template.mock'
import {
  createRecord,
  deleteRecord,
  listRecords,
} from '@/integrations/feishu/bitable'
import type { AssetTemplate } from '@/domains/template/types'

const APP_TOKEN = process.env.FEISHU_BITABLE_APP_TOKEN
const TABLE_ID = process.env.FEISHU_BITABLE_TABLE_TEMPLATES

if (!APP_TOKEN || !TABLE_ID) {
  console.error('缺 env：FEISHU_BITABLE_APP_TOKEN / FEISHU_BITABLE_TABLE_TEMPLATES')
  process.exit(1)
}

if (process.env.BITABLE_VIA_LARK_CLI !== 'true') {
  console.error('需要 BITABLE_VIA_LARK_CLI=true 才能走 lark-cli 用户身份路径')
  process.exit(1)
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

async function main() {
  const appToken = APP_TOKEN as string
  const tableId = TABLE_ID as string

  // 1. 读 mock 种子
  const mock = new MockTemplateRepository()
  const seeds = await mock.list({})
  console.log(`[seed] mock 里有 ${seeds.length} 条种子`)

  // 2. 读 base 当前内容，按 id 索引
  console.log('[seed] 读 base 现有 templates...')
  const existing = new Map<string, string>() // id → record_id
  let pageToken: string | undefined
  do {
    const res = await listRecords(appToken, tableId, { page_size: 100, page_token: pageToken })
    for (const r of res.items) {
      const id = (r.fields.id ?? '') as string
      if (id) existing.set(id, r.record_id)
    }
    pageToken = res.hasMore ? res.pageToken : undefined
  } while (pageToken)
  console.log(`[seed] base 现有 ${existing.size} 条`)

  // 3. 清理 smoke test 残留
  const smokeRecordId = existing.get('tpl_smoke')
  if (smokeRecordId) {
    console.log(`[seed] 删除 smoke 残留 record ${smokeRecordId}`)
    await deleteRecord(appToken, tableId, smokeRecordId)
    existing.delete('tpl_smoke')
  }

  // 4. 灌种子（跳过已存在）
  let inserted = 0
  let skipped = 0
  for (const t of seeds) {
    if (existing.has(t.id)) {
      skipped++
      continue
    }
    try {
      await createRecord(appToken, tableId, templateToFields(t))
      inserted++
      console.log(`[seed] + ${t.id}  ${t.category} / ${t.assetName}`)
    } catch (err) {
      console.error(`[seed] ✗ ${t.id} 失败：`, err instanceof Error ? err.message : err)
    }
  }

  console.log(`[seed] 完成。新增 ${inserted}，跳过 ${skipped}`)
}

main().catch((err) => {
  console.error('[seed] 致命错误：', err)
  process.exit(1)
})
