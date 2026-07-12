import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('gate aparece, completa com progresso real e libera no Despertar; 2ª navegação pula', async ({
  page,
}) => {
  await page.goto('/en');
  const gate = page.getByRole('dialog');
  await expect(gate).toBeVisible();

  const enter = page.getByRole('button', { name: 'Awaken' });
  await expect(enter).toBeVisible({ timeout: 15_000 });
  await enter.click();
  await expect(gate).toBeHidden();
  await expect(page.locator('#hero-heading')).toBeVisible();

  // sessionStorage pula o gate na 2ª navegação (spec §6).
  await page.goto('/en');
  await expect(page.getByRole('dialog')).toBeHidden();
});

test('timeout de 8s libera quando um asset falha', async ({ page }) => {
  await page.clock.install();
  // depth map abortado: a etapa nunca completa; o timeout é a saída.
  await page.route('**/champion/depth-0.webp', (route) => route.abort());
  await page.goto('/en');
  await expect(page.getByRole('dialog')).toBeVisible();

  await page.clock.fastForward(9_000);
  await expect(page.getByRole('button', { name: 'Awaken' })).toBeVisible();
});

test('Esc entra imediatamente', async ({ page }) => {
  await page.goto('/en');
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toBeHidden();
});

test('reduced-motion pula o gate direto', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/en');
  await expect(page.locator('#hero-heading')).toBeVisible();
  await expect(page.getByRole('dialog')).toBeHidden();
});

for (const locale of ['en', 'pt-br']) {
  test(`/${locale}: axe zero com o gate presente`, async ({ page }) => {
    await page.goto(`/${locale}`);
    await expect(page.getByRole('dialog')).toBeVisible();
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });
}
