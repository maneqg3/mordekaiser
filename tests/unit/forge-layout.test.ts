import { describe, expect, it } from 'vitest';
import { PLATE_COUNT } from '@/lib/gate-progress';
import {
  cameraPose,
  glowIntensity,
  plateShapes,
  plateTransforms,
  type PlateShape,
} from '@/webgl/forge-layout';

describe('plateShapes', () => {
  it('deriva 14 placas com punho fino embaixo e cabeça larga no topo', () => {
    const shapes = plateShapes();
    expect(shapes).toHaveLength(PLATE_COUNT);
    for (const shape of shapes) {
      expect(shape.yTop).toBeGreaterThan(shape.yBottom);
      expect(shape.halfWidthBottom).toBeGreaterThan(0);
      expect(shape.halfWidthTop).toBeGreaterThan(0);
    }
    const widest = (shape: PlateShape) =>
      Math.max(shape.halfWidthBottom, shape.halfWidthTop);
    const lower = shapes.slice(0, PLATE_COUNT / 2).map(widest);
    const upper = shapes.slice(PLATE_COUNT / 2).map(widest);
    expect(Math.max(...upper)).toBeGreaterThan(Math.max(...lower) * 2);
  });

  it('placas não se sobrepõem no eixo y (vão de 15%)', () => {
    const shapes = plateShapes();
    for (let index = 1; index < shapes.length; index += 1) {
      expect(shapes[index].yBottom).toBeGreaterThan(shapes[index - 1].yTop);
    }
  });
});

describe('plateTransforms', () => {
  it('progress 1 → transform identidade (silhueta montada)', () => {
    // toBeCloseTo, não toEqual: cos/sin negativos × spread 0 produzem -0,
    // e toEqual distingue -0 de 0.
    for (const transform of plateTransforms(1)) {
      for (const component of [...transform.position, ...transform.rotation]) {
        expect(component).toBeCloseTo(0, 12);
      }
    }
  });

  it('progress 0 → placas afastadas no raio de explosão', () => {
    for (const transform of plateTransforms(0)) {
      const [x, , z] = transform.position;
      expect(Math.hypot(x, z)).toBeCloseTo(2.2, 5);
    }
  });

  it('convergência é monotônica', () => {
    const radiusAt = (progress: number) => {
      const [x, , z] = plateTransforms(progress)[3].position;
      return Math.hypot(x, z);
    };
    expect(radiusAt(0.25)).toBeGreaterThan(radiusAt(0.5));
    expect(radiusAt(0.5)).toBeGreaterThan(radiusAt(0.75));
  });

  it('clampa progress fora de 0..1', () => {
    expect(plateTransforms(-1)).toEqual(plateTransforms(0));
    expect(plateTransforms(2)).toEqual(plateTransforms(1));
  });
});

describe('cameraPose', () => {
  it('orbita ~35° e pousa de frente (x → 0)', () => {
    expect(Math.abs(cameraPose(1).position[0])).toBeLessThan(1e-9);
    expect(Math.abs(cameraPose(0).position[0])).toBeGreaterThan(1);
  });
});

describe('glowIntensity', () => {
  it('base 0.2 até progress 0.7, cresce a 1.0 no fim', () => {
    expect(glowIntensity(0)).toBeCloseTo(0.2);
    expect(glowIntensity(0.7)).toBeCloseTo(0.2);
    expect(glowIntensity(1)).toBeCloseTo(1);
  });
});
