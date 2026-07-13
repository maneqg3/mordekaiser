'use client';

import { Canvas, useThree } from '@react-three/fiber';
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
import { Portal } from '@/webgl/scenes/Portal';
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

/**
 * Dirige frames com invalidate() num rAF próprio enquanto houver cena visível.
 * Trocar a prop `frameloop` em runtime ('demand'→'always') não religa o rAF de
 * forma confiável (bug da Fase 5: anel do portal congelado em um quadro) — com
 * o driver, o frameloop fica fixo em 'demand' e quem pede quadro somos nós.
 */
function FrameDriver({ active }: { active: boolean }) {
  const invalidate = useThree((state) => state.invalidate);
  useEffect(() => {
    if (!active) return;
    let raf = 0;
    const loop = () => {
      invalidate();
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [active, invalidate]);
  return null;
}

export default function PersistentCanvas() {
  const heroTrack = useRef<HTMLElement>(null!);
  const fogTrack = useRef<HTMLElement>(null!);
  const forgeTrack = useRef<HTMLElement>(null!);
  const realmTrack = useRef<HTMLElement>(null!);
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
    const realm = document.querySelector<HTMLElement>(
      "section[aria-labelledby='realm-heading']",
    );
    if (!hero || !fog || !forge || !realm) return;
    heroTrack.current = hero;
    fogTrack.current = fog;
    forgeTrack.current = forge;
    realmTrack.current = realm;
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
      frameloop="demand"
      dpr={[1, 2]}
      gl={{ antialias: false, alpha: true, powerPreference: 'high-performance' }}
      style={{ position: 'fixed', inset: 0, zIndex: 1, pointerEvents: 'none' }}
    >
      <FrameDriver active={activeScenes > 0} />
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
          <View track={realmTrack}>
            <Portal track={realmTrack} />
          </View>
        </Suspense>
      </SceneErrorBoundary>
    </Canvas>
  );
}
