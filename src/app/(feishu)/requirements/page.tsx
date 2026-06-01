import Link from 'next/link'
import { listRequirements } from '@/domains/requirement/service'
import { getCurrentUser } from '@/lib/session'
import { RequirementCard } from '@/components/requirement-card'

export const dynamic = 'force-dynamic'

export default async function RequirementsListPage() {
  const user = await getCurrentUser()
  const items = user ? await listRequirements({ creatorOpenId: user.openId }) : []

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">我的需求</h1>
        <Link
          href="/requirements/create"
          className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm text-white hover:bg-neutral-800"
        >
          + 提需求
        </Link>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-neutral-500">还没有需求，点右上角「提需求」开始。</p>
      ) : (
        <ul className="divide-y divide-neutral-100 overflow-hidden rounded-lg border border-neutral-200 bg-white">
          {items.map((r) => (
            <RequirementCard key={r.id} requirement={r} />
          ))}
        </ul>
      )}
    </div>
  )
}
