import type { Chat, Message } from './types'

export interface ChatState {
  chats: Chat[]
  messages: Record<string, Message[]>
  activeChatId: string | null
}

export type ChatAction =
  | { type: 'addChat'; chat: Chat }
  | { type: 'selectChat'; chatId: string | null }
  | { type: 'addMessage'; message: Message; chatTitle?: string }
  | { type: 'updateMessage'; id: string; patch: Partial<Message> }
  | { type: 'renameChat'; from: string; to: string }
  | { type: 'mergeChats'; chats: Chat[] }
  /** Сообщения из журналов и истории; добавляются только в известные чаты */
  | { type: 'addMessages'; messages: Message[] }

export const emptyState: ChatState = { chats: [], messages: {}, activeChatId: null }

function upsertMessage(list: Message[] = [], message: Message): Message[] {
  if (list.some((m) => m.id === message.id)) return list
  return [...list, message].sort((a, b) => a.timestamp - b.timestamp)
}

/** Телефон чата (только цифры): из getChats или из chatId вида "79991234567@c.us" */
function chatPhone(chat: Chat): string | undefined {
  return chat.phone ?? chat.phoneChatId?.replace(/\D/g, '')
}

/**
 * Переносит чат и его сообщения на другой chatId: мессенджер может вернуть реальный chatId
 * (например, "10000000") вместо "номер@c.us", по которому чат был создан.
 */
function renameChat(state: ChatState, from: string, to: string): ChatState {
  if (from === to) return state
  const source = state.chats.find((c) => c.chatId === from)
  if (!source) return state
  const target = state.chats.find((c) => c.chatId === to)
  const merged: Chat = { ...(target ?? {}), ...source, chatId: to, phoneChatId: source.phoneChatId ?? from }
  let list = state.messages[to] ?? []
  for (const m of state.messages[from] ?? []) list = upsertMessage(list, { ...m, chatId: to })
  const messages = { ...state.messages, [to]: list }
  delete messages[from]
  return {
    // чат остаётся на месте источника в списке
    chats: state.chats.filter((c) => c.chatId !== to).map((c) => (c.chatId === from ? merged : c)),
    messages,
    activeChatId: state.activeChatId === from ? to : state.activeChatId,
  }
}

/** Объединяет список чатов с сервера (getChats) с локальными чатами */
function mergeChats(state: ChatState, remote: Chat[]): ChatState {
  let next = state
  for (const chat of remote) {
    if (!next.chats.some((c) => c.chatId === chat.chatId)) {
      // чат, созданный по номеру, получает настоящий chatId с сервера
      const byPhone = chat.phone && next.chats.find((c) => !c.phone && chatPhone(c) === chat.phone)
      if (byPhone) next = renameChat(next, byPhone.chatId, chat.chatId)
    }
    const exists = next.chats.some((c) => c.chatId === chat.chatId)
    next = {
      ...next,
      chats: exists
        ? next.chats.map((c) => (c.chatId === chat.chatId ? { ...c, title: chat.title, phone: chat.phone ?? c.phone } : c))
        : [...next.chats, chat],
    }
  }
  return next
}

export function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case 'addChat': {
      const exists = state.chats.some((c) => c.chatId === action.chat.chatId)
      return {
        ...state,
        chats: exists ? state.chats : [action.chat, ...state.chats],
        activeChatId: action.chat.chatId,
      }
    }
    case 'selectChat':
      return { ...state, activeChatId: action.chatId }
    case 'addMessage': {
      const { message } = action
      const chats = state.chats.some((c) => c.chatId === message.chatId)
        ? state.chats
        : [{ chatId: message.chatId, title: action.chatTitle || message.chatId }, ...state.chats]
      return {
        ...state,
        chats,
        messages: { ...state.messages, [message.chatId]: upsertMessage(state.messages[message.chatId], message) },
      }
    }
    case 'updateMessage': {
      // ищем сообщение во всех чатах: пока шёл запрос, чат мог быть переименован (renameChat)
      const chatId = Object.keys(state.messages).find((id) => state.messages[id].some((m) => m.id === action.id))
      if (!chatId) return state
      const list = state.messages[chatId]
      const newId = action.patch.id
      // если уведомление outgoingAPIMessageReceived пришло раньше ответа sendMessage — убираем дубль
      const withoutDup = newId && newId !== action.id ? list.filter((m) => m.id !== newId) : list
      const patched = withoutDup.map((m) => (m.id === action.id ? { ...m, ...action.patch } : m))
      return { ...state, messages: { ...state.messages, [chatId]: patched } }
    }
    case 'renameChat':
      return renameChat(state, action.from, action.to)
    case 'mergeChats':
      return mergeChats(state, action.chats)
    case 'addMessages': {
      const known = new Set(state.chats.map((c) => c.chatId))
      const messages = { ...state.messages }
      for (const m of action.messages) {
        if (known.has(m.chatId)) messages[m.chatId] = upsertMessage(messages[m.chatId], m)
      }
      return { ...state, messages }
    }
  }
}
