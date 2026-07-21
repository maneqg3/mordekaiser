import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    sessionStorage.setItem('mordekaiser-gate-seen', '1');
  });
});

const section = (page: import('@playwright/test').Page) =>
  page.locator('section[aria-labelledby="incarnations-heading"]');

async function accent(page: import('@playwright/test').Page): Promise<string> {
  return page.evaluate(() =>
    getComputedStyle(document.documentElement).getPropertyValue('--accent'),
  );
}

test('selecionar skin repinta a pagina; desmarcar volta', async ({ page }) => {
  await page.goto('/pt-br');
  const before = await accent(page);

  const skinButton = section(page).getByRole('button').nth(1);
  await skinButton.click();

  await expect(page.locator('html')).toHaveAttribute('data-skin', /\d+/);
  await expect(skinButton).toHaveAttribute('aria-pressed', 'true');
  await expect.poll(async () => accent(page)).not.toBe(before);

  await skinButton.click();
  await expect(page.locator('html')).not.toHaveAttribute('data-skin');
  await expect.poll(async () => accent(page)).toBe(before);
});

test('uma skin ativa por vez', async ({ page }) => {
  await page.goto('/pt-br');
  const buttons = section(page).getByRole('button');
  await buttons.nth(0).click();
  await buttons.nth(2).click();
  await expect(buttons.nth(0)).toHaveAttribute('aria-pressed', 'false');
  await expect(buttons.nth(2)).toHaveAttribute('aria-pressed', 'true');
});

test('galeria sem violacoes axe', async ({ page }) => {
  await page.goto('/pt-br');
  const results = await new AxeBuilder({ page })
    .include('section[aria-labelledby="incarnations-heading"]')
    .analyze();
  expect(results.violations).toEqual([]);
});
