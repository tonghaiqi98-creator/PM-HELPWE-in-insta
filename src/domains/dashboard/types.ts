import type { Requirement } from '@/domains/requirement/types'

/**
 * 看板派生交付状态：
 * - delivered：PM 在详情页点过「确认交付」（status === 'released'）
 *   （archived 也是终态，但默认不在看板出现 —— 归档=移出视野）
 * - overdue：非终态 + expectedDueDate < today
 * - pending：非终态 + 未到期
 */
export type DeliveryState = 'delivered' | 'overdue' | 'pending'

/**
 * 卡片高亮等级（仅用于 pending 区做"即将延期"提示）：
 * - normal：>= RISK_WARNING_DAYS 天
 * - warning：剩余 [0, RISK_WARNING_DAYS] 天
 */
export type RiskLevel = 'normal' | 'warning'

export type RequirementWithRisk = Requirement & {
  delivery: DeliveryState
  risk: RiskLevel
  riskReason?: string // 例："2 天内到期"、"逾期 5 天"
}

export type DashboardData = {
  overdue: RequirementWithRisk[]
  pending: RequirementWithRisk[]
  delivered: RequirementWithRisk[]
}
