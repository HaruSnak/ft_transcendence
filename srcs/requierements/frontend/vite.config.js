import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/auth': {
        target: 'http://localhost:3004',
        changeOrigin: true,
        secure: false,
      },
      '/api/chat': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      },
      '/api/game': {
        target: 'http://localhost:3002',
        changeOrigin: true,
        secure: false,
      },
      '/api/user': {
        target: 'http://localhost:3003',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    outDir: 'dist',
  },
})