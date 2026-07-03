import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  // User site served at the root domain — must NOT be a subpath base.
  base: '/',
  plugins: [react()],
})
