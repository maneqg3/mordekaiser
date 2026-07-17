import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  cancelRealmChoreography,
  realmChoreography,
} from '@/lib/realm-choreography';

beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
});

describe('realmChoreography', () => {
  it('enter: impacto imediato, cross aos 300ms, reveal aos 1200ms', () => {
    const phases: string[] = [];
    realmChoreography('enter', (p) => phases.push(p), false);
    expect(phases).toEqual(['impact']);
    vi.advanceTimersByTime(300);
    expect(phases).toEqual(['impact', 'cross']);
    vi.advanceTimersByTime(900);
    expect(phases).toEqual(['impact', 'cross', 'reveal']);
  });

  it('exit: impacto e unreveal imediatos, cross aos 600ms', () => {
    const phases: string[] = [];
    realmChoreography('exit', (p) => phases.push(p), false);
    expect(phases).toEqual(['impact', 'unreveal']);
    vi.advanceTimersByTime(600);
    expect(phases).toEqual(['impact', 'unreveal', 'cross']);
  });

  it('reduced-motion: só cross, imediato, sem timers', () => {
    const phases: string[] = [];
    const timers = realmChoreography('enter', (p) => phases.push(p), true);
    expect(phases).toEqual(['cross']);
    expect(timers).toEqual([]);
    vi.advanceTimersByTime(5000);
    expect(phases).toEqual(['cross']);
  });

  it('cancelamento mata as fases pendentes', () => {
    const phases: string[] = [];
    const timers = realmChoreography('enter', (p) => phases.push(p), false);
    vi.advanceTimersByTime(300);
    cancelRealmChoreography(timers);
    vi.advanceTimersByTime(5000);
    expect(phases).toEqual(['impact', 'cross']);
  });
});
