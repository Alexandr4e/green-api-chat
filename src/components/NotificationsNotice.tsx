import { useEffect, useState } from 'react'
import { getSettings, setSettings } from '../api/greenApi'
import type { Credentials } from '../types'
import { getErrorMessage } from '../utils/error'
import { withRetry } from '../utils/retry'

type NoticeState =
  | { kind: 'hidden' }
  | { kind: 'webhook' }
  | { kind: 'disabled'; saving: boolean; error?: string }
  | { kind: 'saved' }

interface NotificationsNoticeProps {
  creds: Credentials
}

/**
 * Проверяет настройки инстанса: без входящих уведомлений ответы собеседника не придут.
 * Если они выключены — предлагает включить их методом setSettings.
 */
export function NotificationsNotice({ creds }: NotificationsNoticeProps) {
  const [state, setState] = useState<NoticeState>({ kind: 'hidden' })

  useEffect(() => {
    const controller = new AbortController()
    withRetry(() => getSettings(creds, controller.signal), { attempts: 3, delayMs: 3000, signal: controller.signal })
      .then((settings) => {
        if (settings.webhookUrl) setState({ kind: 'webhook' })
        // outgoingAPIMessageWebhook нужен, чтобы склеить чат «номер@c.us» с настоящим chatId ответа
        else if (settings.incomingWebhook !== 'yes' || settings.outgoingAPIMessageWebhook !== 'yes')
          setState({ kind: 'disabled', saving: false })
      })
      .catch(() => {
        // настройки недоступны — не мешаем работе чата
      })
    return () => controller.abort()
  }, [creds])

  async function enable() {
    setState({ kind: 'disabled', saving: true })
    try {
      await setSettings(creds, {
        incomingWebhook: 'yes',
        outgoingMessageWebhook: 'yes',
        outgoingAPIMessageWebhook: 'yes',
      })
      setState({ kind: 'saved' })
    } catch (e) {
      setState({ kind: 'disabled', saving: false, error: getErrorMessage(e) })
    }
  }

  switch (state.kind) {
    case 'hidden':
      return null
    case 'webhook':
      return (
        <div className="notice notice--warning" aria-live="polite">
          Уведомления инстанса отправляются на webhookUrl, поэтому новые сообщения здесь не появятся. Очистите
          webhookUrl в консоли GREEN-API.
        </div>
      )
    case 'saved':
      return (
        <div className="notice notice--success" aria-live="polite">
          Уведомления включены. Инстанс перезапускается — новые сообщения начнут приходить в течение 5 минут.
          <button type="button" className="notice__action" onClick={() => setState({ kind: 'hidden' })}>
            Понятно
          </button>
        </div>
      )
    case 'disabled':
      return (
        <div className="notice notice--warning" aria-live="polite">
          Уведомления о сообщениях выключены — ответы собеседников могут не приходить.
          {state.error && <span className="notice__error">Не удалось включить: {state.error}</span>}
          <button type="button" className="notice__action" onClick={enable} disabled={state.saving}>
            {state.saving ? 'Включаем…' : 'Включить'}
          </button>
        </div>
      )
  }
}
