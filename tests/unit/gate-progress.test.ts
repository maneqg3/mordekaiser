import { expect, test, vi } from 'vitest';
import {
  aggregateProgress,
  createGateStore,
  GATE_STAGES,
  platesLit,
} from '@/lib/gate-progress';

test('pesos das etapas somam 1', () => {
  const sum = Object.values(GATE_STAGES).reduce((acc, w) => acc + w, 0);
  expect(sum).toBeCloseTo(1);
});

test('sem etapas reportadas, progresso é 0', () => {
  expect(aggregateProgress({})).toBe(0);
});

test('todas as etapas completas dão 1', () => {
  expect(
    aggregateProgress({ fonts: 1, splash: 1, depth: 1, chunk: 1, compile: 1 }),
  ).toBeCloseTo(1);
});

test('etapa parcial pesa proporcionalmente', () => {
  expect(aggregateProgress({ chunk: 1 })).toBeCloseTo(GATE_STAGES.chunk);
  expect(aggregateProgress({ chunk: 0.5 })).toBeCloseTo(GATE_STAGES.chunk / 2);
});

test('frações fora de 0..1 são clampadas', () => {
  expect(aggregateProgress({ chunk: 5 })).toBeCloseTo(GATE_STAGES.chunk);
  expect(aggregateProgress({ chunk: -1 })).toBe(0);
});

test('platesLit mapeia fração para as 14 placas', () => {
  expect(platesLit(0)).toBe(0);
  expect(platesLit(1)).toBe(14);
  expect(platesLit(0.5)).toBe(7);
  expect(platesLit(2)).toBe(14);
});

test('store agrega, notifica e para de notificar após unsubscribe', () => {
  const store = createGateStore();
  const listener = vi.fn();
  const unsubscribe = store.subscribe(listener);

  store.set('fonts', 1);
  expect(listener).toHaveBeenCalledTimes(1);
  expect(store.value()).toBeCloseTo(GATE_STAGES.fonts);

  unsubscribe();
  store.set('chunk', 1);
  expect(listener).toHaveBeenCalledTimes(1);
  expect(store.value()).toBeCloseTo(GATE_STAGES.fonts + GATE_STAGES.chunk);
});
