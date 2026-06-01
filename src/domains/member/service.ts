import { getMemberRepository } from './repository'
import type { Member, UpsertMemberInput } from './types'

export async function upsertMember(input: UpsertMemberInput): Promise<Member> {
  const repo = await getMemberRepository()
  return repo.upsert(input)
}

export async function listMembers(): Promise<Member[]> {
  const repo = await getMemberRepository()
  return repo.list()
}

export async function getMember(openId: string): Promise<Member | null> {
  const repo = await getMemberRepository()
  return repo.get(openId)
}
