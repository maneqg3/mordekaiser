'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

// ssr: false — o chunk nunca bloqueia conteúdo; a página da Fase 2 é o
// fallback permanente (spec §3).
const PersistentCanvas = dynamic(() => import('@/webgl/PersistentCanvas'), {
  ssr: false,
});

function supportsWebGL2(): boolean {
  try {
    return document.createElement('canvas').getContext('webgl2') !== null;
  } catch {
    return false;
  }
}

/**
 * Decide se e QUANDO a camada WebGL entra. Sem WebGL2 ou com reduced-motion, o
 * site da Fase 2 fica. Com WebGL, o chunk só carrega DEPOIS do gate ser
 * dispensado — durante o gate (a janela que o Lighthouse mede) nada de WebGL
 * roda, preservando a perf. Sem gate (2ª visita), monta pós first paint.
 */
export function WebGLMount() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const reduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    if (reduced || !supportsWebGL2()) return;

    const html = document.documentElement;
    let raf1 = 0;
    let raf2 = 0;
    // Dois rAF: um quadro de conteúdo antes de baixar/compilar o chunk pesado.
    const mount = () => {
      raf1 = requestAnimationFrame(() => {
        raf2 = requestAnimationFrame(() => setReady(true));
      });
    };

    if (!html.hasAttribute('data-gate')) {
      mount();
      return () => {
        cancelAnimationFrame(raf1);
        cancelAnimationFrame(raf2);
      };
    }

    // Gate ativo: espera ele ser fechado (o EntryGate remove [data-gate]).
    const observer = new MutationObserver(() => {
      if (!html.hasAttribute('data-gate')) {
        observer.disconnect();
        mount();
      }
    });
    observer.observe(html, {
      attributes: true,
      attributeFilter: ['data-gate'],
    });
    return () => {
      observer.disconnect();
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, []);

  return ready ? <PersistentCanvas /> : null;
}
