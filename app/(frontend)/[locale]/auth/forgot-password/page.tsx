import type { Metadata } from 'next';
import type { Locale } from '@/lib/i18n';
import { ForgotPasswordForm } from './ForgotPasswordForm';
import { FORGOT_PASSWORD_LOCALES, TRANSLATIONS, type ForgotPasswordLocale } from './translations';

export const dynamic = 'force-static';

function resolveLocale(locale: string): ForgotPasswordLocale {
  return (FORGOT_PASSWORD_LOCALES as readonly string[]).includes(locale)
    ? (locale as ForgotPasswordLocale)
    : 'en';
}

/**
 * Hotfix P0.10R. Metadata dedicati per gli stessi motivi documentati in
 * `../reset-password/page.tsx`: senza, la route erediterebbe title,
 * description e canonical dal layout `[locale]`, cioe' quelli della
 * HOMEPAGE, invitando l'indicizzazione di una pagina di auth e
 * consolidandola sulla home.
 *
 * `noindex, nofollow` qui e non come `Disallow` in robots.txt: un path
 * bloccato da robots non viene letto, quindi il crawler non vedrebbe mai il
 * noindex e l'URL potrebbe restare indicizzato "alla cieca".
 *
 * Il canonical e' self-referenziante e usa la locale RISOLTA (`lc`), non
 * quella grezza dall'URL: per sv/da/no/fi — che servono contenuto inglese
 * per convenzione di sito — punta comunque a se stessa, mai a `/en`, per
 * non dichiarare canonical una pagina diversa da quella servita.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const lc = resolveLocale(locale);
  const t = TRANSLATIONS[lc];
  const canonical = `https://www.fitmesh.fit/${locale}/auth/forgot-password`;

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

export default async function ForgotPasswordPage({
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

      {/*
        `locale` grezza (non `lc`): il redirectTo e i link devono restare
        nella locale che l'utente sta realmente visitando. Per sv/da/no/fi
        il testo e' inglese ma l'URL resta /sv/..., cosi' non lo si sbatte
        su /en a meta' flusso.
      */}
      <ForgotPasswordForm locale={locale as Locale} translations={t} />
    </main>
  );
}
