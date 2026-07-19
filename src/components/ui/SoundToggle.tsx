'use client';

import { useEffect, useSyncExternalStore } from 'react';
import { getAudio } from '@/lib/audio';

const STORAGE_KEY = 'mordekaiser:sound';

/* localStorage é sistema externo: lido via useSyncExternalStore (SSR-safe,
   sem setState em effect). O próprio toggle é o único escritor. */
const armedListeners = new Set<() => void>();
const readArmed = () => localStorage.getItem(STORAGE_KEY) === 'on';
const subscribeArmed = (cb: () => void) => {
  armedListeners.add(cb);
  return () => armedListeners.delete(cb);
};
const writeArmed = (on: boolean) => {
  localStorage.setItem(STORAGE_KEY, on ? 'on' : 'off');
  for (const cb of armedListeners) cb();
};

export type SoundToggleLabels = { enable: string; disable: string };

/**
 * Botão de som persistente (spec Fase 6 §1). Nunca toca sem clique: a
 * preferência 'on' salva só deixa o botão "armado" no load seguinte —
 * aria-pressed reflete som de fato tocando, data-armed reflete a
 * preferência lembrada.
 */
export function SoundToggle({ labels }: { labels: SoundToggleLabels }) {
  const audio = getAudio();
  const state = useSyncExternalStore(
    audio.subscribe,
    audio.getState,
    () => 'idle' as const,
  );
  const isOn = state === 'playing' || state === 'armed';
  const armed = useSyncExternalStore(subscribeArmed, readArmed, () => false);

  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) audio.suspend();
      else audio.resume();
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [audio]);

  const toggle = () => {
    if (isOn) {
      audio.disable();
      writeArmed(false);
    } else {
      audio.enable();
      writeArmed(true);
    }
  };

  return (
    <button
      type="button"
      data-sound-toggle
      data-armed={armed && !isOn ? '' : undefined}
      aria-pressed={isOn}
      className="sound-toggle type-mono"
      onClick={toggle}
    >
      {isOn ? labels.disable : labels.enable}
    </button>
  );
}
