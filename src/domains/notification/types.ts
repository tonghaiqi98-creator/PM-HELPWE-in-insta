import type { Requirement, RequirementStatus } from '@/domains/requirement/types'

export type NotificationEventType =
  | 'requirement_submitted'
  | 'status_changed'
  | 'due_soon'
  | 'overdue'

export type NotificationEvent =
  | {
      type: 'requirement_submitted'
      requirement: Requirement
      targetOpenIds: string[]
    }
  | {
      type: 'status_changed'
      requirement: Requirement
      fromStatus: RequirementStatus
      toStatus: RequirementStatus
      targetOpenIds: string[]
    }
  | {
      type: 'due_soon'
      requirement: Requirement
      side: 'design' | 'dev'
      targetOpenIds: string[]
    }
  | {
      type: 'overdue'
      requirement: Requirement
      side: 'design' | 'dev'
      daysLate: number
      targetOpenIds: string[]
    }

export type NotificationMessage = {
  text: string
  mentionOpenIds: string[]
}
