import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: '.',
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'off',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 5'] } },
  ],
  webServer: {
    command: 'pnpm dev',
    // /a-scroll/ e não a raiz: o spike não tem index.html raiz e 404 não conta como "pronto".
    url: 'http://localhost:5173/a-scroll/',
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
