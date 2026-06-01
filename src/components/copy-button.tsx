'use client'

import { useState } from 'react'
import { copyToClipboard } from '@/lib/clipboard'

type Props = {
  text: string
  label?: string
  copiedLabel?: string
  className?: string
}

export function CopyButton({
  text,
  label = '复制链接',
  copiedLabel = '✓ 已复制',
  className,
}: Props) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      type="button"
      onClick={async () => {
        const ok = await copyToClipboard(text)
        if (ok) {
          setCopied(true)
          setTimeout(() => setCopied(false), 1500)
        }
      }}
      className={
        className ??
        'rounded border border-neutral-300 bg-white px-3 py-1 text-xs text-neutral-700 hover:bg-neutral-50'
      }
    >
      {copied ? copiedLabel : label}
    </button>
  )
}
