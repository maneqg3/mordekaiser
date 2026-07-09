import WebGLFluidEnhanced from 'webgl-fluid-enhanced';

const params = new URLSearchParams(location.search);
const sim = Number(params.get('sim') ?? 128);
const iterations = sim <= 64 ? 10 : 20;
// auto=1: a página injeta splats sozinha e congela após a medição.
// Necessário porque sob CPU throttle a main thread satura e o Playwright
// não consegue nem rodar evaluate() enquanto a sim está viva.
const auto = params.get('auto') === '1';
const MEASURE_BUCKETS = 8;

// v0.7: o construtor recebe um CONTAINER (cria o canvas dentro) e a config é camelCase.
// O plano trazia a API antiga (UPPER_SNAKE + canvas direto) — não renderiza nada no 0.7.1.
const container = document.getElementById('fluid') as HTMLElement;
const simulation = new WebGLFluidEnhanced(container);

simulation.setConfig({
  simResolution: sim,
  dyeResolution: sim * 4,
  pressureIterations: iterations,
  densityDissipation: 2.0,
  velocityDissipation: 0.4,
  curl: 12,
  splatRadius: 0.22,
  colorful: false,
  backgroundColor: '#0c0e0e',
  transparent: false,
});
simulation.start();

// Contador de FPS: quadros por segundo, um bucket por segundo.
declare global {
  interface Window {
    __fps: number[];
    __frames: number;
    __sim: number;
  }
}
window.__fps = [];
window.__frames = 0;
window.__sim = sim;

const hud = document.getElementById('fps')!;
let framesThisSecond = 0;
let secondStart = performance.now();
let frozen = false;

function tick(now: number) {
  window.__frames++;
  framesThisSecond++;

  // Pior caso contínuo: um splat por quadro seguindo uma lissajous.
  if (auto && !frozen) {
    const t = now / 1000;
    const x = innerWidth / 2 + Math.sin(t) * innerWidth * 0.3;
    const y = innerHeight / 2 + Math.cos(t * 1.3) * innerHeight * 0.3;
    simulation.splatAtLocation(x, y, Math.cos(t) * 20, -Math.sin(t * 1.3) * 20);
  }

  if (now - secondStart >= 1000) {
    window.__fps.push(framesThisSecond);
    hud.textContent = String(framesThisSecond);
    framesThisSecond = 0;
    secondStart = now;

    if (auto && !frozen && window.__fps.length >= MEASURE_BUCKETS) {
      frozen = true;
      // Pausa desenhando o último quadro: libera a main thread e preserva a evidência visual.
      simulation.togglePause(true);
    }
  }
  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);
