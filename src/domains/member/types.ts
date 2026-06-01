export type MemberRole = 'pm' | 'designer' | 'developer' | 'tester'

export type Member = {
  openId: string
  name: string
  defaultRole?: MemberRole
  active: boolean
  lastSeenAt: string
}

export type UpsertMemberInput = Pick<Member, 'openId' | 'name'> &
  Partial<Pick<Member, 'defaultRole' | 'active'>>
