import { expect, test } from '@playwright/test';
import en from '../../src/data/mordekaiser.en.json';

// Cresce a cada task: 3 atos (Task 4), depois arsenal/realm/incarnations/credits.
const SECTION_HEADINGS: string[] = [
  'wildlands',
  'grey-waste',
  'forge',
  'arsenal',
  'realm',
];

for (const locale of ['en', 'pt-br']) {
  test(`/${locale}: hero e seções renderizam`, async ({ page }) => {
    await page.goto(`/${locale}`);
    await expect(page.locator('#hero-heading')).toBeVisible();
    for (const id of SECTION_HEADINGS) {
      await expect(page.locator(`#${id}-heading`)).toBeVisible();
    }
  });
}

test('/en: arsenal mostra passiva e q/w/e do data dragon', async ({ page }) => {
  await page.goto('/en');
  await expect(
    page.getByRole('heading', { name: en.passive.name }),
  ).toBeVisible();
  for (const spell of en.spells.slice(0, 3)) {
    await expect(page.getByRole('heading', { name: spell.name })).toBeVisible();
  }
});

test('/en: reino da morte mostra o r do data dragon', async ({ page }) => {
  await page.goto('/en');
  await expect(
    page.getByRole('heading', { name: en.spells[3].name }),
  ).toBeVisible();
});
