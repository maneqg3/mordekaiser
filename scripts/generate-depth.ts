import { pipeline, RawImage } from '@huggingface/transformers';

// Dev-only (spec Fase 3 §2): NÃO roda no build da Vercel nem no CI.
// O asset gerado é versionado — exceção no .gitignore de public/champion/.
const SPLASH =
  'https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Mordekaiser_0.jpg';
const OUT = 'public/champion/depth-0.webp';

async function main(): Promise<void> {
  console.log('carregando Depth Anything V2 (small)…');
  const estimator = await pipeline(
    'depth-estimation',
    'onnx-community/depth-anything-v2-small',
  );

  const image = await RawImage.fromURL(SPLASH);
  const output = await estimator(image);
  const depth = Array.isArray(output) ? output[0].depth : output.depth;

  // toBlob() é browser-only; em Node o RawImage salva via sharp (formato
  // decidido pela extensão do caminho).
  await depth.save(OUT);
  console.log(`pronto: ${OUT}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
