import { readFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';

const TARGET_KB = 130;
const FAIL_KB = 145;
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
