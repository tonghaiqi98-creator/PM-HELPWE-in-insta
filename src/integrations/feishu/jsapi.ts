'use client'

/**
 * 客户端：飞书 H5 jsapi 封装。
 * - loadFeishuSdk(): 注入 <script> 加载飞书 SDK
 * - getLoginCode(): 调用 tt.requestAccess 获取 code（用于后端换 user_id）
 * - (预留) chooseContact(): 联系人选择器（v2）
 *
 * 仅在客户端组件 / hooks 中使用。
 */

declare global {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  interface Window { tt?: any; h5sdk?: any }
}

const SDK_URL = 'https://lf1-cdn-tos.bytegoofy.com/goofy/lark/op/h5-js-sdk-1.5.36.js'

let sdkPromise: Promise<void> | null = null

export function loadFeishuSdk(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve()
  if (window.tt && window.h5sdk) return Promise.resolve()
  if (sdkPromise) return sdkPromise
  sdkPromise = new Promise((resolve, reject) => {
    const s = document.createElement('script')
    s.src = SDK_URL
    s.async = true
    s.onload = () => resolve()
    s.onerror = () => reject(new Error('飞书 H5 SDK 加载失败'))
    document.head.appendChild(s)
  })
  return sdkPromise
}

/**
 * 获取免登 code。返回 code 后由后端 /api/auth/feishu 换 user_id。
 * 在飞书容器外（普通浏览器）调用会被 reject。
 */
export async function getLoginCode(appId: string): Promise<string> {
  await loadFeishuSdk()
  if (typeof window === 'undefined' || !window.tt) {
    throw new Error('飞书 SDK 未就绪（window.tt 缺失）')
  }

  const fmtErr = (err: unknown): string => {
    const e = err as { errno?: number; errMsg?: string; errString?: string } | undefined
    const parts = [
      e?.errno != null ? `errno=${e.errno}` : null,
      e?.errMsg ? `errMsg=${e.errMsg}` : null,
      e?.errString ? `errString=${e.errString}` : null,
    ].filter(Boolean)
    return parts.length ? parts.join(' ') : `raw=${JSON.stringify(err)}`
  }

  return new Promise<string>((resolve, reject) => {
    const fire = () => {
      window.tt.requestAccess({
        appID: appId,
        scopeList: [],
        success: (res: { code: string }) => resolve(res.code),
        fail: (err: unknown) => reject(new Error(`tt.requestAccess fail: ${fmtErr(err)}`)),
      })
    }
    // 飞书推荐：等 h5sdk.ready 再调 tt API；同时监听 error，捕获 jsapi 调用前的 SDK 错误
    if (window.h5sdk?.error) {
      window.h5sdk.error((err: unknown) => {
        reject(new Error(`h5sdk error: ${fmtErr(err)}`))
      })
    }
    if (window.h5sdk?.ready) {
      window.h5sdk.ready(fire)
    } else {
      fire()
    }
  })
}
