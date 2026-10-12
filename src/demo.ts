import type { ChatState } from './store'

/** Демо-режим включается параметром ?demo=1 в адресе страницы. */
export const isDemo = new URLSearchParams(window.location.search).has('demo')

/** Демо-данные для скриншотов (?demo=1): без запросов к GREEN-API. */
export function demoState(): ChatState {
  const now = Date.now()
  const min = 60_000
  const anna = '79161234567@c.us'
  const ivan = '79037654321@c.us'
  return {
    activeChatId: anna,
    chats: [
      { chatId: anna, title: 'Анна', phoneChatId: anna },
      { chatId: ivan, title: '+7 903 765-43-21', phoneChatId: ivan },
    ],
    messages: {
      [anna]: [
        { id: 'd1', chatId: anna, text: 'Привет! Это сообщение отправлено через GREEN-API 👋', outgoing: true, timestamp: now - 12 * min, status: 'sent' },
        { id: 'd2', chatId: anna, text: 'Привет! Получила, всё работает 🙂', outgoing: false, timestamp: now - 10 * min },
        { id: 'd3', chatId: anna, text: 'Отлично. Встречаемся завтра в 10:00?', outgoing: true, timestamp: now - 9 * min, status: 'sent' },
        { id: 'd4', chatId: anna, text: 'Да, договорились!', outgoing: false, timestamp: now - 8 * min },
      ],
      [ivan]: [
        { id: 'd5', chatId: ivan, text: 'Добрый день, документы отправил на почту', outgoing: false, timestamp: now - 3 * 60 * min },
      ],
    },
  }
}
