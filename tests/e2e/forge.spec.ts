import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const FORGE = "section[aria-labelledby='forge-heading']";

// Mesmo padrão do webgl.spec: gate pulado via sessionStorage; SwiftShader
// monta as cenas em headless, fps não é representativo.
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() =>
    sessionStorage.setItem('mordekaiser-gate-seen', '1'),
  );
});

async function forgeTop(
  page: import('@playwright/test').Page,
): Promise<number> {
  return page.locator(FORGE).evaluate((el) => el.getBoundingClientRect().top);
}

test('forja pina durante o scrub', async ({ page }) => {
  await page.goto('/en');
  await expect(page.locator('canvas[aria-hidden="true"]')).toHaveCount(1, {
    timeout: 15_000,
  });
  // ScrollTrigger embrulhou a seção num pin-spacer.
  await expect(page.locator(`.pin-spacer ${FORGE}`)).toHaveCount(1, {
    timeout: 15_000,
  });

  // Rola de wheel em wheel (caminho que o Lenis controla) até o pin engatar.
  for (let step = 0; step < 40; step += 1) {
    await page.mouse.wheel(0, 800);
    await page.waitForTimeout(120);
    if ((await forgeTop(page)) <= 1) break;
  }
  expect(await forgeTop(page)).toBeLessThanOrEqual(1);

  // Pinada: o scroll anda e o topo da seção fica no lugar.
  const scrollBefore = await page.evaluate(() => window.scrollY);
  await page.mouse.wheel(0, 800);
  await page.waitForTimeout(400);
  const scrollAfter = await page.evaluate(() => window.scrollY);
  expect(scrollAfter).toBeGreaterThan(scrollBefore);
  expect(Math.abs(await forgeTop(page))).toBeLessThan(4);
});

test('reduced-motion: sem pin, sem cena, nome visível', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/en');
  await page.waitForLoadState('networkidle');
  await expect(page.locator('canvas')).toHaveCount(0);
  await expect(page.locator('.pin-spacer')).toHaveCount(0);
  await expect(page.locator(`${FORGE} [data-spirit-name]`)).toBeVisible();
});

test('teclado atravessa a seção pinada até o fim da página', async ({
  page,
}) => {
  await page.goto('/en');
  await expect(page.locator('canvas[aria-hidden="true"]')).toHaveCount(1, {
    timeout: 15_000,
  });
  await page.keyboard.press('End');
  await expect
    .poll(
      () =>
        page.evaluate(
          () =>
            window.scrollY + window.innerHeight >=
            document.body.scrollHeight - 8,
        ),
      { timeout: 15_000 },
    )
    .toBe(true);
});

for (const locale of ['en', 'pt-br']) {
  test(`/${locale}: axe zero com a cena da forja montada`, async ({
    page,
  }) => {
    await page.goto(`/${locale}`);
    await expect(page.locator('canvas[aria-hidden="true"]')).toHaveCount(1, {
      timeout: 15_000,
    });
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });
}
