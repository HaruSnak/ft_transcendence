import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [tailwindcss()],
  server: {
    port: 3001,
    open: false,  // Désactivé pour éviter les conflits
    host: true   // Permet les connexions externes
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    target: 'es2020'
  }
});
