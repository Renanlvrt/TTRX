/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => ({
  // GitHub Pages serves the app under /TTRX/ (`vite build --mode pages`); local dev stays at /.
  base: mode === 'pages' ? '/TTRX/' : '/',
  plugins: [react(), tailwindcss()],
  // One server for laptop (localhost) and phone (Wi-Fi IP).
  server: { host: true, port: 5173, strictPort: true },
  test: { environment: 'node', exclude: ['**/node_modules/**', '.claude/**', 'dist/**'] },
}))
