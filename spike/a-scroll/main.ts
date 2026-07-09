import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const params = new URLSearchParams(location.search);
const useLenis = params.get('lenis') === '1';

if (useLenis) {
  const lenis = new Lenis({ autoRaf: false });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
}

// Seção do GSAP: pin + scrub. Precisa continuar funcionando com e sem Lenis.
gsap.to('#box', {
  rotation: 360,
  scale: 2,
  ease: 'none',
  scrollTrigger: {
    trigger: '#pin-wrap',
    start: 'top top',
    end: 'bottom bottom',
    pin: '#pin',
    scrub: true,
  },
});

// Sonda: expõe --p e scrollY a cada quadro, para o Playwright ler.
const native = document.getElementById('native')!;
const pOut = document.getElementById('p')!;
const yOut = document.getElementById('y')!;

declare global {
  interface Window {
    __probe: { p: number; scrollY: number; lenis: boolean };
  }
}

function tick() {
  const raw = getComputedStyle(native).getPropertyValue('--p').trim();
  const p = Number.parseFloat(raw) || 0;
  window.__probe = { p, scrollY: window.scrollY, lenis: useLenis };
  pOut.textContent = p.toFixed(4);
  yOut.textContent = String(Math.round(window.scrollY));
  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);
