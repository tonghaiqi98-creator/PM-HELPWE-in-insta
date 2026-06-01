import { getDeviceRepository } from './repository'
import type { DeviceEncoding } from './types'

export async function listDeviceEncodings(): Promise<DeviceEncoding[]> {
  const repo = await getDeviceRepository()
  return repo.list()
}

/**
 * 按机型标识匹配编码规则（大小写、空格不敏感）。
 * 找不到返回 null，调用方应优雅降级（提单/文档显示「编码规则待补充」）。
 */
export async function getEncodingForDevice(
  deviceCode: string,
): Promise<DeviceEncoding | null> {
  const repo = await getDeviceRepository()
  const norm = deviceCode.trim().toUpperCase()
  const direct = await repo.getByCode(norm)
  if (direct) return direct
  // 兜底：忽略空格做一次全表匹配
  const all = await repo.list()
  return all.find((d) => d.deviceCode.toUpperCase() === norm) ?? null
}
