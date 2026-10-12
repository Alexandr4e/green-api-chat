import { useState, type FormEvent } from 'react'
import type { Chat, Message } from '../types'
import { isValidPhone } from '../utils/phone'
import { formatTime } from '../utils/time'
import { Avatar } from './Avatar'

interface SidebarProps {
  chats: Chat[]
  messages: Record<string, Message[]>
  activeChatId: string | null
  connectionError: string | null
  onSelect: (chatId: string) => void
  onCreate: (phone: string) => void
  onLogout: () => void
}

/** Время последнего сообщения; чаты без сообщений (только что созданные) — вверху списка */
function lastActivity(list: Message[] | undefined): number {
  return list?.at(-1)?.timestamp ?? Number.MAX_SAFE_INTEGER
}

export function Sidebar({ chats, messages, activeChatId, connectionError, onSelect, onCreate, onLogout }: SidebarProps) {
  const [phone, setPhone] = useState('')
  const [error, setError] = useState<string | null>(null)

  function handleCreate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!isValidPhone(phone)) {
      setError('Введите номер в международном формате, например +7 999 123-45-67')
      return
    }
    onCreate(phone)
    setPhone('')
    setError(null)
  }

  const sortedChats = [...chats].sort((a, b) => lastActivity(messages[b.chatId]) - lastActivity(messages[a.chatId]))

  return (
    <aside className="sidebar">
      <div className="sidebar__header">
        <form className="new-chat" onSubmit={handleCreate}>
          <input
            className="new-chat__input"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Номер телефона для нового чата"
            aria-label="Номер телефона для нового чата"
            inputMode="tel"
            autoComplete="tel"
          />
          <button type="submit" className="new-chat__button" title="Создать чат" aria-label="Создать чат">
            +
          </button>
        </form>
        <button type="button" className="icon-button" onClick={onLogout} title="Выйти" aria-label="Выйти">
          <svg
            viewBox="0 0 24 24"
            width="22"
            height="22"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
          </svg>
        </button>
      </div>

      {error && (
        <div className="sidebar__error" role="alert">
          {error}
        </div>
      )}
      {connectionError && (
        <div className="sidebar__error" aria-live="polite">
          Нет связи с GREEN-API: {connectionError}
        </div>
      )}

      <ul className="chat-list">
        {sortedChats.length === 0 && (
          <li className="chat-list__empty">Чатов пока нет. Введите номер телефона выше.</li>
        )}
        {sortedChats.map((chat) => {
          const last = messages[chat.chatId]?.at(-1)
          const isActive = chat.chatId === activeChatId
          return (
            <li key={chat.chatId} className="chat-list__item">
              <button
                type="button"
                className={`chat-item${isActive ? ' chat-item--active' : ''}`}
                onClick={() => onSelect(chat.chatId)}
                aria-current={isActive ? 'true' : undefined}
              >
                <Avatar title={chat.title} />
                <div className="chat-item__body">
                  <div className="chat-item__top">
                    <span className="chat-item__title">{chat.title}</span>
                    {last && <span className="chat-item__time">{formatTime(last.timestamp)}</span>}
                  </div>
                  <div className="chat-item__preview">
                    {last?.outgoing && <span className="chat-item__author">Вы: </span>}
                    {last?.text ?? 'Нет сообщений'}
                  </div>
                </div>
              </button>
            </li>
          )
        })}
      </ul>
    </aside>
  )
}
