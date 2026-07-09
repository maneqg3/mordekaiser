import { test } from '@playwright/test';

// uMouse fixo nos extremos: a comparação das duas imagens é o veredito.
const positions = [
  { name: 'esquerda', mx: -1, my: 0 },
  { name: 'direita', mx: 1, my: 0 },
  { name: 'neutro', mx: 0, my: 0 },
];

for (const { name, mx, my } of positions) {
  test(`captura depth displacement — ${name}`, async ({ page }) => {
    await page.goto(`/c-depth/?mx=${mx}&my=${my}`);
    // O lerp leva alguns quadros para assentar no alvo.
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `test-results/depth-${name}.png`, fullPage: false });
  });
}
