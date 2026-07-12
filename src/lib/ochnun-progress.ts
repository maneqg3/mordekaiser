// Janelas do final da forja, em fração do scrub (spec fase 4 §5): os glifos
// se escrevem em 0.75→0.92 e o cross-fade para o nome legível ocupa 0.92→1.
const WRITE_START = 0.75;
const WRITE_END = 0.92;
const FADE_START = 0.92;

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

/** 0→1 dentro da janela de escrita; dashoffset = 1 - writeOnProgress. */
export function writeOnProgress(scrub: number): number {
  return clamp01((scrub - WRITE_START) / (WRITE_END - WRITE_START));
}

/** 0→1 no cross-fade final: glifos saem, o nome legível entra. */
export function crossFadeProgress(scrub: number): number {
  return clamp01((scrub - FADE_START) / (1 - FADE_START));
}
