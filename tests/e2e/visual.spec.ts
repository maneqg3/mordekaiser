import { expect, test } from '@playwright/test';

const WIDTHS = [320, 768, 1440];
const SECTIONS = [
  'hero-heading',
  'forge-heading',
  'arsenal-heading',
  'incarnations-heading',
];

for (const width of WIDTHS) {
  test(`visual /en @${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/en');
    // Rola a página inteira para disparar as imagens lazy antes das capturas.
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 600) {
        window.scrollTo(0, y);
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
      window.scrollTo(0, 0);
    });
    await page.waitForLoadState('networkidle');
    for (const headingId of SECTIONS) {
      const section = page.locator(`[aria-labelledby='${headingId}']`);
      await section.scrollIntoViewIfNeeded();
      await expect(section).toHaveScreenshot(`${headingId}-${width}.png`, {
        maxDiffPixelRatio: 0.02,
      });
    }
  });
}
