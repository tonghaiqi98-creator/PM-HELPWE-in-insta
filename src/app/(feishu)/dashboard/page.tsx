import Link from 'next/link'
import { getCurrentUser } from '@/lib/session'
import { getMyDashboard } from '@/domains/dashboard/service'
import type { DeliveryState, RequirementWithRisk } from '@/domains/dashboard/types'
import { RequirementCard } from '@/components/requirement-card'

export const dynamic = 'force-dynamic'

const SECTION_TONE: Record<DeliveryState, { count: string; emptyHint: string; title: string }> = {
  overdue: {
    title: '已逾期',
    count: 'bg-red-100 text-red-700',
    emptyHint: '没有逾期需求',
  },
  pending: {
    title: '待交付',
    count: 'bg-neutral-100 text-neutral-700',
    emptyHint: '没有进行中的需求',
  },
  delivered: {
    title: '已交付',
    count: 'bg-emerald-100 text-emerald-700',
    emptyHint: '还没有完成交付的需求',
  },
}

function Section({
  state,
  items,
  showRisk = false,
}: {
  state: DeliveryState
  items: RequirementWithRisk[]
  showRisk?: boolean
}) {
  const tone = SECTION_TONE[state]
  return (
    <section className="space-y-2">
      <div className="flex items-center gap-2">
        <h2 className="text-base font-semibold">{tone.title}</h2>
        <span className={`rounded-full px-2 py-0.5 text-xs ${tone.count}`}>{items.length}</span>
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-neutral-400">{tone.emptyHint}</p>
      ) : (
        <ul className="divide-y divide-neutral-100 overflow-hidden rounded-lg border border-neutral-200 bg-white">
          {items.map((r) => (
            <RequirementCard key={r.id} requirement={r} showRisk={showRisk} />
          ))}
        </ul>
      )}
    </section>
  )
}

export default async function DashboardPage() {
  const user = await getCurrentUser()
  if (!user) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-semibold">我的看板</h1>
        <p className="text-sm text-neutral-500">请先登录后查看。</p>
      </div>
    )
  }

  const data = await getMyDashboard(user.openId)
  const allEmpty = data.overdue.length + data.pending.length + data.delivered.length === 0

  if (allEmpty) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-semibold">我的看板</h1>
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-neutral-200 bg-white py-12">
          <p className="text-sm text-neutral-500">还没有需求</p>
          <Link
            href="/requirements/create"
            className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm text-white hover:bg-neutral-800"
          >
            + 提需求
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">我的看板</h1>
        <p className="text-xs text-neutral-400">
          已交付 = 点过「确认交付」 · 已逾期 = 超过预计完成时间 · 其余为待交付
        </p>
      </div>

      <Section state="overdue" items={data.overdue} />
      <Section state="pending" items={data.pending} showRisk />
      <Section state="delivered" items={data.delivered} />
    </div>
  )
}
