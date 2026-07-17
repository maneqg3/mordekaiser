'use client';

/* eslint-disable react-hooks/immutability -- Cena R3F: uniforms mutados via
   ref dentro de useFrame por design (spec mãe §6). */

import { useFrame, useThree } from '@react-three/fiber';
import type { ShaderMaterial } from 'three';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useSceneActive } from '@/webgl/useSectionFrameloop';
import {
  ambianceFragment,
  ambianceVertex,
} from '@/webgl/shaders/realm-ambiance';

// Lerp da cúpula: ~600ms para 0→1 (fase 'reveal' da coreografia).
const REVEAL_SPEED = 2.5;
// Após sair do reino, mantém frames por este tempo para a cúpula subir.
const COOLDOWN_MS = 900;

export function RealmAmbiance() {
  const { viewport } = useThree();
  const [active, setActive] = useState(false);
  const revealTarget = useRef(0);
  // O R3F v9 clona uniforms da prop — mutação por frame mira o clone via ref.
  const materialRef = useRef<ShaderMaterial>(null);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uReveal: { value: 0 },
      uAspect: { value: 1 },
    }),
    [],
  );

  useEffect(() => {
    uniforms.uAspect.value = viewport.width / viewport.height;
  }, [viewport, uniforms]);

  // Observa o <html>: data-realm monta a cena; data-realm-reveal dirige a
  // cúpula. Cooldown na saída deixa o wipe reverso terminar antes de dormir.
  useEffect(() => {
    const html = document.documentElement;
    let cooldown: ReturnType<typeof setTimeout> | undefined;
    const sync = () => {
      const inRealm = html.hasAttribute('data-realm');
      revealTarget.current = html.hasAttribute('data-realm-reveal') ? 1 : 0;
      if (inRealm) {
        clearTimeout(cooldown);
        setActive(true);
      } else {
        clearTimeout(cooldown);
        cooldown = setTimeout(() => setActive(false), COOLDOWN_MS);
      }
    };
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(html, {
      attributes: true,
      attributeFilter: ['data-realm', 'data-realm-reveal'],
    });
    return () => {
      observer.disconnect();
      clearTimeout(cooldown);
    };
  }, []);

  useSceneActive(active);

  useFrame((state, delta) => {
    uniforms.uTime.value = state.clock.elapsedTime;
    const ease = Math.min(1, delta * REVEAL_SPEED);
    uniforms.uReveal.value +=
      (revealTarget.current - uniforms.uReveal.value) * ease;
    // Replica a fonte no clone vivo (material montado).
    const material = materialRef.current;
    if (material) {
      for (const key of Object.keys(uniforms) as (keyof typeof uniforms)[]) {
        material.uniforms[key].value = uniforms[key].value;
      }
    }
  });

  if (!active) return null;

  return (
    <mesh scale={[viewport.width, viewport.height, 1]}>
      <planeGeometry args={[1, 1]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={ambianceVertex}
        fragmentShader={ambianceFragment}
        uniforms={uniforms}
        transparent
        depthTest={false}
        depthWrite={false}
      />
    </mesh>
  );
}
