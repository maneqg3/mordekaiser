'use client';

/* eslint-disable react-hooks/immutability -- Esta cena R3F muta objetos Three
   retidos (uniforms, render targets, material do quad) dentro de useFrame por
   design (spec mãe §6: mutação via ref, nunca estado React). O modelo de
   imutabilidade do React Compiler não cobre esse escape imperativo. */

import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useSectionFrameloop } from '@/webgl/useSectionFrameloop';
import {
  advectionFragment,
  clearFragment,
  displayFragment,
  divergenceFragment,
  fluidVertex,
  gradientSubtractFragment,
  pressureFragment,
  splatFragment,
} from '@/webgl/shaders/fluid';

// Parâmetros do spike (Risco 2: VIÁVEL EM MOBILE — 60fps em iPhone real).
const IS_COARSE = () => window.matchMedia('(pointer: coarse)').matches;
const SIM_RES_DESKTOP = 128;
const SIM_RES_MOBILE = 64;
const JACOBI_DESKTOP = 20;
const JACOBI_MOBILE = 10;
const DYE_MULTIPLIER = 4; // dyeResolution = sim * 4, como no spike
const DENSITY_DISSIPATION = 2.0;
const VELOCITY_DISSIPATION = 0.4;
const PRESSURE_DAMPING = 0.8;
const SPLAT_RADIUS = 0.0022; // 0.22 / 100, correção do PavelDoGreat
// ponytail: constantes de feel (força e cor) — calibrar olhando a névoa.
const SPLAT_FORCE = 600;
// Paleta do Ato II (tokens.css): névoa #a8b4af fraca; o accent fica no CSS.
const DYE_COLOR = new THREE.Color('#a8b4af').multiplyScalar(0.25);

type DoubleFbo = {
  read: THREE.WebGLRenderTarget;
  write: THREE.WebGLRenderTarget;
  swap: () => void;
  dispose: () => void;
};

function createDoubleFbo(
  width: number,
  height: number,
  type: THREE.TextureDataType,
): DoubleFbo {
  const options: THREE.RenderTargetOptions = {
    type,
    format: THREE.RGBAFormat,
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    wrapS: THREE.ClampToEdgeWrapping,
    wrapT: THREE.ClampToEdgeWrapping,
    depthBuffer: false,
  };
  const fbo = {
    read: new THREE.WebGLRenderTarget(width, height, options),
    write: new THREE.WebGLRenderTarget(width, height, options),
    swap() {
      const previous = fbo.read;
      fbo.read = fbo.write;
      fbo.write = previous;
    },
    dispose() {
      fbo.read.dispose();
      fbo.write.dispose();
    },
  };
  return fbo;
}

function makeMaterial(
  fragment: string,
  uniforms: Record<string, THREE.IUniform>,
) {
  return new THREE.ShaderMaterial({
    vertexShader: fluidVertex,
    fragmentShader: fragment,
    uniforms,
    depthTest: false,
    depthWrite: false,
  });
}

type Splat = { x: number; y: number; dx: number; dy: number };

export function FluidFog({ track }: { track: React.RefObject<HTMLElement> }) {
  const visible = useSectionFrameloop(track);
  const { gl, viewport } = useThree();
  const splats = useRef<Splat[]>([]);
  const displayMaterial = useRef<THREE.ShaderMaterial>(null!);

  // saveData desliga a sim — a névoa CSS .fog-veil da Fase 2 fica (spec §5).
  const saveData = useMemo(() => {
    const connection = (
      navigator as Navigator & { connection?: { saveData?: boolean } }
    ).connection;
    return connection?.saveData === true;
  }, []);

  const sim = useMemo(() => {
    const coarse = IS_COARSE();
    const simRes = coarse ? SIM_RES_MOBILE : SIM_RES_DESKTOP;
    const dyeRes = simRes * DYE_MULTIPLIER;
    const iterations = coarse ? JACOBI_MOBILE : JACOBI_DESKTOP;
    // RGBA16F quando EXT_color_buffer_float existir; RGBA8 como fallback.
    const context = gl.getContext() as WebGL2RenderingContext;
    const halfFloat = context.getExtension('EXT_color_buffer_float') !== null;
    const type = halfFloat ? THREE.HalfFloatType : THREE.UnsignedByteType;

    const velocity = createDoubleFbo(simRes, simRes, type);
    const pressure = createDoubleFbo(simRes, simRes, type);
    const divergence = new THREE.WebGLRenderTarget(simRes, simRes, {
      type,
      format: THREE.RGBAFormat,
      minFilter: THREE.NearestFilter,
      magFilter: THREE.NearestFilter,
      depthBuffer: false,
    });
    const dye = createDoubleFbo(dyeRes, dyeRes, type);

    const texel = new THREE.Vector2(1 / simRes, 1 / simRes);
    const materials = {
      splat: makeMaterial(splatFragment, {
        uTarget: { value: null },
        uAspect: { value: 1 },
        uPoint: { value: new THREE.Vector2() },
        uColor: { value: new THREE.Vector3() },
        uRadius: { value: SPLAT_RADIUS },
      }),
      advection: makeMaterial(advectionFragment, {
        uVelocity: { value: null },
        uSource: { value: null },
        uTexelSize: { value: texel },
        uDt: { value: 0 },
        uDissipation: { value: 0 },
      }),
      divergence: makeMaterial(divergenceFragment, {
        uVelocity: { value: null },
        uTexelSize: { value: texel },
      }),
      clear: makeMaterial(clearFragment, {
        uTexture: { value: null },
        uValue: { value: PRESSURE_DAMPING },
      }),
      pressure: makeMaterial(pressureFragment, {
        uPressure: { value: null },
        uDivergence: { value: null },
        uTexelSize: { value: texel },
      }),
      gradient: makeMaterial(gradientSubtractFragment, {
        uPressure: { value: null },
        uVelocity: { value: null },
        uTexelSize: { value: texel },
      }),
    };

    const quadScene = new THREE.Scene();
    const quadCamera = new THREE.Camera();
    const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2));
    quadScene.add(quad);

    return {
      iterations,
      velocity,
      pressure,
      divergence,
      dye,
      materials,
      quad,
      quadScene,
      quadCamera,
    };
  }, [gl]);

  useEffect(() => {
    return () => {
      sim.velocity.dispose();
      sim.pressure.dispose();
      sim.dye.dispose();
      sim.divergence.dispose();
      for (const material of Object.values(sim.materials)) material.dispose();
      sim.quad.geometry.dispose();
    };
  }, [sim]);

  // Cursor injeta velocidade e densidade; no touch, touchmove passivo — não
  // interfere no scroll (spec §5).
  useEffect(() => {
    if (saveData) return;
    let last: { x: number; y: number } | null = null;

    const push = (clientX: number, clientY: number) => {
      const rect = track.current?.getBoundingClientRect();
      if (!rect || clientY < rect.top || clientY > rect.bottom) {
        last = null;
        return;
      }
      const x = (clientX - rect.left) / rect.width;
      const y = 1 - (clientY - rect.top) / rect.height;
      if (last) {
        splats.current.push({
          x,
          y,
          dx: (x - last.x) * SPLAT_FORCE,
          dy: (y - last.y) * SPLAT_FORCE,
        });
      }
      last = { x, y };
    };

    const onPointer = (event: PointerEvent) =>
      push(event.clientX, event.clientY);
    const onTouch = (event: TouchEvent) => {
      const touch = event.touches[0];
      if (touch) push(touch.clientX, touch.clientY);
    };
    window.addEventListener('pointermove', onPointer, { passive: true });
    window.addEventListener('touchmove', onTouch, { passive: true });
    return () => {
      window.removeEventListener('pointermove', onPointer);
      window.removeEventListener('touchmove', onTouch);
    };
  }, [track, saveData]);

  useFrame((_, delta) => {
    if (!visible || saveData) return;
    // iOS Modo Pouca Energia trava rAF em 30fps: dt clampado, um passo por
    // quadro, sem acumular — a névoa fica mais lenta, nunca instável.
    const dt = Math.min(delta, 1 / 30);
    const { materials, quad, quadScene, quadCamera } = sim;

    const previousTarget = gl.getRenderTarget();
    const scissor = gl.getScissorTest();
    gl.setScissorTest(false);

    const blit = (
      material: THREE.ShaderMaterial,
      target: THREE.WebGLRenderTarget,
    ) => {
      quad.material = material;
      gl.setRenderTarget(target);
      gl.render(quadScene, quadCamera);
    };

    // 1. splats pendentes (velocidade + densidade)
    for (const splat of splats.current.splice(0)) {
      materials.splat.uniforms.uAspect.value = 1;
      materials.splat.uniforms.uPoint.value.set(splat.x, splat.y);
      materials.splat.uniforms.uTarget.value = sim.velocity.read.texture;
      materials.splat.uniforms.uColor.value.set(splat.dx, splat.dy, 0);
      blit(materials.splat, sim.velocity.write);
      sim.velocity.swap();

      materials.splat.uniforms.uTarget.value = sim.dye.read.texture;
      const power = Math.min(1, Math.hypot(splat.dx, splat.dy) / 60);
      materials.splat.uniforms.uColor.value.set(
        DYE_COLOR.r * power,
        DYE_COLOR.g * power,
        DYE_COLOR.b * power,
      );
      blit(materials.splat, sim.dye.write);
      sim.dye.swap();
    }

    // 2. advecção da velocidade e do dye
    materials.advection.uniforms.uDt.value = dt;
    materials.advection.uniforms.uVelocity.value = sim.velocity.read.texture;
    materials.advection.uniforms.uSource.value = sim.velocity.read.texture;
    materials.advection.uniforms.uDissipation.value = VELOCITY_DISSIPATION;
    blit(materials.advection, sim.velocity.write);
    sim.velocity.swap();

    materials.advection.uniforms.uVelocity.value = sim.velocity.read.texture;
    materials.advection.uniforms.uSource.value = sim.dye.read.texture;
    materials.advection.uniforms.uDissipation.value = DENSITY_DISSIPATION;
    blit(materials.advection, sim.dye.write);
    sim.dye.swap();

    // 3. divergência
    materials.divergence.uniforms.uVelocity.value = sim.velocity.read.texture;
    blit(materials.divergence, sim.divergence);

    // 4. pressão: damping + Jacobi
    materials.clear.uniforms.uTexture.value = sim.pressure.read.texture;
    blit(materials.clear, sim.pressure.write);
    sim.pressure.swap();
    materials.pressure.uniforms.uDivergence.value = sim.divergence.texture;
    for (let i = 0; i < sim.iterations; i += 1) {
      materials.pressure.uniforms.uPressure.value = sim.pressure.read.texture;
      blit(materials.pressure, sim.pressure.write);
      sim.pressure.swap();
    }

    // 5. subtração do gradiente
    materials.gradient.uniforms.uPressure.value = sim.pressure.read.texture;
    materials.gradient.uniforms.uVelocity.value = sim.velocity.read.texture;
    blit(materials.gradient, sim.velocity.write);
    sim.velocity.swap();

    gl.setRenderTarget(previousTarget);
    gl.setScissorTest(scissor);

    displayMaterial.current.uniforms.uDye.value = sim.dye.read.texture;
  });

  const displayUniforms = useMemo(() => ({ uDye: { value: null } }), []);

  if (saveData || !visible) return null;

  return (
    <mesh scale={[viewport.width, viewport.height, 1]}>
      <planeGeometry args={[1, 1]} />
      <shaderMaterial
        ref={displayMaterial}
        vertexShader={fluidVertex}
        fragmentShader={displayFragment}
        uniforms={displayUniforms}
        transparent
        depthTest={false}
      />
    </mesh>
  );
}
