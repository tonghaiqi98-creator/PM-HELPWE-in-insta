'use client'

import { useEffect, useRef, useState } from 'react'
import { loadFeishuSdk, getLoginCode } from '@/integrations/feishu/jsapi'

type Props = {
  appId: string
  alreadyLoggedIn: boolean
}

type Status = 'idle' | 'logging-in' | 'ok' | 'skip' | 'error'

export function FeishuBootstrap({ appId, alreadyLoggedIn }: Props) {
  const didRun = useRef(false)
  const [status, setStatus] = useState<Status>(alreadyLoggedIn ? 'ok' : 'idle')
  const [message, setMessage] = useState<string>('')

  useEffect(() => {
    if (didRun.current) return
    didRun.current = true
    if (alreadyLoggedIn) return
    if (!appId) {
      setStatus('error')
      setMessage('NEXT_PUBLIC_FEISHU_APP_ID 未配置')
      return
    }
    if (typeof window === 'undefined') return
    ;(async () => {
      try {
        await loadFeishuSdk()
        if (!window.tt) {
          setStatus('skip')
          setMessage('未在飞书容器内（浏览器直接打开）')
          return
        }
        setStatus('logging-in')
        const code = await getLoginCode(appId)
        const res = await fetch('/api/auth/feishu', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code }),
        })
        const data = (await res.json()) as { ok: boolean; error?: string }
        if (!res.ok || !data.ok) throw new Error(data?.error ?? `HTTP ${res.status}`)
        setStatus('ok')
        window.location.reload()
      } catch (e) {
        setStatus('error')
        setMessage(e instanceof Error ? e.message : String(e))
      }
    })()
  }, [appId, alreadyLoggedIn])

  if (status === 'idle' || status === 'ok') return null

  const styleMap: Record<Exclude<Status, 'idle' | 'ok'>, string> = {
    'logging-in': 'bg-sky-50 text-sky-700',
    skip: 'bg-amber-50 text-amber-700',
    error: 'bg-red-50 text-red-700',
  }
  const text =
    status === 'logging-in'
      ? '正在飞书免登…'
      : status === 'skip'
        ? `${message}，使用 mock 兜底用户`
        : `免登失败：${message}`

  return <div className={`px-4 py-1 text-xs ${styleMap[status]}`}>{text}</div>
}
