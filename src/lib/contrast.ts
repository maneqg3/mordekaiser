const SRGB_LINEAR_THRESHOLD = 0.03928;
const LUMINANCE_WEIGHTS = [0.2126, 0.7152, 0.0722] as const;

function hexChannels(hex: string): [number, number, number] {
  const match = /^#([0-9a-fA-F]{6})$/.exec(hex);
  if (!match) throw new Error(`cor inválida (esperado #rrggbb): ${hex}`);
  const value = match[1];
  return [0, 2, 4].map(
    (i) => Number.parseInt(value.slice(i, i + 2), 16) / 255,
  ) as [number, number, number];
}

function linearize(channel: number): number {
  return channel <= SRGB_LINEAR_THRESHOLD
    ? channel / 12.92
    : ((channel + 0.055) / 1.055) ** 2.4;
}

export function relativeLuminance(hex: string): number {
  return hexChannels(hex)
    .map(linearize)
    .reduce((sum, channel, i) => sum + channel * LUMINANCE_WEIGHTS[i], 0);
}

export function contrastRatio(a: string, b: string): number {
  const [lighter, darker] = [relativeLuminance(a), relativeLuminance(b)].sort(
    (x, y) => y - x,
  );
  return (lighter + 0.05) / (darker + 0.05);
}
