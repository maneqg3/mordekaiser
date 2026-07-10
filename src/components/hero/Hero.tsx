import { getTranslations } from 'next-intl/server';
import { preload } from 'react-dom';

export async function Hero({ title }: { title: string }) {
  // A splash é fundo CSS (fora do next/image): preload manual, é o LCP.
  preload('/champion/splash-0.jpg', { as: 'image', fetchPriority: 'high' });
  const t = await getTranslations('home');

  return (
    <section
      data-act="i"
      aria-labelledby="hero-heading"
      className="hero-splash flex min-h-svh flex-col items-center justify-center gap-6 px-6 text-center"
    >
      <h1
        id="hero-heading"
        aria-label="Mordekaiser"
        className="type-display leading-[0.85] tracking-tight"
        style={{ fontSize: 'var(--text-hero)' }}
      >
        <span aria-hidden className="block">
          MORDE
        </span>
        <span aria-hidden className="block">
          KAISER
        </span>
      </h1>
      <p className="type-blackletter text-2xl">{title}</p>
      <p>{t('tagline')}</p>
      <p aria-hidden className="scroll-cue type-mono mt-10 text-sm tracking-widest">
        {t('scrollCue')} ↓
      </p>
    </section>
  );
}
