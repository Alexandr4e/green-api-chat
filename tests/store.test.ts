import assert from 'node:assert/strict'
import { test } from 'node:test'
import { chatReducer, emptyState, type ChatState } from '../src/store.ts'
import type { Message } from '../src/types.ts'
import { toChat } from '../src/utils/chats.ts'
import { normalizePhone } from '../src/utils/phone.ts'

const msg = (id: string, chatId: string, timestamp: number): Message => ({
  id,
  chatId,
  text: id,
  outgoing: true,
  timestamp,
  status: 'sent',
})

const phoneChat: ChatState = {
  ...emptyState,
  chats: [{ chatId: '79991112233@c.us', title: '+7 999 111-22-33', phoneChatId: '79991112233@c.us' }],
  messages: { '79991112233@c.us': [msg('m1', '79991112233@c.us', 1)] },
  activeChatId: '79991112233@c.us',
}

test('renameChat переносит чат, сообщения и активный чат на настоящий chatId', () => {
  const next = chatReducer(phoneChat, { type: 'renameChat', from: '79991112233@c.us', to: '555000' })
  assert.deepEqual(
    next.chats.map((c) => c.chatId),
    ['555000'],
  )
  assert.equal(next.chats[0].phoneChatId, '79991112233@c.us')
  assert.deepEqual(
    next.messages['555000'].map((m) => [m.id, m.chatId]),
    [['m1', '555000']],
  )
  assert.equal(next.messages['79991112233@c.us'], undefined)
  assert.equal(next.activeChatId, '555000')
})

test('mergeChats склеивает чат, созданный по номеру, с чатом из getChats по телефону', () => {
  const next = chatReducer(phoneChat, {
    type: 'mergeChats',
    chats: [{ chatId: '555000', title: 'Пётр', phone: '79991112233' }],
  })
  assert.equal(next.chats.length, 1)
  assert.equal(next.chats[0].chatId, '555000')
  assert.equal(next.chats[0].title, 'Пётр')
  assert.equal(next.messages['555000'].length, 1)
})

test('updateMessage не оставляет дубль, если уведомление пришло раньше ответа sendMessage', () => {
  const state: ChatState = {
    ...emptyState,
    chats: [{ chatId: 'c', title: 'c' }],
    messages: { c: [{ ...msg('local-1', 'c', 1), status: 'sending' }, msg('MSG1', 'c', 2)] },
  }
  const next = chatReducer(state, { type: 'updateMessage', id: 'local-1', patch: { id: 'MSG1', status: 'sent' } })
  assert.deepEqual(
    next.messages.c.map((m) => m.id),
    ['MSG1'],
  )
})

test('normalizePhone: российская «8» без «+», код страны с «+» не трогает', () => {
  assert.equal(normalizePhone('8 (999) 111-22-33'), '79991112233')
  assert.equal(normalizePhone('+84 912 345 678'), '84912345678')
  assert.equal(normalizePhone('+7 999 111-22-33'), '79991112233')
})

test('toChat: chatId (Telegram) и id (WhatsApp), каналы пропускает, запасное название', () => {
  assert.deepEqual(toChat({ chatId: '555000', name: 'Пётр', type: 'user' }), { chatId: '555000', title: 'Пётр', phone: undefined })
  assert.equal(toChat({ id: '79991112233@c.us', type: 'user' })?.title, '+7 999 111-22-33')
  assert.equal(toChat({ id: '120363@g.us', name: 'Группа', type: 'group' })?.chatId, '120363@g.us')
  assert.equal(toChat({ chatId: '-100500', name: 'Канал', type: 'channel' }), null)
  assert.equal(toChat({ chatId: '777', username: 'bot' })?.title, '@bot')
  assert.equal(toChat({ type: 'user' }), null)
})
