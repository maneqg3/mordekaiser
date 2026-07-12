import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { crossFadeProgress, writeOnProgress } from '@/lib/ochnun-progress';
import { forgeProgress } from '@/webgl/forge-progress';

/**
 * Pin + scrub da forja (spec fase 4 §4). Só é chamado quando a camada WebGL
 * montou — reduced-motion / sem WebGL / sem JS nunca criam o pin. O Lenis
 * rola a janela de verdade (scroll nativo), então o listener interno do
 * ScrollTrigger funciona sem integração explícita — validado por E2E.
 */
export function setupForgeScrub(section: HTMLElement): () => void {
  gsap.registerPlugin(ScrollTrigger);

  const svg = section.querySelector<SVGSVGElement>('[data-ochnun]');
  const glyphs = [
    ...section.querySelectorAll<SVGPathElement>('[data-ochnun] path'),
  ];
  const name = section.querySelector<HTMLElement>('[data-spirit-name]');

  // JS esconde o nome (não o CSS de base): sem JS a Fase 2 continua visível.
  if (name) gsap.set(name, { autoAlpha: 0 });
  // Revela o svg (o CSS de base o mantém em opacity 0); traços não-escritos.
  if (svg) svg.style.opacity = '1';
  for (const path of glyphs) {
    path.style.strokeDasharray = '1';
    path.style.strokeDashoffset = '1';
  }

  const apply = (progress: number) => {
    forgeProgress.value = progress;
    const write = writeOnProgress(progress);
    const fade = crossFadeProgress(progress);
    for (const path of glyphs) {
      path.style.strokeDashoffset = String(1 - write);
      path.style.opacity = String(1 - fade);
    }
    if (name) {
      name.style.opacity = String(fade);
      name.style.visibility = fade > 0 ? 'visible' : 'hidden';
    }
  };

  const trigger = ScrollTrigger.create({
    trigger: section,
    start: 'top top',
    end: '+=200%',
    pin: true,
    onUpdate: (self) => apply(self.progress),
  });

  return () => {
    trigger.kill();
    forgeProgress.value = 0;
    if (name) gsap.set(name, { clearProps: 'all' });
    if (svg) svg.removeAttribute('style');
    for (const path of glyphs) path.removeAttribute('style');
  };
}
