import { cookies } from 'next/headers'

const SESSION_COOKIE = 'pmh_session'

export type SessionData = {
  openId: string
  name: string
  expiresAt: number
}

/**
 * 服务端：读取当前登录用户。
 * v1 用 httpOnly cookie 存简易 session（后续可换 iron-session / jose）。
 * 没有 session → 返回 null（中间件/页面应跳转免登）。
 */
export async function getSession(): Promise<SessionData | null> {
  const store = await cookies()
  const raw = store.get(SESSION_COOKIE)?.value
  if (!raw) return null
  try {
    const data = JSON.parse(raw) as SessionData
    if (data.expiresAt < Date.now()) return null
    return data
  } catch {
    return null
  }
}

export async function setSession(data: SessionData): Promise<void> {
  const store = await cookies()
  store.set(SESSION_COOKIE, JSON.stringify(data), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  })
}

export async function clearSession(): Promise<void> {
  const store = await cookies()
  store.delete(SESSION_COOKIE)
}

export type CurrentUser = { openId: string; name: string }

/**
 * 当前用户。免登未接通时（mock 开发期）回退到一个开发用 PM。
 * 生产 bitable 模式下没有 session 返回 null（页面应跳免登）。
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const s = await getSession()
  if (s) return { openId: s.openId, name: s.name }
  if (process.env.DATA_SOURCE === 'mock') {
    return { openId: 'ou_8339dd5f96ae885f2dd5554b59b98a4e', name: '童海奇（开发）' }
  }
  return null
}
