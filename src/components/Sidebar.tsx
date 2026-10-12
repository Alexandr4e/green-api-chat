import { useRef, useState, type FormEvent, type ReactNode } from 'react'
import type { Chat, Message } from '../types'
import { isValidPhone } from '../utils/phone'
import { formatTime } from '../utils/time'
import { Avatar } from './Avatar'
import { LogoutIcon, PhoneIcon, PlusIcon } from './icons'

interface SidebarProps {
  chats: Chat[]
  messages: Record<string, Message[]>
  activeChatId: string | null
  connectionError: string | null
  /** Уведомление над списком чатов (например, о настройках инстанса) */
  notice?: ReactNode
  onSelect: (chatId: string) => void
  onCreate: (phone: string) => void
  onLogout: () => void
}

/**
 * Ключ сортировки: время последнего сообщения или создания чата.
 * Чаты с сервера без сообщений получают 0 и остаются внизу в порядке, который вернул сервер.
 */
function lastActivity(chat: Chat, list: Message[] | undefined): number {
  return list?.at(-1)?.timestamp ?? chat.createdAt ?? 0
}

export function Sidebar({
  chats,
  messages,
  activeChatId,
  connectionError,
  notice,
  onSelect,
  onCreate,
  onLogout,
}: SidebarProps) {
  const [phone, setPhone] = useState('')
  const [error, setError] = useState<string | null>(null)
  const phoneInputRef = useRef<HTMLInputElement>(null)

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

  const sortedChats = [...chats].sort(
    (a, b) => lastActivity(b, messages[b.chatId]) - lastActivity(a, messages[a.chatId]),
  )

  return (
    <aside className="sidebar">
      <div className="sidebar__header">
        <h1 className="sidebar__title">Чаты</h1>
        <div className="sidebar__actions">
          <button
            type="button"
            className="icon-button sidebar__logout"
            onClick={onLogout}
            title="Выйти"
            aria-label="Выйти"
          >
            <LogoutIcon size={22} />
          </button>
          <button
            type="button"
            className="round-button"
            onClick={() => phoneInputRef.current?.focus()}
            title="Новый чат"
            aria-label="Новый чат"
          >
            <PlusIcon size={20} />
          </button>
        </div>
      </div>

      <form className="new-chat" onSubmit={handleCreate}>
        <PhoneIcon className="new-chat__icon" size={18} />
        <input
          ref={phoneInputRef}
          className="new-chat__input"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Номер телефона нового чата"
          aria-label="Номер телефона нового чата"
          inputMode="tel"
          autoComplete="tel"
          enterKeyHint="go"
        />
        {phone && (
          <button type="submit" className="new-chat__button">
            Создать
          </button>
        )}
      </form>

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
      {notice}

      <ul className="chat-list">
        {sortedChats.length === 0 && (
          <li className="chat-list__empty">Чатов пока нет. Введите номер телефона, чтобы начать переписку.</li>
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
