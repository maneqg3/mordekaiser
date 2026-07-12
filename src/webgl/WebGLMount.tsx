'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { gateStore } from '@/lib/gate-progress';

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
 * Decide se a camada WebGL entra. Sem WebGL2 ou com reduced-motion, o site
 * da Fase 2 fica — e o gate é avisado de que não há chunk a esperar.
 */
export function WebGLMount() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const reduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    if (reduced || !supportsWebGL2()) {
      gateStore.set('chunk', 1);
      gateStore.set('compile', 1);
      return;
    }
    // Pós first paint: dois rAF garantem um quadro do conteúdo antes do chunk.
    let second = 0;
    const first = requestAnimationFrame(() => {
      second = requestAnimationFrame(() => setReady(true));
    });
    return () => {
      cancelAnimationFrame(first);
      cancelAnimationFrame(second);
    };
  }, []);

  return ready ? <PersistentCanvas /> : null;
}
