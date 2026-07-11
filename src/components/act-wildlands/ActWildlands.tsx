import { getTranslations } from 'next-intl/server';
import { LoreSection } from '@/components/ui/LoreSection';

export async function ActWildlands() {
  const t = await getTranslations('wildlands');
  return (
    <LoreSection
      act="i"
      headingId="wildlands-heading"
      kicker={t('kicker')}
      title={t('title')}
      body={t.raw('body') as string[]}
    />
  );
}
