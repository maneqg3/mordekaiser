'use client';

import { useState } from 'react';
import { applyRealmTransition } from '@/lib/realm-transition';

export type SkinItem = { num: number; name: string };

/**
 * Grid interativo das Encarnações (spec Fase 6 §2). Selecionar uma skin seta
 * data-skin no <html> — o CSS de tokens repinta a página inteira; a mutação
 * passa por applyRealmTransition (View Transition no Chrome, crossfade de
 * @property no Firefox, corte seco em reduced-motion). Sem JS os botões são
 * inertes e o conteúdo (imagem + nome) permanece íntegro.
 */
export function IncarnationsGallery({ skins }: { skins: SkinItem[] }) {
  const [active, setActive] = useState<number | null>(null);

  const select = (num: number) => {
    const next = active === num ? null : num;
    const reduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    applyRealmTransition(document, reduced, () => {
      const html = document.documentElement;
      if (next === null) html.removeAttribute('data-skin');
      else html.setAttribute('data-skin', String(next));
    });
    setActive(next);
  };

  return (
    <ul className="grid list-none gap-6 p-0 sm:grid-cols-2 lg:grid-cols-3">
      {skins.map((skin) => (
        <li key={skin.num}>
          <button
            type="button"
            aria-pressed={active === skin.num}
            className="skin-card flex w-full flex-col gap-2 p-0 text-left"
            onClick={() => select(skin.num)}
          >
            {/* next/image estourou o teto de bundle (spec §9) — img nativa, lazy. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/champion/splash-${skin.num}.jpg`}
              alt=""
              width={1215}
              height={717}
              loading="lazy"
              decoding="async"
              className="h-auto w-full"
            />
            <span className="type-mono text-sm opacity-80">{skin.name}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}
