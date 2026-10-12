import { useState, type FormEvent } from 'react'
import { GreenApiError, getStateInstance, isAuthError } from '../api/greenApi'
import type { Credentials } from '../types'
import { getErrorMessage } from '../utils/error'
import { LogoIcon } from './icons'

const DEFAULT_API_URL = 'https://api.green-api.com'

interface LoginFormProps {
  onLogin: (creds: Credentials) => void
  /** Причина, по которой пользователя вернули на форму входа */
  initialError?: string | null
}

function describeLoginError(error: unknown): string {
  if (isAuthError(error)) {
    return 'Неверный idInstance или apiTokenInstance'
  }
  if (error instanceof GreenApiError) return `Не удалось подключиться: ${getErrorMessage(error)}`
  // сервер не ответил (сеть, таймаут): чаще всего у инстанса другой адрес API
  return 'Не удалось подключиться. Проверьте apiUrl в блоке «Дополнительно» — адрес указан в консоли GREEN-API.'
}

export function LoginForm({ onLogin, initialError = null }: LoginFormProps) {
  const [apiUrl, setApiUrl] = useState(DEFAULT_API_URL)
  const [idInstance, setIdInstance] = useState('')
  const [apiTokenInstance, setApiTokenInstance] = useState('')
  const [error, setError] = useState<string | null>(initialError)
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
        <div className="login__logo">
          <LogoIcon size={72} />
        </div>
        <h1 className="login__title">Войдите через GREEN-API</h1>
        <p className="login__hint">
          Укажите данные инстанса из{' '}
          <a className="login__link" href="https://console.green-api.com" target="_blank" rel="noreferrer">
            консоли GREEN-API
          </a>
        </p>

        <label className="login__field">
          <span className="login__label">id Instance</span>
          <input
            className="login__input"
            value={idInstance}
            onChange={(e) => setIdInstance(e.target.value)}
            placeholder="1101000001"
            inputMode="numeric"
          />
        </label>
        <label className="login__field">
          <span className="login__label">API Token Instance</span>
          <input
            className="login__input"
            type="password"
            value={apiTokenInstance}
            onChange={(e) => setApiTokenInstance(e.target.value)}
            placeholder="Токен инстанса"
            autoComplete="off"
          />
        </label>
        <details className="login__advanced">
          <summary className="login__advanced-toggle">Дополнительно</summary>
          <label className="login__field">
            <span className="login__label">apiUrl — адрес API из консоли, если отличается</span>
            <input className="login__input" type="url" value={apiUrl} onChange={(e) => setApiUrl(e.target.value)} />
          </label>
        </details>

        {error && (
          <div className="login__error" role="alert">
            {error}
          </div>
        )}
        <button type="submit" className="login__button" disabled={loading}>
          {loading && <span className="login__spinner" aria-hidden="true" />}
          {loading ? 'Проверяем…' : 'Войти'}
        </button>
      </form>
    </div>
  )
}
