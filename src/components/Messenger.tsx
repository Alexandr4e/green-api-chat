import { useCallback, useEffect, useReducer, useRef } from 'react'
import {
  SESSION_EXPIRED_MESSAGE,
  getChatHistory,
  getChats,
  lastIncomingMessages,
  lastOutgoingMessages,
  sendMessage,
} from '../api/greenApi'
import { demoState, isDemo } from '../demo'
import { useNotifications } from '../hooks/useNotifications'
import { chatReducer, emptyState, type ChatState } from '../store'
import type { Chat, Credentials, Message, NotificationBody } from '../types'
import { toChat } from '../utils/chats'
import { historyToMessage, parseTextNotification } from '../utils/notifications'
import { formatChatId, normalizePhone, phoneToChatId } from '../utils/phone'
import { sleep, withRetry } from '../utils/retry'
import { loadJson, removeItem, saveJson } from '../utils/storage'
import { ChatWindow } from './ChatWindow'
import { NavRail } from './NavRail'
import { NotificationsNotice } from './NotificationsNotice'
import { Sidebar } from './Sidebar'

interface MessengerProps {
  creds: Credentials
  onLogout: (reason?: string) => void
}

const chatsKey = (creds: Credentials) => `greenapi.chats.${creds.idInstance}`
const RETRY = { attempts: 3, delayMs: 3000 }
const HISTORY_COUNT = 50
/** Глубина журналов для превью и сортировки чатов — 90 дней: журналы хранят не более 3 месяцев */
const JOURNAL_MINUTES = 90 * 24 * 60
/** Пауза между запросами истории для превью: лимит getChatHistory — 1 запрос в секунду на инстанс */
const PREVIEW_DELAY_MS = 1100
/** Сообщений истории для превью: последнее может быть не текстовым (фото и т. п.) */
const PREVIEW_COUNT = 5
/** Сколько чатов без сообщений в журналах дозапрашивать — каждый чат стоит запрос из общего лимита */
const PREVIEW_MAX_CHATS = 20
/** Сколько последних сообщений чата сохранять в sessionStorage: историю можно загрузить заново */
const SAVED_MESSAGES_PER_CHAT = 50

function initState(creds: Credentials): ChatState {
  if (isDemo) return demoState()
  return { ...emptyState, ...loadJson<ChatState>(chatsKey(creds)), activeChatId: null }
}

export function Messenger({ creds, onLogout }: MessengerProps) {
  const [state, dispatch] = useReducer(chatReducer, creds, initState)
  const stateRef = useRef(state)

  useEffect(() => {
    stateRef.current = state
    if (isDemo) return
    const messages = Object.fromEntries(
      Object.entries(state.messages).map(([chatId, list]) => [chatId, list.slice(-SAVED_MESSAGES_PER_CHAT)]),
    )
    saveJson(chatsKey(creds), { ...state, messages })
  }, [state, creds])

  const handleNotification = useCallback((body: NotificationBody) => {
    const parsed = parseTextNotification(body)
    if (!parsed) return
    const { message, chatTitle } = parsed
    const current = stateRef.current

    if (!current.chats.some((c) => c.chatId === message.chatId)) {
      // Мессенджер может прислать реальный chatId вместо "номер@c.us", по которому был создан чат.
      // Находим исходный чат по idMessage отправленного нами сообщения (outgoingAPIMessageReceived).
      const from = Object.keys(current.messages).find((chatId) => current.messages[chatId].some((m) => m.id === message.id))
      if (from) dispatch({ type: 'renameChat', from, to: message.chatId })
    }

    dispatch({ type: 'addMessage', message, chatTitle })
  }, [])

  // список чатов аккаунта, затем последние сообщения из журналов — для превью и сортировки
  useEffect(() => {
    if (isDemo) return undefined
    const controller = new AbortController()
    const options = { ...RETRY, signal: controller.signal }

    async function load() {
      let chats: Chat[]
      try {
        const list = await withRetry(() => getChats(creds, controller.signal), options)
        chats = list.map(toChat).filter((c): c is Chat => c !== null)
        dispatch({ type: 'mergeChats', chats })
      } catch {
        // список чатов необязателен: без него можно создать чат по номеру
        return
      }
      // чаты, у которых уже есть сообщения (сохранённые в сессии или из журналов)
      const withPreview = new Set(
        Object.entries(stateRef.current.messages)
          .filter(([, list]) => list.length > 0)
          .map(([chatId]) => chatId),
      )
      try {
        const [incoming, outgoing] = await withRetry(
          () =>
            Promise.all([
              lastIncomingMessages(creds, JOURNAL_MINUTES, controller.signal),
              lastOutgoingMessages(creds, JOURNAL_MINUTES, controller.signal),
            ]),
          options,
        )
        const messages = [...incoming, ...outgoing].map(historyToMessage).filter((m): m is Message => m !== null)
        dispatch({ type: 'addMessages', messages })
        for (const m of messages) withPreview.add(m.chatId)
      } catch {
        // без превью список чатов остаётся рабочим
      }

      // чатам без сообщений в журналах — последние сообщения из истории, по одному запросу с паузой
      for (const chat of chats.filter((c) => !withPreview.has(c.chatId)).slice(0, PREVIEW_MAX_CHATS)) {
        if (controller.signal.aborted) return
        try {
          const items = await withRetry(() => getChatHistory(creds, chat.chatId, PREVIEW_COUNT, controller.signal), options)
          const messages = items.map(historyToMessage).filter((m): m is Message => m !== null)
          dispatch({ type: 'addMessages', messages })
        } catch {
          // пропускаем чат
        }
        await sleep(PREVIEW_DELAY_MS, controller.signal)
      }
    }

    void load()
    return () => controller.abort()
  }, [creds])

  // история активного чата: загружаем один раз за сессию при первом открытии
  const historyLoadedRef = useRef(new Set<string>())
  const activeChatId = state.activeChatId
  useEffect(() => {
    if (isDemo || !activeChatId || historyLoadedRef.current.has(activeChatId)) return undefined
    const controller = new AbortController()
    withRetry(() => getChatHistory(creds, activeChatId, HISTORY_COUNT, controller.signal), {
      ...RETRY,
      signal: controller.signal,
    })
      .then((items) => {
        historyLoadedRef.current.add(activeChatId)
        const messages = items.map(historyToMessage).filter((m): m is Message => m !== null)
        dispatch({ type: 'addMessages', messages })
      })
      .catch(() => {
        // без истории чат остаётся рабочим
      })
    return () => controller.abort()
  }, [creds, activeChatId])

  const { error: connectionError } = useNotifications(isDemo ? null : creds, handleNotification, () =>
    logout(SESSION_EXPIRED_MESSAGE),
  )

  function handleCreateChat(phone: string) {
    const chatId = phoneToChatId(phone)
    const digits = normalizePhone(phone)
    const existing = state.chats.find((c) => c.chatId === chatId || c.phoneChatId === chatId || c.phone === digits)
    if (existing) {
      dispatch({ type: 'selectChat', chatId: existing.chatId })
      return
    }
    dispatch({ type: 'addChat', chat: { chatId, title: formatChatId(chatId), phoneChatId: chatId, createdAt: Date.now() } })
  }

  async function handleSend(text: string) {
    const chatId = state.activeChatId
    if (!chatId) return
    const localId = `local-${crypto.randomUUID()}`
    dispatch({
      type: 'addMessage',
      message: { id: localId, chatId, text, outgoing: true, timestamp: Date.now(), status: isDemo ? 'sent' : 'sending' },
    })
    if (isDemo) return
    try {
      const { idMessage } = await sendMessage(creds, chatId, text)
      dispatch({ type: 'updateMessage', id: localId, patch: { id: idMessage, status: 'sent' } })
    } catch {
      dispatch({ type: 'updateMessage', id: localId, patch: { status: 'error' } })
    }
  }

  function logout(reason?: string) {
    removeItem(chatsKey(creds))
    onLogout(reason)
  }

  const activeChat = state.chats.find((c) => c.chatId === state.activeChatId)

  return (
    <div className={`messenger${activeChat ? ' messenger--chat-open' : ''}`}>
      <NavRail onLogout={() => logout()} />
      <Sidebar
        chats={state.chats}
        messages={state.messages}
        activeChatId={state.activeChatId}
        connectionError={connectionError}
        notice={isDemo ? null : <NotificationsNotice creds={creds} />}
        onSelect={(chatId) => dispatch({ type: 'selectChat', chatId })}
        onCreate={handleCreateChat}
        onLogout={() => logout()}
      />
      {activeChat ? (
        <ChatWindow
          chat={activeChat}
          messages={state.messages[activeChat.chatId] ?? []}
          onSend={handleSend}
          onBack={() => dispatch({ type: 'selectChat', chatId: null })}
        />
      ) : (
        <section className="chat chat--empty">
          <span className="chat__notice">Выберите чат или создайте новый по номеру телефона</span>
        </section>
      )}
    </div>
  )
}
