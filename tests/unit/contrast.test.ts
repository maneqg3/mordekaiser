import { readFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';
import { contrastRatio, relativeLuminance } from '@/lib/contrast';

const WCAG_AA_BODY = 4.5;
const WCAG_AA_NON_TEXT = 3;

const css = readFileSync('src/styles/tokens.css', 'utf8');

function pair(block: string): { bg: string; fg: string; accent: string } {
  const bg = block.match(/--bg:\s*(#[0-9a-fA-F]{6})/)?.[1];
  const fg = block.match(/--fg:\s*(#[0-9a-fA-F]{6})/)?.[1];
  const accent = block.match(/--accent:\s*(#[0-9a-fA-F]{6})/)?.[1];
  if (!bg || !fg || !accent)
    throw new Error(`tokens ausentes no bloco: ${block}`);
  return { bg, fg, accent };
}

describe('relativeLuminance', () => {
  test('branco puro tem luminância 1', () => {
    expect(relativeLuminance('#ffffff')).toBeCloseTo(1, 5);
  });

  test('preto puro tem luminância 0', () => {
    expect(relativeLuminance('#000000')).toBeCloseTo(0, 5);
  });
});

describe('contrastRatio', () => {
  test('preto sobre branco é 21:1', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 1);
  });

  test('cor sobre ela mesma é 1:1', () => {
    expect(contrastRatio('#8c2a1e', '#8c2a1e')).toBeCloseTo(1, 5);
  });

  test('é simétrica', () => {
    expect(contrastRatio('#0f0e0c', '#d6cfc0')).toBeCloseTo(
      contrastRatio('#d6cfc0', '#0f0e0c'),
      5,
    );
  });
});

describe('tokens dos atos cumprem WCAG AA', () => {
  const rootBlock = css.match(/:root\s*\{[^}]*--bg[^}]*\}/)?.[0];
  if (!rootBlock)
    throw new Error('bloco :root com --bg não encontrado em tokens.css');

  const acts: Array<[string, { bg: string; fg: string }]> = [
    ['i (:root)', pair(rootBlock)],
  ];
  for (const m of css.matchAll(/\[data-act='(\w+)'\]\s*\{([^}]*)\}/g)) {
    acts.push([m[1], pair(m[2])]);
  }

  test('há exatamente 4 atos', () => {
    expect(acts).toHaveLength(4);
  });

  test.each(acts)('ato %s: fg sobre bg ≥ 4.5:1', (_name, { bg, fg }) => {
    expect(contrastRatio(fg, bg)).toBeGreaterThanOrEqual(WCAG_AA_BODY);
  });
});

describe("tokens do reino ([data-realm='death']) cumprem WCAG AA", () => {
  // O seletor do override usa [data-act] SEM valor de propósito: a regex dos
  // atos acima exige [data-act='x'] e não pode contar o bloco do reino.
  const realmBlock = css.match(/\[data-realm='death'\][^{]*\{([^}]*)\}/)?.[1];
  if (!realmBlock)
    throw new Error("bloco [data-realm='death'] não encontrado em tokens.css");
  const tokens = pair(realmBlock);

  test('fg sobre bg ≥ 4.5:1', () => {
    expect(contrastRatio(tokens.fg, tokens.bg)).toBeGreaterThanOrEqual(
      WCAG_AA_BODY,
    );
  });

  test('accent sobre bg ≥ 3:1 (componentes não-texto)', () => {
    expect(contrastRatio(tokens.accent, tokens.bg)).toBeGreaterThanOrEqual(
      WCAG_AA_NON_TEXT,
    );
  });
});
