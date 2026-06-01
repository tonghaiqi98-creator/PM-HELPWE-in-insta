import type { DeviceEncoding } from '@/domains/device/types'

/**
 * 把机型 SN 编码规则格式化成 markdown 段落。
 * 用于开发提单 / 需求文档：开发靠这套规则从序列号识别机型。
 * 纯函数。
 */
export function generateEncodingSection(encoding: DeviceEncoding | null | undefined): string {
  if (!encoding) {
    return ['## 机型识别（SN 编码规则）', '编码规则待补充（该机型未在编码库中配置）。'].join('\n')
  }
  const lines: string[] = [
    `## 机型识别（SN 编码规则）— ${encoding.deviceName}`,
    `示例：\`${encoding.example}\``,
    ``,
    `| 位 | 含义 | 规则 |`,
    `| --- | --- | --- |`,
  ]
  for (const p of encoding.positions) {
    lines.push(`| ${p.range} | ${p.name} | ${p.rule} |`)
  }
  if (encoding.note) lines.push(``, `> ${encoding.note}`)
  return lines.join('\n')
}
