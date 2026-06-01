'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

type Props = {
  requirementId: string
  className?: string
}

export function ConfirmDeliveryButton({ requirementId, className }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleClick() {
    if (!window.confirm('确认交付后状态变为「已交付」，是否继续？')) return
    setError(null)
    setSubmitting(true)
    try {
      const res = await fetch(`/api/requirements/${requirementId}/status`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ toStatus: 'released' }),
      })
      const data = (await res.json()) as { ok: boolean; error?: string }
      if (!res.ok || !data.ok) {
        setError(data.error ?? `提交失败 (${res.status})`)
        return
      }
      startTransition(() => router.refresh())
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setSubmitting(false)
    }
  }

  const disabled = submitting || pending

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled}
        className={
          className ??
          'rounded bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50'
        }
      >
        {disabled ? '提交中…' : '✓ 确认交付'}
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  )
}
