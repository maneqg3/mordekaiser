import { expect, test } from '@playwright/test';

// Cresce a cada task: 3 atos (Task 4), depois arsenal/realm/incarnations/credits.
const SECTION_HEADINGS: string[] = [];

for (const locale of ['en', 'pt-br']) {
  test(`/${locale}: hero e seções renderizam`, async ({ page }) => {
    await page.goto(`/${locale}`);
    await expect(page.locator('#hero-heading')).toBeVisible();
    for (const id of SECTION_HEADINGS) {
      await expect(page.locator(`#${id}-heading`)).toBeVisible();
    }
  });
}
