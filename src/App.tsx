import { useEffect, useState } from 'react'
import { SESSION_EXPIRED_MESSAGE, getStateInstance, isAuthError } from './api/greenApi'
import { LoginForm } from './components/LoginForm'
import { Messenger } from './components/Messenger'
import { isDemo } from './demo'
import type { Credentials } from './types'
import { loadJson, removeItem, saveJson } from './utils/storage'

const CREDENTIALS_KEY = 'greenapi.credentials'
const DEMO_CREDENTIALS: Credentials = { apiUrl: '', idInstance: 'demo', apiTokenInstance: '' }

export default function App() {
  const [creds, setCreds] = useState<Credentials | null>(() =>
    isDemo ? DEMO_CREDENTIALS : loadJson<Credentials>(CREDENTIALS_KEY),
  )
  const [logoutReason, setLogoutReason] = useState<string | null>(null)

  // данные входа, восстановленные из сессии, могли устареть: токен сменили или инстанс разлогинен
  useEffect(() => {
    if (isDemo || !creds) return
    getStateInstance(creds)
      .then(({ stateInstance }) => {
        // выходим только при окончательных состояниях; starting, sleepMode, suspended — временные
        if (stateInstance === 'notAuthorized' || stateInstance === 'blocked') {
          handleLogout(`Инстанс недоступен (состояние: ${stateInstance}). Проверьте его в консоли GREEN-API.`)
        }
      })
      .catch((e) => {
        // сетевые ошибки и 429 не означают, что токен недействителен — сессию не трогаем
        if (isAuthError(e)) handleLogout(SESSION_EXPIRED_MESSAGE)
      })
    // только при загрузке страницы; при обычном входе данные только что проверены
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleLogin(newCreds: Credentials) {
    saveJson(CREDENTIALS_KEY, newCreds)
    setLogoutReason(null)
    setCreds(newCreds)
  }

  function handleLogout(reason: string | null = null) {
    removeItem(CREDENTIALS_KEY)
    setLogoutReason(reason)
    setCreds(null)
  }

  if (!creds) return <LoginForm onLogin={handleLogin} initialError={logoutReason} />

  return <Messenger key={creds.idInstance} creds={creds} onLogout={handleLogout} />
}
