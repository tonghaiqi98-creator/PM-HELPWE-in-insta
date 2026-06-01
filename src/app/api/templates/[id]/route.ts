import { NextResponse } from 'next/server'
import { z } from 'zod'
import { updateTemplate, deleteTemplate } from '@/domains/template/service'

type Ctx = { params: Promise<{ id: string }> }

export async function PATCH(req: Request, { params }: Ctx) {
  const { id } = await params
  try {
    const body = await req.json()
    const updated = await updateTemplate(id, body)
    return NextResponse.json({ ok: true, template: updated })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ ok: false, error: '校验失败', issues: err.issues }, { status: 400 })
    }
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    )
  }
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const { id } = await params
  try {
    await deleteTemplate(id)
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    )
  }
}
