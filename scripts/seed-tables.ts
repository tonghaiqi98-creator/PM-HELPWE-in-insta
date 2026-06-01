/**
 * 一次性脚本：在 PM helper 数据 base 里建 4 张表（requirements / asset_items / collaborators / status_logs）。
 *
 * 跑法：npm run seed:tables
 *
 * 行为：
 *   1. 拉 base 现有表名，已存在则跳过建表（幂等）
 *   2. 缺的表用 lark-cli +table-create 建空表（默认带 ID 自增字段）
 *   3. 用 lark-cli +field-create 逐个加业务字段（select 字段带 options）
 *   4. 输出每张表的 table_id，让用户贴到 .env.local 对应 FEISHU_BITABLE_TABLE_*
 *
 * 字段名约定：业务术语中文（需求标题/状态/...），技术术语保留英文（ID/OpenId/Token/URL）
 * Select 选项值约定：跟 ts type 字符串 union 完全一致（draft/static/P0/...），避免 codec 转换层
 */

import { spawn } from 'node:child_process'

const APP_TOKEN = process.env.FEISHU_BITABLE_APP_TOKEN
if (!APP_TOKEN) {
  console.error('缺 env：FEISHU_BITABLE_APP_TOKEN')
  process.exit(1)
}

type FieldType = 'text' | 'number' | 'select' | 'multiSelect' | 'checkbox' | 'datetime'

type FieldSpec = {
  name: string
  type: FieldType
  options?: { name: string }[]
}

// lark-cli 不识别 type:"multiSelect"，会静默 fallback 到单选。
// 多选必须用 type:"select" + multiple:true。这里把 ts 友好的 'multiSelect' 转成飞书认的形式。
function specToFieldJson(spec: FieldSpec): Record<string, unknown> {
  if (spec.type === 'multiSelect') {
    return { name: spec.name, type: 'select', multiple: true, options: spec.options ?? [] }
  }
  const json: Record<string, unknown> = { name: spec.name, type: spec.type }
  if (spec.options) json.options = spec.options
  return json
}

type TableSpec = {
  name: string
  fields: FieldSpec[]
}

const REQUIREMENT_STATUSES = [
  'draft',
  'submitted',
  'designing',
  'waiting_design_review',
  'waiting_dev_accept',
  'developing',
  'waiting_test',
  'released',
  'archived',
] as const

const TABLES: TableSpec[] = [
  {
    name: 'requirements',
    fields: [
      { name: 'id', type: 'text' },
      { name: '需求标题', type: 'text' },
      { name: '目标设备', type: 'text' },
      {
        name: '需求类型',
        type: 'select',
        options: [{ name: 'type_1' }, { name: 'type_2' }, { name: 'type_3' }, { name: 'type_4' }],
      },
      {
        name: '平台',
        type: 'select',
        options: [{ name: '软件' }, { name: '硬件' }, { name: '零售' }, { name: '设计' }],
      },
      {
        name: 'APP端',
        type: 'multiSelect',
        options: [{ name: 'ios' }, { name: 'android' }],
      },
      {
        name: '优先级',
        type: 'select',
        options: [{ name: 'P0' }, { name: 'P1' }, { name: 'P2' }],
      },
      { name: '预计完成日期', type: 'datetime' },
      { name: '成功指标', type: 'text' },
      { name: '备注', type: 'text' },
      {
        name: '状态',
        type: 'select',
        options: REQUIREMENT_STATUSES.map((s) => ({ name: s })),
      },
      { name: '需求文档Token', type: 'text' },
      { name: '需求文档链接', type: 'text' },
      { name: '设计收单RecordId', type: 'text' },
      { name: '设计收单链接', type: 'text' },
      { name: '创建人OpenId', type: 'text' },
      { name: '创建人姓名', type: 'text' },
      { name: '创建时间', type: 'datetime' },
      { name: '更新时间', type: 'datetime' },
    ],
  },
  {
    name: 'asset_items',
    fields: [
      { name: 'id', type: 'text' },
      { name: '关联需求ID', type: 'text' },
      { name: '关联模板ID', type: 'text' },
      { name: '目标设备', type: 'text' },
      { name: '模块', type: 'text' },
      { name: '目录', type: 'text' },
      { name: '场景', type: 'text' },
      { name: '资源名', type: 'text' },
      {
        name: '资源类型',
        type: 'select',
        options: [{ name: 'static' }, { name: 'dynamic' }],
      },
      {
        name: '格式',
        type: 'select',
        options: [{ name: 'png' }, { name: 'jpg' }, { name: 'webp' }, { name: 'lottie' }],
      },
      { name: '宽度', type: 'number' },
      { name: '高度', type: 'number' },
      { name: '帧率', type: 'number' },
      {
        name: '主题',
        type: 'multiSelect',
        options: [{ name: 'light' }, { name: 'dark' }],
      },
      {
        name: '交付状态',
        type: 'select',
        options: [{ name: 'pending' }, { name: 'delivered' }, { name: 'accepted' }],
      },
      { name: '交付链接', type: 'text' },
      { name: '验收备注', type: 'text' },
      { name: '排序', type: 'number' },
    ],
  },
  {
    name: 'collaborators',
    fields: [
      { name: 'id', type: 'text' },
      { name: '关联需求ID', type: 'text' },
      { name: '成员OpenId', type: 'text' },
      {
        name: '角色',
        type: 'select',
        options: [
          { name: 'creator' },
          { name: 'designer' },
          { name: 'developer' },
          { name: 'tester' },
          { name: 'watcher' },
        ],
      },
      { name: '接收通知', type: 'checkbox' },
    ],
  },
  {
    name: 'status_logs',
    fields: [
      { name: 'id', type: 'text' },
      { name: '关联需求ID', type: 'text' },
      {
        name: '原状态',
        type: 'select',
        options: REQUIREMENT_STATUSES.map((s) => ({ name: s })),
      },
      {
        name: '新状态',
        type: 'select',
        options: REQUIREMENT_STATUSES.map((s) => ({ name: s })),
      },
      { name: '操作人OpenId', type: 'text' },
      { name: '备注', type: 'text' },
      { name: '创建时间', type: 'datetime' },
    ],
  },
]

type LarkCliEnvelope<T> = { ok: boolean; identity?: string; error?: unknown; data?: T }

function runLarkCli<T>(args: string[]): Promise<LarkCliEnvelope<T>> {
  return new Promise((resolve, reject) => {
    const child = spawn('lark-cli', args, { stdio: ['ignore', 'pipe', 'pipe'] })
    let stdout = ''
    let stderr = ''
    child.stdout.on('data', (d) => (stdout += d.toString()))
    child.stderr.on('data', (d) => (stderr += d.toString()))
    child.once('error', (err) => reject(new Error(`spawn lark-cli failed: ${err.message}`)))
    child.once('close', (code) => {
      if (code !== 0) {
        reject(new Error(`lark-cli exited ${code}: ${stderr || stdout || '(no output)'}`))
        return
      }
      try {
        const parsed = JSON.parse(stdout) as LarkCliEnvelope<T>
        if (!parsed.ok) {
          reject(new Error(`lark-cli failed: ${JSON.stringify(parsed.error ?? parsed)}`))
          return
        }
        resolve(parsed)
      } catch {
        reject(new Error(`lark-cli stdout not JSON: ${stdout.slice(0, 400)}`))
      }
    })
  })
}

type ListTableData = { tables: { id: string; name: string }[] }

async function listExistingTables(): Promise<Map<string, string>> {
  const env = await runLarkCli<ListTableData>([
    'base',
    '+table-list',
    '--base-token',
    APP_TOKEN as string,
    '--limit',
    '100',
  ])
  const map = new Map<string, string>()
  for (const t of env.data?.tables ?? []) map.set(t.name, t.id)
  return map
}

type CreateTableData = { table?: { id: string; name: string }; table_id?: string }

async function createTable(name: string): Promise<string> {
  const env = await runLarkCli<CreateTableData>([
    'base',
    '+table-create',
    '--base-token',
    APP_TOKEN as string,
    '--name',
    name,
  ])
  const tableId = env.data?.table?.id ?? env.data?.table_id
  if (!tableId) throw new Error(`create table ${name} returned no table_id: ${JSON.stringify(env)}`)
  return tableId
}

type ListFieldData = { fields: { id: string; name: string; type: string }[] }

async function listFields(tableId: string): Promise<Set<string>> {
  const env = await runLarkCli<ListFieldData>([
    'base',
    '+field-list',
    '--base-token',
    APP_TOKEN as string,
    '--table-id',
    tableId,
    '--limit',
    '100',
  ])
  return new Set((env.data?.fields ?? []).map((f) => f.name))
}

async function createField(tableId: string, spec: FieldSpec): Promise<void> {
  await runLarkCli<unknown>([
    'base',
    '+field-create',
    '--base-token',
    APP_TOKEN as string,
    '--table-id',
    tableId,
    '--json',
    JSON.stringify(specToFieldJson(spec)),
  ])
}

async function ensureTable(spec: TableSpec, existing: Map<string, string>) {
  let tableId = existing.get(spec.name)
  if (tableId) {
    console.log(`[seed] = ${spec.name}  已存在 (${tableId})`)
  } else {
    tableId = await createTable(spec.name)
    console.log(`[seed] + ${spec.name}  新建 (${tableId})`)
  }

  const haveFields = await listFields(tableId)
  let added = 0
  for (const f of spec.fields) {
    if (haveFields.has(f.name)) continue
    await createField(tableId, f)
    added++
    console.log(`[seed]   + 字段 ${f.name} (${f.type})`)
  }
  if (added === 0) console.log(`[seed]   = 全部 ${spec.fields.length} 字段已就位`)
  return tableId
}

async function main() {
  console.log(`[seed] base = ${APP_TOKEN}`)
  const existing = await listExistingTables()
  const result: Record<string, string> = {}
  for (const spec of TABLES) {
    result[spec.name] = await ensureTable(spec, existing)
  }
  console.log('\n[seed] 完成。把下面 4 行填进 .env.local：\n')
  console.log(`FEISHU_BITABLE_TABLE_REQUIREMENTS=${result.requirements}`)
  console.log(`FEISHU_BITABLE_TABLE_ASSET_ITEMS=${result.asset_items}`)
  console.log(`FEISHU_BITABLE_TABLE_COLLABORATORS=${result.collaborators}`)
  console.log(`FEISHU_BITABLE_TABLE_STATUS_LOGS=${result.status_logs}`)
}

main().catch((err) => {
  console.error('[seed] 致命错误：', err)
  process.exit(1)
})
