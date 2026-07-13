import { describe, expect, it } from 'vitest';
import type { ReactElement } from 'react';
import { PLATE_COUNT } from '@/lib/gate-progress';
import { ForgePlates } from '@/components/act-forge/ForgePlates';

type PolygonElement = ReactElement<{ points: string }>;
type GroupElement = ReactElement<{ children: PolygonElement[] }>;
type SvgElement = ReactElement<{ children: GroupElement }>;

function polygonPoints(): number[][][] {
  const svg = ForgePlates() as SvgElement;
  const polygons = svg.props.children.props.children;
  return polygons.map((polygon) =>
    polygon.props.points.split(' ').map((pair) => pair.split(',').map(Number)),
  );
}

describe('ForgePlates', () => {
  it('deriva 14 placas da tabela de perfil', () => {
    expect(polygonPoints()).toHaveLength(PLATE_COUNT);
  });

  it('placas empilham de baixo para cima (y do SVG decresce)', () => {
    const plates = polygonPoints();
    for (let index = 1; index < plates.length; index += 1) {
      expect(plates[index][0][1]).toBeLessThan(plates[index - 1][0][1]);
    }
  });

  it('cabeça no topo mais larga que o punho na base', () => {
    const plates = polygonPoints();
    const width = (plate: number[][]) => plate[1][0] - plate[0][0];
    const widths = plates.map(width);
    expect(Math.max(...widths.slice(PLATE_COUNT / 2))).toBeGreaterThan(
      Math.max(...widths.slice(0, PLATE_COUNT / 2)) * 2,
    );
  });
});
