import { randomUUID } from 'node:crypto'
import { getRequirementRepository } from './repository'
import { getAssetItemRepository } from './asset-item-repository'
import { createRequirementSchema } from './schema'
import { getDocxGenerator } from './docx-generator'
import { getEncodingForDevice } from '@/domains/device/service'
import { getEnv } from '@/lib/env'
import type {
  AssetItem,
  CreateRequirementInput,
  Requirement,
  RequirementFilter,
  RequirementWithItems,
  UpdateRequirementInput,
} from './types'

/**
 * 创建一份批次需求 + 其下资源项。
 * 先建 Requirement(draft)，再批量建 AssetItem。
 */
export async function createRequirement(
  input: CreateRequirementInput,
): Promise<RequirementWithItems> {
  const parsed = createRequirementSchema.parse(input)
  const repo = await getRequirementRepository()
  const itemRepo = await getAssetItemRepository()

  const requirement = await repo.create({
    title: parsed.title,
    targetDevice: parsed.targetDevice,
    type: parsed.type,
    intakePlatform: parsed.intakePlatform,
    appPlatforms: parsed.appPlatforms,
    successMetric: parsed.successMetric,
    priority: parsed.priority,
    expectedDueDate: parsed.expectedDueDate,
    remark: parsed.remark,
    status: 'draft',
    creatorOpenId: parsed.creatorOpenId,
    creatorName: parsed.creatorName,
  })

  const assetItems = await itemRepo.batchCreate(
    requirement.id,
    requirement.targetDevice,
    parsed.assetItems,
  )

  // 自动生成飞书 docx 需求文档（失败不阻塞草稿落库）
  const docMeta = await tryGenerateRequirementDocx(requirement, assetItems)
  if (docMeta) {
    const updated = await repo.update(requirement.id, docMeta)
    return { ...updated, assetItems }
  }
  return { ...requirement, assetItems }
}

/**
 * 尝试为新创建的需求生成飞书 docx。失败/未配置都返回 null，仅 console.warn，不抛错。
 * folder_token 未配 / lark-cli 未装 / 飞书 API 错都按"跳过"处理，草稿状态不受影响。
 */
async function tryGenerateRequirementDocx(
  requirement: Requirement,
  assetItems: AssetItem[],
): Promise<{ documentToken: string; documentUrl: string } | null> {
  const { FEISHU_DOC_FOLDER_TOKEN, REQUIREMENT_DOC_TEMPLATE_URL } = getEnv()
  if (!FEISHU_DOC_FOLDER_TOKEN) {
    console.warn('[docx] FEISHU_DOC_FOLDER_TOKEN 未配置，跳过 docx 生成')
    return null
  }
  try {
    const encoding = await getEncodingForDevice(requirement.targetDevice)
    const gen = getDocxGenerator()
    const result = await gen.generate({
      requirement,
      assetItems,
      encoding,
      folderToken: FEISHU_DOC_FOLDER_TOKEN,
      templateDocUrl: REQUIREMENT_DOC_TEMPLATE_URL,
    })
    if (result.ok) {
      console.log(`[docx] 已生成: ${result.documentUrl}`)
      return { documentToken: result.documentToken, documentUrl: result.documentUrl }
    }
    console.warn(`[docx] 生成失败（不阻塞草稿）: ${result.error}`)
    return null
  } catch (e) {
    console.warn(
      '[docx] 生成异常（不阻塞草稿）:',
      e instanceof Error ? e.message : String(e),
    )
    return null
  }
}

export async function getRequirement(id: string): Promise<Requirement | null> {
  const repo = await getRequirementRepository()
  return repo.get(id)
}

export async function getRequirementWithItems(
  id: string,
): Promise<RequirementWithItems | null> {
  const repo = await getRequirementRepository()
  const requirement = await repo.get(id)
  if (!requirement) return null
  const itemRepo = await getAssetItemRepository()
  const assetItems = await itemRepo.listByRequirement(id)
  return { ...requirement, assetItems }
}

export async function listRequirements(filter: RequirementFilter): Promise<Requirement[]> {
  const repo = await getRequirementRepository()
  return repo.list(filter)
}

export async function updateRequirement(
  id: string,
  patch: UpdateRequirementInput,
): Promise<Requirement> {
  const repo = await getRequirementRepository()
  return repo.update(id, patch)
}

export function newRequirementId(): string {
  return `req_${randomUUID()}`
}
