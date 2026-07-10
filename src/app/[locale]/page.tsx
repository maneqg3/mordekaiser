import { setRequestLocale } from 'next-intl/server';
import { ActForge } from '@/components/act-forge/ActForge';
import { ActGreyWaste } from '@/components/act-grey-waste/ActGreyWaste';
import { ActWildlands } from '@/components/act-wildlands/ActWildlands';
import { Arsenal } from '@/components/arsenal/Arsenal';
import { Credits } from '@/components/credits/Credits';
import { Hero } from '@/components/hero/Hero';
import { Incarnations } from '@/components/incarnations/Incarnations';
import { RealmOfDeath } from '@/components/realm-of-death/RealmOfDeath';
import type { ChampionData } from '@/lib/ddragon';

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const champion = (await import(`../../data/mordekaiser.${locale}.json`))
    .default as ChampionData;

  return (
    <>
      <main>
        <Hero title={champion.title} />
        <ActWildlands />
        <ActGreyWaste />
        <ActForge />
        <Arsenal champion={champion} />
        <RealmOfDeath champion={champion} />
        <Incarnations champion={champion} />
      </main>
      <Credits version={champion.version} />
    </>
  );
}
