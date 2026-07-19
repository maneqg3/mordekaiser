'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import { getAudio } from '@/lib/audio';

const STORAGE_KEY = 'mordekaiser:sound';

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
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    setArmed(localStorage.getItem(STORAGE_KEY) === 'on');
  }, []);

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
      localStorage.setItem(STORAGE_KEY, 'off');
      setArmed(false);
    } else {
      audio.enable();
      localStorage.setItem(STORAGE_KEY, 'on');
      setArmed(true);
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
