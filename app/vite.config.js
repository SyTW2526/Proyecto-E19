import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Proxy /api to backend during dev.
// Use VITE_BACKEND env var if provided; default to localhost:4000 for typical host dev.
const backend = process.env.VITE_BACKEND || 'http://localhost:4000'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: backend,
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
