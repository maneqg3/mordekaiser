import { expect, test } from '@playwright/test';

// Headless chromium tem WebGL via SwiftShader: as cenas montam, mas fps não
// é representativo — performance se mede manual (spec §11).
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() =>
    sessionStorage.setItem('mordekaiser-gate-seen', '1'),
  );
});

test('canvas monta escondido de leitores de tela', async ({ page }) => {
  await page.goto('/en');
  await expect(page.locator('canvas[aria-hidden="true"]')).toHaveCount(1, {
    timeout: 15_000,
  });
});

test('reduced-motion não monta cena nenhuma', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/en');
  await expect(page.locator('#hero-heading')).toBeVisible();
  await page.waitForLoadState('networkidle');
  await expect(page.locator('canvas')).toHaveCount(0);
});

test('transições de cor da fase 2 seguem funcionando com lenis ativo', async ({
  page,
}) => {
  await page.goto('/en');
  // Lenis carregou: ele marca o <html> com a classe `lenis`.
  await expect(page.locator('html.lenis')).toHaveCount(1, { timeout: 15_000 });

  const animation = await page
    .locator("section[data-act='ii']")
    .evaluate((el) => getComputedStyle(el).animationName);
  expect(animation).toBe('act-i-to-ii');

  // E o scroll de fato anda com o Lenis controlando a rolagem.
  await page.mouse.wheel(0, 1200);
  await expect
    .poll(() => page.evaluate(() => window.scrollY))
    .toBeGreaterThan(0);
});

test('cena do portal renderiza sem erros de shader', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  await page.goto('/en');
  await expect(page.locator('canvas[aria-hidden="true"]')).toHaveCount(1, {
    timeout: 15_000,
  });
  await page
    .locator("section[aria-labelledby='realm-heading']")
    .scrollIntoViewIfNeeded();
  // Dois rAF: garante pelo menos um quadro renderizado com a cena visível —
  // erro de compilação de shader do three aparece no console aqui.
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
  );
  expect(errors.filter((text) => text.includes('THREE'))).toEqual([]);
});

test('cena do portal anima continuamente (dois frames diferem)', async ({
  page,
}) => {
  await page.goto('/en');
  const canvas = page.locator('canvas[aria-hidden="true"]');
  await expect(canvas).toHaveCount(1, { timeout: 15_000 });
  await page
    .locator("section[aria-labelledby='realm-heading']")
    .scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  const first = await canvas.screenshot();
  await page.waitForTimeout(600);
  const second = await canvas.screenshot();
  // Anel congelado (bug da Fase 5): frames idênticos. uTime vivo: diferem.
  expect(first.equals(second)).toBe(false);
});
