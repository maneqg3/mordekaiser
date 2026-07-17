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
  await page.addInitScript(() => {
    sessionStorage.setItem('mordekaiser-gate-seen', '1');
    // Conta as chamadas de startViewTransition para asserir o caminho tomado.
    const original = Document.prototype.startViewTransition;
    if (!original) return;
    Document.prototype.startViewTransition = function (
      ...args: Parameters<typeof original>
    ) {
      const w = window as unknown as { __vtCalls?: number };
      w.__vtCalls = (w.__vtCalls ?? 0) + 1;
      return original.apply(this, args);
    };
  });
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

test('reduced-motion: troca instantânea, sem view transition', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/en');
  await waitPortalReady(page);
  await page.getByRole('button', { name: CROSS.en }).click();
  await expect(page.locator('html')).toHaveAttribute('data-realm', 'death');
  const calls = await page.evaluate(
    () => (window as unknown as { __vtCalls?: number }).__vtCalls ?? 0,
  );
  expect(calls).toBe(0);
});

test('sem reduced-motion, a travessia passa por startViewTransition', async ({
  page,
}) => {
  await page.goto('/en');
  await waitPortalReady(page);
  const supported = await page.evaluate(
    () => 'startViewTransition' in document,
  );
  test.skip(!supported, 'browser sem view transitions usa o crossfade CSS');
  await page.getByRole('button', { name: CROSS.en }).click();
  await expect(page.locator('html')).toHaveAttribute('data-realm', 'death');
  await expect
    .poll(() =>
      page.evaluate(
        () => (window as unknown as { __vtCalls?: number }).__vtCalls ?? 0,
      ),
    )
    .toBeGreaterThan(0);
});

test('coreografia: impacto → data-realm → reveal, nesta ordem', async ({
  page,
}) => {
  await page.goto('/en');
  await waitPortalReady(page);
  const html = page.locator('html');
  await page.getByRole('button', { name: CROSS.en }).click();
  // Impacto síncrono no clique.
  await expect(html).toHaveClass(/realm-impact/);
  // Cross aos ~300ms (auto-wait do Playwright cobre).
  await expect(html).toHaveAttribute('data-realm', 'death');
  // Cúpula aos ~1200ms.
  await expect(html).toHaveAttribute('data-realm-reveal', '');

  // Volta: reveal cai imediatamente, data-realm aos ~600ms.
  await page.getByRole('button', { name: 'Return' }).click();
  await expect(html).not.toHaveAttribute('data-realm-reveal');
  await expect(html).not.toHaveAttribute('data-realm');
});

test('reduced-motion: sem impacto e sem reveal — só a troca', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/en');
  await waitPortalReady(page);
  const html = page.locator('html');
  await page.getByRole('button', { name: CROSS.en }).click();
  await expect(html).toHaveAttribute('data-realm', 'death');
  await expect(html).not.toHaveClass(/realm-impact/);
  await expect(html).not.toHaveAttribute('data-realm-reveal');
});

test('ambientação do reino: segundo passe webgl vivo só dentro do reino', async ({
  page,
}) => {
  await page.goto('/en');
  await waitPortalReady(page);
  const canvas = page.locator('canvas[aria-hidden="true"]');
  await expect(canvas).toHaveCount(1, { timeout: 15_000 });

  await page.getByRole('button', { name: CROSS.en }).click();
  await expect(page.locator('html')).toHaveAttribute('data-realm-reveal', '');
  // Cúpula materializada: dois frames do canvas diferem numa seção SEM cena
  // própria (incarnations) — quem anima ali é só a ambientação fixa. (No topo
  // não vale: o HeroDepth animaria e mascararia o RED.)
  await page.evaluate(() =>
    document
      .querySelector("[aria-labelledby='incarnations-heading']")
      ?.scrollIntoView(),
  );
  await page.waitForTimeout(900);
  const first = await canvas.screenshot();
  await page.waitForTimeout(600);
  const second = await canvas.screenshot();
  expect(first.equals(second)).toBe(false);
});
