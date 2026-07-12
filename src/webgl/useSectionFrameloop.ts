'use client';

import { useEffect, useState } from 'react';

/**
 * true enquanto a seção rastreada está no viewport. As cenas usam isso para
 * montar/desmontar a mesh e liberar (early-return no useFrame) o trabalho
 * pesado quando a seção não está visível.
 *
 * O canvas roda em `frameloop="always"` (a troca em runtime via `set('always')`
 * não religa o rAF ocioso do R3F — só a prop do Canvas funciona de forma
 * confiável), então este hook só reporta visibilidade; não mexe no frameloop.
 */
export function useSectionFrameloop(
  track: React.RefObject<HTMLElement>,
): boolean {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const element = track.current;
    if (!element) return;
    const observer = new IntersectionObserver(([entry]) => {
      setVisible(entry.isIntersecting);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [track]);

  return visible;
}
