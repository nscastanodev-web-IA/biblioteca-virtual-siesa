import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

const API_TARGET = process.env.VITE_API_TARGET ?? 'http://localhost:8000'

// Modo demostración (solo interfaz): se activa automáticamente al compilar en
// Vercel (que define VERCEL=1) o manualmente con VITE_DEMO_MODE=true. Habilita
// la API simulada (src/services/demoApi.ts) para publicar sin backend.
const DEMO_MODE = process.env.VERCEL === '1' || process.env.VITE_DEMO_MODE === 'true'

// Vite config — https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  define: {
    __DEMO_MODE__: JSON.stringify(DEMO_MODE),
  },
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
