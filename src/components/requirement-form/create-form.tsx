'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { AssetTemplate } from '@/domains/template/types'
import type { CreateAssetItemInput, Platform } from '@/domains/requirement/types'
import { REQUIREMENT_TYPES, PRIORITIES } from '@/lib/constants'
import { KindBadge, specText } from '@/components/template-selector/spec-badge'

type Group = { module: string; category: string; items: AssetTemplate[] }

function plusDays(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

export function CreateRequirementForm({
  groups,
  knownDevices = [],
}: {
  groups: Group[]
  knownDevices?: string[]
}) {
  const router = useRouter()
  const [device, setDevice] = useState('')
  const [titleEdited, setTitleEdited] = useState(false)
  const [title, setTitle] = useState('')
  const [type, setType] = useState(REQUIREMENT_TYPES[0].value)
  const [platforms, setPlatforms] = useState<Platform[]>(['ios', 'android'])
  const [priority, setPriority] = useState<(typeof PRIORITIES)[number]>('P1')
  const [dueDate, setDueDate] = useState(plusDays(10))
  const [remark, setRemark] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const effectiveTitle = titleEdited ? title : device ? `新增${device}连接图片资源` : ''
  const allTemplates = useMemo(() => groups.flatMap((g) => g.items), [groups])
  const selectedCount = selected.size
  const deviceKnown =
    !device || knownDevices.some((d) => d.toUpperCase() === device.trim().toUpperCase())

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }
  function toggleGroup(g: Group, on: boolean) {
    setSelected((prev) => {
      const next = new Set(prev)
      for (const t of g.items) {
        if (on) next.add(t.id)
        else next.delete(t.id)
      }
      return next
    })
  }
  function togglePlatform(p: Platform) {
    setPlatforms((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]))
  }

  async function handleSubmit() {
    setError(null)
    if (!device.trim()) return setError('请填写目标设备')
    if (selectedCount === 0) return setError('至少勾选一个资源位')
    if (platforms.length === 0) return setError('至少选一个平台')

    const assetItems: CreateAssetItemInput[] = allTemplates
      .filter((t) => selected.has(t.id))
      .map((t, idx) => ({
        templateId: t.id,
        module: t.module,
        category: t.category,
        scene: t.scene,
        assetName: t.assetName,
        assetKind: t.assetKind,
        format: t.format,
        size: t.defaultSize,
        fps: t.fps,
        themes: t.hasThemeVariants ? (['light', 'dark'] as const).slice() : [],
        sortOrder: idx,
      }))

    setSubmitting(true)
    try {
      const res = await fetch('/api/requirements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: effectiveTitle,
          targetDevice: device.trim(),
          type,
          intakePlatform: '软件',
          appPlatforms: platforms,
          priority,
          expectedDueDate: dueDate,
          remark: remark.trim() || undefined,
          assetItems,
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.ok) {
        setError(data.error ?? '提交失败')
        setSubmitting(false)
        return
      }
      router.push(`/requirements/${data.requirement.id}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : '网络错误')
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* 顶部：批次字段 */}
      <div className="grid grid-cols-2 gap-3 rounded-lg border border-neutral-200 bg-white p-4 sm:grid-cols-3">
        <Field label="目标设备 *">
          <input
            className="input"
            placeholder="如 Z03 / Z05 / TRC"
            list="known-devices"
            value={device}
            onChange={(e) => setDevice(e.target.value)}
          />
          <datalist id="known-devices">
            {knownDevices.map((d) => (
              <option key={d} value={d} />
            ))}
          </datalist>
          {!deviceKnown && (
            <span className="text-xs text-amber-600">该机型暂无 SN 编码规则，提单时会提示待补充</span>
          )}
        </Field>
        <Field label="需求标题">
          <input
            className="input"
            value={effectiveTitle}
            onChange={(e) => {
              setTitleEdited(true)
              setTitle(e.target.value)
            }}
          />
        </Field>
        <Field label="需求类型">
          <select className="input" value={type} onChange={(e) => setType(e.target.value as typeof type)}>
            {REQUIREMENT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="平台（APP 端）">
          <div className="flex gap-4 pt-1.5 text-sm">
            {(['ios', 'android'] as Platform[]).map((p) => (
              <label key={p} className="flex items-center gap-1">
                <input type="checkbox" checked={platforms.includes(p)} onChange={() => togglePlatform(p)} />
                {p === 'ios' ? 'iOS' : 'Android'}
              </label>
            ))}
          </div>
        </Field>
        <Field label="优先级">
          <select className="input" value={priority} onChange={(e) => setPriority(e.target.value as typeof priority)}>
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </Field>
        <Field label="预计完成时间">
          <input type="date" className="input" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </Field>
        <Field label="备注" full>
          <input className="input" value={remark} onChange={(e) => setRemark(e.target.value)} />
        </Field>
      </div>

      {/* 下方：资源位勾选 */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-neutral-500">选择资源位（已选 {selectedCount}）</h2>
          <span className="text-xs text-neutral-400">规格在「模板库」维护</span>
        </div>
        {groups.map((g) => {
          const groupSelected = g.items.length > 0 && g.items.every((t) => selected.has(t.id))
          return (
            <section key={`${g.module}-${g.category}`} className="rounded-lg border border-neutral-200 bg-white">
              <header className="flex items-center justify-between border-b border-neutral-100 px-3 py-2">
                <span className="text-sm font-medium">
                  {g.module} · {g.category}
                </span>
                <label className="flex items-center gap-1 text-xs text-neutral-500">
                  <input type="checkbox" checked={groupSelected} onChange={(e) => toggleGroup(g, e.target.checked)} />
                  全选
                </label>
              </header>
              <ul className="divide-y divide-neutral-100">
                {g.items.map((t) => (
                  <li key={t.id}>
                    <label className="flex cursor-pointer items-center gap-3 px-3 py-2 hover:bg-neutral-50">
                      <input type="checkbox" checked={selected.has(t.id)} onChange={() => toggle(t.id)} />
                      <span className="flex-1">
                        <span className="font-medium text-neutral-900">{t.assetName}</span>
                        <span className="ml-2 text-xs text-neutral-500">{t.scene}</span>
                      </span>
                      <KindBadge kind={t.assetKind} />
                      <span className="font-mono text-xs text-neutral-500">{specText(t, t.defaultSize)}</span>
                      {t.hasThemeVariants && <span className="text-xs text-neutral-400">L/D</span>}
                    </label>
                  </li>
                ))}
              </ul>
            </section>
          )
        })}
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      )}

      <div className="flex items-center justify-end gap-3">
        <span className="text-xs text-neutral-400">需要新资源位？去「模板库」新增后再来勾选</span>
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="rounded-md bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
        >
          {submitting ? '创建中…' : `创建需求草稿（${selectedCount} 个资源位）`}
        </button>
      </div>
    </div>
  )
}

function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <label className={`block space-y-1 ${full ? 'col-span-2 sm:col-span-3' : ''}`}>
      <span className="text-xs font-medium text-neutral-600">{label}</span>
      {children}
    </label>
  )
}
