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

export const emptyState: ChatState = { chats: [], messages: {}, activeChatId: null }

function upsertMessage(list: Message[] = [], message: Message): Message[] {
  if (list.some((m) => m.id === message.id)) return list
  return [...list, message].sort((a, b) => a.timestamp - b.timestamp)
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
    case 'renameChat': {
      // Telegram может вернуть реальный chatId (например, "10000000") вместо "номер@c.us".
      // Переносим чат и его сообщения на реальный chatId.
      const { from, to } = action
      if (from === to) return state
      const source = state.chats.find((c) => c.chatId === from)
      if (!source) return state
      const target = state.chats.find((c) => c.chatId === to)
      const merged: Chat = { ...(target ?? {}), ...source, chatId: to, phoneChatId: source.phoneChatId ?? from }
      const chats = state.chats.filter((c) => c.chatId !== from && c.chatId !== to)
      let list = state.messages[to] ?? []
      for (const m of state.messages[from] ?? []) list = upsertMessage(list, { ...m, chatId: to })
      const messages = { ...state.messages, [to]: list }
      delete messages[from]
      return {
        chats: [merged, ...chats],
        messages,
        activeChatId: state.activeChatId === from ? to : state.activeChatId,
      }
    }
  }
}
