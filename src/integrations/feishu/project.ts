/**
 * 飞书项目 (project.feishu.cn) API 占位。
 * v1 不接 API，仅用空间 URL 拼跳转链接。
 * v2 拿到 plugin_id / plugin_secret 后在这里实现 workitem create。
 */

import { getEnv } from '@/lib/env'

export function getProjectSpaceUrl(): string {
  return getEnv().FEISHU_PROJECT_SPACE_URL
}

// TODO(v2): 接飞书项目 OpenAPI
// - getProjectAccessToken(): plugin_id/secret -> access_token
// - createWorkitem(spaceId, type='requirement', fields): { workitem_id, url }
