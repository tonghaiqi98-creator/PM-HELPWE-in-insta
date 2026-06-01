import { getEnv } from '@/lib/env'
import type { NotificationMessage } from '@/domains/notification/types'

/**
 * 飞书自定义群机器人 webhook 发送。
 * v1 用 post + @ 用户的 markdown 消息。
 *
 * 注意：自定义机器人不能直接发个人，只能发群。
 * @ 个人需要在群里且要 open_id。
 */

type FeishuBotPayload = {
  msg_type: 'text' | 'post' | 'interactive'
  content: unknown
}

export async function sendBotMessage(message: NotificationMessage): Promise<void> {
  const { FEISHU_BOT_WEBHOOK } = getEnv()
  if (!FEISHU_BOT_WEBHOOK) {
    console.warn('[feishu/bot] webhook not configured, skipping notification')
    return
  }

  const mentions = message.mentionOpenIds
    .map((id) => `<at user_id="${id}"></at>`)
    .join(' ')

  const payload: FeishuBotPayload = {
    msg_type: 'post',
    content: {
      post: {
        zh_cn: {
          title: '资源适配工作台',
          content: [
            [
              { tag: 'text', text: mentions ? `${mentions} ` : '' },
              { tag: 'text', text: message.text },
            ],
          ],
        },
      },
    },
  }

  const res = await fetch(FEISHU_BOT_WEBHOOK, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    console.error(`[feishu/bot] webhook returned ${res.status}`)
  }
}
