'use client';

import { useEffect, useRef, useState } from 'react';
import {
  cancelRealmChoreography,
  realmChoreography,
  type RealmPhase,
} from '@/lib/realm-choreography';
import { applyRealmTransition } from '@/lib/realm-transition';

export type RealmGatewayLabels = { cross: string; return: string };

/**
 * Botão da travessia (spec Fase 5.1 §3). Orquestra a coreografia em 3 tempos
 * via realmChoreography; o estado do reino segue sendo atributos no <html> —
 * CSS e cenas WebGL reagem a eles. Sem JS o botão não existe (Fase 2 intacta).
 */
export function RealmGateway({ labels }: { labels: RealmGatewayLabels }) {
  const [isInRealm, setIsInRealm] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    document.documentElement.setAttribute('data-portal-ready', '');
    const timers = timersRef.current;
    return () => cancelRealmChoreography(timers);
  }, []);

  const toggleRealm = () => {
    const html = document.documentElement;
    // Origem da sucção: o centro do portal na viewport.
    const origin = document.querySelector('.portal-ring') ?? buttonRef.current;
    if (origin) {
      const rect = origin.getBoundingClientRect();
      html.style.setProperty('--portal-x', `${rect.left + rect.width / 2}px`);
      html.style.setProperty('--portal-y', `${rect.top + rect.height / 2}px`);
    }
    const next = !isInRealm;
    const reduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;

    const run = (phase: RealmPhase) => {
      if (phase === 'impact') {
        // remove+reflow reinicia o keyframe em cliques consecutivos.
        html.classList.remove('realm-impact');
        void html.offsetWidth;
        html.classList.add('realm-impact');
      } else if (phase === 'cross') {
        applyRealmTransition(document, reduced, () => {
          if (next) html.setAttribute('data-realm', 'death');
          else html.removeAttribute('data-realm');
        });
      } else if (phase === 'reveal') {
        html.setAttribute('data-realm-reveal', '');
      } else {
        html.removeAttribute('data-realm-reveal');
      }
    };

    cancelRealmChoreography(timersRef.current);
    timersRef.current = realmChoreography(
      next ? 'enter' : 'exit',
      run,
      reduced,
    );
    setIsInRealm(next);
  };

  return (
    <button
      ref={buttonRef}
      type="button"
      data-realm-cta
      className="realm-cta type-mono"
      onClick={toggleRealm}
    >
      {isInRealm ? labels.return : labels.cross}
    </button>
  );
}
