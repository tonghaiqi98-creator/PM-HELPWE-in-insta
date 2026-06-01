import { NextResponse } from 'next/server'
import { getEnv } from '@/lib/env'

/**
 * 健康检查。
 * - 默认只验证服务端可启动 + 当前 DATA_SOURCE
 * - ?probe=feishu：尝试拿 tenant_access_token（需要真实凭证）
 * - ?probe=bitable：尝试读 members 表第一条（需要凭证 + 表存在）
 */
export async function GET(req: Request) {
  const url = new URL(req.url)
  const probe = url.searchParams.get('probe')
  const env = getEnv()
  const base = {
    ok: true,
    dataSource: env.DATA_SOURCE,
    appName: env.NEXT_PUBLIC_APP_NAME,
    timestamp: new Date().toISOString(),
  }

  if (probe === 'feishu') {
    try {
      const { getTenantAccessToken } = await import('@/integrations/feishu/client')
      const token = await getTenantAccessToken()
      return NextResponse.json({ ...base, feishu: { tokenPrefix: token.slice(0, 6) + '***' } })
    } catch (err) {
      return NextResponse.json(
        { ...base, ok: false, feishu: { error: errMsg(err) } },
        { status: 500 },
      )
    }
  }

  if (probe === 'bitable') {
    try {
      const { listRecords } = await import('@/integrations/feishu/bitable')
      const { items } = await listRecords(
        env.FEISHU_BITABLE_APP_TOKEN,
        env.FEISHU_BITABLE_TABLE_MEMBERS,
        { page_size: 1 },
      )
      return NextResponse.json({ ...base, bitable: { sampleCount: items.length } })
    } catch (err) {
      return NextResponse.json(
        { ...base, ok: false, bitable: { error: errMsg(err) } },
        { status: 500 },
      )
    }
  }

  return NextResponse.json(base)
}

function errMsg(err: unknown): string {
  return err instanceof Error ? err.message : String(err)
}
