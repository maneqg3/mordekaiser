export type RealmPhase = 'impact' | 'cross' | 'reveal' | 'unreveal';

/** Timings da travessia (spec Fase 5.1 §3): impacto → sucção → cúpula. */
export const ENTER_TIMINGS = { impact: 0, cross: 300, reveal: 1200 } as const;
/** Volta comprimida: cúpula sobe já, mundo morto é cuspido aos 600ms. */
export const EXIT_TIMINGS = { impact: 0, unreveal: 0, cross: 600 } as const;

/**
 * Agenda as fases da travessia. Fases com delay 0 rodam síncronas (impacto no
 * mesmo frame do clique). Reduced-motion: só a mutação, imediata — o CSS cuida
 * do resto ser estático. Retorna os timers pendentes para cancelamento.
 */
export function realmChoreography(
  direction: 'enter' | 'exit',
  run: (phase: RealmPhase) => void,
  reducedMotion: boolean,
): ReturnType<typeof setTimeout>[] {
  if (reducedMotion) {
    run('cross');
    return [];
  }
  const timings: Partial<Record<RealmPhase, number>> =
    direction === 'enter' ? ENTER_TIMINGS : EXIT_TIMINGS;
  const timers: ReturnType<typeof setTimeout>[] = [];
  for (const [phase, delay] of Object.entries(timings) as Array<
    [RealmPhase, number]
  >) {
    if (delay === 0) run(phase);
    else timers.push(setTimeout(() => run(phase), delay));
  }
  return timers;
}

/** Cancela fases pendentes (clique rápido em Atravessar/Retornar). */
export function cancelRealmChoreography(
  timers: ReturnType<typeof setTimeout>[],
): void {
  for (const timer of timers) clearTimeout(timer);
}
