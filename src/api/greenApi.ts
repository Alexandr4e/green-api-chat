import type { ChatInfo, Credentials, HistoryMessage, InstanceSettings, Notification } from '../types'

export class GreenApiError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'GreenApiError'
    this.status = status
  }
}

/** Токен недействителен: неверный, изменён или удалён */
export function isAuthError(error: unknown): boolean {
  return error instanceof GreenApiError && (error.status === 401 || error.status === 403)
}

export const SESSION_EXPIRED_MESSAGE = 'Сессия недействительна: токен инстанса изменён или удалён. Войдите заново.'

function buildUrl(creds: Credentials, method: string, suffix = ''): string {
  const base = creds.apiUrl.trim().replace(/\/+$/, '')
  return `${base}/waInstance${creds.idInstance.trim()}/${method}/${creds.apiTokenInstance.trim()}${suffix}`
}

function extractErrorMessage(text: string, fallback: string): string {
  try {
    const data: unknown = JSON.parse(text)
    if (data && typeof data === 'object' && 'message' in data && typeof data.message === 'string') {
      return data.message
    }
  } catch {
    // ответ не JSON
  }
  // тело ответа целиком не показываем: в нём бывает путь запроса с apiTokenInstance
  return fallback
}

/** Без ответа за это время запрос прерывается: хост инстанса бывает недоступен, а fetch ждёт бесконечно */
const REQUEST_TIMEOUT_MS = 20_000

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const timeout = AbortSignal.timeout(REQUEST_TIMEOUT_MS)
  // AbortSignal.any нет в Safari до 17.4 — там остаётся только сигнал вызывающего кода, без таймаута
  const signal = init?.signal ? (AbortSignal.any?.([init.signal, timeout]) ?? init.signal) : timeout
  const res = await fetch(url, { ...init, signal })
  const text = await res.text()
  if (!res.ok) {
    throw new GreenApiError(`${res.status}: ${extractErrorMessage(text, res.statusText || 'ошибка сервера')}`, res.status)
  }
  return (text ? JSON.parse(text) : null) as T
}

export function getStateInstance(creds: Credentials): Promise<{ stateInstance: string }> {
  return request(buildUrl(creds, 'getStateInstance'))
}

export function getSettings(creds: Credentials, signal?: AbortSignal): Promise<InstanceSettings> {
  return request(buildUrl(creds, 'getSettings'), { signal })
}

/** Сохраняет настройки; инстанс перезапускается, изменения применяются в течение 5 минут */
export function setSettings(creds: Credentials, settings: Partial<InstanceSettings>): Promise<{ saveSettings: boolean }> {
  return request(buildUrl(creds, 'setSettings'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings),
  })
}

export function getChatHistory(
  creds: Credentials,
  chatId: string,
  count: number,
  signal?: AbortSignal,
): Promise<HistoryMessage[]> {
  return request(buildUrl(creds, 'getChatHistory'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chatId, count }),
    signal,
  })
}

/** Журнал входящих сообщений за последние `minutes` минут */
export function lastIncomingMessages(creds: Credentials, minutes: number, signal?: AbortSignal): Promise<HistoryMessage[]> {
  return request(buildUrl(creds, 'lastIncomingMessages', `?minutes=${minutes}`), { signal })
}

/** Журнал исходящих сообщений за последние `minutes` минут */
export function lastOutgoingMessages(creds: Credentials, minutes: number, signal?: AbortSignal): Promise<HistoryMessage[]> {
  return request(buildUrl(creds, 'lastOutgoingMessages', `?minutes=${minutes}`), { signal })
}

export function getChats(creds: Credentials, signal?: AbortSignal): Promise<ChatInfo[]> {
  return request(buildUrl(creds, 'getChats'), { signal })
}

export function sendMessage(creds: Credentials, chatId: string, message: string): Promise<{ idMessage: string }> {
  return request(buildUrl(creds, 'sendMessage'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chatId, message }),
  })
}

export function receiveNotification(
  creds: Credentials,
  receiveTimeout = 5,
  signal?: AbortSignal,
): Promise<Notification | null> {
  return request(buildUrl(creds, 'receiveNotification', `?receiveTimeout=${receiveTimeout}`), { signal })
}

export function deleteNotification(
  creds: Credentials,
  receiptId: number,
  signal?: AbortSignal,
): Promise<{ result: boolean }> {
  return request(buildUrl(creds, 'deleteNotification', `/${receiptId}`), { method: 'DELETE', signal })
}
