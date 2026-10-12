import type { Credentials, Notification } from '../types'

export class GreenApiError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'GreenApiError'
    this.status = status
  }
}

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
  return text || fallback
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init)
  const text = await res.text()
  if (!res.ok) {
    throw new GreenApiError(`${res.status}: ${extractErrorMessage(text, res.statusText)}`, res.status)
  }
  return (text ? JSON.parse(text) : null) as T
}

export function getStateInstance(creds: Credentials): Promise<{ stateInstance: string }> {
  return request(buildUrl(creds, 'getStateInstance'))
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
