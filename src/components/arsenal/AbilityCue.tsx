'use client';

import type { CueName } from '@/data/audio-manifest';
import { getAudio } from '@/lib/audio';

/**
 * Header interativo do card de habilidade (spec Fase 6 §1.4). Ativação
 * (click/Enter) toca a fala da habilidade; com som desligado é no-op por
 * design — som é decoração, nunca erro. Sem JS o botão é inerte e o
 * conteúdo permanece.
 */
export function AbilityCue({
  cue,
  label,
  children,
}: {
  cue: CueName;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      className="ability-cue flex items-center gap-4 p-0 text-left"
      aria-label={label}
      onClick={() => getAudio().playCue(cue)}
    >
      {children}
    </button>
  );
}
