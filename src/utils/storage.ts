// Данные (включая apiTokenInstance) хранятся в sessionStorage: переживают перезагрузку страницы,
// но удаляются при закрытии вкладки. Если хранилище недоступно — работаем без сохранения.

export function loadJson<T>(key: string): T | null {
  try {
    const raw = sessionStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

export function saveJson(key: string, value: unknown): void {
  try {
    sessionStorage.setItem(key, JSON.stringify(value))
  } catch {
    // игнорируем
  }
}

export function removeItem(key: string): void {
  try {
    sessionStorage.removeItem(key)
  } catch {
    // игнорируем
  }
}
