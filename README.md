# GREEN-API Telegram Chat

Простой веб-чат для отправки и получения текстовых сообщений в **Telegram** через сервис
[GREEN-API](https://green-api.com/telegram/). Интерфейс сделан по образцу
[Telegram Web](https://web.telegram.org/).

- **Демо:** https://__GH_USER__.github.io/green-api-telegram-chat/
- **Демо-режим без учётных данных** (фиктивная переписка для просмотра интерфейса):
  https://__GH_USER__.github.io/green-api-telegram-chat/?demo=1

| Вход | Чат | Мобильная версия |
|---|---|---|
| ![Вход](docs/screenshots/login.png) | ![Чат](docs/screenshots/chat.png) | ![Мобильная версия](docs/screenshots/mobile.png) |

## Возможности

1. Вход по учётным данным инстанса GREEN-API (`idInstance`, `apiTokenInstance`).
   Данные проверяются методом `getStateInstance` (инстанс должен быть в состоянии `authorized`).
2. Создание нового чата по номеру телефона получателя.
3. Отправка текстового сообщения — метод
   [SendMessage](https://green-api.com/telegram/docs/api/sending/SendMessage/).
4. Получение входящих сообщений — технология
   [HTTP API](https://green-api.com/telegram/docs/api/receiving/technology-http-api/):
   цикл `ReceiveNotification` (long polling, `receiveTimeout=5`) → обработка → `DeleteNotification`.
5. Отображение ответов собеседника в чате. Также показываются сообщения, отправленные вами
   с телефона (`outgoingMessageReceived`).

Обрабатываются только текстовые сообщения (`textMessage`, `extendedTextMessage`), остальные
уведомления подтверждаются и пропускаются.

## Локальный запуск

Требуется Node.js 20+.

```bash
git clone https://github.com/__GH_USER__/green-api-telegram-chat.git
cd green-api-telegram-chat
npm install
npm run dev
```

Откройте http://localhost:5173.

Сборка production-версии: `npm run build` (результат в `dist/`), предпросмотр: `npm run preview`.

## Подготовка инстанса GREEN-API

1. Зарегистрируйтесь в [консоли GREEN-API](https://console.green-api.com) и создайте инстанс
   для Telegram, авторизуйте его.
2. В настройках инстанса:
   - поле **URL для получения уведомлений (webhookUrl) оставьте пустым** — иначе уведомления
     уйдут на webhook и не попадут в очередь HTTP API;
   - включите получение входящих уведомлений о сообщениях (`incomingWebhook`), при желании —
     уведомления об исходящих (`outgoingWebhook`, `outgoingAPIMessageWebhook`).
3. Скопируйте `idInstance` и `apiTokenInstance`. Поле `apiUrl` по умолчанию
   `https://api.green-api.com`; если в консоли у инстанса указан другой API URL — подставьте его.

## Как пользоваться

1. Введите `idInstance`, `apiTokenInstance` и нажмите «Войти».
2. В поле «Номер телефона для нового чата» введите номер получателя в международном формате
   (`+7 999 123-45-67`, `79991234567` и т. п.) и нажмите «+».
3. Напишите сообщение и нажмите Enter (Shift+Enter — перенос строки).
4. Ответ получателя появится в чате в течение нескольких секунд.

> В Telegram чат, созданный по номеру (`79991234567@c.us`), после первого сообщения может
> получить числовой chatId. Приложение сопоставляет его по `idMessage` отправленного
> сообщения и объединяет переписку в один чат.

## Структура

```
src/
  api/greenApi.ts            запросы к GREEN-API (sendMessage, receive/deleteNotification, getStateInstance)
  hooks/useNotifications.ts  цикл получения уведомлений по HTTP API
  store.ts                   reducer состояния чатов и сообщений
  components/
    LoginForm.tsx            форма входа
    Messenger.tsx            экран мессенджера: состояние, отправка, обработка уведомлений
    Sidebar.tsx              список чатов и создание чата по номеру
    ChatWindow.tsx           окно переписки
    MessageBubble.tsx        сообщение
    MessageInput.tsx         поле ввода
    Avatar.tsx               аватар с инициалами
  utils/                     номера телефонов, разбор уведомлений, localStorage, время
  demo.ts                    данные для демо-режима (?demo=1)
```

CSS организован по методологии BEM (`block__element--modifier`), стили — в `src/index.css`.

Стек: React 19, TypeScript, Vite. Внешних зависимостей, кроме React, нет.
Учётные данные и история чатов хранятся только в `localStorage` браузера; кнопка выхода их удаляет.
Деплой на GitHub Pages — GitHub Actions (`.github/workflows/deploy.yml`).
