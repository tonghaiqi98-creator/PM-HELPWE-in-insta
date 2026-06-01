import type { Member, UpsertMemberInput } from './types'

export interface MemberRepository {
  list(): Promise<Member[]>
  get(openId: string): Promise<Member | null>
  upsert(input: UpsertMemberInput): Promise<Member>
}

export async function getMemberRepository(): Promise<MemberRepository> {
  const { shouldUseBitableFor } = await import('@/lib/repo-source')
  if (shouldUseBitableFor('FEISHU_BITABLE_TABLE_MEMBERS')) {
    const m = await import('@/integrations/feishu/repositories/member.bitable')
    return new m.BitableMemberRepository()
  }
  const m = await import('@/integrations/mock/member.mock')
  return new m.MockMemberRepository()
}
