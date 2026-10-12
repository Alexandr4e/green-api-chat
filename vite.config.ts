import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // относительные пути, чтобы сборка работала на GitHub Pages в подкаталоге репозитория
  base: './',
})
