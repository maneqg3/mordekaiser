import { readdirSync, readFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';

// Fase 3 (spec §9): orçamento +35% aprovado — three+R3F+drei não cabem no
// teto antigo (145). O chunk WebGL é lazy e tem teto próprio.
// Fase 4 (spec §7): gsap+ScrollTrigger (~40kb gz) e a cena da forja entram no
// chunk lazy — teto 367kb aprovado pelo usuário, alvo interno 300kb.
const TARGET_KB = 175;
const FAIL_KB = 196;
const LAZY_TARGET_KB = 300;
const LAZY_FAIL_KB = 367;
const PAGE_HTML = '.next/server/app/en.html';

// O Turbopack não emite `app-build-manifest.json`, e o `build-manifest.json` só
// lista o runtime compartilhado — não os chunks da rota. Os <script> do HTML
// pré-renderizado são a fonte de verdade: é exatamente o que o browser baixa.
let html;
try {
  html = readFileSync(PAGE_HTML, 'utf8');
} catch {
  console.error(`check-bundle: ${PAGE_HTML} ausente. Rode 'pnpm build' antes.`);
  process.exit(1);
}

// `noModule` é o bundle de polyfills para browsers legados: nenhum browser com
// suporte a ES modules o baixa, então ele não faz parte do JS inicial real.
const scripts = [
  ...new Set(
    [...html.matchAll(/<script\b[^>]*>/g)]
      .map((m) => m[0])
      .filter((tag) => !tag.includes('noModule'))
      .map((tag) => tag.match(/src="\/_next\/(static\/[^"]+\.js)"/)?.[1])
      .filter((src) => src !== undefined),
  ),
];

if (scripts.length === 0) {
  console.error(
    `check-bundle: nenhum <script> de /_next/static encontrado em ${PAGE_HTML}.`,
  );
  process.exit(1);
}

let totalBytes = 0;
for (const asset of scripts) {
  totalBytes += gzipSync(readFileSync(`.next/${asset}`)).length;
}

const totalKb = totalBytes / 1024;
console.log(
  `check-bundle: JS inicial (gz) de /en = ${totalKb.toFixed(1)}kb em ${scripts.length} chunks (alvo ${TARGET_KB}kb, teto ${FAIL_KB}kb)`,
);
if (totalKb > FAIL_KB) {
  console.error('check-bundle: REPROVADO — acima do teto');
  process.exit(1);
}
if (totalKb > TARGET_KB) {
  console.warn('check-bundle: acima do alvo, abaixo do teto — atenção');
}

// Chunks lazy: todo .js emitido que o HTML inicial NÃO referencia (o polyfill
// noModule é referenciado, então fica de fora). Superconjunto do chunk WebGL
// (inclui Lenis) — conservador de propósito.
const emitted = readdirSync('.next/static/chunks', { recursive: true })
  .map(String)
  .filter((file) => file.endsWith('.js'))
  .map((file) => `static/chunks/${file.replaceAll('\\', '/')}`);
const lazy = emitted.filter((asset) => !html.includes(asset));

let lazyBytes = 0;
for (const asset of lazy) {
  lazyBytes += gzipSync(readFileSync(`.next/${asset}`)).length;
}
const lazyKb = lazyBytes / 1024;
console.log(
  `check-bundle: JS lazy (gz) = ${lazyKb.toFixed(1)}kb em ${lazy.length} chunks (teto ${LAZY_FAIL_KB}kb)`,
);
if (lazyKb > LAZY_FAIL_KB) {
  console.error('check-bundle: REPROVADO — chunks lazy acima do teto');
  process.exit(1);
}
if (lazyKb > LAZY_TARGET_KB) {
  console.warn('check-bundle: lazy acima do alvo, abaixo do teto — atenção');
}
