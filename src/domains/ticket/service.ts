import type { DesignTicketAdapter } from './design-adapter'
import type { DevTicketAdapter } from './dev-adapter'
import { BitableFormAdapter } from '@/integrations/feishu/adapters/design-bitable.adapter'
import { DevContentAdapter } from '@/integrations/feishu/adapters/dev-content.adapter'

/**
 * 工厂函数：选择当前 adapter 实现。
 * 业务 service 只依赖这两个函数返回的接口，不应直接 import 具体 adapter 类。
 */
export function getDesignAdapter(): DesignTicketAdapter {
  return new BitableFormAdapter()
}

export function getDevAdapter(): DevTicketAdapter {
  // v2 拿到飞书项目 API 权限后换成 DevProjectApiAdapter
  return new DevContentAdapter()
}
