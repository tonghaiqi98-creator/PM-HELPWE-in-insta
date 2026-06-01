import { randomUUID } from 'node:crypto'
import type {
  CreateStatusLogInput,
  StatusLogRepository,
} from '@/domains/workflow/repository'
import type { StatusLog } from '@/domains/workflow/types'
import { getStore } from './store'

export class MockStatusLogRepository implements StatusLogRepository {
  async listByRequirement(requirementId: string): Promise<StatusLog[]> {
    return Array.from(getStore().statusLogs.values())
      .filter((l) => l.requirementId === requirementId)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  }
  async create(input: CreateStatusLogInput): Promise<StatusLog> {
    const log: StatusLog = {
      id: `log_${randomUUID()}`,
      ...input,
      createdAt: new Date().toISOString(),
    }
    getStore().statusLogs.set(log.id, log)
    return log
  }
}
