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
    it: 'FitMesh Sync: sincronizza il tuo smartwatch a una dashboard personale nell\'app',
    en: 'FitMesh Sync: sync your smartwatch to a personal app dashboard',
    es: 'FitMesh Sync: sincroniza tu smartwatch con un panel personal en la app',
    de: 'FitMesh Sync: Synchronisiere deine Smartwatch mit einem persönlichen App-Dashboard',
    pt: 'FitMesh Sync: sincronize seu smartwatch com um painel pessoal no app',
    fr: 'FitMesh Sync : synchronisez votre montre connectée avec un tableau de bord personnel dans l\'application',
    pl: 'FitMesh Sync: synchronizuj swój smartwatch z osobistym panelem w aplikacji',
    tr: 'FitMesh Sync: Akıllı saatinizi uygulamadaki kişisel bir panele senkronize edin',
    nl: 'FitMesh Sync: Synchroniseer je smartwatch met een persoonlijk dashboard in de app',
    ja: 'FitMesh Sync: スマートウォッチをアプリ内の個人ダッシュボードへ同期',
    ko: 'FitMesh Sync: 스마트워치를 앱 내 개인 대시보드와 동기화',
    sv: 'FitMesh Sync: Synka din smartklocka till en personlig dashboard i appen',
    da: 'FitMesh Sync: Synkronisér dit smartwatch til et personligt dashboard i appen',
    no: 'FitMesh Sync: Synkroniser smartklokken din til et personlig dashbord i appen',
    fi: 'FitMesh Sync: Synkronoi älykellosi sovelluksen henkilökohtaiseen koontinäyttöön',
  };
  const descriptions: Record<Locale, string> = {
    it: 'FitMesh Sync sincronizza Galaxy Watch e Wear OS con una dashboard premium nell\'app: passi, battito, sonno, calorie. Privacy-first, zero tracker pubblicitari.',
    en: 'FitMesh Sync syncs Galaxy Watch and Wear OS data to a premium in-app dashboard: steps, heart rate, sleep, calories. Privacy-first. No ad trackers.',
    es: 'FitMesh Sync sincroniza Galaxy Watch y Wear OS con un panel premium en la app: pasos, frecuencia cardíaca, sueño, calorías. Privacidad primero, sin rastreadores publicitarios.',
    de: 'FitMesh Sync synchronisiert Galaxy Watch und Wear OS mit einem Premium-App-Dashboard: Schritte, Herzfrequenz, Schlaf. Datenschutz zuerst, keine Werbetracker.',
    pt: 'FitMesh Sync sincroniza Galaxy Watch e Wear OS com um painel premium no app: passos, frequência cardíaca, sono, calorias. Privacidade primeiro, sem rastreadores publicitários.',
    fr: 'FitMesh Sync synchronise Galaxy Watch et Wear OS vers un dashboard premium dans l\'application : pas, pouls, sommeil, calories. Confidentialité d\'abord, aucun traceur publicitaire.',
    pl: 'FitMesh Sync synchronizuje Galaxy Watch i Wear OS z premium panelem w aplikacji: kroki, tętno, sen, kalorie. Prywatność na pierwszym miejscu. Bez trackerów reklamowych.',
    tr: 'FitMesh Sync, Galaxy Watch ve Wear OS verilerini uygulamadaki premium bir panele yansıtır: adımlar, kalp atışı, uyku, kalori. Gizlilik öncelikli. Reklam izleyicisi yok.',
    nl: 'FitMesh Sync spiegelt Galaxy Watch en Wear OS data naar een premium dashboard in de app: stappen, hartslag, slaap, calorieën. Privacy-first. Geen advertentietrackers.',
    ja: 'FitMesh SyncはGalaxy WatchとWear OSのデータをアプリ内のプレミアムダッシュボードへ同期: 歩数、心拍数、睡眠、カロリー。プライバシーファースト。',
    ko: 'FitMesh Sync는 Galaxy Watch와 Wear OS 데이터를 앱 내 프리미엄 대시보드에 동기화: 걸음 수, 심박수, 수면, 칼로리. 개인정보 보호 최우선.',
    sv: 'FitMesh Sync speglar data från Galaxy Watch och Wear OS till en premium dashboard i appen: steg, puls, sömn, kalorier. Integritet först. Inga annonsspårare.',
    da: 'FitMesh Sync spejler data fra Galaxy Watch og Wear OS til et premium dashboard i appen: skridt, puls, søvn, kalorier. Privatliv først. Ingen annoncetrackere.',
    no: 'FitMesh Sync speiler data fra Galaxy Watch og Wear OS til et premium dashbord i appen: skritt, puls, søvn, kalorier. Personvern først. Ingen annonsesporere.',
    fi: 'FitMesh Sync peilaa Galaxy Watchin ja Wear OS:n tiedot sovelluksen premium-koontinäyttöön: askeleet, syke, uni, kalorit. Yksityisyys edellä. Ei mainosseurantaa.',
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
