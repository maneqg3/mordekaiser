import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { ChampionData } from '@/lib/ddragon';

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('home');
  const champion = (await import(`../../data/mordekaiser.${locale}.json`))
    .default as ChampionData;

  return (
    <>
      <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
        <h1
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
        <p className="type-blackletter text-2xl">{champion.title}</p>
        <p>{t('tagline')}</p>
      </main>
      <footer className="flex flex-col items-center gap-2 px-6 py-8 text-center text-sm">
        <p className="type-mono">
          {t('patchLabel', { version: champion.version })}
        </p>
        <p className="max-w-prose opacity-80">{t('disclaimer')}</p>
      </footer>
    </>
  );
}
