import type { Metadata, Viewport } from 'next';
import { notFound } from 'next/navigation';

import { locales, type Locale, htmlLang } from '@/lib/i18n';
import { RootHtmlShell } from '@/components/RootHtmlShell';
import { ROOT_METADATA_BASE, ROOT_VIEWPORT } from '@/lib/root-metadata';

export const viewport: Viewport = ROOT_VIEWPORT;

/** Pre-render both locales at build time for SEO. */
export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

/**
 * Root metadata per [locale]: base condivisa (metadataBase, icone, robots standard)
 * e title template neutro per le pagine che non definiscono un proprio template.
 * Canonical, hreflang e metadati specifici della Home vivono in (marketing)/page.tsx,
 * per evitare che pagine 404 o route interne ereditino i dati della Home.
 */
export async function generateMetadata({
  params,
}: {
  params?: Promise<{ locale: string }>;
} = {}): Promise<Metadata> {
  const { robots: _robots, ...base } = ROOT_METADATA_BASE;
  return {
    ...base,
    title: "FitMesh Sync",
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
