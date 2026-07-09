import { test, expect } from '@playwright/test';

const STEPS = 20;

async function sample(page: import('@playwright/test').Page, lenis: 0 | 1) {
  await page.goto(`/a-scroll/?lenis=${lenis}`);
  await page.waitForFunction(() => window.__probe !== undefined);

  const maxScroll = await page.evaluate(
    () => document.documentElement.scrollHeight - window.innerHeight,
  );

  const samples: { y: number; p: number }[] = [];
  for (let i = 0; i <= STEPS; i++) {
    const target = Math.round((maxScroll * i) / STEPS);
    await page.evaluate((y) => window.scrollTo(0, y), target);
    // Lenis interpola: dá tempo de a animação assentar antes de amostrar.
    await page.waitForTimeout(400);
    const probe = await page.evaluate(() => window.__probe);
    samples.push({ y: probe.scrollY, p: probe.p });
  }
  return samples;
}

for (const lenis of [0, 1] as const) {
  test(`--p avança monotonicamente com lenis=${lenis}`, async ({ page }) => {
    const samples = await sample(page, lenis);
    console.log(`lenis=${lenis}`, JSON.stringify(samples));

    // 1. Sai de ~0 e chega em ~1.
    expect(samples[0].p).toBeLessThan(0.05);
    expect(samples[samples.length - 1].p).toBeGreaterThan(0.95);

    // 2. Nunca regride. Tolerância de 0.01 para ruído de arredondamento.
    for (let i = 1; i < samples.length; i++) {
      expect(samples[i].p).toBeGreaterThanOrEqual(samples[i - 1].p - 0.01);
    }

    // 3. Não fica preso: pelo menos 15 dos 21 pontos são distintos.
    const distinct = new Set(samples.map((s) => s.p.toFixed(3))).size;
    expect(distinct).toBeGreaterThanOrEqual(15);
  });
}

test('o pin do ScrollTrigger funciona com Lenis ligado', async ({ page }) => {
  await page.goto('/a-scroll/?lenis=1');
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight / 2));
  await page.waitForTimeout(600);

  const transform = await page.evaluate(
    () => getComputedStyle(document.querySelector('#box')!).transform,
  );
  // Se o scrub rodou, há uma matriz de rotação/escala — não `none`.
  expect(transform).not.toBe('none');
});
