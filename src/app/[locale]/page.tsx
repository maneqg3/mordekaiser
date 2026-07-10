import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Hero } from '@/components/hero/Hero';
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
      <main>
        <Hero title={champion.title} />
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
