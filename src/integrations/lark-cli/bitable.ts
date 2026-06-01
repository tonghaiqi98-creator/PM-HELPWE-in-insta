import { spawn } from 'node:child_process'
import type { BitableRecord, ListOptions } from '@/integrations/feishu/bitable'

/**
 * Bitable CRUD 通过本机 `lark-cli base +record-*` 实现，使用用户身份（童海奇）。
 *
 * 为什么走这条路：飞书不允许用户身份代应用授权 base（1063001），base owner 也只能
 * 把"人类用户"加为协作者，无法把 PM helper 应用加进去。单人开发期借 lark-cli 用童海奇
 * 个人身份直接读写 base，绕过应用授权问题。
 *
 * 注意事项：
 * - 性能：每次 spawn 子进程，~100ms 开销；本地单人足够，多人/上线必须切回应用身份
 * - 切换：env BITABLE_VIA_LARK_CLI=true 时启用；feishu/bitable.ts 的 5 个函数会路由到这里
 * - lark-cli 不支持 filter，调用方在 in-memory 过滤（现有 repository 本来就是这样）
 * - 分页：lark-cli 用 offset，page_token 在这里被当作 offset 的字符串编码
 */

type LarkCliEnvelope<T> = {
  ok: boolean
  identity?: string
  error?: unknown
  data?: T
}

type ListResultData = {
  data: unknown[][]
  fields: string[]
  field_id_list?: string[]
  record_id_list: string[]
  has_more?: boolean
}

type CreateResultData = {
  data: unknown[][]
  fields: string[]
  record_id_list: string[]
}

type GetResultData = {
  data: unknown[][]
  fields: string[]
  record_id_list: string[]
}

export async function listRecords(
  appToken: string,
  tableId: string,
  opts: ListOptions = {},
): Promise<{ items: BitableRecord[]; hasMore: boolean; pageToken?: string }> {
  // 飞书 OpenAPI 支持 filter 字符串（CurrentValue.[name]="value"），但 lark-cli +record-list 不支持。
  // 走 lark-cli 时收到 filter 就全表扫 + in-memory filter，保持上层 BitableRepository 语义一致。
  if (opts.filter) {
    const all = await listAllRecords(appToken, tableId)
    const pred = parseEqFilter(opts.filter)
    const items = pred ? all.filter(pred) : all
    return { items, hasMore: false }
  }

  const limit = opts.page_size ?? 100
  const offset = opts.page_token ? Number(opts.page_token) || 0 : 0
  const env = await runRecordList(appToken, tableId, limit, offset)
  const items = rowsToRecords(
    env.data?.data ?? [],
    env.data?.fields ?? [],
    env.data?.record_id_list ?? [],
  )
  const hasMore = env.data?.has_more === true
  return {
    items,
    hasMore,
    pageToken: hasMore ? String(offset + limit) : undefined,
  }
}

async function listAllRecords(appToken: string, tableId: string): Promise<BitableRecord[]> {
  const out: BitableRecord[] = []
  const limit = 200
  let offset = 0
  while (true) {
    const env = await runRecordList(appToken, tableId, limit, offset)
    out.push(
      ...rowsToRecords(
        env.data?.data ?? [],
        env.data?.fields ?? [],
        env.data?.record_id_list ?? [],
      ),
    )
    if (env.data?.has_more !== true) break
    offset += limit
  }
  return out
}

/**
 * 给 /data 查看页用的"原始读"：返回 lark-cli 二维数组 + 字段名，page through 所有页。
 * 没有解码、没有字段映射 —— 6 张表（含中英文字段名）通用渲染。
 */
export async function listRawTable(
  appToken: string,
  tableId: string,
): Promise<{ fields: string[]; rows: unknown[][]; recordIds: string[] }> {
  const fields: string[] = []
  const rows: unknown[][] = []
  const recordIds: string[] = []
  const limit = 200
  let offset = 0
  while (true) {
    const env = await runRecordList(appToken, tableId, limit, offset)
    if (fields.length === 0 && env.data?.fields) fields.push(...env.data.fields)
    for (const row of env.data?.data ?? []) rows.push(row)
    for (const rid of env.data?.record_id_list ?? []) recordIds.push(rid)
    if (env.data?.has_more !== true) break
    offset += limit
  }
  return { fields, rows, recordIds }
}

async function runRecordList(
  appToken: string,
  tableId: string,
  limit: number,
  offset: number,
): Promise<LarkCliEnvelope<ListResultData>> {
  return runLarkCli<ListResultData>([
    'base',
    '+record-list',
    '--base-token',
    appToken,
    '--table-id',
    tableId,
    '--limit',
    String(limit),
    '--offset',
    String(offset),
    '--format',
    'json',
  ])
}

/** 解析 `CurrentValue.[fieldName]="value"` 形态的 filter，返回判定函数 */
function parseEqFilter(filter: string): ((r: BitableRecord) => boolean) | null {
  const m = filter.match(/^CurrentValue\.\[(.+?)\]="(.*)"$/)
  if (!m) return null
  const [, fieldName, value] = m
  return (r) => {
    const v = r.fields[fieldName]
    if (v == null) return false
    if (typeof v === 'string') return v === value
    if (typeof v === 'number') return String(v) === value
    if (Array.isArray(v) && v.length > 0) {
      const first = v[0]
      if (typeof first === 'string') return first === value
      if (typeof first === 'object' && first && 'text' in first) {
        return String((first as { text: unknown }).text) === value
      }
    }
    return false
  }
}

export async function getRecord(
  appToken: string,
  tableId: string,
  recordId: string,
): Promise<BitableRecord | null> {
  const args = [
    'base',
    '+record-get',
    '--base-token',
    appToken,
    '--table-id',
    tableId,
    '--record-id',
    recordId,
    '--format',
    'json',
  ]
  try {
    const env = await runLarkCli<GetResultData>(args)
    const items = rowsToRecords(env.data?.data ?? [], env.data?.fields ?? [], env.data?.record_id_list ?? [])
    return items[0] ?? null
  } catch (err) {
    if (err instanceof Error && /not.?found|1254|RecordIdNotFound/i.test(err.message)) return null
    throw err
  }
}

export async function createRecord(
  appToken: string,
  tableId: string,
  fields: Record<string, unknown>,
): Promise<BitableRecord> {
  const { names, values } = splitFields(fields)
  const json = JSON.stringify({ fields: names, rows: [values] })
  const args = [
    'base',
    '+record-batch-create',
    '--base-token',
    appToken,
    '--table-id',
    tableId,
    '--json',
    json,
  ]
  const env = await runLarkCli<CreateResultData>(args)
  const items = rowsToRecords(env.data?.data ?? [], env.data?.fields ?? [], env.data?.record_id_list ?? [])
  if (!items[0]) {
    throw new Error(`lark-cli create returned no record: ${JSON.stringify(env)}`)
  }
  return items[0]
}

export async function updateRecord(
  appToken: string,
  tableId: string,
  recordId: string,
  fields: Record<string, unknown>,
): Promise<BitableRecord> {
  const json = JSON.stringify({ record_id_list: [recordId], patch: fields })
  const args = [
    'base',
    '+record-batch-update',
    '--base-token',
    appToken,
    '--table-id',
    tableId,
    '--json',
    json,
  ]
  await runLarkCli<unknown>(args)
  const got = await getRecord(appToken, tableId, recordId)
  if (!got) throw new Error(`updateRecord: record ${recordId} disappeared after update`)
  return got
}

export async function deleteRecord(
  appToken: string,
  tableId: string,
  recordId: string,
): Promise<void> {
  const args = [
    'base',
    '+record-delete',
    '--base-token',
    appToken,
    '--table-id',
    tableId,
    '--record-id',
    recordId,
    '--yes',
  ]
  await runLarkCli<unknown>(args)
}

function splitFields(fields: Record<string, unknown>): { names: string[]; values: unknown[] } {
  const names = Object.keys(fields)
  const values = names.map((k) => fields[k])
  return { names, values }
}

function rowsToRecords(
  rows: unknown[][],
  fieldNames: string[],
  recordIds: string[],
): BitableRecord[] {
  return rows.map((row, i) => {
    const fields: Record<string, unknown> = {}
    fieldNames.forEach((name, j) => {
      fields[name] = row[j]
    })
    return {
      record_id: recordIds[i] ?? '',
      fields,
    }
  })
}

function runLarkCli<T>(args: string[]): Promise<LarkCliEnvelope<T>> {
  const binary = process.env.LARK_CLI_BIN || 'lark-cli'
  return new Promise((resolve, reject) => {
    const child = spawn(binary, args, { stdio: ['ignore', 'pipe', 'pipe'] })
    let stdout = ''
    let stderr = ''
    child.stdout.on('data', (d) => {
      stdout += d.toString()
    })
    child.stderr.on('data', (d) => {
      stderr += d.toString()
    })
    child.once('error', (err) => {
      reject(new Error(`spawn ${binary} failed: ${err.message}`))
    })
    child.once('close', (code) => {
      if (code !== 0) {
        reject(new Error(`lark-cli exited ${code}: ${stderr || stdout || '(no output)'}`))
        return
      }
      let parsed: LarkCliEnvelope<T>
      try {
        parsed = JSON.parse(stdout) as LarkCliEnvelope<T>
      } catch {
        reject(new Error(`lark-cli stdout not JSON: ${stdout.slice(0, 400)}`))
        return
      }
      if (!parsed.ok) {
        reject(new Error(`lark-cli failed: ${JSON.stringify(parsed.error ?? parsed)}`))
        return
      }
      resolve(parsed)
    })
  })
}
