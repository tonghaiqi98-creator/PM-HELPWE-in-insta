import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createRequirement, listRequirements } from '@/domains/requirement/service'
import { getCurrentUser } from '@/lib/session'

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ ok: false, error: '未登录' }, { status: 401 })
  const items = await listRequirements({ creatorOpenId: user.openId })
  return NextResponse.json({ ok: true, items })
}

export async function POST(req: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ ok: false, error: '未登录' }, { status: 401 })
  try {
    const body = await req.json()
    const created = await createRequirement({
      ...body,
      creatorOpenId: user.openId,
      creatorName: user.name,
    })
    return NextResponse.json({ ok: true, requirement: created })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { ok: false, error: '校验失败', issues: err.issues },
        { status: 400 },
      )
    }
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    )
  }
}
