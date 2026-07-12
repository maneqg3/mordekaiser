'use client';

import { useEffect } from 'react';
import type Lenis from 'lenis';

/**
 * Lenis lazy, pós first paint, junto do chunk WebGL (spec §7).
 * Desligado sob reduced-motion. scroll-snap segue proibido.
 */
export function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let lenis: Lenis | undefined;
    let frame = 0;
    let cancelled = false;

    import('lenis').then(({ default: LenisClass }) => {
      if (cancelled) return;
      lenis = new LenisClass();
      const loop = (time: number) => {
        lenis?.raf(time);
        frame = requestAnimationFrame(loop);
      };
      frame = requestAnimationFrame(loop);
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      lenis?.destroy();
    };
  }, []);

  return null;
}
