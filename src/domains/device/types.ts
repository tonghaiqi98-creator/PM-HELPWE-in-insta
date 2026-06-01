/**
 * 机型产品序列号（SN）编码规则。
 * APP 靠解析 SN 判断机型，选对应 UI 资源（见需求文档「通过序列号判断」）。
 * 提单 / 需求文档要自动带入对应机型的规则，供开发实现机型识别。
 */

export type EncodingPosition = {
  range: string // 位段，如 '1-2' / '3' / '9-14'
  name: string // 含义，如 '产品代码' / '生产厂商代码'
  rule: string // 规则说明
}

export type DeviceEncoding = {
  id: string
  deviceCode: string // 机型标识（大写），如 Z03 / Z05 / TRC
  deviceName: string // 显示名
  example: string // 示例 SN
  positions: EncodingPosition[]
  note?: string
}

export type CreateDeviceEncodingInput = Omit<DeviceEncoding, 'id'>
export type UpdateDeviceEncodingInput = Partial<Omit<DeviceEncoding, 'id'>>
