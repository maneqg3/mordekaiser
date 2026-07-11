'use client';

import { useFrame, useThree } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useSectionFrameloop } from '@/webgl/useSectionFrameloop';
import { heroDepthFragment, heroDepthVertex } from '@/webgl/shaders/heroDepth';

const STRENGTH = 0.035;

/** uv scale/offset equivalentes a background-size: cover. */
function coverUv(
  viewWidth: number,
  viewHeight: number,
  imageWidth: number,
  imageHeight: number,
): { scale: THREE.Vector2; offset: THREE.Vector2 } {
  const viewRatio = viewWidth / viewHeight;
  const imageRatio = imageWidth / imageHeight;
  const scale =
    viewRatio > imageRatio
      ? new THREE.Vector2(1, imageRatio / viewRatio)
      : new THREE.Vector2(viewRatio / imageRatio, 1);
  const offset = new THREE.Vector2((1 - scale.x) / 2, (1 - scale.y) / 2);
  return { scale, offset };
}

export function HeroDepth({ track }: { track: React.RefObject<HTMLElement> }) {
  const visible = useSectionFrameloop(track);
  const { viewport, size } = useThree();
  const [splash, depth] = useTexture([
    '/champion/splash-0.jpg',
    '/champion/depth-0.webp',
  ]);
  const target = useRef(new THREE.Vector2(0, 0));

  const uniforms = useMemo(
    () => ({
      uTexture: { value: splash },
      uDepth: { value: depth },
      uMouse: { value: new THREE.Vector2(0, 0) },
      uScroll: { value: 0 },
      uStrength: { value: STRENGTH },
      uUvScale: { value: new THREE.Vector2(1, 1) },
      uUvOffset: { value: new THREE.Vector2(0, 0) },
    }),
    [splash, depth],
  );

  useEffect(() => {
    const image = splash.image as HTMLImageElement;
    const { scale, offset } = coverUv(
      size.width,
      size.height,
      image.width,
      image.height,
    );
    uniforms.uUvScale.value.copy(scale);
    uniforms.uUvOffset.value.copy(offset);
  }, [size, splash, uniforms]);

  useEffect(() => {
    // Mobile: uScroll dirige o parallax; sem giroscópio (spec §4).
    if (window.matchMedia('(pointer: coarse)').matches) {
      const onScroll = () => {
        uniforms.uScroll.value = Math.min(
          1,
          window.scrollY / window.innerHeight,
        );
      };
      window.addEventListener('scroll', onScroll, { passive: true });
      return () => window.removeEventListener('scroll', onScroll);
    }
    const onMove = (event: PointerEvent) => {
      target.current.set(
        (event.clientX / window.innerWidth) * 2 - 1,
        -((event.clientY / window.innerHeight) * 2 - 1),
      );
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove);
  }, [uniforms]);

  useFrame((_, delta) => {
    // Mutação via ref/uniform dentro de useFrame — nunca estado React.
    uniforms.uMouse.value.lerp(target.current, Math.min(1, delta * 5));
  });

  if (!visible) return null;

  return (
    <mesh scale={[viewport.width, viewport.height, 1]}>
      <planeGeometry args={[1, 1]} />
      <shaderMaterial
        vertexShader={heroDepthVertex}
        fragmentShader={heroDepthFragment}
        uniforms={uniforms}
      />
    </mesh>
  );
}
