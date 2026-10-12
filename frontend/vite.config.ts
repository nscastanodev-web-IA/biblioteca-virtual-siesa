import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

const API_TARGET = process.env.VITE_API_TARGET ?? 'http://localhost:8000'

// Vite config — https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: Number(process.env.PORT ?? 5173),
    // El front habla siempre con /api/v1. En desarrollo se redirige al backend PHP
    // para evitar problemas de CORS; en producción el servidor web sirve ambos.
    proxy: {
      '/api': {
        target: API_TARGET,
        changeOrigin: true,
      },
    },
  },
})
