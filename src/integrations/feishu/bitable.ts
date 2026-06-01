import { feishuFetch } from './client'
import * as larkCli from '@/integrations/lark-cli/bitable'

/**
 * 飞书多维表格 (Bitable) 最小 CRUD 封装。
 * 文档：https://open.feishu.cn/document/server-docs/docs/bitable-v1/app-table-record
 *
 * env BITABLE_VIA_LARK_CLI=true 时，所有调用走 lark-cli 用户身份子进程（单人开发期捷径）。
 * 否则走 tenant_access_token 应用身份 HTTP API（生产路径）。
 */

function viaLarkCli(): boolean {
  return process.env.BITABLE_VIA_LARK_CLI === 'true'
}

export type BitableRecord = {
  record_id: string
  fields: Record<string, unknown>
  created_time?: number
  last_modified_time?: number
}

type ListResponse = {
  code: number
  msg: string
  data: {
    items?: BitableRecord[]
    page_token?: string
    has_more?: boolean
    total?: number
  }
}

type CreateResponse = {
  code: number
  msg: string
  data: { record: BitableRecord }
}

type UpdateResponse = CreateResponse
type GetResponse = CreateResponse

export type ListOptions = {
  page_size?: number
  page_token?: string
  filter?: string
  sort?: string[]
}

export async function listRecords(
  appToken: string,
  tableId: string,
  opts: ListOptions = {},
): Promise<{ items: BitableRecord[]; hasMore: boolean; pageToken?: string }> {
  if (viaLarkCli()) return larkCli.listRecords(appToken, tableId, opts)
  const params = new URLSearchParams()
  if (opts.page_size) params.set('page_size', String(opts.page_size))
  if (opts.page_token) params.set('page_token', opts.page_token)
  if (opts.filter) params.set('filter', opts.filter)
  if (opts.sort?.length) params.set('sort', JSON.stringify(opts.sort))
  const data = await feishuFetch<ListResponse>(
    `/open-apis/bitable/v1/apps/${appToken}/tables/${tableId}/records?${params}`,
  )
  return {
    items: data.data.items ?? [],
    hasMore: data.data.has_more ?? false,
    pageToken: data.data.page_token,
  }
}

export async function getRecord(
  appToken: string,
  tableId: string,
  recordId: string,
): Promise<BitableRecord | null> {
  if (viaLarkCli()) return larkCli.getRecord(appToken, tableId, recordId)
  try {
    const data = await feishuFetch<GetResponse>(
      `/open-apis/bitable/v1/apps/${appToken}/tables/${tableId}/records/${recordId}`,
    )
    return data.data.record
  } catch (err) {
    if (err instanceof Error && /not.?found|1254/i.test(err.message)) return null
    throw err
  }
}

export async function createRecord(
  appToken: string,
  tableId: string,
  fields: Record<string, unknown>,
): Promise<BitableRecord> {
  if (viaLarkCli()) return larkCli.createRecord(appToken, tableId, fields)
  const data = await feishuFetch<CreateResponse>(
    `/open-apis/bitable/v1/apps/${appToken}/tables/${tableId}/records`,
    { method: 'POST', body: JSON.stringify({ fields }) },
  )
  return data.data.record
}

export async function updateRecord(
  appToken: string,
  tableId: string,
  recordId: string,
  fields: Record<string, unknown>,
): Promise<BitableRecord> {
  if (viaLarkCli()) return larkCli.updateRecord(appToken, tableId, recordId, fields)
  const data = await feishuFetch<UpdateResponse>(
    `/open-apis/bitable/v1/apps/${appToken}/tables/${tableId}/records/${recordId}`,
    { method: 'PUT', body: JSON.stringify({ fields }) },
  )
  return data.data.record
}

export async function deleteRecord(
  appToken: string,
  tableId: string,
  recordId: string,
): Promise<void> {
  if (viaLarkCli()) return larkCli.deleteRecord(appToken, tableId, recordId)
  await feishuFetch(
    `/open-apis/bitable/v1/apps/${appToken}/tables/${tableId}/records/${recordId}`,
    { method: 'DELETE' },
  )
}
