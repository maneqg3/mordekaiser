import { describe, expect, it, vi } from 'vitest';
import { applyRealmTransition } from '@/lib/realm-transition';

describe('applyRealmTransition', () => {
  it('usa startViewTransition quando suportado e sem reduced-motion', () => {
    const mutate = vi.fn();
    const startViewTransition = vi.fn((update: () => void) => update());
    const path = applyRealmTransition({ startViewTransition }, false, mutate);
    expect(path).toBe('view-transition');
    expect(startViewTransition).toHaveBeenCalledOnce();
    expect(mutate).toHaveBeenCalledOnce();
  });

  it('aplica direto quando o browser não suporta view transitions', () => {
    const mutate = vi.fn();
    const path = applyRealmTransition({}, false, mutate);
    expect(path).toBe('direct');
    expect(mutate).toHaveBeenCalledOnce();
  });

  it('aplica direto com reduced-motion mesmo com suporte', () => {
    const mutate = vi.fn();
    const startViewTransition = vi.fn((update: () => void) => update());
    const path = applyRealmTransition({ startViewTransition }, true, mutate);
    expect(path).toBe('direct');
    expect(startViewTransition).not.toHaveBeenCalled();
    expect(mutate).toHaveBeenCalledOnce();
  });
});
