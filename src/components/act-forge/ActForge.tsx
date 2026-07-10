import { getTranslations } from 'next-intl/server';
import { LoreSection } from '@/components/ui/LoreSection';
import { ForgePlates } from './ForgePlates';

export async function ActForge() {
  const t = await getTranslations('forge');
  return (
    <LoreSection
      act="iii"
      headingId="forge-heading"
      kicker={t('kicker')}
      title={t('title')}
      body={t.raw('body') as string[]}
    >
      <ForgePlates />
      <p
        className="type-display text-center text-5xl sm:text-6xl"
        style={{ color: 'var(--accent)' }}
      >
        {t('spiritName')}
      </p>
    </LoreSection>
  );
}
