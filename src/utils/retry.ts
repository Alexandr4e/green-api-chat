import { GreenApiError } from '../api/greenApi'

/** Пауза, которую можно прервать через AbortSignal */
export function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    const timer = setTimeout(resolve, ms)
    signal?.addEventListener('abort', () => {
      clearTimeout(timer)
      resolve()
    })
  })
}

interface RetryOptions {
  attempts: number
  delayMs: number
  signal?: AbortSignal
}

/** Повторяет запрос при ошибке (например, 429 — превышен лимит запросов GREEN-API) */
export async function withRetry<T>(fn: () => Promise<T>, { attempts, delayMs, signal }: RetryOptions): Promise<T> {
  for (let attempt = 1; ; attempt++) {
    try {
      return await fn()
    } catch (error) {
      // 4xx (кроме 429 — превышен лимит) повтором не исправить: неверный токен, запрос и т. п.
      const permanent = error instanceof GreenApiError && error.status < 500 && error.status !== 429
      if (permanent || attempt >= attempts || signal?.aborted) throw error
      await sleep(delayMs, signal)
    }
  }
}
