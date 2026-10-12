import type { HistoryMessage, Message, NotificationBody } from '../types'
import { formatChatId } from './phone'

const TEXT_WEBHOOKS = new Set(['incomingMessageReceived', 'outgoingMessageReceived', 'outgoingAPIMessageReceived'])

export interface TextNotification {
  message: Message
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

const TEXT_TYPES = new Set(['textMessage', 'extendedTextMessage'])

/** Преобразует сообщение из getChatHistory; нетекстовые сообщения пропускает */
export function historyToMessage(item: HistoryMessage): Message | null {
  if (!TEXT_TYPES.has(item.typeMessage) || typeof item.textMessage !== 'string') return null
  const outgoing = item.type === 'outgoing'
  return {
    id: item.idMessage,
    chatId: item.chatId,
    text: item.textMessage,
    outgoing,
    timestamp: item.timestamp * 1000,
    status: outgoing ? 'sent' : undefined,
  }
}
