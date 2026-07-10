import { expect, test } from '@playwright/test';

test('prefers-reduced-motion desliga as animações de scroll', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/en');
  const animation = await page
    .locator("section[data-act='ii']")
    .evaluate((el) => getComputedStyle(el).animationName);
  expect(animation).toBe('none');
});

test('sem reduced-motion, a transição de cor do ato ii está ativa', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/en');
  const animation = await page
    .locator("section[data-act='ii']")
    .evaluate((el) => getComputedStyle(el).animationName);
  expect(animation).toBe('act-i-to-ii');
});
