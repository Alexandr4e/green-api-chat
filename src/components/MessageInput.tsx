import { useEffect, useRef, useState, type KeyboardEvent } from 'react'

/** Ограничение длины сообщения в методе sendMessage для Telegram */
const MAX_LENGTH = 4096

interface MessageInputProps {
  onSend: (text: string) => void
}

/** Поле ввода сообщения. Монтируется заново для каждого чата (key), поэтому черновик не переносится между чатами. */
export function MessageInput({ onSend }: MessageInputProps) {
  const [text, setText] = useState('')
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const canSend = text.trim().length > 0

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  function submit() {
    const value = text.trim()
    if (!value) return
    onSend(value)
    setText('')
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault()
      submit()
    }
  }

  return (
    <div className="composer">
      <div className="composer__field">
        <textarea
          ref={inputRef}
          className="composer__input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Сообщение"
          aria-label="Текст сообщения"
          rows={1}
          maxLength={MAX_LENGTH}
        />
      </div>
      <button type="button" className="composer__send" onClick={submit} disabled={!canSend} aria-label="Отправить">
        <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
          <path fill="currentColor" d="M3.4 20.4 21 12 3.4 3.6 3.4 10l12.6 2-12.6 2z" />
        </svg>
      </button>
    </div>
  )
}
