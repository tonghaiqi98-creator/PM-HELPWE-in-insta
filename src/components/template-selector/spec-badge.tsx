import type { AssetKind, ImageFormat } from '@/domains/template/types'

type SpecLike = { format: ImageFormat; assetKind: AssetKind; fps?: number }

export function specText(t: SpecLike, size: { width: number; height: number }): string {
  const dims = `${size.width}×${size.height}`
  const fps = t.assetKind === 'dynamic' && t.fps ? ` · ${t.fps}fps` : ''
  return `${t.format} ${dims}${fps}`
}

export function KindBadge({ kind }: { kind: AssetKind }) {
  const isDyn = kind === 'dynamic'
  return (
    <span
      className={`inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium ${
        isDyn ? 'bg-purple-100 text-purple-700' : 'bg-sky-100 text-sky-700'
      }`}
    >
      {isDyn ? '动图' : '静态'}
    </span>
  )
}
