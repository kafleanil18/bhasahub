import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  testIgnore: 'pwa.spec.js',
  fullyParallel: true,
  workers: 2,
  use: { baseURL: 'http://127.0.0.1:5176', headless: true, channel: 'chromium' },
  // Fixed values, so the tests don't depend on what each computer's client/.env holds. The Google
  // client ID is a stand-in: the sign-in tests replace Google's script with their own.
  webServer: { command: 'npm run dev -- --host 127.0.0.1 --port 5176 --strictPort', env: { VITE_CONTACT_PHONE: '9779800000000', VITE_GOOGLE_CLIENT_ID: 'e2e-test.apps.googleusercontent.com' }, url: 'http://127.0.0.1:5176', reuseExistingServer: !process.env.CI },
});
