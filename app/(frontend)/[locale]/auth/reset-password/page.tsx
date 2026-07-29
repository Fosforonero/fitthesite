import type { Metadata } from 'next';
import type { Locale } from '@/lib/i18n';
import { ResetPasswordForm } from './ResetPasswordForm';
import { RESET_PASSWORD_LOCALES, TRANSLATIONS, type ResetPasswordLocale } from './translations';

export const dynamic = 'force-static';

function resolveLocale(locale: string): ResetPasswordLocale {
  return (RESET_PASSWORD_LOCALES as readonly string[]).includes(locale)
    ? (locale as ResetPasswordLocale)
    : 'en';
}

/**
 * Senza questo, la route ereditava titolo, description e canonical dal root
 * layout, cioe' quelli della HOMEPAGE: in produzione le 11 pagine servivano
 * `<meta name="robots" content="index, follow">` e un canonical verso
 * `/<locale>`, invitando l'indicizzazione di una pagina di auth e
 * consolidandola sulla home (verificato dal vivo il 2026-07-25).
 *
 * `noindex, nofollow` e' dichiarato QUI e non come `Disallow` in robots.txt di
 * proposito: un path bloccato da robots.txt non viene letto, quindi il crawler
 * non vedrebbe mai il noindex e l'URL potrebbe restare indicizzato "alla
 * cieca". Lasciare la route leggibile e' cio' che rende il noindex efficace.
 * (Il `Disallow: /auth/` gia' presente in robots.txt non copre comunque questi
 * path, che sono `/<locale>/auth/...`.)
 *
 * `openGraph`/`twitter` sono dedicati alla recovery, non un `{}` vuoto: un
 * `generateMetadata` che non definisce `openGraph` erediterebbe quello del
 * layout `[locale]` (title/description/url della HOMEPAGE) — lo stesso bug
 * di title/canonical gia' corretto sopra, ma nella superficie social. Nessuna
 * immagine dedicata: quella della homepage (da file convention, fuori da
 * questo oggetto) resta valida senza bisogno di duplicarla qui.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const lc = resolveLocale(locale);
  const t = TRANSLATIONS[lc];
  const canonical = `https://www.fitmesh.fit/${lc}/auth/reset-password`;

  return {
    title: t.metaTitle,
    description: t.metaDescription,
    robots: { index: false, follow: false },
    alternates: { canonical },
    openGraph: {
      type: 'website',
      url: canonical,
      title: t.metaTitle,
      description: t.metaDescription,
    },
    twitter: {
      title: t.metaTitle,
      description: t.metaDescription,
    },
  };
}

export default async function ResetPasswordPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const lc = resolveLocale(locale);

  const t = TRANSLATIONS[lc];

  return (
    <main className="max-w-md mx-auto px-4 sm:px-6 py-16 sm:py-24">
      <div className="text-center mb-8">
        <h1 className="font-display text-display-md font-semibold tracking-tightest text-text-primary">
          {t.title}
        </h1>
        <p className="mt-3 text-text-secondary leading-relaxed">{t.subtitle}</p>
      </div>

      <ResetPasswordForm locale={lc as Locale} translations={t} />
    </main>
  );
}
