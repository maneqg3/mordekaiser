import { getTranslations } from 'next-intl/server';
import type { CueName } from '@/data/audio-manifest';
import type { ChampionData } from '@/lib/ddragon';
import { AbilityCue } from './AbilityCue';

type Ability = {
  label: string;
  name: string;
  description: string;
  icon: string;
  cue: CueName;
  cooldown?: string;
  cost?: string;
  range?: string;
};

export async function Arsenal({ champion }: { champion: ChampionData }) {
  const t = await getTranslations('arsenal');
  const [q, w, e] = champion.spells;
  const toAbility = (
    label: string,
    cue: CueName,
    spell: ChampionData['spells'][number],
  ): Ability => ({
    label,
    cue,
    name: spell.name,
    description: spell.description,
    icon: spell.icon,
    cooldown: spell.cooldownBurn,
    cost: spell.costBurn,
    range: spell.rangeBurn,
  });
  const abilities: Ability[] = [
    {
      label: t('passiveLabel'),
      cue: 'passive',
      name: champion.passive.name,
      description: champion.passive.description,
      icon: champion.passive.icon,
    },
    toAbility(t('qLabel'), 'q', q),
    toAbility(t('wLabel'), 'w', w),
    toAbility(t('eLabel'), 'e', e),
  ];

  return (
    <section
      data-act="iii"
      aria-labelledby="arsenal-heading"
      className="act-section act-static"
    >
      <div className="reveal mx-auto flex max-w-4xl flex-col gap-10">
        <h2 id="arsenal-heading" className="type-blackletter text-4xl sm:text-5xl">
          {t('title')}
        </h2>
        <div className="grid gap-6 sm:grid-cols-2">
          {abilities.map((ability) => (
            <article key={ability.name} className="ability-card flex flex-col gap-3 p-6">
              <AbilityCue
                cue={ability.cue}
                label={t('hear', { name: ability.name })}
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- next/image estoura o teto de bundle (spec §9) */}
                <img
                  src={`/champion/${ability.icon}`}
                  alt=""
                  width={64}
                  height={64}
                  loading="lazy"
                  decoding="async"
                />
                <div>
                  <p className="act-kicker">{ability.label}</p>
                  <h3 className="type-display text-xl">{ability.name}</h3>
                </div>
              </AbilityCue>
              <p className="opacity-90">{ability.description}</p>
              {ability.cooldown !== undefined && (
                <dl className="type-mono flex flex-wrap gap-x-6 gap-y-1 text-sm opacity-80">
                  <div>
                    <dt className="inline">{t('cooldownLabel')}: </dt>
                    <dd className="inline">{ability.cooldown}</dd>
                  </div>
                  <div>
                    <dt className="inline">{t('costLabel')}: </dt>
                    <dd className="inline">{ability.cost}</dd>
                  </div>
                  <div>
                    <dt className="inline">{t('rangeLabel')}: </dt>
                    <dd className="inline">{ability.range}</dd>
                  </div>
                </dl>
              )}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
