import { defineConfig } from '@playwright/test';

// Porta própria: a 3000 costuma estar ocupada por outros serviços da máquina, e
// um servidor estranho que responda 200 engana o health-check do webServer.
const PORT = Number(process.env.PORT ?? 3100);
const baseURL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: 'tests/e2e',
  // SwiftShader + workers paralelos deixam a view transition da travessia
  // lenta; 5s (default) flakeia sob carga — o atributo chega, só demora.
  expect: { timeout: 10_000 },
  use: {
    baseURL,
    // Chrome 120+ bloqueia o fallback SwiftShader de WebGL em headless sem esta
    // flag; sem ela as cenas R3F não montam no CI (spec §11: cenas montam via
    // SwiftShader, fps não é representativo — perf se mede manual).
    launchOptions: { args: ['--enable-unsafe-swiftshader'] },
  },
  webServer: {
    command: 'pnpm start',
    env: { PORT: String(PORT) },
    url: `${baseURL}/en`,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
