import { describe, expect, it } from 'vitest';
import { crossFadeProgress, writeOnProgress } from '@/lib/ochnun-progress';

describe('writeOnProgress', () => {
  it('0 antes da janela (0.75), 1 depois (0.92)', () => {
    expect(writeOnProgress(0)).toBe(0);
    expect(writeOnProgress(0.75)).toBe(0);
    expect(writeOnProgress(0.92)).toBe(1);
    expect(writeOnProgress(1)).toBe(1);
  });

  it('meio da janela ≈ 0.5', () => {
    expect(writeOnProgress((0.75 + 0.92) / 2)).toBeCloseTo(0.5);
  });
});

describe('crossFadeProgress', () => {
  it('só atua no trecho final (0.92→1)', () => {
    expect(crossFadeProgress(0.9)).toBe(0);
    expect(crossFadeProgress(0.92)).toBe(0);
    expect(crossFadeProgress(0.96)).toBeCloseTo(0.5);
    expect(crossFadeProgress(1)).toBe(1);
  });
});
