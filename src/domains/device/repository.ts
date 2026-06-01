import type {
  DeviceEncoding,
  CreateDeviceEncodingInput,
  UpdateDeviceEncodingInput,
} from './types'

export interface DeviceRepository {
  list(): Promise<DeviceEncoding[]>
  getByCode(deviceCode: string): Promise<DeviceEncoding | null>
  create(input: CreateDeviceEncodingInput): Promise<DeviceEncoding>
  update(id: string, patch: UpdateDeviceEncodingInput): Promise<DeviceEncoding>
  delete(id: string): Promise<void>
}

export async function getDeviceRepository(): Promise<DeviceRepository> {
  if (process.env.DATA_SOURCE === 'mock') {
    const m = await import('@/integrations/mock/device.mock')
    return new m.MockDeviceRepository()
  }
  const m = await import('@/integrations/feishu/repositories/device.bitable')
  return new m.BitableDeviceRepository()
}
