import { defineConfig } from '@playwright/test';

// Porta própria: a 3000 costuma estar ocupada por outros serviços da máquina, e
// um servidor estranho que responda 200 engana o health-check do webServer.
const PORT = Number(process.env.PORT ?? 3100);
const baseURL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: 'tests/e2e',
  use: { baseURL },
  webServer: {
    command: 'pnpm start',
    env: { PORT: String(PORT) },
    url: `${baseURL}/en`,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
