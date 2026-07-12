'use client';

import { useEffect } from 'react';
import type Lenis from 'lenis';

/**
 * Lenis lazy (spec §7). Desligado sob reduced-motion. Entra só DEPOIS do gate
 * ser dispensado: durante o gate o body é `overflow: hidden`, então o Lenis
 * não faria nada e só custaria perf na janela que o Lighthouse mede.
 * scroll-snap segue proibido.
 */
export function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const html = document.documentElement;
    let lenis: Lenis | undefined;
    let frame = 0;
    let cancelled = false;

    const start = () => {
      import('lenis').then(({ default: LenisClass }) => {
        if (cancelled) return;
        lenis = new LenisClass();
        const loop = (time: number) => {
          lenis?.raf(time);
          frame = requestAnimationFrame(loop);
        };
        frame = requestAnimationFrame(loop);
      });
    };

    let observer: MutationObserver | undefined;
    if (html.hasAttribute('data-gate')) {
      observer = new MutationObserver(() => {
        if (!html.hasAttribute('data-gate')) {
          observer?.disconnect();
          start();
        }
      });
      observer.observe(html, {
        attributes: true,
        attributeFilter: ['data-gate'],
      });
    } else {
      start();
    }

    return () => {
      cancelled = true;
      observer?.disconnect();
      cancelAnimationFrame(frame);
      lenis?.destroy();
    };
  }, []);

  return null;
}
