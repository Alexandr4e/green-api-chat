import { useCallback, useEffect, useReducer, useRef } from 'react'
import { sendMessage } from '../api/greenApi'
import { demoState, isDemo } from '../demo'
import { useNotifications } from '../hooks/useNotifications'
import { chatReducer, emptyState, type ChatState } from '../store'
import type { Credentials, NotificationBody } from '../types'
import { parseTextNotification } from '../utils/notifications'
import { formatChatId, phoneToChatId } from '../utils/phone'
import { loadJson, removeItem, saveJson } from '../utils/storage'
import { ChatWindow } from './ChatWindow'
import { Sidebar } from './Sidebar'

interface MessengerProps {
  creds: Credentials
  onLogout: () => void
}

const chatsKey = (creds: Credentials) => `greenapi.chats.${creds.idInstance}`

function initState(creds: Credentials): ChatState {
  if (isDemo) return demoState()
  return { ...emptyState, ...loadJson<ChatState>(chatsKey(creds)), activeChatId: null }
}

export function Messenger({ creds, onLogout }: MessengerProps) {
  const [state, dispatch] = useReducer(chatReducer, creds, initState)
  const stateRef = useRef(state)

  useEffect(() => {
    stateRef.current = state
    if (!isDemo) saveJson(chatsKey(creds), state)
  }, [state, creds])

  const handleNotification = useCallback((body: NotificationBody) => {
    const parsed = parseTextNotification(body)
    if (!parsed) return
    const { message, sender, chatTitle } = parsed
    const current = stateRef.current

    if (!current.chats.some((c) => c.chatId === message.chatId)) {
      // Telegram может прислать реальный chatId вместо "номер@c.us", по которому был создан чат.
      // Находим исходный чат по idMessage отправленного сообщения или по номеру отправителя.
      const byMessage = Object.keys(current.messages).find((chatId) =>
        current.messages[chatId].some((m) => m.id === message.id),
      )
      const byPhone = current.chats.find((c) => c.phoneChatId && c.phoneChatId === sender.sender)?.chatId
      const from = byMessage ?? byPhone
      if (from) dispatch({ type: 'renameChat', from, to: message.chatId })
    }

    dispatch({ type: 'addMessage', message, chatTitle })
  }, [])

  const { error: connectionError } = useNotifications(isDemo ? null : creds, handleNotification)

  function handleCreateChat(phone: string) {
    const chatId = phoneToChatId(phone)
    const existing = state.chats.find((c) => c.chatId === chatId || c.phoneChatId === chatId)
    if (existing) {
      dispatch({ type: 'selectChat', chatId: existing.chatId })
      return
    }
    dispatch({ type: 'addChat', chat: { chatId, title: formatChatId(chatId), phoneChatId: chatId } })
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

  function handleLogout() {
    removeItem(chatsKey(creds))
    onLogout()
  }

  const activeChat = state.chats.find((c) => c.chatId === state.activeChatId)

  return (
    <div className={`messenger${activeChat ? ' messenger--chat-open' : ''}`}>
      <Sidebar
        chats={state.chats}
        messages={state.messages}
        activeChatId={state.activeChatId}
        connectionError={connectionError}
        onSelect={(chatId) => dispatch({ type: 'selectChat', chatId })}
        onCreate={handleCreateChat}
        onLogout={handleLogout}
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
