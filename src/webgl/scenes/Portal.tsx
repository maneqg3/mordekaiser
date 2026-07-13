'use client';

/* eslint-disable react-hooks/immutability -- Esta cena R3F muta uniforms
   retidos (refs) dentro de useFrame/listeners por design (spec mãe §6:
   mutação via ref, nunca estado React). */

import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import { useSectionFrameloop } from '@/webgl/useSectionFrameloop';
import { portalProximity } from '@/webgl/portal-proximity';
import { portalFragment, portalVertex } from '@/webgl/shaders/portal';

// Velocidade do lerp de uHover/uCrossed (mesma ordem do HeroDepth).
const EASE_SPEED = 5;

export function Portal({ track }: { track: React.RefObject<HTMLElement> }) {
  const visible = useSectionFrameloop(track);
  const { viewport } = useThree();
  const hoverTarget = useRef(0);
  const crossedTarget = useRef(0);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uProximity: { value: 0 },
      uHover: { value: 0 },
      uCrossed: { value: 0 },
      uAspect: { value: 1 },
    }),
    [],
  );

  useEffect(() => {
    uniforms.uAspect.value = viewport.width / viewport.height;
  }, [viewport, uniforms]);

  // Hover/focus do botão da travessia dirigem uHover (spec §3). A ponte com o
  // DOM é o atributo [data-realm-cta] — zero estado React global.
  useEffect(() => {
    const button =
      document.querySelector<HTMLButtonElement>('[data-realm-cta]');
    if (!button) return;
    const on = () => {
      hoverTarget.current = 1;
    };
    const off = () => {
      hoverTarget.current = 0;
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
    uniforms.uHover.value +=
      (hoverTarget.current - uniforms.uHover.value) * ease;
    uniforms.uCrossed.value +=
      (crossedTarget.current - uniforms.uCrossed.value) * ease;
  });

  if (!visible) return null;

  return (
    <mesh scale={[viewport.width, viewport.height, 1]}>
      <planeGeometry args={[1, 1]} />
      <shaderMaterial
        vertexShader={portalVertex}
        fragmentShader={portalFragment}
        uniforms={uniforms}
        transparent
        depthTest={false}
      />
    </mesh>
  );
}
