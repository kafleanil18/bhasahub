import { defineConfig } from '@playwright/test'
import { fileURLToPath } from 'node:url'
export default defineConfig({
  testDir: './e2e',
  testMatch: 'pwa.spec.js',
  use: { baseURL: 'http://127.0.0.1:5177', headless: true, channel: process.env.PLAYWRIGHT_CHANNEL || 'chromium' },
  webServer: {
    cwd: fileURLToPath(new URL('.', import.meta.url)),
    command: 'npm run preview -- --host 127.0.0.1 --port 5177 --strictPort',
    url: 'http://127.0.0.1:5177',
  },
})
