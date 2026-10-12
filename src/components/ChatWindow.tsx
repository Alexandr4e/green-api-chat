import { useEffect, useRef } from 'react'
import type { Chat, Message } from '../types'
import { formatChatId } from '../utils/phone'
import { Avatar } from './Avatar'
import { MessageBubble } from './MessageBubble'
import { MessageInput } from './MessageInput'

interface ChatWindowProps {
  chat: Chat
  messages: Message[]
  onSend: (text: string) => void
  onBack: () => void
}

export function ChatWindow({ chat, messages, onSend, onBack }: ChatWindowProps) {
  const feedRef = useRef<HTMLDivElement>(null)
  const subtitle = formatChatId(chat.phoneChatId ?? chat.chatId)

  useEffect(() => {
    const feed = feedRef.current
    feed?.scrollTo({ top: feed.scrollHeight })
  }, [messages.length, chat.chatId])

  return (
    <section className="chat">
      <header className="chat__header">
        <button type="button" className="icon-button chat__back" onClick={onBack} aria-label="Назад к списку чатов">
          ←
        </button>
        <Avatar title={chat.title} size={42} />
        <div>
          <div className="chat__title">{chat.title}</div>
          {subtitle !== chat.title && <div className="chat__subtitle">{subtitle}</div>}
        </div>
      </header>

      <div className="chat__feed" ref={feedRef} role="log" aria-live="polite">
        <div className="chat__feed-inner">
          {messages.length === 0 && <div className="chat__notice">Напишите первое сообщение</div>}
          {messages.map((m) => (
            <MessageBubble key={m.id} message={m} />
          ))}
        </div>
      </div>

      <MessageInput key={chat.chatId} onSend={onSend} />
    </section>
  )
}
