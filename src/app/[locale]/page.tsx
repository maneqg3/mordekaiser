import { getTranslations, setRequestLocale } from 'next-intl/server';

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('home');

  return (
    <>
      <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-6">
        <h1 aria-label="Mordekaiser">
          <span aria-hidden className="block">
            MORDE
          </span>
          <span aria-hidden className="block">
            KAISER
          </span>
        </h1>
        <p>{t('tagline')}</p>
      </main>
      <footer className="px-6 py-8 text-sm">
        <p>{t('disclaimer')}</p>
      </footer>
    </>
  );
}
