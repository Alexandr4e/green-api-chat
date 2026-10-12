import type { Message, NotificationBody, SenderData } from '../types'
import { formatChatId } from './phone'

const TEXT_WEBHOOKS = new Set(['incomingMessageReceived', 'outgoingMessageReceived', 'outgoingAPIMessageReceived'])

export interface TextNotification {
  message: Message
  sender: SenderData
  chatTitle: string
}

/** Преобразует уведомление GREEN-API в текстовое сообщение; для прочих уведомлений возвращает null. */
export function parseTextNotification(body: NotificationBody): TextNotification | null {
  if (!TEXT_WEBHOOKS.has(body.typeWebhook)) return null

  const data = body.messageData
  const text = data?.textMessageData?.textMessage ?? data?.extendedTextMessageData?.text
  const sender = body.senderData
  if (text === undefined || !sender?.chatId || !body.idMessage) return null

  const incoming = body.typeWebhook === 'incomingMessageReceived'
  return {
    sender,
    chatTitle: sender.senderContactName || sender.chatName || sender.senderName || formatChatId(sender.chatId),
    message: {
      id: body.idMessage,
      chatId: sender.chatId,
      text,
      outgoing: !incoming,
      timestamp: body.timestamp ? body.timestamp * 1000 : Date.now(),
      status: incoming ? undefined : 'sent',
    },
  }
}
