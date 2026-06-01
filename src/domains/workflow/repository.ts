import type { StatusLog } from './types'

export type CreateStatusLogInput = Omit<StatusLog, 'id' | 'createdAt'>

export interface StatusLogRepository {
  listByRequirement(requirementId: string): Promise<StatusLog[]>
  create(input: CreateStatusLogInput): Promise<StatusLog>
}

export async function getStatusLogRepository(): Promise<StatusLogRepository> {
  const { shouldUseBitableFor } = await import('@/lib/repo-source')
  if (shouldUseBitableFor('FEISHU_BITABLE_TABLE_STATUS_LOGS')) {
    const m = await import('@/integrations/feishu/repositories/status-log.bitable')
    return new m.BitableStatusLogRepository()
  }
  const m = await import('@/integrations/mock/status-log.mock')
  return new m.MockStatusLogRepository()
}
