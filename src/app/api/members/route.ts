import { NextResponse } from 'next/server'
import { listMembers } from '@/domains/member/service'

export async function GET() {
  const items = await listMembers()
  return NextResponse.json({ ok: true, items })
}
