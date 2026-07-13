'use client';

import { useEffect, useRef, useState } from 'react';
import { applyRealmTransition } from '@/lib/realm-transition';

export type RealmGatewayLabels = { cross: string; return: string };

/**
 * Botão da travessia (spec Fase 5 §4). O estado do reino é um atributo no
 * <html>; o CSS faz o repaint e o esconder/revelar do card. Na hidratação
 * marca [data-portal-ready] — sem JS o atributo nunca entra, o botão fica
 * escondido e o card do R permanece visível (Fase 2 intacta).
 */
export function RealmGateway({ labels }: { labels: RealmGatewayLabels }) {
  const [isInRealm, setIsInRealm] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    document.documentElement.setAttribute('data-portal-ready', '');
  }, []);

  const toggleRealm = () => {
    const html = document.documentElement;
    // Origem do reveal circular: o centro do portal na viewport (spec §4).
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
    applyRealmTransition(document, reduced, () => {
      if (next) html.setAttribute('data-realm', 'death');
      else html.removeAttribute('data-realm');
    });
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
