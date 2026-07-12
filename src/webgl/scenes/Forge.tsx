'use client';

/* eslint-disable react-hooks/immutability -- Esta cena R3F muta objetos Three
   retidos (meshes, câmera, scene.environment) dentro de useFrame/useEffect por
   design (spec mãe §6: mutação via ref, nunca estado React). O modelo de
   imutabilidade do React Compiler não cobre esse escape imperativo. */

import { useFrame, useThree } from '@react-three/fiber';
import { PerspectiveCamera } from '@react-three/drei';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { useSectionFrameloop } from '@/webgl/useSectionFrameloop';
import { forgeProgress } from '@/webgl/forge-progress';
import {
  cameraPose,
  glowIntensity,
  plateShapes,
  plateTransforms,
} from '@/webgl/forge-layout';

const PLATE_DEPTH = 0.12;
const GLOW_COLOR = '#7effb6';

/** Textura radial procedural para o glow — nenhum asset baixado. */
function makeGlowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const context = canvas.getContext('2d')!;
  const gradient = context.createRadialGradient(128, 128, 0, 128, 128, 128);
  gradient.addColorStop(0, 'rgba(126, 255, 182, 0.85)');
  gradient.addColorStop(1, 'rgba(126, 255, 182, 0)');
  context.fillStyle = gradient;
  context.fillRect(0, 0, 256, 256);
  return new THREE.CanvasTexture(canvas);
}

export function Forge({ track }: { track: React.RefObject<HTMLElement> }) {
  const visible = useSectionFrameloop(track);
  const { gl, scene } = useThree();
  const cameraRef = useRef<THREE.PerspectiveCamera>(null);
  const plateRefs = useRef<(THREE.Mesh | null)[]>([]);
  const glowRef = useRef<THREE.Mesh>(null);
  const lightRef = useRef<THREE.PointLight>(null);

  const geometries = useMemo(
    () =>
      plateShapes().map((plate) => {
        const shape = new THREE.Shape();
        shape.moveTo(-plate.halfWidthBottom, plate.yBottom);
        shape.lineTo(plate.halfWidthBottom, plate.yBottom);
        shape.lineTo(plate.halfWidthTop, plate.yTop);
        shape.lineTo(-plate.halfWidthTop, plate.yTop);
        shape.closePath();
        return new THREE.ExtrudeGeometry(shape, {
          depth: PLATE_DEPTH,
          bevelEnabled: true,
          bevelThickness: 0.015,
          bevelSize: 0.015,
          bevelSegments: 2,
        });
      }),
    [],
  );

  const material = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#111314',
        metalness: 0.9,
        roughness: 0.35,
      }),
    [],
  );

  const glowMap = useMemo(() => makeGlowTexture(), []);

  // Ambiente PBR local: RoomEnvironment procedural via PMREM — sem HDR
  // baixado, sem preset do drei (que busca de CDN; proibido).
  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const environment = pmrem.fromScene(new RoomEnvironment(), 0.04);
    scene.environment = environment.texture;
    return () => {
      scene.environment = null;
      environment.texture.dispose();
      pmrem.dispose();
    };
  }, [gl, scene]);

  useEffect(() => {
    return () => {
      for (const geometry of geometries) geometry.dispose();
      material.dispose();
      glowMap.dispose();
    };
  }, [geometries, material, glowMap]);

  useFrame(() => {
    // Mutação via ref dentro de useFrame — nunca estado React (spec mãe §6).
    const progress = forgeProgress.value;
    const transforms = plateTransforms(progress);
    for (let index = 0; index < transforms.length; index += 1) {
      const mesh = plateRefs.current[index];
      if (!mesh) continue;
      mesh.position.set(...transforms[index].position);
      mesh.rotation.set(...transforms[index].rotation);
    }
    const pose = cameraPose(progress);
    const camera = cameraRef.current;
    if (camera) {
      camera.position.set(...pose.position);
      camera.lookAt(...pose.target);
    }
    const glow = glowIntensity(progress);
    if (lightRef.current) lightRef.current.intensity = glow * 6;
    if (glowRef.current) {
      (glowRef.current.material as THREE.MeshBasicMaterial).opacity = glow;
    }
  });

  if (!visible) return null;

  return (
    <group>
      <PerspectiveCamera ref={cameraRef} makeDefault fov={38} near={0.1} far={20} />
      {geometries.map((geometry, index) => (
        <mesh
          key={geometry.uuid}
          ref={(mesh) => {
            plateRefs.current[index] = mesh;
          }}
          geometry={geometry}
          material={material}
        />
      ))}
      <mesh ref={glowRef} position={[0, 1.3, -0.6]}>
        <planeGeometry args={[3.4, 3.4]} />
        <meshBasicMaterial
          map={glowMap}
          transparent
          opacity={0.2}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      <pointLight
        ref={lightRef}
        color={GLOW_COLOR}
        position={[0, 1.3, -0.4]}
        intensity={1.2}
        distance={6}
      />
      <ambientLight intensity={0.25} />
    </group>
  );
}
