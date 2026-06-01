/**
 * Repository 实现选择策略：
 *
 * - DATA_SOURCE=bitable: 所有 repo 都走 bitable 实现（未实现的会 throw "TODO"）
 * - DATA_SOURCE=mock（默认）: 默认走 mock；但**如果该表的 env 都填了**，自动走 bitable
 *
 * 这样的好处：渐进迁移 — 哪个表的 table_id 填了，就联调那个表；其他仍用 mock 不受影响。
 */

export function shouldUseBitableFor(tableEnvKey: string): boolean {
  if (process.env.DATA_SOURCE === 'bitable') return true
  return Boolean(process.env.FEISHU_BITABLE_APP_TOKEN && process.env[tableEnvKey])
}
