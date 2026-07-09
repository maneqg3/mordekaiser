import { test, expect } from '@playwright/test';

// COMO RODAR: pnpm exec playwright test b-fluid/perf.spec.ts --project=mobile --headed
//
// Três descobertas deste ambiente (WSL2 + WSLg), medidas, não supostas:
// 1. Headless rasteriza por software: ~10fps nas grades 64 E 128 (grade nem
//    influencia) — artefato de ReadPixels/composição, não sinal de dispositivo.
//    Headed via WSLg usa a GPU real e vai a 60fps cravado.
// 2. Emulation.setCPUThrottlingRate (4x e até 2x) + este workload WebGL satura a
//    main thread do renderer: nem evaluate() responde por 3+ minutos. Throttle é
//    imensurável aqui. O número que decide é o de hardware real (etapa manual).
// 3. Dirigir o mouse via protocolo compete com o render loop; a página em ?auto=1
//    injeta um splat por quadro sozinha (pior caso) e congela após 8 buckets.

function median(xs: number[]) {
  const s = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

for (const sim of [64, 128] as const) {
  test(`fluid sim ${sim}x${sim} em viewport Pixel 5 (GPU desta máquina, sem throttle)`, async ({ page }) => {
    test.setTimeout(120_000);

    await page.goto(`/b-fluid/?sim=${sim}&auto=1`, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => window.__fps.length >= 8, undefined, {
      timeout: 90_000,
      polling: 1000,
    });

    const fps = await page.evaluate(() => window.__fps);

    // Evidência visual de que a sim renderizou (a página pausa desenhando o último quadro).
    await page.screenshot({ path: `test-results/fluid-${sim}.png` });

    // Descarta o primeiro segundo: compilação de shader e aquecimento.
    const steady = fps.slice(1);
    expect(steady.length, 'a medição precisa de pelo menos 3 segundos úteis').toBeGreaterThanOrEqual(3);

    const med = median(steady);
    console.log(`sim=${sim} fps por segundo: ${JSON.stringify(fps)} | mediana: ${med}`);

    if (sim === 64) {
      expect(med, 'grade 64 é o piso aceitável em mobile').toBeGreaterThanOrEqual(55);
    } else {
      // 128 em mobile não é requisito. Medimos para saber a margem em desktop.
      expect(med).toBeGreaterThan(0);
    }
  });
}
