import type { Requirement, RequirementStatus } from '@/domains/requirement/types'
import type { CollaboratorRole } from '@/domains/collaborator/types'
import { updateRequirement, getRequirement } from '@/domains/requirement/service'
import { listForRequirement } from '@/domains/collaborator/service'
import { TRANSITIONS } from './types'
import { getStatusLogRepository } from './repository'

export function canTransition(
  fromStatus: RequirementStatus,
  toStatus: RequirementStatus,
  operatorRoles: CollaboratorRole[],
): boolean {
  const rule = TRANSITIONS.find((t) => t.from === fromStatus && t.to === toStatus)
  if (!rule) return false
  return rule.allowedRoles.some((r) => operatorRoles.includes(r))
}

export function allowedNextStatuses(
  fromStatus: RequirementStatus,
  operatorRoles: CollaboratorRole[],
): RequirementStatus[] {
  return TRANSITIONS.filter(
    (t) => t.from === fromStatus && t.allowedRoles.some((r) => operatorRoles.includes(r)),
  ).map((t) => t.to)
}

/**
 * 权限：
 * - creator：发起人，可编辑全部
 * - designer / developer / tester：仅能改对应阶段状态（见 TRANSITIONS）
 * - watcher：只读
 */
export function canEditRequirement(
  requirement: Requirement,
  operatorOpenId: string,
  operatorRoles: CollaboratorRole[],
): boolean {
  if (requirement.creatorOpenId === operatorOpenId) return true
  if (operatorRoles.includes('creator')) return true
  return false
}

/**
 * 解析操作人在指定 requirement 上的所有角色：
 * - 是创建人 → 自动包含 'creator'
 * - 在 collaborators 表里有挂的角色 → 一并收
 */
export async function resolveOperatorRoles(
  requirement: Requirement,
  operatorOpenId: string,
): Promise<CollaboratorRole[]> {
  const roles = new Set<CollaboratorRole>()
  if (requirement.creatorOpenId === operatorOpenId) roles.add('creator')
  const collabs = await listForRequirement(requirement.id)
  for (const c of collabs) {
    if (c.memberOpenId === operatorOpenId) roles.add(c.role)
  }
  return Array.from(roles)
}

export type ApplyTransitionResult =
  | { ok: true; requirement: Requirement }
  | {
      ok: false
      code: 'not_found' | 'forbidden' | 'invalid_transition'
      message: string
    }

/**
 * 应用一次状态流转：校验 → 落 requirement.status → 写 status_log。
 * 失败返回结构化 code，不抛错（参考 ticket adapter 约定）。
 */
export async function applyStatusTransition(input: {
  requirementId: string
  toStatus: RequirementStatus
  operatorOpenId: string
  note?: string
}): Promise<ApplyTransitionResult> {
  const requirement = await getRequirement(input.requirementId)
  if (!requirement) {
    return { ok: false, code: 'not_found', message: '需求不存在' }
  }

  const roles = await resolveOperatorRoles(requirement, input.operatorOpenId)
  if (roles.length === 0) {
    return { ok: false, code: 'forbidden', message: '你不是该需求的相关人，无权变更状态' }
  }

  if (!canTransition(requirement.status, input.toStatus, roles)) {
    return {
      ok: false,
      code: 'invalid_transition',
      message: `当前角色（${roles.join('/')}）无法把状态从「${requirement.status}」改成「${input.toStatus}」`,
    }
  }

  const updated = await updateRequirement(input.requirementId, { status: input.toStatus })
  const logRepo = await getStatusLogRepository()
  await logRepo.create({
    requirementId: input.requirementId,
    fromStatus: requirement.status,
    toStatus: input.toStatus,
    operatorOpenId: input.operatorOpenId,
    note: input.note,
  })

  return { ok: true, requirement: updated }
}
