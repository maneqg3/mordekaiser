'use client';

import { useEffect, useRef, useState } from 'react';
import { gateStore, type GateStage } from '@/lib/gate-progress';
import { PlateProgress } from '@/components/gate/PlateProgress';

export type GateLabels = {
  label: string;
  loading: string;
  enter: string;
  /** contém o placeholder literal {percent} */
  progress: string;
};

const SEEN_KEY = 'mordekaiser-gate-seen';
const TIMEOUT_MS = 8000;

function closeGate(): void {
  try {
    sessionStorage.setItem(SEEN_KEY, '1');
  } catch {
    // Safari em navegação privada: sem sessionStorage, o gate só volta a
    // aparecer na próxima navegação — aceitável.
  }
  document.documentElement.removeAttribute('data-gate');
}

/**
 * Overlay narrativo com progresso REAL (spec §6). O markup vai inline no HTML
 * servido, escondido por padrão; o boot script no body o revela antes do
 * first paint quando JS está ativo e as saídas de emergência não se aplicam.
 */
export function EntryGate({ labels }: { labels: GateLabels }) {
  const [fraction, setFraction] = useState(0);
  const [ready, setReady] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Todas as saídas e o progresso só existem se o boot script ligou o gate.
  useEffect(() => {
    if (!document.documentElement.hasAttribute('data-gate')) return;

    dialogRef.current?.focus();

    // Progresso real: fontes + decode dos assets do hero. chunk/compile vêm
    // do WebGLMount/PersistentCanvas pelo mesmo gateStore.
    document.fonts.ready.then(() => gateStore.set('fonts', 1));
    const decode = (src: string, stage: GateStage) => {
      const image = new Image();
      image.src = src;
      image
        .decode()
        .then(() => gateStore.set(stage, 1))
        .catch(() => {
          // Asset falhou: NÃO completa — o timeout de 8s é a saída (spec §6).
        });
    };
    decode('/champion/splash-0.jpg', 'splash');
    decode('/champion/depth-0.webp', 'depth');

    const unsubscribe = gateStore.subscribe(() => {
      const value = gateStore.value();
      setFraction(value);
      if (value >= 1) setReady(true);
    });

    // Saída de emergência: timeout de 8s entra assim mesmo.
    const timeout = setTimeout(() => setReady(true), TIMEOUT_MS);

    // Esc entra imediatamente.
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeGate();
    };
    window.addEventListener('keydown', onKeyDown);

    return () => {
      unsubscribe();
      clearTimeout(timeout);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  useEffect(() => {
    if (ready) buttonRef.current?.focus();
  }, [ready]);

  // Foco preso: o botão é o único focável; Tab não sai do overlay.
  const trapFocus = (event: React.KeyboardEvent) => {
    if (event.key !== 'Tab') return;
    event.preventDefault();
    (buttonRef.current ?? dialogRef.current)?.focus();
  };

  const percent = Math.round(fraction * 4) * 25; // anuncia em passos de 25%

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label={labels.label}
      tabIndex={-1}
      className="entry-gate"
      onKeyDown={trapFocus}
    >
      <p className="gate-name type-display" data-lit={ready || undefined}>
        <span className="block">MORDE</span>
        <span className="block">KAISER</span>
      </p>
      <PlateProgress fraction={ready ? 1 : fraction} />
      <p className="type-mono gate-status">{labels.loading}</p>
      <p aria-live="polite" className="sr-only">
        {labels.progress.replace('{percent}', String(percent))}
      </p>
      {ready && (
        <button
          ref={buttonRef}
          type="button"
          className="gate-enter type-mono"
          onClick={closeGate}
        >
          {labels.enter}
        </button>
      )}
    </div>
  );
}
