import { useState, type FormEvent } from 'react'
import { GreenApiError, getStateInstance } from '../api/greenApi'
import type { Credentials } from '../types'
import { getErrorMessage } from '../utils/error'

const DEFAULT_API_URL = 'https://api.green-api.com'

interface LoginFormProps {
  onLogin: (creds: Credentials) => void
}

function describeLoginError(error: unknown): string {
  if (error instanceof GreenApiError && (error.status === 401 || error.status === 403)) {
    return 'Неверный idInstance или apiTokenInstance'
  }
  return `Не удалось подключиться: ${getErrorMessage(error)}`
}

export function LoginForm({ onLogin }: LoginFormProps) {
  const [apiUrl, setApiUrl] = useState(DEFAULT_API_URL)
  const [idInstance, setIdInstance] = useState('')
  const [apiTokenInstance, setApiTokenInstance] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const creds: Credentials = {
      apiUrl: apiUrl.trim(),
      idInstance: idInstance.trim(),
      apiTokenInstance: apiTokenInstance.trim(),
    }
    if (!creds.apiUrl || !creds.idInstance || !creds.apiTokenInstance) {
      setError('Заполните все поля')
      return
    }

    setLoading(true)
    setError(null)
    try {
      const { stateInstance } = await getStateInstance(creds)
      if (stateInstance === 'authorized') {
        onLogin(creds)
        return
      }
      setError(`Инстанс не авторизован (состояние: ${stateInstance}). Авторизуйте его в консоли GREEN-API.`)
    } catch (err) {
      setError(describeLoginError(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login">
      <form className="login__card" onSubmit={handleSubmit} noValidate>
        <div className="login__logo" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="56" height="56">
            <path
              fill="currentColor"
              d="M9.8 15.3 9.6 19c.4 0 .6-.2.8-.4l2-1.9 4.1 3c.8.4 1.3.2 1.5-.7l2.7-12.7c.3-1.1-.4-1.6-1.2-1.3L3.7 10.7c-1.1.4-1.1 1.1-.2 1.4l4.1 1.3 9.6-6c.5-.3.9-.1.5.2"
            />
          </svg>
        </div>
        <h1 className="login__title">Вход в чат</h1>
        <p className="login__hint">
          Введите данные инстанса Telegram из{' '}
          <a className="login__link" href="https://console.green-api.com" target="_blank" rel="noreferrer">
            консоли GREEN-API
          </a>
        </p>

        <label className="login__field">
          <span className="login__label">idInstance</span>
          <input
            className="login__input"
            value={idInstance}
            onChange={(e) => setIdInstance(e.target.value)}
            placeholder="1101000001"
            inputMode="numeric"
          />
        </label>
        <label className="login__field">
          <span className="login__label">apiTokenInstance</span>
          <input
            className="login__input"
            type="password"
            value={apiTokenInstance}
            onChange={(e) => setApiTokenInstance(e.target.value)}
            placeholder="Токен инстанса"
            autoComplete="off"
          />
        </label>
        <label className="login__field">
          <span className="login__label">apiUrl</span>
          <input className="login__input" type="url" value={apiUrl} onChange={(e) => setApiUrl(e.target.value)} />
        </label>

        {error && (
          <div className="login__error" role="alert">
            {error}
          </div>
        )}
        <button type="submit" className="login__button" disabled={loading}>
          {loading ? 'Проверка…' : 'Войти'}
        </button>
      </form>
    </div>
  )
}
