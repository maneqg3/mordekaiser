import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';

// O gate tem spec próprio (gate.spec.ts); aqui testamos o site em si.
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() =>
    sessionStorage.setItem('mordekaiser-gate-seen', '1'),
  );
});

// Lido em runtime, não por import estático: src/data/ é gerado no build
// (gitignored) e não existe no job de typecheck do CI.
const en = JSON.parse(
  readFileSync('src/data/mordekaiser.en.json', 'utf8'),
) as {
  passive: { name: string };
  spells: Array<{ name: string }>;
};

// Cresce a cada task: 3 atos (Task 4), depois arsenal/realm/incarnations/credits.
const SECTION_HEADINGS: string[] = [
  'wildlands',
  'grey-waste',
  'forge',
  'arsenal',
  'realm',
  'incarnations',
  'credits',
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

test('/en: reino da morte mostra o r do data dragon após a travessia', async ({
  page,
}) => {
  await page.goto('/en');
  // Fase 5: com JS ativo o card só aparece do outro lado do portal.
  await expect(page.locator('html')).toHaveAttribute('data-portal-ready', '');
  await page.getByRole('button', { name: 'Cross over' }).click();
  await expect(
    page.getByRole('heading', { name: en.spells[3].name }),
  ).toBeVisible();
});

for (const locale of ['en', 'pt-br']) {
  test(`/${locale}: créditos têm disclaimer da Riot e links`, async ({ page }) => {
    await page.goto(`/${locale}`);
    const credits = page.locator('footer[aria-labelledby="credits-heading"]');
    await expect(credits).toContainText('Riot Games');
    await expect(
      credits.getByRole('link', { name: 'GitHub' }),
    ).toHaveAttribute('href', 'https://github.com/maneqg3/mordekaiser');
    await expect(
      credits.getByRole('link', { name: 'LinkedIn' }),
    ).toHaveAttribute('href', 'https://www.linkedin.com/in/gabriel-luis-gomes');
  });
}

test('/en: galeria tem 14 skins nomeadas', async ({ page }) => {
  await page.goto('/en');
  // Fase 6: cards viraram botões de skin (repintura via data-skin).
  const cards = page.locator(
    'section[aria-labelledby="incarnations-heading"] button.skin-card',
  );
  await expect(cards).toHaveCount(14);
  await expect(cards.first()).toContainText('Mordekaiser');
});
