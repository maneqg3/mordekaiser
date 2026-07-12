import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

// O gate tem spec próprio (gate.spec.ts); aqui testamos o site em si.
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() =>
    sessionStorage.setItem('mordekaiser-gate-seen', '1'),
  );
});

test('raiz redireciona para /en', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveURL(/\/en$/);
});

for (const locale of ['en', 'pt-br']) {
  test(`/${locale}: h1 visível e zero violações de axe`, async ({ page }) => {
    await page.goto(`/${locale}`);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });
}
