import { PLATE_COUNT, platesLit } from '@/lib/gate-progress';

// Torre afunilando como o ForgePlates da Fase 2 (o motivo do sigilo),
// fatiada nas 14 placas da armadura. Geometria derivada, não desenhada.
const PLATES = Array.from({ length: PLATE_COUNT }, (_, index) => {
  const t0 = index / PLATE_COUNT;
  const t1 = (index + 0.85) / PLATE_COUNT; // 15% de vão entre placas
  const half = (t: number) => 30 - 24 * t; // meia-largura: 30 → 6
  const y = (t: number) => 270 - 260 * t; // base 270 → topo 10
  return [
    `${100 - half(t0)},${y(t0)}`,
    `${100 + half(t0)},${y(t0)}`,
    `${100 + half(t1)},${y(t1)}`,
    `${100 - half(t1)},${y(t1)}`,
  ].join(' ');
});

export function PlateProgress({ fraction }: { fraction: number }) {
  const lit = platesLit(fraction);
  return (
    <svg aria-hidden viewBox="0 0 200 280" className="gate-plates">
      {PLATES.map((points, index) => (
        <polygon
          key={points}
          points={points}
          fill={index < lit ? '#7effb6' : '#111314'}
          fillOpacity={index < lit ? 0.8 : 1}
          stroke="#7effb6"
          strokeOpacity="0.35"
          strokeWidth="1"
        />
      ))}
    </svg>
  );
}
