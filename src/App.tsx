import { useState } from 'react'
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

  function handleLogin(newCreds: Credentials) {
    saveJson(CREDENTIALS_KEY, newCreds)
    setCreds(newCreds)
  }

  function handleLogout() {
    removeItem(CREDENTIALS_KEY)
    setCreds(null)
  }

  if (!creds) return <LoginForm onLogin={handleLogin} />

  return <Messenger key={creds.idInstance} creds={creds} onLogout={handleLogout} />
}
