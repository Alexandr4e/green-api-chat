import type { Chat, ChatInfo } from '../types'
// расширение .ts нужно, чтобы файл запускался в тестах Node без сборки
import { formatChatId, normalizePhone } from './phone.ts'

/** Чат из ответа getChats; каналы пропускаем — писать в них нельзя */
export function toChat(info: ChatInfo): Chat | null {
  // Telegram и MAX отдают chatId, WhatsApp — id
  const chatId = String(info.chatId ?? info.id ?? '')
  if (!chatId || info.type === 'channel') return null
  const phone = info.phoneNumber ? normalizePhone(String(info.phoneNumber)) : undefined
  const title = info.name || (info.username ? `@${info.username}` : '') || formatChatId(phone ? `${phone}@c.us` : chatId)
  return { chatId, title, phone }
}
