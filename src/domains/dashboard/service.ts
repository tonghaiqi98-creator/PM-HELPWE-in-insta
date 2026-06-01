import type { Requirement } from '@/domains/requirement/types'
import { listRequirements } from '@/domains/requirement/service'
import { daysUntil } from '@/lib/date'
import { RISK_WARNING_DAYS } from '@/lib/constants'
import type {
  DashboardData,
  DeliveryState,
  RequirementWithRisk,
  RiskLevel,
} from './types'

export function getDeliveryState(req: Requirement, now: Date = new Date()): DeliveryState {
  if (req.status === 'released') return 'delivered'
  if (req.status === 'archived') return 'delivered' // 归档归到 delivered 计算族（看板默认过滤掉，不展示）
  if (daysUntil(req.expectedDueDate, now) < 0) return 'overdue'
  return 'pending'
}

export function calcRisk(
  req: Requirement,
  delivery: DeliveryState,
  now: Date = new Date(),
): { risk: RiskLevel; reason?: string } {
  if (delivery === 'delivered') return { risk: 'normal' }
  const remaining = daysUntil(req.expectedDueDate, now)
  if (delivery === 'overdue') return { risk: 'warning', reason: `逾期 ${-remaining} 天` }
  if (remaining <= RISK_WARNING_DAYS) return { risk: 'warning', reason: `${remaining} 天内到期` }
  return { risk: 'normal' }
}

function decorate(reqs: Requirement[], now = new Date()): RequirementWithRisk[] {
  return reqs.map((r) => {
    const delivery = getDeliveryState(r, now)
    const { risk, reason } = calcRisk(r, delivery, now)
    return { ...r, delivery, risk, riskReason: reason }
  })
}

export async function getMyDashboard(currentOpenId: string): Promise<DashboardData> {
  const all = await listRequirements({ creatorOpenId: currentOpenId })
  const decorated = decorate(all)

  return {
    overdue: decorated.filter((r) => r.delivery === 'overdue'),
    pending: decorated.filter((r) => r.delivery === 'pending'),
    // 归档不在看板出现
    delivered: decorated.filter((r) => r.delivery === 'delivered' && r.status !== 'archived'),
  }
}
