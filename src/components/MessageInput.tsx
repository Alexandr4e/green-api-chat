import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { ArrowUpIcon } from './icons'

/** Ограничение длины текста в методе sendMessage */
const MAX_LENGTH = 4000

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
      <div className="composer__bar">
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
        <button type="button" className="composer__send" onClick={submit} disabled={!canSend} aria-label="Отправить">
          <ArrowUpIcon size={18} />
        </button>
      </div>
    </div>
  )
}
