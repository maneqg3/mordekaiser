'use client';

import { Canvas } from '@react-three/fiber';
import { View } from '@react-three/drei';
import {
  Component,
  Suspense,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import type { ReactNode } from 'react';
import { sceneVisibility } from '@/webgl/useSectionFrameloop';
import { HeroDepth } from '@/webgl/scenes/HeroDepth';
import { FluidFog } from '@/webgl/scenes/FluidFog';
import { Forge } from '@/webgl/scenes/Forge';
import { setupForgeScrub } from '@/webgl/forge-scrub';

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

export default function PersistentCanvas() {
  const heroTrack = useRef<HTMLElement>(null!);
  const fogTrack = useRef<HTMLElement>(null!);
  const forgeTrack = useRef<HTMLElement>(null!);
  const [tracked, setTracked] = useState(false);
  // 'always' só enquanto alguma cena está no viewport; 'demand' (canvas ocioso)
  // caso contrário — preserva o orçamento de perf fora das seções WebGL.
  const activeScenes = useSyncExternalStore(
    sceneVisibility.subscribe,
    sceneVisibility.getSnapshot,
    () => 0,
  );

  useEffect(() => {
    const hero = document.querySelector<HTMLElement>(
      "section[aria-labelledby='hero-heading']",
    );
    const fog = document.querySelector<HTMLElement>(
      "section[aria-labelledby='grey-waste-heading']",
    );
    const forge = document.querySelector<HTMLElement>(
      "section[aria-labelledby='forge-heading']",
    );
    if (!hero || !fog || !forge) return;
    heroTrack.current = hero;
    fogTrack.current = fog;
    forgeTrack.current = forge;
    // Sync único com DOM externo: as seções são renderizadas pela Fase 2, então
    // é preciso medi-las no mount e então revelar as Views. Sem loop (deps []).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTracked(true);
  }, []);

  // O pin nasce e morre com o canvas: setupForgeScrub retorna o cleanup — o
  // React o executa no unmount.
  useEffect(() => {
    if (!tracked) return;
    return setupForgeScrub(forgeTrack.current);
  }, [tracked]);

  if (!tracked) return null;

  return (
    <Canvas
      aria-hidden
      // R3F espalha `aria-hidden` no div container; a spec §10 pede o atributo
      // no próprio <canvas>. Marcamos o domElement na criação do renderer.
      onCreated={({ gl }) => gl.domElement.setAttribute('aria-hidden', 'true')}
      frameloop={activeScenes > 0 ? 'always' : 'demand'}
      dpr={[1, 2]}
      gl={{ antialias: false, alpha: true, powerPreference: 'high-performance' }}
      style={{ position: 'fixed', inset: 0, zIndex: 1, pointerEvents: 'none' }}
    >
      <SceneErrorBoundary>
        <Suspense fallback={null}>
          <View track={heroTrack}>
            <HeroDepth track={heroTrack} />
          </View>
          <View track={fogTrack}>
            <FluidFog track={fogTrack} />
          </View>
          <View track={forgeTrack}>
            <Forge track={forgeTrack} />
          </View>
        </Suspense>
      </SceneErrorBoundary>
    </Canvas>
  );
}
