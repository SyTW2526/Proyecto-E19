import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// En producción usar HTTPS, en desarrollo local usar HTTP
const backend = process.env.BACKEND_URL || 
  (process.env.NODE_ENV === 'production' 
    ? 'https://proyecto-e19.onrender.com' 
    : 'http://localhost:4000')

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: '0.0.0.0',
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
