import type { NotificationEvent, NotificationMessage } from './types'

/**
 * 纯函数：把事件转成消息文本 + @ 列表。
 * 不发请求，发送由 integrations/feishu/bot.ts 完成。
 */
export function buildMessage(event: NotificationEvent): NotificationMessage {
  switch (event.type) {
    case 'requirement_submitted':
      return {
        text: `📌 新换图需求\n标题：${event.requirement.title}\n设备：${event.requirement.targetDevice}\n预计完成：${event.requirement.expectedDueDate}`,
        mentionOpenIds: event.targetOpenIds,
      }
    case 'status_changed':
      return {
        text: `🔄 需求 ${event.requirement.title} 进入「${event.toStatus}」，请处理`,
        mentionOpenIds: event.targetOpenIds,
      }
    case 'due_soon':
      return {
        text: `⏰ 需求 ${event.requirement.title} 明天到期（${event.side}），当前状态 ${event.requirement.status}`,
        mentionOpenIds: event.targetOpenIds,
      }
    case 'overdue':
      return {
        text: `🚨 需求 ${event.requirement.title} 已逾期 ${event.daysLate} 天（${event.side}）`,
        mentionOpenIds: event.targetOpenIds,
      }
  }
}
