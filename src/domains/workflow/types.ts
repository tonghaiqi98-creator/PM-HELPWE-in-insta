import type { RequirementStatus } from '@/domains/requirement/types'
import type { CollaboratorRole } from '@/domains/collaborator/types'

/**
 * 状态流转规则：fromStatus -> 允许的下一批 status + 允许操作的角色
 * 见 PRD §6.3
 */
export type StatusTransition = {
  from: RequirementStatus
  to: RequirementStatus
  allowedRoles: CollaboratorRole[]
}

export const NON_TERMINAL_STATUSES: readonly RequirementStatus[] = [
  'draft',
  'submitted',
  'designing',
  'waiting_design_review',
  'waiting_dev_accept',
  'developing',
  'waiting_test',
] as const

export const TERMINAL_STATUSES: readonly RequirementStatus[] = ['released', 'archived'] as const

export const TRANSITIONS: readonly StatusTransition[] = [
  { from: 'draft', to: 'submitted', allowedRoles: ['creator'] },
  { from: 'submitted', to: 'designing', allowedRoles: ['designer'] },
  { from: 'designing', to: 'waiting_design_review', allowedRoles: ['designer'] },
  { from: 'waiting_design_review', to: 'waiting_dev_accept', allowedRoles: ['creator'] },
  { from: 'waiting_dev_accept', to: 'developing', allowedRoles: ['developer'] },
  { from: 'developing', to: 'waiting_test', allowedRoles: ['developer'] },
  { from: 'waiting_test', to: 'released', allowedRoles: ['tester', 'creator'] },
  // PM 确认交付：任意非终态由 creator 直达 released
  { from: 'draft', to: 'released', allowedRoles: ['creator'] },
  { from: 'submitted', to: 'released', allowedRoles: ['creator'] },
  { from: 'designing', to: 'released', allowedRoles: ['creator'] },
  { from: 'waiting_design_review', to: 'released', allowedRoles: ['creator'] },
  { from: 'waiting_dev_accept', to: 'released', allowedRoles: ['creator'] },
  { from: 'developing', to: 'released', allowedRoles: ['creator'] },
  // 归档：任何节点都可以
  { from: 'draft', to: 'archived', allowedRoles: ['creator'] },
  { from: 'submitted', to: 'archived', allowedRoles: ['creator'] },
  { from: 'designing', to: 'archived', allowedRoles: ['creator'] },
  { from: 'waiting_design_review', to: 'archived', allowedRoles: ['creator'] },
  { from: 'waiting_dev_accept', to: 'archived', allowedRoles: ['creator'] },
  { from: 'developing', to: 'archived', allowedRoles: ['creator'] },
  { from: 'waiting_test', to: 'archived', allowedRoles: ['creator'] },
  { from: 'released', to: 'archived', allowedRoles: ['creator'] },
] as const

export type StatusLog = {
  id: string
  requirementId: string
  fromStatus: RequirementStatus
  toStatus: RequirementStatus
  operatorOpenId: string
  note?: string
  createdAt: string
}
