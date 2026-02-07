import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  // Base path para servir desde la raíz (app.esbilla.com)
  base: '/',
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Separar vendors grandes en chunks independientes
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'firebase-vendor': ['firebase/app', 'firebase/auth', 'firebase/firestore'],
          'chart-vendor': ['recharts'],
          'query-vendor': ['@tanstack/react-query'],
          'icons-vendor': ['lucide-react'],
        },
      },
    },
    // Aumentar límite de warning a 600kb (chunks individuales más pequeños)
    chunkSizeWarningLimit: 600,
    // Sourcemaps solo en desarrollo
    sourcemap: false,
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    css: true,
  },
})
