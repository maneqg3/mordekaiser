import { getTranslations } from 'next-intl/server';
import { RealmGateway } from '@/components/realm-of-death/RealmGateway';
import { LoreSection } from '@/components/ui/LoreSection';
import type { ChampionData } from '@/lib/ddragon';

export async function RealmOfDeath({ champion }: { champion: ChampionData }) {
  const t = await getTranslations('realm');
  const tArsenal = await getTranslations('arsenal');
  const r = champion.spells[3];

  return (
    <LoreSection
      act="iv"
      headingId="realm-heading"
      kicker={t('kicker')}
      title={t('title')}
      body={t.raw('body') as string[]}
    >
      <div aria-hidden className="portal-ring" />
      <RealmGateway
        labels={{ cross: t('crossLabel'), return: t('returnLabel') }}
      />
      <article className="ability-card realm-ultimate flex flex-col gap-3 p-6">
        <div className="flex items-center gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element -- next/image estoura o teto de bundle (spec §9) */}
          <img
            src={`/champion/${r.icon}`}
            alt=""
            width={64}
            height={64}
            loading="lazy"
            decoding="async"
          />
          <div>
            <p className="act-kicker">{t('ultimateLabel')}</p>
            <h3 className="type-display text-xl">{r.name}</h3>
          </div>
        </div>
        <p className="opacity-90">{r.description}</p>
        <dl className="type-mono flex flex-wrap gap-x-6 gap-y-1 text-sm opacity-80">
          <div>
            <dt className="inline">{tArsenal('cooldownLabel')}: </dt>
            <dd className="inline">{r.cooldownBurn}</dd>
          </div>
          <div>
            <dt className="inline">{tArsenal('costLabel')}: </dt>
            <dd className="inline">{r.costBurn}</dd>
          </div>
          <div>
            <dt className="inline">{tArsenal('rangeLabel')}: </dt>
            <dd className="inline">{r.rangeBurn}</dd>
          </div>
        </dl>
      </article>
    </LoreSection>
  );
}
