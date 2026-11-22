import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  testIgnore: 'pwa.spec.js',
  fullyParallel: true,
  workers: 2,
  use: { baseURL: 'http://127.0.0.1:5176', headless: true, channel: 'chromium' },
  webServer: { command: 'npm run dev -- --host 127.0.0.1 --port 5176 --strictPort', env: { VITE_CONTACT_PHONE: '9779800000000' }, url: 'http://127.0.0.1:5176', reuseExistingServer: !process.env.CI },
});
