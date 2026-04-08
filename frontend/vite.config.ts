import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    host: '0.0.0.0',
    proxy: {
      '/api': {
        // In Docker: backend service name. Locally: localhost
        target: process.env.VITE_BACKEND_PROXY ?? 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
})
