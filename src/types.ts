export interface Credentials {
  apiUrl: string
  idInstance: string
  apiTokenInstance: string
}

export type MessageStatus = 'sending' | 'sent' | 'error'

export interface Message {
  /** idMessage из GREEN-API или локальный id, пока сообщение отправляется */
  id: string
  chatId: string
  text: string
  outgoing: boolean
  timestamp: number // ms
  status?: MessageStatus
}

export interface Chat {
  chatId: string
  title: string
  /** chatId вида 79991234567@c.us, по которому чат был создан (если создан по номеру) */
  phoneChatId?: string
}

// ---- Формат уведомлений GREEN-API (только нужные поля) ----

export interface SenderData {
  chatId: string
  sender?: string
  senderName?: string
  senderContactName?: string
  chatName?: string
}

export interface MessageData {
  typeMessage: string
  textMessageData?: { textMessage: string }
  extendedTextMessageData?: { text: string }
}

export interface NotificationBody {
  typeWebhook: string
  idMessage?: string
  timestamp?: number // seconds
  senderData?: SenderData
  messageData?: MessageData
}

export interface Notification {
  receiptId: number
  body: NotificationBody
}
