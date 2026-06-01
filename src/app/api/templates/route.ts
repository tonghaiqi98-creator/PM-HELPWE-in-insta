import { NextResponse } from 'next/server'
import { z } from 'zod'
import { listTemplates, createTemplate } from '@/domains/template/service'
import type { AssetKind } from '@/domains/template/types'

export async function GET(req: Request) {
  const url = new URL(req.url)
  const assetKind = url.searchParams.get('assetKind')
  const items = await listTemplates({
    module: url.searchParams.get('module') ?? undefined,
    category: url.searchParams.get('category') ?? undefined,
    assetKind:
      assetKind === 'static' || assetKind === 'dynamic' ? (assetKind as AssetKind) : undefined,
    keyword: url.searchParams.get('keyword') ?? undefined,
  })
  return NextResponse.json({ ok: true, items })
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const created = await createTemplate(body)
    return NextResponse.json({ ok: true, template: created })
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
