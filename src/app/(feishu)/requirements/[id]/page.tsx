import { notFound } from 'next/navigation'
import { getRequirementWithItems } from '@/domains/requirement/service'
import { getEncodingForDevice } from '@/domains/device/service'
import { getDeliveryState } from '@/domains/dashboard/service'
import { formatStatus } from '@/domains/requirement/labels'
import { REQUIREMENT_TYPES } from '@/lib/constants'
import { KindBadge, specText } from '@/components/template-selector/spec-badge'
import { CopyButton } from '@/components/copy-button'
import { ConfirmDeliveryButton } from '@/components/confirm-delivery-button'
import { getEnv } from '@/lib/env'
import { getCurrentUser } from '@/lib/session'
import type { DeliveryState } from '@/domains/dashboard/types'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ id: string }> }

export default async function RequirementDetailPage({ params }: Props) {
  const { id } = await params
  const req = await getRequirementWithItems(id)
  if (!req) notFound()

  const encoding = await getEncodingForDevice(req.targetDevice)
  const typeLabel = REQUIREMENT_TYPES.find((t) => t.value === req.type)?.label ?? req.type
  const { DESIGN_INTAKE_FORM_URL } = getEnv()

  const delivery = getDeliveryState(req)
  const currentUser = await getCurrentUser()
  const canConfirmDelivery =
    currentUser?.openId === req.creatorOpenId && delivery !== 'delivered'

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">{req.title}</h1>
          <p className="mt-1 text-sm text-neutral-500">
            {req.targetDevice} · {typeLabel} · {req.priority} · 状态 {formatStatus(req.status)}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <DeliveryBadge state={delivery} />
          {canConfirmDelivery && <ConfirmDeliveryButton requirementId={req.id} />}
        </div>
      </div>

      <section className="rounded-lg border border-sky-200 bg-sky-50 px-4 py-3">
        {req.documentUrl ? (
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm text-sky-900">
              <span className="mr-2">📄 飞书需求文档</span>
              <span className="text-xs text-sky-600">已自动生成，设计/开发可在文档内填补内容</span>
            </div>
            <div className="flex items-center gap-2">
              <CopyButton
                text={req.documentUrl}
                label="复制链接"
                className="rounded border border-sky-300 bg-white px-3 py-1 text-xs text-sky-700 hover:bg-sky-100"
              />
              <a
                href={req.documentUrl}
                target="_blank"
                rel="noreferrer"
                className="rounded bg-sky-600 px-3 py-1 text-xs font-medium text-white hover:bg-sky-700"
              >
                打开飞书 docx →
              </a>
            </div>
          </div>
        ) : (
          <p className="text-sm text-amber-700">
            ⚠️ 飞书需求文档未生成 —— 检查 <code>FEISHU_DOC_FOLDER_TOKEN</code> 是否已配 + lark-cli 是否可用（看 dev server 控制台 <code>[docx]</code> 日志）
          </p>
        )}
      </section>

      <section className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
        <div className="mb-2 flex items-center justify-between gap-3">
          <div className="text-sm text-emerald-900">
            <span className="mr-2">📤 提单给设计</span>
            <span className="text-xs text-emerald-600">
              v1 手动：复制 docx 链接 → 打开表单 → 粘贴到「需求文档链接」字段 → 提交
            </span>
          </div>
          <div className="flex items-center gap-2">
            {req.documentUrl && (
              <CopyButton
                text={req.documentUrl}
                label="复制 docx 链接"
                copiedLabel="✓ 已复制，可粘贴"
                className="rounded border border-emerald-300 bg-white px-3 py-1 text-xs text-emerald-800 hover:bg-emerald-100"
              />
            )}
            <a
              href={DESIGN_INTAKE_FORM_URL}
              target="_blank"
              rel="noreferrer"
              className="rounded bg-emerald-600 px-3 py-1 text-xs font-medium text-white hover:bg-emerald-700"
            >
              打开设计提单表单 →
            </a>
          </div>
        </div>
        <p className="text-xs text-emerald-700">
          自动写设计收单表（无需手动跳转）的权限申请中，到位后这条提示会消失，按钮变成「一键提单」。
        </p>
      </section>

      <section className="grid gap-3 rounded-lg border border-neutral-200 bg-white p-4 text-sm sm:grid-cols-2">
        <Info label="目标设备" value={req.targetDevice} />
        <Info label="平台（APP）" value={req.appPlatforms.join(' / ')} />
        <Info label="收单平台" value={req.intakePlatform} />
        <Info label="预计完成" value={req.expectedDueDate} />
        <Info label="产品经理" value={req.creatorName} />
        {req.successMetric ? (
          <Info label="需求指标" value={req.successMetric} full />
        ) : (
          <Info label="需求指标" value="待补充（一键提单前填写）" full />
        )}
        {req.remark && <Info label="备注" value={req.remark} full />}
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-medium text-neutral-500">机型识别 · SN 编码规则</h2>
        {encoding ? (
          <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
            <div className="border-b border-neutral-100 px-3 py-2 text-sm">
              <span className="font-medium">{encoding.deviceName}</span>
              <span className="ml-2 font-mono text-xs text-neutral-500">示例 {encoding.example}</span>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 text-left text-xs text-neutral-500">
                <tr>
                  <th className="px-3 py-2 font-medium">位</th>
                  <th className="px-3 py-2 font-medium">含义</th>
                  <th className="px-3 py-2 font-medium">规则</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {encoding.positions.map((p) => (
                  <tr key={p.range}>
                    <td className="px-3 py-2 font-mono text-xs text-neutral-600">{p.range}</td>
                    <td className="px-3 py-2 text-neutral-700">{p.name}</td>
                    <td className="px-3 py-2 text-neutral-600">{p.rule}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
            未配置「{req.targetDevice}」的 SN 编码规则。可在设置/机型编码库补充。
          </p>
        )}
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-medium text-neutral-500">资源清单（{req.assetItems.length}）</h2>
        <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-left text-xs text-neutral-500">
              <tr>
                <th className="px-3 py-2 font-medium">#</th>
                <th className="px-3 py-2 font-medium">分组</th>
                <th className="px-3 py-2 font-medium">涉及环节</th>
                <th className="px-3 py-2 font-medium">资源名称</th>
                <th className="px-3 py-2 font-medium">类型</th>
                <th className="px-3 py-2 font-medium">规格</th>
                <th className="px-3 py-2 font-medium">主题</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {req.assetItems.map((item, i) => (
                <tr key={item.id}>
                  <td className="px-3 py-2 text-neutral-400">{i + 1}</td>
                  <td className="px-3 py-2 text-neutral-600">{item.category}</td>
                  <td className="px-3 py-2 text-neutral-700">{item.scene}</td>
                  <td className="px-3 py-2 font-medium">{item.assetName}</td>
                  <td className="px-3 py-2">
                    <KindBadge kind={item.assetKind} />
                  </td>
                  <td className="px-3 py-2 font-mono text-xs text-neutral-600">{specText(item, item.size)}</td>
                  <td className="px-3 py-2 text-xs text-neutral-500">
                    {item.themes.length ? item.themes.join(' / ') : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

function Info({ label, value, full }: { label: string; value: string; full?: boolean }) {
  return (
    <div className={full ? 'sm:col-span-2' : ''}>
      <div className="text-xs text-neutral-400">{label}</div>
      <div className="text-neutral-800">{value}</div>
    </div>
  )
}

const DELIVERY_BADGE: Record<DeliveryState, { label: string; cls: string }> = {
  delivered: { label: '已交付', cls: 'bg-emerald-100 text-emerald-700' },
  overdue: { label: '已逾期', cls: 'bg-red-100 text-red-700' },
  pending: { label: '待交付', cls: 'bg-neutral-100 text-neutral-700' },
}

function DeliveryBadge({ state }: { state: DeliveryState }) {
  const { label, cls } = DELIVERY_BADGE[state]
  return <span className={`rounded px-2 py-1 text-xs font-medium ${cls}`}>{label}</span>
}
