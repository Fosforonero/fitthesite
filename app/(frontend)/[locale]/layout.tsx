import type { Metadata, Viewport } from 'next';
import { notFound } from 'next/navigation';

import { locales, type Locale, htmlLang, ogLocale, localeAlternates } from '@/lib/i18n';
import { RootHtmlShell } from '@/components/RootHtmlShell';
import { ROOT_METADATA_BASE, ROOT_VIEWPORT } from '@/lib/root-metadata';

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

  const titles: Record<Locale, string> = {
    it: 'FitMesh Sync — Sincronizza il tuo smartwatch a una dashboard personale',
    en: 'FitMesh Sync — Sync your smartwatch to a personal dashboard',
    es: 'FitMesh Sync — Sincroniza tu smartwatch con un panel personal',
    de: 'FitMesh Sync: Synchronisiere deine Smartwatch mit einem persönlichen Dashboard',
    pt: 'FitMesh Sync: sincronize seu smartwatch com um painel pessoal',
    fr: 'FitMesh Sync : synchronisez votre montre connectée avec un tableau de bord personnel',
    pl: 'FitMesh Sync — synchronizuj swój smartwatch z osobistym panelem',
    tr: 'FitMesh Sync — Akıllı saatinizi kişisel bir panele senkronize edin',
    nl: 'FitMesh Sync — Synchroniseer je smartwatch met een persoonlijk dashboard',
    ja: 'FitMesh Sync — スマートウォッチを個人ダッシュボードへ同期',
    ko: 'FitMesh Sync — 스마트워치를 개인 대시보드와 동기화',
    sv: 'FitMesh Sync: Synka din smartklocka till en personlig dashboard',
    da: 'FitMesh Sync: Synkronisér dit smartwatch til et personligt dashboard',
    no: 'FitMesh Sync: Synkroniser smartklokken din til et personlig dashbord',
    fi: 'FitMesh Sync: Synkronoi älykellosi henkilökohtaiseen koontinäyttöön',
  };
  const descriptions: Record<Locale, string> = {
    it: 'FitMesh Sync sincronizza Galaxy Watch e Wear OS con una dashboard premium: passi, battito, sonno, calorie. Privacy-first, zero cloud opachi, zero tracker.',
    en: 'FitMesh Sync syncs Galaxy Watch and Wear OS data to a premium dashboard: steps, heart rate, sleep, calories. Privacy-first. No opaque clouds. No trackers.',
    es: 'FitMesh Sync sincroniza Galaxy Watch y Wear OS con un panel premium: pasos, frecuencia cardíaca, sueño, calorías. Privacidad primero, sin rastreadores.',
    de: 'FitMesh Sync synchronisiert Galaxy Watch und Wear OS mit einem Premium-Dashboard: Schritte, Herzfrequenz, Schlaf. Datenschutz zuerst, keine Tracker.',
    pt: 'FitMesh Sync sincroniza Galaxy Watch e Wear OS com um painel premium: passos, frequência cardíaca, sono, calorias. Privacidade primeiro, sem rastreadores.',
    fr: 'FitMesh Sync synchronise Galaxy Watch et Wear OS vers un dashboard premium : pas, pouls, sommeil, calories. Confidentialité d\'abord, aucun traceur.',
    pl: 'FitMesh Sync synchronizuje Galaxy Watch i Wear OS z premium panelem: kroki, tętno, sen, kalorie. Prywatność na pierwszym miejscu. Bez ukrytych trackerów.',
    tr: 'FitMesh Sync, Galaxy Watch ve Wear OS verilerini premium bir panele yansıtır: adımlar, kalp atışı, uyku, kalori. Gizlilik öncelikli. İzleyici yok.',
    nl: 'FitMesh Sync spiegelt Galaxy Watch en Wear OS data naar een premium dashboard: stappen, hartslag, slaap, calorieën. Privacy-first. Geen trackers.',
    ja: 'FitMesh SyncはGalaxy WatchとWear OSのデータをプレミアムダッシュボードへ同期: 歩数、心拍数、睡眠、カロリー。プライバシーファースト。',
    ko: 'FitMesh Sync는 Galaxy Watch와 Wear OS 데이터를 프리미엄 대시보드에 동기화: 걸음 수, 심박수, 수면, 칼로리. 개인정보 보호 최우선.',
    sv: 'FitMesh Sync speglar data från Galaxy Watch och Wear OS till en premium dashboard: steg, puls, sömn, kalorier. Integritet först. Inga dolda spårare.',
    da: 'FitMesh Sync spejler data fra Galaxy Watch og Wear OS til et premium dashboard: skridt, puls, søvn, kalorier. Privatliv først. Ingen skjulte trackere.',
    no: 'FitMesh Sync speiler data fra Galaxy Watch og Wear OS til et premium dashbord: skritt, puls, søvn, kalorier. Personvern først. Ingen skjulte sporere.',
    fi: 'FitMesh Sync peilaa Galaxy Watchin ja Wear OS:n tiedot premium-koontinäyttöön: askeleet, syke, uni, kalorit. Yksityisyys edellä. Ei piilotettua seurantaa.',
  };

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
