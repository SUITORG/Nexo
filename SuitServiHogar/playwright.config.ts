import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: [
    {
      command: 'npm run dev',
      url: 'http://localhost:3000',
      reuseExistingServer: !process.env.CI,
      timeout: 120000,
      env: {
        VITE_DEV_MODE: 'true',
        VITE_DEV_MOCK_STRIPE: 'true',
        VITE_DEV_MOCK_EXCHANGE_RATE: 'true',
      },
    },
    {
      // Backend para /api/dev/* (qa-login) — flujo-dev lo necesita
      command: 'npx tsx server.js',
      url: 'http://localhost:3010/api/dev/status',
      reuseExistingServer: !process.env.CI,
      timeout: 60000,
    },
  ],
});