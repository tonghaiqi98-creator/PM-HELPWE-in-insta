import { feishuFetch } from './client'

/**
 * 服务端：把飞书 H5 免登的 code 换成 user_info。
 * https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/authen-v1/login_authen/authen
 */

export type FeishuUserInfo = {
  open_id: string
  union_id?: string
  user_id?: string
  name: string
  en_name?: string
  email?: string
  avatar_url?: string
}

type AuthResponse = {
  code: number
  msg: string
  data?: FeishuUserInfo
}

export async function exchangeCodeForUser(code: string): Promise<FeishuUserInfo> {
  const data = await feishuFetch<AuthResponse>('/open-apis/authen/v1/access_token', {
    method: 'POST',
    body: JSON.stringify({ grant_type: 'authorization_code', code }),
  })
  if (!data.data) {
    throw new Error(`[feishu/auth] no user data: ${data.code} ${data.msg}`)
  }
  return data.data
}
