import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { locales, type Locale, ogLocale, localeAlternates } from '@/lib/i18n';

const SITE_URL = 'https://www.fitmesh.fit';

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
  if (!locales.includes(locale as Locale)) return {};
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
  };
  const descriptions: Record<Locale, string> = {
    it: 'FitMesh Sync sincronizza Galaxy Watch e Wear OS con una dashboard premium: passi, battito, sonno, calorie e VO₂ max. Privacy-first, niente cloud opachi, niente tracker.',
    en: 'FitMesh Sync mirrors Galaxy Watch and Wear OS data to a premium personal dashboard: steps, heart rate, sleep, calories, VO₂ max. Privacy-first. No opaque clouds. No trackers.',
    es: 'FitMesh Sync sincroniza Galaxy Watch y Wear OS con un panel premium: pasos, frecuencia cardíaca, sueño, calorías y VO₂ máx. Centrado en tu privacidad, sin nubes opacas ni rastreadores.',
    de: 'FitMesh Sync synchronisiert Galaxy Watch und Wear OS mit einem Premium-Dashboard: Schritte, Herzfrequenz, Schlaf, Kalorien und VO₂ max. Datenschutz zuerst, keine undurchsichtigen Clouds, keine Tracker.',
    pt: 'O FitMesh Sync sincroniza Galaxy Watch e Wear OS com um painel premium: passos, frequência cardíaca, sono, calorias e VO₂ máx. Privacidade em primeiro lugar, sem nuvens opacas, sem rastreadores.',
    fr: 'FitMesh Sync synchronise Galaxy Watch et Wear OS avec un tableau de bord premium : pas, fréquence cardiaque, sommeil, calories et VO₂ max. Confidentialité avant tout, aucun cloud opaque, aucun traceur.',
    pl: 'FitMesh Sync synchronizuje Galaxy Watch i Wear OS z premium panelem: kroki, tętno, sen, kalorie i VO₂ max. Prywatność na pierwszym miejscu. Bez ukrytych chmur. Bez trackerów.',
    tr: 'FitMesh Sync, Galaxy Watch ve Wear OS verilerini premium bir kişisel panele yansıtır: adımlar, kalp atışı, uyku, kalori ve VO₂ maks. Gizlilik öncelikli. Opak bulut yok. İzleyici yok.',
    nl: 'FitMesh Sync spiegelt Galaxy Watch en Wear OS data naar een premium persoonlijk dashboard: stappen, hartslag, slaap, calorieën en VO₂ max. Privacy-first. Geen ondoorzichtige clouds. Geen trackers.',
    ja: 'FitMesh SyncはGalaxy WatchとWear OSのデータをプレミアムダッシュボードへ同期: 歩数、心拍数、睡眠、カロリー、VO₂ max。プライバシーファースト。',
    ko: 'FitMesh Sync는 Galaxy Watch와 Wear OS 데이터를 프리미엄 대시보드에 동기화: 걸음 수, 심박수, 수면, 칼로리, VO₂ max. 개인정보 보호 최우선.',
  };

  return {
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
 * Root locale layout — minimal wrapper.
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
  return <>{children}</>;
}
