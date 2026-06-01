import Link from 'next/link'
import { getEnv } from '@/lib/env'
import { listRawTable } from '@/integrations/lark-cli/bitable'

/**
 * 多维表格查看页：把「PM helper 数据」base 的 6 张表直接渲染出来。
 *
 * 设计：server component 直接调 lark-cli 拿 raw 行 + 字段名，按列序无脑铺成 HTML table。
 * 不复用 BitableRepository（部分 repo 没暴露 listAll，且 raw 渲染对中英混排字段名都通用）。
 *
 * 编辑请走「在飞书 base 打开」外链按钮 → 直接到飞书 base UI；本页只读。
 */

type TableDef = {
  key: string
  label: string
  tableId: string
}

function buildTables(): TableDef[] {
  const env = getEnv()
  return [
    { key: 'requirements', label: '需求', tableId: env.FEISHU_BITABLE_TABLE_REQUIREMENTS },
    { key: 'asset_items', label: '资源明细', tableId: env.FEISHU_BITABLE_TABLE_ASSET_ITEMS },
    { key: 'templates', label: '模板库', tableId: env.FEISHU_BITABLE_TABLE_TEMPLATES },
    { key: 'members', label: '成员', tableId: env.FEISHU_BITABLE_TABLE_MEMBERS },
    { key: 'collaborators', label: '合作人', tableId: env.FEISHU_BITABLE_TABLE_COLLABORATORS },
    { key: 'status_logs', label: '状态日志', tableId: env.FEISHU_BITABLE_TABLE_STATUS_LOGS },
  ].filter((t) => t.tableId)
}

function formatCell(v: unknown): string {
  if (v == null) return '—'
  if (typeof v === 'string') return v || '—'
  if (typeof v === 'number') return String(v)
  if (typeof v === 'boolean') return v ? '是' : '否'
  if (Array.isArray(v)) {
    if (v.length === 0) return '—'
    return v
      .map((x) => {
        if (typeof x === 'string') return x
        if (typeof x === 'object' && x && 'text' in x) return String((x as { text: unknown }).text)
        if (typeof x === 'object' && x && 'name' in x) return String((x as { name: unknown }).name)
        return JSON.stringify(x)
      })
      .join(' / ')
  }
  return JSON.stringify(v)
}

export default async function DataPage({
  searchParams,
}: {
  searchParams: Promise<{ table?: string }>
}) {
  const env = getEnv()
  const tables = buildTables()
  const params = await searchParams
  const active = tables.find((t) => t.key === params.table) ?? tables[0]

  if (!active) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-semibold">数据库</h1>
        <p className="text-sm text-neutral-500">尚未配置任何 Bitable 表。</p>
      </div>
    )
  }

  let fields: string[] = []
  let rows: unknown[][] = []
  let recordIds: string[] = []
  let loadError: string | null = null
  try {
    const data = await listRawTable(env.FEISHU_BITABLE_APP_TOKEN, active.tableId)
    fields = data.fields
    rows = data.rows
    recordIds = data.recordIds
  } catch (e) {
    loadError = e instanceof Error ? e.message : String(e)
  }

  const baseUrl = `https://arashivision.feishu.cn/base/${env.FEISHU_BITABLE_APP_TOKEN}?table=${active.tableId}`

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">数据库</h1>
        <a
          href={baseUrl}
          target="_blank"
          rel="noreferrer"
          className="rounded border border-neutral-300 px-3 py-1 text-sm text-neutral-700 hover:bg-neutral-50"
        >
          在飞书 base 打开 ↗
        </a>
      </div>

      <nav className="flex flex-wrap gap-2 border-b border-neutral-200 pb-2">
        {tables.map((t) => {
          const isActive = t.key === active.key
          return (
            <Link
              key={t.key}
              href={`/data?table=${t.key}`}
              className={
                'rounded-t px-3 py-1.5 text-sm ' +
                (isActive
                  ? 'border-b-2 border-neutral-900 font-medium text-neutral-900'
                  : 'text-neutral-500 hover:text-neutral-700')
              }
            >
              {t.label}
            </Link>
          )
        })}
      </nav>

      <div className="text-xs text-neutral-500">
        当前表 <code className="rounded bg-neutral-100 px-1 py-0.5">{active.tableId}</code>，共{' '}
        {rows.length} 行 · 数据来自 lark-cli 用户身份读取
      </div>

      {loadError ? (
        <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          读取失败：{loadError}
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded border border-neutral-200 bg-neutral-50 p-3 text-sm text-neutral-500">
          这张表当前没有数据。
        </div>
      ) : (
        <div className="overflow-x-auto rounded border border-neutral-200">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-left text-xs text-neutral-500">
              <tr>
                <th className="px-3 py-2 font-medium">#</th>
                {fields.map((f) => (
                  <th key={f} className="whitespace-nowrap px-3 py-2 font-medium">
                    {f}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 bg-white">
              {rows.map((row, idx) => (
                <tr key={recordIds[idx] ?? idx} className="hover:bg-neutral-50">
                  <td className="px-3 py-2 text-neutral-400">{idx + 1}</td>
                  {row.map((v, ci) => (
                    <td
                      key={ci}
                      className="max-w-[280px] truncate px-3 py-2 text-neutral-700"
                      title={typeof v === 'string' ? v : undefined}
                    >
                      {formatCell(v)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
