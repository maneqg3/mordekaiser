import { getTranslations } from 'next-intl/server';
import { skinDisplayName, type ChampionData } from '@/lib/ddragon';
import { IncarnationsGallery } from './IncarnationsGallery';

export async function Incarnations({ champion }: { champion: ChampionData }) {
  const t = await getTranslations('incarnations');

  return (
    <section
      data-act="iv"
      aria-labelledby="incarnations-heading"
      className="act-section act-static"
    >
      <div className="reveal mx-auto flex max-w-6xl flex-col gap-10">
        <div className="flex flex-col gap-2">
          <h2
            id="incarnations-heading"
            className="type-blackletter text-4xl sm:text-5xl"
          >
            {t('title')}
          </h2>
          <p className="type-mono text-sm opacity-80">{t('subtitle')}</p>
        </div>
        <IncarnationsGallery
          skins={champion.skins.map((skin) => ({
            num: skin.num,
            name: skinDisplayName(skin, champion.name),
          }))}
        />
      </div>
    </section>
  );
}
