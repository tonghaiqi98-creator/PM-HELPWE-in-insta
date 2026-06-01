import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { applyStatusTransition } from '@/domains/workflow/service'
import { getCurrentUser } from '@/lib/session'

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

const bodySchema = z.object({
  toStatus: z.enum(REQUIREMENT_STATUSES),
  note: z.string().max(500).optional(),
})

type Ctx = { params: Promise<{ id: string }> }

export async function POST(req: Request, { params }: Ctx) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ ok: false, error: '未登录' }, { status: 401 })

  const { id } = await params
  try {
    const body = bodySchema.parse(await req.json())
    const result = await applyStatusTransition({
      requirementId: id,
      toStatus: body.toStatus,
      operatorOpenId: user.openId,
      note: body.note,
    })

    if (!result.ok) {
      const httpStatus =
        result.code === 'not_found' ? 404 : result.code === 'forbidden' ? 403 : 409
      return NextResponse.json({ ok: false, error: result.message, code: result.code }, {
        status: httpStatus,
      })
    }

    revalidatePath('/dashboard')
    revalidatePath('/requirements')
    revalidatePath(`/requirements/${id}`)
    return NextResponse.json({ ok: true, requirement: result.requirement })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ ok: false, error: '校验失败', issues: err.issues }, {
        status: 400,
      })
    }
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    )
  }
}
