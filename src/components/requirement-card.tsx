import Link from 'next/link'
import type { Requirement } from '@/domains/requirement/types'
import type { RequirementWithRisk } from '@/domains/dashboard/types'
import { formatStatus } from '@/domains/requirement/labels'
import { REQUIREMENT_TYPES } from '@/lib/constants'

type Props = {
  requirement: Requirement | RequirementWithRisk
  /** 仅在调用方期望显示"即将延期"提示时传 true（dashboard 的 pending section） */
  showRisk?: boolean
}

function hasRisk(r: Requirement | RequirementWithRisk): r is RequirementWithRisk {
  return 'risk' in r
}

export function RequirementCard({ requirement: r, showRisk = false }: Props) {
  const warning = showRisk && hasRisk(r) && r.risk === 'warning'
  const reason = hasRisk(r) ? r.riskReason : undefined

  return (
    <li>
      <Link
        href={`/requirements/${r.id}`}
        className={`block px-4 py-3 hover:bg-neutral-50 ${
          warning ? 'border-l-4 border-amber-500' : ''
        }`}
      >
        <div className="flex items-center justify-between gap-2">
          <span className="font-medium">{r.title}</span>
          <span className="text-xs text-neutral-400">{formatStatus(r.status)}</span>
        </div>
        <div className="mt-1 text-xs text-neutral-500">
          {r.targetDevice} ·{' '}
          {REQUIREMENT_TYPES.find((t) => t.value === r.type)?.label ?? r.type} · {r.priority} ·
          预计 {r.expectedDueDate}
        </div>
        {warning && reason && (
          <div className="mt-1 text-xs font-medium text-amber-600">{reason}</div>
        )}
      </Link>
    </li>
  )
}
