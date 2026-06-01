import { getEnv } from '@/lib/env'

/**
 * 飞书服务端 client：管理 tenant_access_token（带内存缓存）。
 * 注意：仅在服务端导入。不要在 components/ 或 app/(feishu) 客户端组件中 import。
 */

const FEISHU_BASE = 'https://open.feishu.cn'

type TokenCache = {
  token: string
  expiresAt: number
}

let cache: TokenCache | null = null

export async function getTenantAccessToken(): Promise<string> {
  const now = Date.now()
  if (cache && cache.expiresAt > now + 60_000) return cache.token

  const { FEISHU_APP_ID, FEISHU_APP_SECRET } = getEnv()
  if (!FEISHU_APP_ID || !FEISHU_APP_SECRET) {
    throw new Error('[feishu] FEISHU_APP_ID / FEISHU_APP_SECRET 未配置')
  }

  const res = await fetch(`${FEISHU_BASE}/open-apis/auth/v3/tenant_access_token/internal`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ app_id: FEISHU_APP_ID, app_secret: FEISHU_APP_SECRET }),
    cache: 'no-store',
  })
  if (!res.ok) {
    throw new Error(`[feishu] tenant_access_token HTTP ${res.status}`)
  }
  const data = (await res.json()) as {
    code: number
    msg: string
    tenant_access_token?: string
    expire?: number
  }
  if (data.code !== 0 || !data.tenant_access_token) {
    throw new Error(`[feishu] tenant_access_token error: ${data.code} ${data.msg}`)
  }
  cache = {
    token: data.tenant_access_token,
    expiresAt: now + (data.expire ?? 7200) * 1000,
  }
  return cache.token
}

/**
 * 通用：带 token 的飞书 OpenAPI 调用。
 * 不在这里做 retry / 限流；上游需要的话自己包。
 */
export async function feishuFetch<T = unknown>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const token = await getTenantAccessToken()
  const url = path.startsWith('http') ? path : `${FEISHU_BASE}${path}`
  const res = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(init.headers ?? {}),
    },
    cache: 'no-store',
  })
  const text = await res.text()
  let data: unknown
  try {
    data = text ? JSON.parse(text) : {}
  } catch {
    throw new Error(`[feishu] ${path} returned non-JSON: ${text.slice(0, 200)}`)
  }
  const obj = data as { code?: number; msg?: string }
  if (!res.ok || (obj.code !== undefined && obj.code !== 0)) {
    throw new Error(`[feishu] ${path} failed: ${obj.code} ${obj.msg ?? res.statusText}`)
  }
  return data as T
}
