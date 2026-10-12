import type { Message, MessageStatus } from '../types'
import { formatClock } from '../utils/time'

const STATUS_TITLES: Record<MessageStatus, string> = {
  sending: 'Отправляется',
  sent: 'Отправлено',
  error: 'Ошибка отправки',
}

const STATUS_ICONS: Record<MessageStatus, string> = {
  sending: '🕓',
  sent: '✓',
  error: '!',
}

interface MessageBubbleProps {
  message: Message
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const status = message.status ?? 'sent'
  return (
    <div className={`bubble ${message.outgoing ? 'bubble--out' : 'bubble--in'}`}>
      <span className="bubble__text">{message.text}</span>
      <span className="bubble__meta">
        <time dateTime={new Date(message.timestamp).toISOString()}>{formatClock(message.timestamp)}</time>
        {message.outgoing && (
          <span className={`bubble__status bubble__status--${status}`} title={STATUS_TITLES[status]}>
            {STATUS_ICONS[status]}
          </span>
        )}
      </span>
    </div>
  )
}
