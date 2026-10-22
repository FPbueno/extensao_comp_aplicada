import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// No `npm run dev`, /api é repassado para o back, como o nginx faz em produção.
// Padrão: back publicado pelo docker compose (BACK_PORT=5000). Para usar o Flask
// rodando direto na máquina: VITE_API_PROXY=http://localhost:5555 npm run dev
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: process.env.VITE_API_PROXY ?? 'http://localhost:5000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})
