import { randomUUID } from 'node:crypto'
import type { AssetItemRepository } from '@/domains/requirement/asset-item-repository'
import type { AssetItem, CreateAssetItemInput } from '@/domains/requirement/types'
import { getStore } from './store'

export class MockAssetItemRepository implements AssetItemRepository {
  async listByRequirement(requirementId: string): Promise<AssetItem[]> {
    return Array.from(getStore().assetItems.values())
      .filter((i) => i.requirementId === requirementId)
      .sort((a, b) => a.sortOrder - b.sortOrder)
  }
  async batchCreate(
    requirementId: string,
    targetDevice: string,
    items: CreateAssetItemInput[],
  ): Promise<AssetItem[]> {
    const store = getStore()
    const created = items.map((input) => {
      const item: AssetItem = {
        ...input,
        id: `ai_${randomUUID()}`,
        requirementId,
        targetDevice,
        status: input.status ?? 'pending',
      }
      store.assetItems.set(item.id, item)
      return item
    })
    return created
  }
  async update(id: string, patch: Partial<AssetItem>): Promise<AssetItem> {
    const store = getStore()
    const existing = store.assetItems.get(id)
    if (!existing) throw new Error(`asset item not found: ${id}`)
    const updated = { ...existing, ...patch }
    store.assetItems.set(id, updated)
    return updated
  }
  async delete(id: string): Promise<void> {
    getStore().assetItems.delete(id)
  }
}
