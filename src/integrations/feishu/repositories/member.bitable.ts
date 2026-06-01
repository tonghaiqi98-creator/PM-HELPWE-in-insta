import type { MemberRepository } from '@/domains/member/repository'
import type { Member, MemberRole, UpsertMemberInput } from '@/domains/member/types'
import { getEnv } from '@/lib/env'
import {
  createRecord,
  listRecords,
  updateRecord,
  type BitableRecord,
} from '@/integrations/feishu/bitable'
import {
  decodeBoolean,
  decodeDateTime,
  decodeSelect,
  decodeText,
  encodeDateTime,
  encodeUser,
  eqFilter,
} from './_codec'

export class BitableMemberRepository implements MemberRepository {
  private app() {
    const env = getEnv()
    return {
      appToken: env.FEISHU_BITABLE_APP_TOKEN,
      tableId: env.FEISHU_BITABLE_TABLE_MEMBERS,
    }
  }

  async list(): Promise<Member[]> {
    const { appToken, tableId } = this.app()
    const out: Member[] = []
    let pageToken: string | undefined
    do {
      const res = await listRecords(appToken, tableId, { page_size: 100, page_token: pageToken })
      for (const r of res.items) {
        const m = recordToMember(r)
        if (m) out.push(m)
      }
      pageToken = res.hasMore ? res.pageToken : undefined
    } while (pageToken)
    return out
  }

  async get(openId: string): Promise<Member | null> {
    const { appToken, tableId } = this.app()
    const { items } = await listRecords(appToken, tableId, {
      filter: eqFilter('openId', openId),
      page_size: 1,
    })
    return items[0] ? recordToMember(items[0]) : null
  }

  async upsert(input: UpsertMemberInput): Promise<Member> {
    const { appToken, tableId } = this.app()
    const { items } = await listRecords(appToken, tableId, {
      filter: eqFilter('openId', input.openId),
      page_size: 1,
    })
    const existingRec = items[0] ?? null
    const existing = existingRec ? recordToMember(existingRec) : null
    const now = new Date().toISOString()
    const member: Member = {
      openId: input.openId,
      name: input.name,
      defaultRole: input.defaultRole ?? existing?.defaultRole,
      active: input.active ?? existing?.active ?? true,
      lastSeenAt: now,
    }
    const fields = memberToFields(member)
    if (existingRec) {
      await updateRecord(appToken, tableId, existingRec.record_id, fields)
    } else {
      await createRecord(appToken, tableId, fields)
    }
    return member
  }
}

function memberToFields(m: Member): Record<string, unknown> {
  return {
    openId: m.openId,
    name: m.name,
    defaultRole: m.defaultRole ?? null,
    active: m.active,
    lastSeenAt: encodeDateTime(m.lastSeenAt),
    // 「人员」字段可选写入：以 open_id 形态传，飞书会自动渲染头像/姓名
    person: encodeUser(m.openId),
  }
}

function recordToMember(r: BitableRecord): Member | null {
  const f = r.fields
  const openId = decodeText(f.openId)
  if (!openId) return null
  return {
    openId,
    name: decodeText(f.name) ?? openId,
    defaultRole: decodeSelect(f.defaultRole) as MemberRole | undefined,
    active: decodeBoolean(f.active) ?? true,
    lastSeenAt: decodeDateTime(f.lastSeenAt) ?? new Date().toISOString(),
  }
}
