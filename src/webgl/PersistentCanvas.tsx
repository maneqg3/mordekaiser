'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { View } from '@react-three/drei';
import { Component, Suspense, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { gateStore } from '@/lib/gate-progress';
import { HeroDepth } from '@/webgl/scenes/HeroDepth';
import { FluidFog } from '@/webgl/scenes/FluidFog';

/** Cena que quebrar (asset 404, shader inválido) vira nada — o site fica. */
class SceneErrorBoundary extends Component<
  { children?: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

/** Primeiro quadro renderizado = aquecimento; o gate conta como 'compile'. */
function CompileSignal() {
  const done = useRef(false);
  useFrame(() => {
    if (!done.current) {
      done.current = true;
      gateStore.set('compile', 1);
    }
  });
  return null;
}

export default function PersistentCanvas() {
  const heroTrack = useRef<HTMLElement>(null!);
  const fogTrack = useRef<HTMLElement>(null!);
  const [tracked, setTracked] = useState(false);

  useEffect(() => {
    gateStore.set('chunk', 1);
    const hero = document.querySelector<HTMLElement>(
      "section[aria-labelledby='hero-heading']",
    );
    const fog = document.querySelector<HTMLElement>(
      "section[aria-labelledby='grey-waste-heading']",
    );
    if (!hero || !fog) return;
    heroTrack.current = hero;
    fogTrack.current = fog;
    // Sync único com DOM externo: as seções são renderizadas pela Fase 2, então
    // é preciso medi-las no mount e então revelar as Views. Sem loop (deps []).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTracked(true);
  }, []);

  if (!tracked) return null;

  return (
    <Canvas
      aria-hidden
      // R3F espalha `aria-hidden` no div container; a spec §10 pede o atributo
      // no próprio <canvas>. Marcamos o domElement na criação do renderer.
      onCreated={({ gl }) => gl.domElement.setAttribute('aria-hidden', 'true')}
      frameloop="demand"
      dpr={[1, 2]}
      gl={{ antialias: false, alpha: true, powerPreference: 'high-performance' }}
      style={{ position: 'fixed', inset: 0, zIndex: 1, pointerEvents: 'none' }}
    >
      <CompileSignal />
      <SceneErrorBoundary>
        <Suspense fallback={null}>
          <View track={heroTrack}>
            <HeroDepth track={heroTrack} />
          </View>
          <View track={fogTrack}>
            <FluidFog track={fogTrack} />
          </View>
        </Suspense>
      </SceneErrorBoundary>
    </Canvas>
  );
}
