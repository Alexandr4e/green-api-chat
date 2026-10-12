import { useEffect, useRef, useState } from 'react'
import { deleteNotification, receiveNotification } from '../api/greenApi'
import type { Credentials, NotificationBody } from '../types'
import { getErrorMessage } from '../utils/error'

const RECEIVE_TIMEOUT_SEC = 5
const RETRY_DELAY_MS = 3000

function sleep(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    const timer = setTimeout(resolve, ms)
    signal.addEventListener('abort', () => {
      clearTimeout(timer)
      resolve()
    })
  })
}

/**
 * Получение входящих уведомлений по технологии HTTP API:
 * receiveNotification (long polling) → обработка → deleteNotification.
 * Передайте creds = null, чтобы остановить получение.
 */
export function useNotifications(
  creds: Credentials | null,
  onNotification: (body: NotificationBody) => void,
): { error: string | null } {
  const handlerRef = useRef(onNotification)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    handlerRef.current = onNotification
  })

  useEffect(() => {
    if (!creds) return undefined
    const activeCreds = creds
    const controller = new AbortController()
    const { signal } = controller

    async function poll() {
      while (!signal.aborted) {
        try {
          const notification = await receiveNotification(activeCreds, RECEIVE_TIMEOUT_SEC, signal)
          setError(null)
          if (!notification) continue
          try {
            handlerRef.current(notification.body)
          } finally {
            // подтверждаем даже при ошибке обработки, иначе очередь «застрянет» на этом уведомлении
            await deleteNotification(activeCreds, notification.receiptId, signal)
          }
        } catch (e) {
          if (signal.aborted) return
          setError(getErrorMessage(e))
          await sleep(RETRY_DELAY_MS, signal)
        }
      }
    }

    void poll()
    return () => controller.abort()
  }, [creds])

  return { error }
}
