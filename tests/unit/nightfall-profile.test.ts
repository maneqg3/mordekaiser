import { describe, expect, it } from 'vitest';
import { PLATE_COUNT } from '@/lib/gate-progress';
import { NIGHTFALL_PROFILE } from '@/lib/nightfall-profile';

describe('NIGHTFALL_PROFILE', () => {
  it('tem PLATE_COUNT+1 amostras (bordas das 14 fatias)', () => {
    expect(NIGHTFALL_PROFILE).toHaveLength(PLATE_COUNT + 1);
  });

  it('y é estritamente crescente de 0 a 1', () => {
    expect(NIGHTFALL_PROFILE[0].y).toBe(0);
    expect(NIGHTFALL_PROFILE.at(-1)!.y).toBe(1);
    for (let index = 1; index < NIGHTFALL_PROFILE.length; index += 1) {
      expect(NIGHTFALL_PROFILE[index].y).toBeGreaterThan(
        NIGHTFALL_PROFILE[index - 1].y,
      );
    }
  });

  it('meia-larguras positivas e estilizadas (fração da altura < 0.5)', () => {
    for (const sample of NIGHTFALL_PROFILE) {
      expect(sample.halfWidth).toBeGreaterThan(0);
      expect(sample.halfWidth).toBeLessThan(0.5);
    }
  });

  it('cabeça (metade de cima) bem mais larga que o punho (metade de baixo)', () => {
    const half = Math.ceil(NIGHTFALL_PROFILE.length / 2);
    const lower = NIGHTFALL_PROFILE.slice(0, half).map((s) => s.halfWidth);
    const upper = NIGHTFALL_PROFILE.slice(half).map((s) => s.halfWidth);
    expect(Math.max(...upper)).toBeGreaterThan(Math.max(...lower) * 2);
  });
});
