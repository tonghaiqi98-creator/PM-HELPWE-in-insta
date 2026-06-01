import type { RequirementStatus } from './types'

/**
 * 中文展示名（覆盖 9 种状态，跟 PRD §6.3 一致）。
 * 注意：released 在用户视角等同于「已交付」（PM 点确认交付的结果），
 * 跟看板的 DeliveryBadge 文案一致。
 */
export const STATUS_LABELS: Record<RequirementStatus, string> = {
  draft: '草稿',
  submitted: '已提交',
  designing: '设计中',
  waiting_design_review: '待设计评审',
  waiting_dev_accept: '待开发接单',
  developing: '开发中',
  waiting_test: '待测试',
  released: '已交付',
  archived: '已归档',
}

export function formatStatus(status: RequirementStatus): string {
  return STATUS_LABELS[status] ?? status
}
