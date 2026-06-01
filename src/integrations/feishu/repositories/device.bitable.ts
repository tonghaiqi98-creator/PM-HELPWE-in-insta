import type { DeviceRepository } from '@/domains/device/repository'
import type {
  DeviceEncoding,
  CreateDeviceEncodingInput,
  UpdateDeviceEncodingInput,
} from '@/domains/device/types'

export class BitableDeviceRepository implements DeviceRepository {
  async list(): Promise<DeviceEncoding[]> {
    throw new Error('TODO: BitableDeviceRepository.list（待接 Bitable devices 表）')
  }
  async getByCode(_deviceCode: string): Promise<DeviceEncoding | null> {
    throw new Error('TODO: BitableDeviceRepository.getByCode')
  }
  async create(_input: CreateDeviceEncodingInput): Promise<DeviceEncoding> {
    throw new Error('TODO: BitableDeviceRepository.create')
  }
  async update(_id: string, _patch: UpdateDeviceEncodingInput): Promise<DeviceEncoding> {
    throw new Error('TODO: BitableDeviceRepository.update')
  }
  async delete(_id: string): Promise<void> {
    throw new Error('TODO: BitableDeviceRepository.delete')
  }
}
