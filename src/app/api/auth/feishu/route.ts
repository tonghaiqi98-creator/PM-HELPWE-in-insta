import { NextResponse } from 'next/server'
import { exchangeCodeForUser } from '@/integrations/feishu/auth'
import { setSession } from '@/lib/session'
import { upsertMember } from '@/domains/member/service'

/**
 * POST { code } -> 用飞书免登 code 换 user_info，写 session cookie，
 * 同时把当前用户写入/更新 members 表。
 */
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { code?: string }
    if (!body.code) {
      return NextResponse.json({ ok: false, error: 'code 缺失' }, { status: 400 })
    }
    const user = await exchangeCodeForUser(body.code)
    await setSession({
      openId: user.open_id,
      name: user.name,
      expiresAt: Date.now() + 1000 * 60 * 60 * 24 * 7,
    })
    await upsertMember({ openId: user.open_id, name: user.name }).catch((e) => {
      console.warn('[auth] upsert member failed (non-fatal):', e)
    })
    return NextResponse.json({ ok: true, openId: user.open_id, name: user.name })
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    )
  }
}
