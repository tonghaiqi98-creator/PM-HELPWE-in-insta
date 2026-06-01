import { randomUUID } from 'node:crypto'
import type { DeviceRepository } from '@/domains/device/repository'
import type {
  DeviceEncoding,
  CreateDeviceEncodingInput,
  UpdateDeviceEncodingInput,
} from '@/domains/device/types'
import { getStore } from './store'

export class MockDeviceRepository implements DeviceRepository {
  async list(): Promise<DeviceEncoding[]> {
    return Array.from(getStore().deviceEncodings.values()).sort((a, b) =>
      a.deviceCode.localeCompare(b.deviceCode),
    )
  }
  async getByCode(deviceCode: string): Promise<DeviceEncoding | null> {
    const norm = deviceCode.trim().toUpperCase()
    return (
      Array.from(getStore().deviceEncodings.values()).find(
        (d) => d.deviceCode.toUpperCase() === norm,
      ) ?? null
    )
  }
  async create(input: CreateDeviceEncodingInput): Promise<DeviceEncoding> {
    const d: DeviceEncoding = { ...input, id: `dev_${randomUUID()}` }
    getStore().deviceEncodings.set(d.id, d)
    return d
  }
  async update(id: string, patch: UpdateDeviceEncodingInput): Promise<DeviceEncoding> {
    const store = getStore()
    const existing = store.deviceEncodings.get(id)
    if (!existing) throw new Error(`device encoding not found: ${id}`)
    const updated: DeviceEncoding = { ...existing, ...patch }
    store.deviceEncodings.set(id, updated)
    return updated
  }
  async delete(id: string): Promise<void> {
    getStore().deviceEncodings.delete(id)
  }
}
