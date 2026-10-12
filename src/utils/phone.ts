/** Оставляет только цифры; российский 8XXXXXXXXXX без «+» приводит к 7XXXXXXXXXX. */
export function normalizePhone(input: string): string {
  let digits = input.replace(/\D/g, '')
  // с «+» это код страны (например, +84 — Вьетнам), а не российская «восьмёрка»
  if (!input.trim().startsWith('+') && digits.length === 11 && digits.startsWith('8')) digits = '7' + digits.slice(1)
  return digits
}

export function isValidPhone(input: string): boolean {
  const digits = normalizePhone(input)
  return digits.length >= 10 && digits.length <= 15
}

export function phoneToChatId(input: string): string {
  return `${normalizePhone(input)}@c.us`
}

/** 79991234567@c.us → +7 999 123-45-67; прочие chatId возвращает как есть */
export function formatChatId(chatId: string): string {
  const m = chatId.match(/^(\d+)@c\.us$/)
  if (!m) return chatId
  const d = m[1]
  if (d.length === 11 && d.startsWith('7')) {
    return `+7 ${d.slice(1, 4)} ${d.slice(4, 7)}-${d.slice(7, 9)}-${d.slice(9)}`
  }
  return `+${d}`
}
