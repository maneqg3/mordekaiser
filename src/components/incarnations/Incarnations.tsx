import { getTranslations } from 'next-intl/server';
import { skinDisplayName, type ChampionData } from '@/lib/ddragon';

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
        <ul className="grid list-none gap-6 p-0 sm:grid-cols-2 lg:grid-cols-3">
          {champion.skins.map((skin) => {
            const name = skinDisplayName(skin, champion.name);
            return (
              <li key={skin.num}>
                <figure className="flex flex-col gap-2">
                  {/* next/image estourou o teto de bundle (147.9kb > 145kb):
                      fallback registrado na spec §9 — img nativa, lazy. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/champion/splash-${skin.num}.jpg`}
                    alt=""
                    width={1215}
                    height={717}
                    loading="lazy"
                    decoding="async"
                    className="h-auto w-full"
                  />
                  <figcaption className="type-mono text-sm opacity-80">
                    {name}
                  </figcaption>
                </figure>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
