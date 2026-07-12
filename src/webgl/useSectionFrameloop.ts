'use client';

import { useEffect, useState } from 'react';

// Store externo minimalista: quantas cenas estão visíveis agora. O
// PersistentCanvas lê isso (useSyncExternalStore) e dirige a prop `frameloop`
// do Canvas — 'always' com alguma cena visível, 'demand' quando ociosa.
// A prop do Canvas é a única forma confiável de trocar o frameloop em runtime;
// `set({frameloop})` do store do R3F não religa o rAF ocioso.
let activeCount = 0;
const listeners = new Set<() => void>();
function emit(): void {
  for (const listener of listeners) listener();
}

export const sceneVisibility = {
  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  getSnapshot: (): number => activeCount,
};

/**
 * true enquanto a seção rastreada está no viewport. As cenas usam isso para
 * montar/desmontar a mesh e liberar (early-return no useFrame) o trabalho
 * pesado quando fora do viewport. Também alimenta o contador que decide o
 * frameloop do canvas.
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

  useEffect(() => {
    if (!visible) return;
    activeCount += 1;
    emit();
    return () => {
      activeCount -= 1;
      emit();
    };
  }, [visible]);

  return visible;
}
