// Offline (spec 4.5 §3): lê nightfall/Nightfall.stl (binário, referência da
// Riot fora do repo) e grava src/lib/nightfall-profile.ts — só números,
// gerado e commitado. Não roda no build; sem o STL local, usa-se o gerado.
// Uso: node scripts/derive-nightfall-profile.mjs
// Idempotente: mesmo STL → mesmo arquivo, byte a byte.
import { readFileSync, writeFileSync } from 'node:fs';

const STL_PATH = new URL('../nightfall/Nightfall.stl', import.meta.url);
const OUT_PATH = new URL('../src/lib/nightfall-profile.ts', import.meta.url);
// 15 = PLATE_COUNT + 1: bordas das 14 fatias (forge-layout interpola entre elas)
const SAMPLES = 15;

/** STL binário: header 80 bytes, uint32 de triângulos, 50 bytes por triângulo
 * (normal 3×f32 ignorada + 3 vértices 3×f32 + 2 bytes de atributo). */
function readVertices(buffer) {
  const count = buffer.readUInt32LE(80);
  const vertices = [];
  for (let triangle = 0; triangle < count; triangle += 1) {
    const base = 84 + triangle * 50 + 12;
    for (let corner = 0; corner < 3; corner += 1) {
      const offset = base + corner * 12;
      vertices.push([
        buffer.readFloatLE(offset),
        buffer.readFloatLE(offset + 4),
        buffer.readFloatLE(offset + 8),
      ]);
    }
  }
  return vertices;
}

/** 14 fatias no eixo maior; meia-largura máxima (raio no plano transversal)
 * numa janela de meia fatia em torno de cada uma das 15 bordas. */
function deriveProfile(vertices) {
  const mins = [Infinity, Infinity, Infinity];
  const maxs = [-Infinity, -Infinity, -Infinity];
  for (const vertex of vertices) {
    for (let axisIndex = 0; axisIndex < 3; axisIndex += 1) {
      mins[axisIndex] = Math.min(mins[axisIndex], vertex[axisIndex]);
      maxs[axisIndex] = Math.max(maxs[axisIndex], vertex[axisIndex]);
    }
  }
  const extents = maxs.map((max, axisIndex) => max - mins[axisIndex]);
  const axis = extents.indexOf(Math.max(...extents));
  const [u, w] = [0, 1, 2].filter((axisIndex) => axisIndex !== axis);
  const height = extents[axis];
  const centerU = (mins[u] + maxs[u]) / 2;
  const centerW = (mins[w] + maxs[w]) / 2;

  const halfWindow = 1 / ((SAMPLES - 1) * 2);
  const widths = Array.from({ length: SAMPLES }, (_, index) => {
    const station = index / (SAMPLES - 1);
    let max = 0;
    for (const vertex of vertices) {
      const t = (vertex[axis] - mins[axis]) / height;
      if (Math.abs(t - station) > halfWindow) continue;
      max = Math.max(max, Math.hypot(vertex[u] - centerU, vertex[w] - centerW));
    }
    return max / height;
  });

  // Janela sem vértice (malha esparsa) → interpola vizinhos não vazios.
  for (let index = 0; index < widths.length; index += 1) {
    if (widths[index] > 0) continue;
    let lo = index - 1;
    while (lo >= 0 && widths[lo] === 0) lo -= 1;
    let hi = index + 1;
    while (hi < widths.length && widths[hi] === 0) hi += 1;
    if (lo < 0) widths[index] = widths[hi];
    else if (hi >= widths.length) widths[index] = widths[lo];
    else
      widths[index] =
        widths[lo] + ((widths[hi] - widths[lo]) * (index - lo)) / (hi - lo);
  }

  // Cabeça no topo: se a metade de baixo é a mais larga, inverte o perfil.
  const lowerMax = Math.max(...widths.slice(0, SAMPLES >> 1));
  const upperMax = Math.max(...widths.slice(SAMPLES >> 1));
  return lowerMax > upperMax ? widths.toReversed() : widths;
}

const widths = deriveProfile(readVertices(readFileSync(STL_PATH)));
const rows = widths
  .map((halfWidth, index) => {
    const y = (index / (SAMPLES - 1)).toFixed(4);
    return `  { y: ${y}, halfWidth: ${halfWidth.toFixed(4)} },`;
  })
  .join('\n');

writeFileSync(
  OUT_PATH,
  `// Gerado por scripts/derive-nightfall-profile.mjs — NÃO editar à mão.
// Perfil da Véu da Noite (spec 4.5 §3): silhueta medida offline do STL de
// referência (asset da Riot, fora do repo). Só números — runtime procedural.
// y normalizado 0→1 no eixo maior; halfWidth em fração da altura.
export type ProfileSample = { y: number; halfWidth: number };

export const NIGHTFALL_PROFILE: readonly ProfileSample[] = [
${rows}
];
`,
);
console.log(
  `nightfall-profile: ${SAMPLES} amostras gravadas em src/lib/nightfall-profile.ts`,
);
