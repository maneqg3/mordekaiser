/** Pesos por etapa do gate (spec Fase 3 §6). Somam 1.
 *
 * Só assets de HTML/CSS (fontes + splash + depth do hero). O chunk WebGL NÃO
 * entra: ele só carrega DEPOIS do gate ser dispensado (perf — o WebGL rodando
 * durante o gate, que é a janela medida pelo Lighthouse, derrubava a nota). */
export const GATE_STAGES = {
  fonts: 0.3,
  splash: 0.4,
  depth: 0.3,
} as const;

export type GateStage = keyof typeof GATE_STAGES;

/** As 14 placas da armadura (mesmo motivo do ForgePlates da Fase 2). */
export const PLATE_COUNT = 14;

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

/** Agrega frações por etapa (0–1) na fração global do gate. */
export function aggregateProgress(
  fractions: Partial<Record<GateStage, number>>,
): number {
  let total = 0;
  for (const stage of Object.keys(GATE_STAGES) as GateStage[]) {
    total += GATE_STAGES[stage] * clamp01(fractions[stage] ?? 0);
  }
  return clamp01(total);
}

/** Quantas das 14 placas acendem para uma fração global. */
export function platesLit(fraction: number): number {
  return Math.round(clamp01(fraction) * PLATE_COUNT);
}

type Listener = () => void;

/** Store minimalista: gate (bundle inicial) e chunk WebGL compartilham o módulo. */
export function createGateStore() {
  const fractions: Partial<Record<GateStage, number>> = {};
  const listeners = new Set<Listener>();
  return {
    set(stage: GateStage, fraction: number): void {
      fractions[stage] = fraction;
      for (const listener of listeners) listener();
    },
    value(): number {
      return aggregateProgress(fractions);
    },
    subscribe(listener: Listener): () => void {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

export const gateStore = createGateStore();
