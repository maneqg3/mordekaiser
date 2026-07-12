'use client';

import { useThree } from '@react-three/fiber';
import { useEffect, useState } from 'react';

// Refcount entre cenas: o canvas é um só — volta a 'demand' apenas quando
// NENHUMA cena está visível.
let activeScenes = 0;

/** true enquanto a seção rastreada está no viewport; liga frameloop 'always'. */
export function useSectionFrameloop(
  track: React.RefObject<HTMLElement>,
): boolean {
  const set = useThree((state) => state.set);
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
    activeScenes += 1;
    set({ frameloop: 'always' });
    return () => {
      activeScenes -= 1;
      if (activeScenes === 0) set({ frameloop: 'demand' });
    };
  }, [visible, set]);

  return visible;
}
