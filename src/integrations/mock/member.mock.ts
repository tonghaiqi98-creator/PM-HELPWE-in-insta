import type { MemberRepository } from '@/domains/member/repository'
import type { Member, UpsertMemberInput } from '@/domains/member/types'
import { getStore } from './store'

export class MockMemberRepository implements MemberRepository {
  async list(): Promise<Member[]> {
    return Array.from(getStore().members.values())
  }
  async get(openId: string): Promise<Member | null> {
    return getStore().members.get(openId) ?? null
  }
  async upsert(input: UpsertMemberInput): Promise<Member> {
    const store = getStore()
    const existing = store.members.get(input.openId)
    const now = new Date().toISOString()
    const member: Member = {
      openId: input.openId,
      name: input.name,
      defaultRole: input.defaultRole ?? existing?.defaultRole,
      active: input.active ?? existing?.active ?? true,
      lastSeenAt: now,
    }
    store.members.set(member.openId, member)
    return member
  }
}
