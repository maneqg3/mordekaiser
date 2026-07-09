import { pipeline, RawImage } from '@huggingface/transformers';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const SPLASH = 'https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Mordekaiser_0.jpg';
const OUT = fileURLToPath(new URL('./assets/', import.meta.url));

async function main() {
  await mkdir(OUT, { recursive: true });

  console.log('baixando splash…');
  const res = await fetch(SPLASH);
  if (!res.ok) throw new Error(`splash retornou ${res.status}`);
  await writeFile(`${OUT}/splash.jpg`, Buffer.from(await res.arrayBuffer()));

  console.log('carregando Depth Anything V2 (small)…');
  const estimator = await pipeline('depth-estimation', 'onnx-community/depth-anything-v2-small');

  const image = await RawImage.fromURL(SPLASH);
  const output = await estimator(image);
  const depth = Array.isArray(output) ? output[0].depth : output.depth;

  // toBlob() é browser-only; em Node o RawImage salva via sharp.
  await depth.save(`${OUT}/depth.png`);
  console.log(`pronto: ${OUT}splash.jpg e ${OUT}depth.png`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
