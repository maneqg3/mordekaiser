import { getTranslations } from 'next-intl/server';
import { LoreSection } from '@/components/ui/LoreSection';

export async function ActGreyWaste() {
  const t = await getTranslations('greyWaste');
  return (
    <LoreSection
      act="ii"
      headingId="grey-waste-heading"
      kicker={t('kicker')}
      title={t('title')}
      body={t.raw('body') as string[]}
      className="fog-veil"
    />
  );
}
