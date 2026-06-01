import { NextResponse } from 'next/server'
// Phase 8 实现：到期检查 + 飞书提醒
// 触发：Vercel Cron 或外部 cron 调用 GET /api/cron

export async function GET() {
  return NextResponse.json({ ok: true, message: 'TODO Phase 8 cron' })
}
