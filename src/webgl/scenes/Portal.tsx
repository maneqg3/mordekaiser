'use client';

/* eslint-disable react-hooks/immutability -- Esta cena R3F muta uniforms
   retidos (refs) dentro de useFrame/listeners por design (spec mãe §6:
   mutação via ref, nunca estado React). */

import { useFrame, useThree } from '@react-three/fiber';
import { AdditiveBlending } from 'three';
import type { ShaderMaterial } from 'three';
import { useEffect, useMemo, useRef } from 'react';
import { useSectionFrameloop } from '@/webgl/useSectionFrameloop';
import { portalProximity } from '@/webgl/portal-proximity';
import {
  portalFragment,
  portalVertex,
  soulsFragment,
  soulsVertex,
} from '@/webgl/shaders/portal';

// Velocidade do lerp de uFrenzy/uCrossed (mesma ordem do HeroDepth).
const EASE_SPEED = 5;
const SOUL_COUNT = 360;

export function Portal({ track }: { track: React.RefObject<HTMLElement> }) {
  const visible = useSectionFrameloop(track);
  const { viewport } = useThree();
  const frenzyTarget = useRef(0);
  const crossedTarget = useRef(0);
  // O R3F v9 CLONA cada uniform ao aplicar a prop `uniforms` — mutar só o
  // objeto do useMemo congela o shader (bug da Fase 5). A fonte é a verdade;
  // o useFrame replica os valores nos clones dos dois materiais via ref.
  const ringMaterial = useRef<ShaderMaterial>(null);
  const soulsMaterial = useRef<ShaderMaterial>(null);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uProximity: { value: 0 },
      uFrenzy: { value: 0 },
      uCrossed: { value: 0 },
      uAspect: { value: 1 },
    }),
    [],
  );

  // Sementes determinísticas das almas (hash de Knuth por índice) + posições
  // zeradas exigidas pelo three (a posição real nasce no vertex shader).
  const soulSeeds = useMemo(() => {
    const seeds = new Float32Array(SOUL_COUNT);
    for (let i = 0; i < SOUL_COUNT; i += 1) {
      seeds[i] = (((i + 1) * 2654435761) % 4294967296) / 4294967296;
    }
    return seeds;
  }, []);
  const soulPositions = useMemo(() => new Float32Array(SOUL_COUNT * 3), []);

  useEffect(() => {
    uniforms.uAspect.value = viewport.width / viewport.height;
  }, [viewport, uniforms]);

  // Hover/focus do botão dirigem uFrenzy. Ponte com o DOM: [data-realm-cta].
  useEffect(() => {
    const button =
      document.querySelector<HTMLButtonElement>('[data-realm-cta]');
    if (!button) return;
    const on = () => {
      frenzyTarget.current = 1;
    };
    const off = () => {
      frenzyTarget.current = 0;
    };
    button.addEventListener('pointerenter', on);
    button.addEventListener('pointerleave', off);
    button.addEventListener('focus', on);
    button.addEventListener('blur', off);
    return () => {
      button.removeEventListener('pointerenter', on);
      button.removeEventListener('pointerleave', off);
      button.removeEventListener('focus', on);
      button.removeEventListener('blur', off);
    };
  }, []);

  // uCrossed segue [data-realm] no <html>: flash de expansão na travessia.
  useEffect(() => {
    const html = document.documentElement;
    const sync = () => {
      crossedTarget.current =
        html.getAttribute('data-realm') === 'death' ? 1 : 0;
    };
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(html, {
      attributes: true,
      attributeFilter: ['data-realm'],
    });
    return () => observer.disconnect();
  }, []);

  useFrame((state, delta) => {
    // Mutação via ref/uniform dentro de useFrame — nunca estado React.
    uniforms.uTime.value = state.clock.elapsedTime;
    const rect = track.current.getBoundingClientRect();
    uniforms.uProximity.value = portalProximity(
      rect.top,
      rect.height,
      window.innerHeight,
    );
    const ease = Math.min(1, delta * EASE_SPEED);
    uniforms.uFrenzy.value +=
      (frenzyTarget.current - uniforms.uFrenzy.value) * ease;
    uniforms.uCrossed.value +=
      (crossedTarget.current - uniforms.uCrossed.value) * ease;
    // Replica a fonte nos clones vivos (materiais montados).
    for (const material of [ringMaterial.current, soulsMaterial.current]) {
      if (!material) continue;
      for (const key of Object.keys(uniforms) as (keyof typeof uniforms)[]) {
        material.uniforms[key].value = uniforms[key].value;
      }
    }
  });

  if (!visible) return null;

  return (
    <group scale={[viewport.width, viewport.height, 1]}>
      <mesh>
        <planeGeometry args={[1, 1]} />
        <shaderMaterial
          ref={ringMaterial}
          vertexShader={portalVertex}
          fragmentShader={portalFragment}
          uniforms={uniforms}
          transparent
          depthTest={false}
        />
      </mesh>
      <points>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[soulPositions, 3]}
          />
          <bufferAttribute attach="attributes-aSeed" args={[soulSeeds, 1]} />
        </bufferGeometry>
        <shaderMaterial
          ref={soulsMaterial}
          vertexShader={soulsVertex}
          fragmentShader={soulsFragment}
          uniforms={uniforms}
          transparent
          depthTest={false}
          depthWrite={false}
          blending={AdditiveBlending}
        />
      </points>
    </group>
  );
}
