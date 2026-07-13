import { readFileSync } from 'node:fs';
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

// Lido em runtime: src/data/ é gerado no build (mesmo padrão de content.spec).
const en = JSON.parse(readFileSync('src/data/mordekaiser.en.json', 'utf8')) as {
  spells: Array<{ name: string }>;
};
const R_NAME = en.spells[3].name;
const CROSS = { en: 'Cross over', 'pt-br': 'Atravessar' } as const;

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() =>
    sessionStorage.setItem('mordekaiser-gate-seen', '1'),
  );
});

/** Espera a hidratação: o RealmGateway marca o <html> no mount. */
async function waitPortalReady(page: import('@playwright/test').Page) {
  await expect(page.locator('html')).toHaveAttribute('data-portal-ready', '');
}

test('travessia: clique repinta, revela o card do R e Retornar desfaz', async ({
  page,
}) => {
  await page.goto('/en');
  await waitPortalReady(page);
  const html = page.locator('html');
  const card = page.getByRole('heading', { name: R_NAME });

  // Com JS ativo, o card fica escondido até a travessia (spec §2).
  await expect(card).toBeHidden();

  await page.getByRole('button', { name: CROSS.en }).click();
  await expect(html).toHaveAttribute('data-realm', 'death');
  await expect(card).toBeVisible();

  // O DOM não é recriado — só o atributo muda: o foco fica no botão (spec §5).
  const back = page.getByRole('button', { name: 'Return' });
  await expect(back).toBeFocused();

  await back.click();
  await expect(html).not.toHaveAttribute('data-realm');
  await expect(card).toBeHidden();
});

test('reload volta ao mundo vivo — a travessia não persiste', async ({
  page,
}) => {
  await page.goto('/en');
  await waitPortalReady(page);
  await page.getByRole('button', { name: CROSS.en }).click();
  await expect(page.locator('html')).toHaveAttribute('data-realm', 'death');

  await page.reload();
  await expect(page.locator('#realm-heading')).toBeVisible();
  await expect(page.locator('html')).not.toHaveAttribute('data-realm');
});

test.describe('sem JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('card do R visível e sem botão da travessia', async ({ page }) => {
    await page.goto('/en');
    // Sem JS os atributos nunca entram: Fase 2 intacta (spec §4).
    await expect(page.getByRole('heading', { name: R_NAME })).toBeVisible();
    await expect(page.locator('[data-realm-cta]')).toBeHidden();
  });
});

for (const locale of ['en', 'pt-br'] as const) {
  test(`/${locale}: axe zero dentro do reino`, async ({ page }) => {
    await page.goto(`/${locale}`);
    await waitPortalReady(page);
    await page.getByRole('button', { name: CROSS[locale] }).click();
    await expect(page.locator('html')).toHaveAttribute('data-realm', 'death');
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });
}
