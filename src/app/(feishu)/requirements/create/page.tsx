import { listTemplates, groupByCategory } from '@/domains/template/service'
import { listDeviceEncodings } from '@/domains/device/service'
import { getCurrentUser } from '@/lib/session'
import { CreateRequirementForm } from '@/components/requirement-form/create-form'

export const dynamic = 'force-dynamic'

export default async function CreateRequirementPage() {
  const [templates, devices, user] = await Promise.all([
    listTemplates(),
    listDeviceEncodings(),
    getCurrentUser(),
  ])
  const groups = groupByCategory(templates)
  const knownDevices = devices.map((d) => d.deviceCode)

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">提换图需求</h1>
        <p className="mt-1 text-sm text-neutral-600">
          选设备 + 勾资源位（规格自动带出）→ 填需求指标 → 创建草稿。
          {user && <span className="ml-1 text-neutral-400">当前：{user.name}</span>}
        </p>
      </div>
      <CreateRequirementForm groups={groups} knownDevices={knownDevices} />
    </div>
  )
}
