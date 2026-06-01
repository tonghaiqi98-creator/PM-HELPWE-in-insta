'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { AssetTemplate, CreateTemplateInput } from '@/domains/template/types'
import { ASSET_CATEGORIES, ASSET_FORMATS } from '@/lib/constants'
import { KindBadge, specText } from './spec-badge'

type Group = { module: string; category: string; items: AssetTemplate[] }

function emptyDraft(): CreateTemplateInput {
  return {
    module: '连接',
    category: '连接-静态图',
    scene: '',
    assetName: '',
    assetKind: 'static',
    format: 'png',
    defaultSize: { width: 100, height: 100 },
    hasThemeVariants: false,
    namingRule: '',
    devModule: '',
    note: '',
    sortOrder: 99,
  }
}

export function TemplateManager({ groups }: { groups: Group[] }) {
  const router = useRouter()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState<CreateTemplateInput | null>(null)
  const [busy, setBusy] = useState(false)

  const total = groups.reduce((n, g) => n + g.items.length, 0)

  function openCreate() {
    setEditingId(null)
    setDraft(emptyDraft())
  }
  function openEdit(t: AssetTemplate) {
    setEditingId(t.id)
    const { id: _id, ...rest } = t
    setDraft({ ...rest, namingRule: t.namingRule ?? '', devModule: t.devModule ?? '', note: t.note ?? '' })
  }

  async function save() {
    if (!draft) return
    if (!draft.scene.trim() || !draft.assetName.trim()) {
      alert('涉及环节 / 资源名称必填')
      return
    }
    setBusy(true)
    try {
      const res = await fetch(editingId ? `/api/templates/${editingId}` : '/api/templates', {
        method: editingId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draft),
      })
      const data = await res.json()
      if (!res.ok || !data.ok) {
        alert(data.error ?? '保存失败')
        return
      }
      setDraft(null)
      setEditingId(null)
      router.refresh()
    } finally {
      setBusy(false)
    }
  }

  async function remove(t: AssetTemplate) {
    if (!confirm(`删除资源位「${t.assetName}」？已创建的需求不受影响。`)) return
    setBusy(true)
    try {
      const res = await fetch(`/api/templates/${t.id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok || !data.ok) {
        alert(data.error ?? '删除失败')
        return
      }
      router.refresh()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">模板库 · 资源位目录</h1>
          <p className="mt-1 text-sm text-neutral-600">
            跨设备稳定的资源位清单，共 {total} 个。提需求时勾选即带出规格。
          </p>
        </div>
        <button
          onClick={openCreate}
          className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm text-white hover:bg-neutral-800"
        >
          + 新增资源位
        </button>
      </div>

      {groups.map((g) => (
        <section key={`${g.module}-${g.category}`} className="space-y-2">
          <h2 className="text-sm font-medium text-neutral-500">
            {g.module} · {g.category}（{g.items.length}）
          </h2>
          <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 text-left text-xs text-neutral-500">
                <tr>
                  <th className="px-3 py-2 font-medium">涉及环节</th>
                  <th className="px-3 py-2 font-medium">资源名称</th>
                  <th className="px-3 py-2 font-medium">类型</th>
                  <th className="px-3 py-2 font-medium">规格</th>
                  <th className="px-3 py-2 font-medium">主题</th>
                  <th className="px-3 py-2 font-medium text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {g.items.map((t) => (
                  <tr key={t.id}>
                    <td className="px-3 py-2 text-neutral-700">{t.scene}</td>
                    <td className="px-3 py-2 font-medium text-neutral-900">
                      {t.assetName}
                      {t.note && <span className="ml-1 text-xs text-amber-600">· {t.note}</span>}
                    </td>
                    <td className="px-3 py-2">
                      <KindBadge kind={t.assetKind} />
                    </td>
                    <td className="px-3 py-2 font-mono text-xs text-neutral-600">
                      {specText(t, t.defaultSize)}
                    </td>
                    <td className="px-3 py-2 text-xs text-neutral-500">
                      {t.hasThemeVariants ? 'Light / Dark' : '—'}
                    </td>
                    <td className="px-3 py-2 text-right text-xs">
                      <button onClick={() => openEdit(t)} className="text-neutral-600 hover:text-neutral-900">
                        编辑
                      </button>
                      <button onClick={() => remove(t)} className="ml-3 text-red-600 hover:text-red-700">
                        删除
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}

      {draft && (
        <TemplateModal
          draft={draft}
          setDraft={setDraft}
          onSave={save}
          onCancel={() => setDraft(null)}
          busy={busy}
          isEdit={!!editingId}
        />
      )}
    </div>
  )
}

function TemplateModal({
  draft,
  setDraft,
  onSave,
  onCancel,
  busy,
  isEdit,
}: {
  draft: CreateTemplateInput
  setDraft: (d: CreateTemplateInput) => void
  onSave: () => void
  onCancel: () => void
  busy: boolean
  isEdit: boolean
}) {
  const set = (patch: Partial<CreateTemplateInput>) => setDraft({ ...draft, ...patch })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg bg-white p-5 shadow-xl">
        <h3 className="mb-4 text-base font-semibold">{isEdit ? '编辑资源位' : '新增资源位'}</h3>
        <div className="grid grid-cols-2 gap-3">
          <L label="模块">
            <input className="input" value={draft.module} onChange={(e) => set({ module: e.target.value })} />
          </L>
          <L label="分组">
            <select className="input" value={draft.category} onChange={(e) => set({ category: e.target.value })}>
              {ASSET_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </L>
          <L label="涉及环节 *">
            <input className="input" value={draft.scene} onChange={(e) => set({ scene: e.target.value })} />
          </L>
          <L label="资源名称 *">
            <input className="input" value={draft.assetName} onChange={(e) => set({ assetName: e.target.value })} />
          </L>
          <L label="类型">
            <select
              className="input"
              value={draft.assetKind}
              onChange={(e) => set({ assetKind: e.target.value as CreateTemplateInput['assetKind'] })}
            >
              <option value="static">静态图</option>
              <option value="dynamic">动图</option>
            </select>
          </L>
          <L label="格式">
            <select
              className="input"
              value={draft.format}
              onChange={(e) => set({ format: e.target.value as CreateTemplateInput['format'] })}
            >
              {ASSET_FORMATS.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </L>
          <L label="宽 (px)">
            <input
              type="number"
              className="input"
              value={draft.defaultSize.width}
              onChange={(e) => set({ defaultSize: { ...draft.defaultSize, width: Number(e.target.value) } })}
            />
          </L>
          <L label="高 (px)">
            <input
              type="number"
              className="input"
              value={draft.defaultSize.height}
              onChange={(e) => set({ defaultSize: { ...draft.defaultSize, height: Number(e.target.value) } })}
            />
          </L>
          {draft.assetKind === 'dynamic' && (
            <L label="帧率 fps">
              <input
                type="number"
                className="input"
                value={draft.fps ?? ''}
                onChange={(e) => set({ fps: e.target.value ? Number(e.target.value) : undefined })}
              />
            </L>
          )}
          <L label="排序">
            <input
              type="number"
              className="input"
              value={draft.sortOrder}
              onChange={(e) => set({ sortOrder: Number(e.target.value) })}
            />
          </L>
          <L label="命名规则" full>
            <input className="input" value={draft.namingRule ?? ''} onChange={(e) => set({ namingRule: e.target.value })} />
          </L>
          <L label="备注" full>
            <input className="input" value={draft.note ?? ''} onChange={(e) => set({ note: e.target.value })} />
          </L>
          <label className="col-span-2 flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={draft.hasThemeVariants}
              onChange={(e) => set({ hasThemeVariants: e.target.checked })}
            />
            区分 Light / Dark 双主题
          </label>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onCancel} className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm">
            取消
          </button>
          <button
            onClick={onSave}
            disabled={busy}
            className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm text-white disabled:opacity-50"
          >
            {busy ? '保存中…' : '保存'}
          </button>
        </div>
      </div>
    </div>
  )
}

function L({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <label className={`block space-y-1 ${full ? 'col-span-2' : ''}`}>
      <span className="text-xs font-medium text-neutral-600">{label}</span>
      {children}
    </label>
  )
}
