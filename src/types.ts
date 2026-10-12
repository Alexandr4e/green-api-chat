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
  /** Телефон собеседника (цифры), если известен из getChats */
  phone?: string
  /** Время создания чата пользователем (ms) — для сортировки чатов без сообщений */
  createdAt?: number
}

/** Настройки инстанса из getSettings (только нужные поля) */
export interface InstanceSettings {
  webhookUrl?: string
  incomingWebhook?: string
  outgoingMessageWebhook?: string
  outgoingAPIMessageWebhook?: string
}

/** Элемент ответа метода getChatHistory (только нужные поля) */
export interface HistoryMessage {
  type: 'incoming' | 'outgoing'
  idMessage: string
  timestamp: number // seconds
  typeMessage: string
  chatId: string
  textMessage?: string
}

/** Элемент ответа метода getChats (только нужные поля) */
export interface ChatInfo {
  /** Telegram и MAX отдают chatId, WhatsApp — id */
  chatId?: string
  id?: string
  name?: string
  type?: string
  phoneNumber?: string | number
  username?: string
}

// ---- Формат уведомлений GREEN-API (только нужные поля) ----

export interface SenderData {
  chatId: string
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
