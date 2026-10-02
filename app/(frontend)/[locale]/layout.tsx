import type { Metadata, Viewport } from 'next';
import { notFound } from 'next/navigation';

import { locales, type Locale, htmlLang, ogLocale, localeAlternates } from '@/lib/i18n';
import { RootHtmlShell } from '@/components/RootHtmlShell';
import { ROOT_METADATA_BASE, ROOT_VIEWPORT } from '@/lib/root-metadata';
import { HOME_META_DESCRIPTIONS, HOME_META_TITLES } from '@/lib/content/home-meta';

const SITE_URL = 'https://www.fitmesh.fit';

export const viewport: Viewport = ROOT_VIEWPORT;

/** Pre-render both locales at build time for SEO. */
export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

/** Locale-specific metadata with hreflang alternates. */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!locales.includes(locale as Locale)) return ROOT_METADATA_BASE;
  const lc = locale as Locale;

  // Fonte unica di title/description (U-META-01..03): lib/content/home-meta.ts.
  const titles = HOME_META_TITLES;
  const descriptions = HOME_META_DESCRIPTIONS;

  return {
    ...ROOT_METADATA_BASE,
    title: titles[lc],
    description: descriptions[lc],
    alternates: {
      canonical: `${SITE_URL}/${lc}`,
      languages: localeAlternates((l) => `${SITE_URL}/${l}`),
    },
    openGraph: {
      type: 'website',
      url: `${SITE_URL}/${lc}`,
      siteName: 'FitMesh Sync',
      title: titles[lc],
      description: descriptions[lc],
      locale: ogLocale[lc],
      alternateLocale: locales
        .filter((l) => l !== lc)
        .map((l) => ogLocale[l]),
    },
    twitter: {
      card: 'summary_large_image',
      title: 'FitMesh Sync',
      description: descriptions[lc],
    },
  };
}

/**
 * Root layout per tutte le route `/[locale]/*` (P0.9: vero root layout —
 * definisce `<html lang>`/`<body>` tramite RootHtmlShell, nessun layout
 * condiviso sopra di questo). `params.locale` e' sempre noto staticamente
 * (generateStaticParams sopra copre le 15 locale), quindi `<html lang>` si
 * risolve interamente server-side senza leggere alcun header di richiesta.
 *
 * Header/Footer/CookieBanner sono SPECIFICI del route group `(marketing)`.
 * Le route `/app/*` (private area) e `/admin/*` hanno layout propri con
 * navigazione dedicata.
 */
export default async function LocaleLayout({
  params,
  children,
}: {
  params: Promise<{ locale: string }>;
  children: React.ReactNode;
}) {
  const { locale } = await params;
  if (!locales.includes(locale as Locale)) notFound();
  const lc = locale as Locale;
  return <RootHtmlShell lang={htmlLang[lc]}>{children}</RootHtmlShell>;
}
