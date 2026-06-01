import type { AssetItem, CreateAssetItemInput } from './types'

export interface AssetItemRepository {
  listByRequirement(requirementId: string): Promise<AssetItem[]>
  /**
   * 批量建明细：targetDevice 是 batch-level 参数（一个 requirement 一台设备），
   * 不在 CreateAssetItemInput 里重复，由这里统一注入到每条 AssetItem。
   */
  batchCreate(
    requirementId: string,
    targetDevice: string,
    items: CreateAssetItemInput[],
  ): Promise<AssetItem[]>
  update(id: string, patch: Partial<AssetItem>): Promise<AssetItem>
  delete(id: string): Promise<void>
}

export async function getAssetItemRepository(): Promise<AssetItemRepository> {
  const { shouldUseBitableFor } = await import('@/lib/repo-source')
  if (shouldUseBitableFor('FEISHU_BITABLE_TABLE_ASSET_ITEMS')) {
    const m = await import('@/integrations/feishu/repositories/asset-item.bitable')
    return new m.BitableAssetItemRepository()
  }
  const m = await import('@/integrations/mock/asset-item.mock')
  return new m.MockAssetItemRepository()
}
