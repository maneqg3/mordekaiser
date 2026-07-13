/**
 * 0→1 conforme o centro da seção se aproxima do centro do viewport (spec §3).
 * Zera exatamente quando a seção sai do viewport: o alcance é a soma das
 * meias-alturas (seção + viewport).
 */
export function portalProximity(
  rectTop: number,
  rectHeight: number,
  viewportHeight: number,
): number {
  const range = (rectHeight + viewportHeight) / 2;
  if (range <= 0) return 0;
  const distance = Math.abs(rectTop + rectHeight / 2 - viewportHeight / 2);
  return Math.min(1, Math.max(0, 1 - distance / range));
}
