import { PLATE_COUNT } from '@/lib/gate-progress';

// Torre em unidades de mundo: a MESMA derivação do PlateProgress do gate
// (viewBox 200×280, meia-largura 30→6, vão de 15%) escalada por 1/100.
// Geometria derivada, não desenhada — o motivo do sigilo é um só.
const TOWER_HEIGHT = 2.6;
const HALF_WIDTH_BOTTOM = 0.3;
const HALF_WIDTH_TOP = 0.06;
const GAP = 0.15;
const EXPLODE_RADIUS = 2.2;
const EXPLODE_TILT = 1.1;
const GOLDEN_ANGLE = 2.399963; // rad — leque radial sem placas coincidentes
const CAMERA_ORBIT = (35 * Math.PI) / 180;

export type PlateShape = {
  halfWidthBottom: number;
  halfWidthTop: number;
  yBottom: number;
  yTop: number;
};

export type PlateTransform = {
  position: [number, number, number];
  rotation: [number, number, number];
};

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function easeInOutCubic(t: number): number {
  const x = clamp01(t);
  return x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2;
}

/** Contorno 2D de cada placa; a extrusão acontece na cena. */
export function plateShapes(count: number = PLATE_COUNT): PlateShape[] {
  const half = (t: number) =>
    HALF_WIDTH_BOTTOM - (HALF_WIDTH_BOTTOM - HALF_WIDTH_TOP) * t;
  const y = (t: number) => TOWER_HEIGHT * t;
  return Array.from({ length: count }, (_, index) => {
    const t0 = index / count;
    const t1 = (index + 1 - GAP) / count;
    return {
      halfWidthBottom: half(t0),
      halfWidthTop: half(t1),
      yBottom: y(t0),
      yTop: y(t1),
    };
  });
}

/**
 * progress 0 → placas explodidas em leque radial; progress 1 → identidade
 * (a geometria já carrega o y de cada placa na silhueta).
 */
export function plateTransforms(
  progress: number,
  count: number = PLATE_COUNT,
): PlateTransform[] {
  const spread = 1 - easeInOutCubic(progress);
  return Array.from({ length: count }, (_, index) => {
    const angle = index * GOLDEN_ANGLE;
    return {
      position: [
        Math.cos(angle) * EXPLODE_RADIUS * spread,
        0,
        Math.sin(angle) * EXPLODE_RADIUS * spread,
      ],
      rotation: [
        Math.sin(angle * 3) * EXPLODE_TILT * spread,
        angle * spread,
        Math.cos(angle * 2) * EXPLODE_TILT * spread,
      ],
    };
  });
}

/** Câmera orbita ~35° de azimute e aproxima até pousar de frente. */
export function cameraPose(progress: number): {
  position: [number, number, number];
  target: [number, number, number];
} {
  const eased = easeInOutCubic(progress);
  const azimuth = (1 - eased) * CAMERA_ORBIT;
  const distance = 4.6 - 0.8 * eased;
  return {
    position: [Math.sin(azimuth) * distance, 1.5, Math.cos(azimuth) * distance],
    target: [0, TOWER_HEIGHT / 2, 0],
  };
}

/** Luz verde vaza fraca o tempo todo e cresce no último trecho (0.7→1). */
export function glowIntensity(progress: number): number {
  return 0.2 + 0.8 * clamp01((clamp01(progress) - 0.7) / 0.3);
}
