import { notFound } from 'next/navigation';
import { hasLocale } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { blackletter, body, display, mono } from '@/app/fonts';
import { EntryGate } from '@/components/gate/EntryGate';
import { SoulsLayer } from '@/components/realm-of-death/SoulsLayer';
import { SmoothScroll } from '@/components/SmoothScroll';
import { SoundToggle } from '@/components/ui/SoundToggle';
import { WebGLMount } from '@/webgl/WebGLMount';
import { routing } from '@/i18n/routing';
import '../globals.css';

// Revela o gate ANTES do first paint quando JS está ativo e as saídas de
// emergência não se aplicam (spec Fase 3 §6). Roda como primeiro filho do
// body: o overlay vem depois no DOM, então não há flash.
const GATE_BOOT = `(function(){try{if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;if(sessionStorage.getItem('mordekaiser-gate-seen'))return;document.documentElement.setAttribute('data-gate','on')}catch(e){}})()`;

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'meta' });
  return { title: t('title'), description: t('description') };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'gate' });
  const tSound = await getTranslations({ locale, namespace: 'sound' });

  return (
    <html
      lang={locale}
      // O boot script muda atributos do <html> antes da hidratação.
      suppressHydrationWarning
      className={`${display.variable} ${blackletter.variable} ${body.variable} ${mono.variable}`}
    >
      <body>
        <script dangerouslySetInnerHTML={{ __html: GATE_BOOT }} />
        <EntryGate
          labels={{
            label: t('label'),
            loading: t('loading'),
            enter: t('enter'),
            progress: t.raw('progress') as string,
          }}
        />
        {children}
        <SoundToggle
          labels={{ enable: tSound('enable'), disable: tSound('disable') }}
        />
        <div aria-hidden className="realm-ambiance-track" />
        <SoulsLayer />
        <WebGLMount />
        <SmoothScroll />
      </body>
    </html>
  );
}
