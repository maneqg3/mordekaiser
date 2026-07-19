import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    sessionStorage.setItem('mordekaiser-gate-seen', '1');
  });
});

test('nenhum byte de audio antes do gesto', async ({ page }) => {
  const audioRequests: string[] = [];
  page.on('request', (r) => {
    if (r.url().includes('/audio/')) audioRequests.push(r.url());
  });
  await page.goto('/pt-br');
  await page.waitForLoadState('networkidle');
  expect(audioRequests).toHaveLength(0);
});

test('opt-in liga, persiste e nunca autoplay no reload', async ({ page }) => {
  await page.goto('/pt-br');
  const toggle = page.locator('[data-sound-toggle]');

  await expect(toggle).toBeVisible();
  await expect(toggle).toHaveAttribute('aria-pressed', 'false');

  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-pressed', 'true');
  const stored = await page.evaluate(() =>
    localStorage.getItem('mordekaiser:sound'),
  );
  expect(stored).toBe('on');

  await page.reload();
  const after = page.locator('[data-sound-toggle]');
  // Preferencia lembrada como "armado", mas SEM tocar (aria-pressed false).
  await expect(after).toHaveAttribute('data-armed', '');
  await expect(after).toHaveAttribute('aria-pressed', 'false');
});

test('desligar persiste off', async ({ page }) => {
  await page.goto('/pt-br');
  const toggle = page.locator('[data-sound-toggle]');
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-pressed', 'true');
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-pressed', 'false');
  const stored = await page.evaluate(() =>
    localStorage.getItem('mordekaiser:sound'),
  );
  expect(stored).toBe('off');
});
