import { Fragment, useEffect, useRef } from 'react'
import type { Chat, Message } from '../types'
import { formatChatId } from '../utils/phone'
import { formatDay, isSameDay } from '../utils/time'
import { Avatar } from './Avatar'
import { BackIcon } from './icons'
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
  // телефон собеседника, если известен; внутренний chatId мессенджера не показываем
  const phoneChatId = chat.phone ? `${chat.phone}@c.us` : chat.phoneChatId
  const subtitle = phoneChatId ? formatChatId(phoneChatId) : null

  useEffect(() => {
    const feed = feedRef.current
    feed?.scrollTo({ top: feed.scrollHeight })
  }, [messages.length, chat.chatId])

  return (
    <section className="chat">
      <header className="chat__header">
        <button type="button" className="icon-button chat__back" onClick={onBack} aria-label="Назад к списку чатов">
          <BackIcon size={22} />
        </button>
        <Avatar title={chat.title} size={40} />
        <div className="chat__info">
          <div className="chat__title">{chat.title}</div>
          {subtitle && subtitle !== chat.title && <div className="chat__subtitle">{subtitle}</div>}
        </div>
      </header>

      <div className="chat__feed" ref={feedRef} role="log" aria-live="polite">
        <div className="chat__feed-inner">
          {messages.length === 0 && <div className="chat__notice">Напишите первое сообщение</div>}
          {messages.map((m, i) => (
            <Fragment key={m.id}>
              {(i === 0 || !isSameDay(messages[i - 1].timestamp, m.timestamp)) && (
                <div className="chat__notice chat__notice--date">{formatDay(m.timestamp)}</div>
              )}
              <MessageBubble message={m} />
            </Fragment>
          ))}
        </div>
      </div>

      <MessageInput key={chat.chatId} onSend={onSend} />
    </section>
  )
}
