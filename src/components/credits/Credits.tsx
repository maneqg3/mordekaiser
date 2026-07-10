import { getTranslations } from 'next-intl/server';

const GITHUB_URL = 'https://github.com/maneqg3/mordekaiser';
const LINKEDIN_URL = 'https://www.linkedin.com/in/gabriel-luis-gomes';

export async function Credits({ version }: { version: string }) {
  const t = await getTranslations('credits');
  const tHome = await getTranslations('home');

  return (
    <footer
      data-act="iv"
      aria-labelledby="credits-heading"
      className="act-section act-static"
    >
      <div className="mx-auto flex max-w-prose flex-col gap-6 text-sm">
        <h2 id="credits-heading" className="type-blackletter text-3xl">
          {t('title')}
        </h2>
        <p className="type-mono">{tHome('patchLabel', { version })}</p>
        <div>
          <p className="act-kicker">{t('fontsLabel')}</p>
          <p className="mt-2">
            Big Shoulders · Grenze Gotisch · Inter · JetBrains Mono
          </p>
        </div>
        <div>
          <p className="act-kicker">{t('sourceLabel')}</p>
          <p className="mt-2 flex gap-4">
            <a className="underline" href={GITHUB_URL}>
              GitHub
            </a>
            <a className="underline" href={LINKEDIN_URL}>
              LinkedIn
            </a>
          </p>
        </div>
        <p className="opacity-80">{tHome('disclaimer')}</p>
      </div>
    </footer>
  );
}
