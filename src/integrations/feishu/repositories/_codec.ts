/**
 * 飞书 Bitable 字段读写 codec：把记录的 fields 在 ts type 与 Bitable 返回值之间转换。
 *
 * Bitable 字段读取行为（v1 API）：
 * - text: 返回 string，或 [{ type: 'text', text: '...' }] 富文本数组
 * - number: 返回 number 或 string
 * - single_select: 返回 string（option name）或 { text }
 * - checkbox: 返回 boolean
 * - datetime / created_at / updated_at: 返回毫秒时间戳（number）
 * - user: 返回 [{ id, name, ... }] 数组
 */

export function decodeText(v: unknown): string | undefined {
  if (v == null) return undefined
  if (typeof v === 'string') return v.trim() || undefined
  if (Array.isArray(v) && v.length > 0) {
    const first = v[0] as { text?: unknown }
    if (typeof first?.text === 'string') return first.text.trim() || undefined
    if (typeof first === 'string') return (first as string).trim() || undefined
  }
  return undefined
}

export function decodeNumber(v: unknown): number | undefined {
  if (v == null || v === '') return undefined
  if (typeof v === 'number') return Number.isFinite(v) ? v : undefined
  if (typeof v === 'string') {
    const n = Number(v)
    return Number.isFinite(n) ? n : undefined
  }
  return undefined
}

export function decodeBoolean(v: unknown): boolean | undefined {
  if (v == null) return undefined
  if (typeof v === 'boolean') return v
  if (typeof v === 'string') return v === 'true' || v === '1'
  if (typeof v === 'number') return v !== 0
  return undefined
}

export function decodeSelect(v: unknown): string | undefined {
  if (v == null) return undefined
  if (typeof v === 'string') return v.trim() || undefined
  if (typeof v === 'object' && v && 'text' in v) {
    const t = (v as { text: unknown }).text
    return typeof t === 'string' ? t : undefined
  }
  if (Array.isArray(v) && v.length > 0) {
    const first = v[0]
    if (typeof first === 'string') return first
    if (typeof first === 'object' && first && 'text' in first) {
      const t = (first as { text: unknown }).text
      return typeof t === 'string' ? t : undefined
    }
  }
  return undefined
}

/** 多选：返回 option name 字符串数组 */
export function decodeMultiSelect(v: unknown): string[] {
  if (v == null) return []
  if (Array.isArray(v)) {
    return v
      .map((x) => (typeof x === 'string' ? x : typeof x === 'object' && x && 'text' in x ? String((x as { text: unknown }).text) : ''))
      .filter(Boolean)
  }
  return []
}

/**
 * datetime / created_at / updated_at：返回 ISO string
 *
 * 兼容两个来源：
 * - 飞书原 OpenAPI：number 毫秒时间戳
 * - lark-cli +record-list --format json：字符串 'yyyy-MM-dd HH:mm:ss'（用户本地时区渲染）
 */
export function decodeDateTime(v: unknown): string | undefined {
  if (v == null || v === '') return undefined
  if (typeof v === 'number') {
    return Number.isFinite(v) ? new Date(v).toISOString() : undefined
  }
  if (typeof v === 'string') {
    // 已是 ISO（带 T 或 Z）
    let t = Date.parse(v)
    if (!Number.isFinite(t) && /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(v)) {
      // lark-cli 渲染格式：当作 local time（依赖运行机器时区与用户时区一致）
      t = Date.parse(v.replace(' ', 'T'))
    }
    return Number.isFinite(t) ? new Date(t).toISOString() : undefined
  }
  return undefined
}

/** 人员字段：返回 open_id 数组（飞书会用 id 字段返回 open_id 形态） */
export function decodeUserIds(v: unknown): string[] {
  if (!Array.isArray(v)) return []
  return v
    .map((x) => (typeof x === 'object' && x && 'id' in x ? String((x as { id: unknown }).id) : ''))
    .filter(Boolean)
}

/** 把日期 ISO 字符串编码为 Bitable 时间戳（毫秒） */
export function encodeDateTime(iso: string | undefined): number | null {
  if (!iso) return null
  const t = Date.parse(iso)
  return Number.isFinite(t) ? t : null
}

/** 把 open_id 编码为 Bitable 人员字段写入值 */
export function encodeUser(openId: string | undefined): Array<{ id: string }> | null {
  if (!openId) return null
  return [{ id: openId }]
}

/** Bitable filter 字符串：CurrentValue.[fieldName]="value"；value 内不能含双引号 */
export function eqFilter(fieldName: string, value: string): string {
  return `CurrentValue.[${fieldName}]="${value.replace(/"/g, '')}"`
}
