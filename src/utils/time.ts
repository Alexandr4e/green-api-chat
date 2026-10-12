const DAY_MS = 24 * 60 * 60 * 1000

function startOfDay(ms: number): number {
  const d = new Date(ms)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

/** Время для списка чатов: ЧЧ:ММ сегодня, иначе дата */
export function formatTime(ms: number): string {
  if (startOfDay(ms) === startOfDay(Date.now())) return formatClock(ms)
  return new Date(ms).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
}

export function formatClock(ms: number): string {
  return new Date(ms).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
}

/** Подпись разделителя дней в ленте: «Сегодня», «Вчера» или «8 октября» */
export function formatDay(ms: number): string {
  const diffDays = Math.round((startOfDay(Date.now()) - startOfDay(ms)) / DAY_MS)
  if (diffDays === 0) return 'Сегодня'
  if (diffDays === 1) return 'Вчера'
  const sameYear = new Date(ms).getFullYear() === new Date().getFullYear()
  return new Date(ms).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: sameYear ? undefined : 'numeric',
  })
}

export function isSameDay(a: number, b: number): boolean {
  return startOfDay(a) === startOfDay(b)
}
