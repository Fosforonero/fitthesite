import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { locales, type Locale, ogLocale, htmlLang, getDictionary, localeAlternates } from "@/lib/i18n";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CookieBanner from "@/components/CookieBanner";
import MarketingBackdrop from "@/components/MarketingBackdrop";
import { IOS_ENABLED, APPLE_APP_ID } from "@/lib/flags";
import { SITE_URL } from "@/lib/product-facts";

/** Pre-render both locales at build time for SEO. */
export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

/** Locale-specific metadata with hreflang alternates. */
export async function generateMetadata(
  { params }: { params: Promise<{ locale: string }> },
): Promise<Metadata> {
  const { locale } = await params;
  if (!locales.includes(locale as Locale)) return {};
  const lc = locale as Locale;

  const titles: Record<Locale, string> = {
    it: "FitMesh Sync — Una dashboard globale per tutti i tuoi dispositivi",
    en: "FitMesh Sync — One global dashboard for all your devices",
    es: "FitMesh Sync — Un panel global para todos tus dispositivos",
    de: "FitMesh Sync — Ein globales Dashboard für alle deine Geräte",
    pt: "FitMesh Sync — Um painel global para todos os seus dispositivos",
    fr: "FitMesh Sync — Un tableau de bord global pour tous vos appareils",
    pl: "FitMesh Sync — jeden globalny panel dla wszystkich Twoich urzadzen",
    tr: "FitMesh Sync — Tum cihazlariniz icin tek bir global panel",
    nl: "FitMesh Sync — Één global dashboard voor al je apparaten",
    ja: "FitMesh Sync — すべてのデバイスをひとつのグローバルダッシュボードへ",
    ko: "FitMesh Sync — 모든 기기를 위한 하나의 글로벌 대시보드",
    sv: "FitMesh Sync: En global dashboard för alla dina enheter",
    da: "FitMesh Sync: Ét globalt dashboard til alle dine enheder",
    no: "FitMesh Sync: Ett globalt dashbord for alle enhetene dine",
    fi: "FitMesh Sync: Yksi maailmanlaajuinen koontinäyttö kaikille laitteillesi",
  };
  const descriptions: Record<Locale, string> = {
    it: "FitMesh Sync unisce Galaxy Watch, Wear OS, Health Connect e provider cloud in una dashboard globale: passi, battito, sonno, recupero e trend. Privacy-first, niente tracker.",
    en: "FitMesh Sync brings Galaxy Watch, Wear OS, Health Connect and cloud providers into one global dashboard: steps, heart rate, sleep, recovery, trends. Privacy-first. No trackers.",
    es: "FitMesh Sync reúne Galaxy Watch, Wear OS, Health Connect y proveedores en la nube en un panel global: pasos, frecuencia cardíaca, sueño, recuperación y tendencias. Centrado en tu privacidad, sin rastreadores.",
    de: "FitMesh Sync verbindet Galaxy Watch, Wear OS, Health Connect und Cloud-Dienste in einem globalen Dashboard: Schritte, Herzfrequenz, Schlaf, Erholung und Trends. Datenschutz-first. Keine Tracker.",
    pt: "FitMesh Sync reúne Galaxy Watch, Wear OS, Health Connect e provedores em nuvem em um painel global: passos, frequência cardíaca, sono, recuperação e tendências. Privacidade em primeiro lugar. Sem rastreadores.",
    fr: "FitMesh Sync regroupe Galaxy Watch, Wear OS, Health Connect et les services cloud dans un tableau de bord global: pas, fréquence cardiaque, sommeil, récupération et tendances. Confidentialité avant tout. Sans traceurs.",
    pl: "FitMesh Sync łączy Galaxy Watch, Wear OS, Health Connect i dostawców chmury w jednym panelu: kroki, tętno, sen, regeneracja i trendy. Prywatność na pierwszym miejscu. Bez trackerów.",
    tr: "FitMesh Sync, Galaxy Watch, Wear OS, Health Connect ve bulut sağlayıcılarını tek bir global panelde bir araya getirir: adımlar, kalp atışı, uyku, toparlanma ve trendler. Gizlilik öncelikli. İzleyici yok.",
    nl: "FitMesh Sync brengt Galaxy Watch, Wear OS, Health Connect en cloudproviders samen in één global dashboard: stappen, hartslag, slaap, herstel en trends. Privacy-first. Geen trackers.",
    ja: "FitMesh Syncは、Galaxy Watch、Wear OS、Health Connect、およびクラウドプロバイダーを1つのグローバルダッシュボードに統合：ステップ数、心拍数、睡眠、回復、傾向。プライバシーを最優先に、EUサーバー、GDPR準拠。トラッカーなし。",
    ko: "FitMesh Sync은 Galaxy Watch, Wear OS, Health Connect 및 클라우드 제공업체를 한 글로벌 대시보드로 통합합니다: 걸음 수, 심박수, 수면, 회복, 추세. 개인정보 보호를 최우선으로, EU 서버, GDPR 준수. 트래커 없음.",
    sv: "FitMesh Sync samlar Galaxy Watch, Wear OS, Health Connect och molntjänster i en global dashboard: steg, puls, sömn, återhämtning och trender. Integritet först. Inga spårare.",
    da: "FitMesh Sync samler Galaxy Watch, Wear OS, Health Connect og cloud-udbydere i ét globalt dashboard: skridt, puls, søvn, restitution og tendenser. Privatliv først. Ingen trackere.",
    no: "FitMesh Sync samler Galaxy Watch, Wear OS, Health Connect og skytjenester i ett globalt dashbord: skritt, puls, søvn, restitusjon og trender. Personvern først. Ingen sporere.",
    fi: "FitMesh Sync kokoaa Galaxy Watchin, Wear OS:n, Health Connectin ja pilvipalvelut yhteen maailmanlaajuiseen koontinäyttöön: askeleet, syke, uni, palautuminen ja trendit. Yksityisyys edellä. Ei seurantaa.",
  };

  return {
    title: titles[lc],
    description: descriptions[lc],
    alternates: {
      canonical: `${SITE_URL}/${lc}`,
      languages: localeAlternates((l) => `${SITE_URL}/${l}`),
    },
    openGraph: {
      type: "website",
      url: `${SITE_URL}/${lc}`,
      siteName: "FitMesh Sync",
      title: titles[lc],
      description: descriptions[lc],
      locale: ogLocale[lc],
      alternateLocale: locales.filter((l) => l !== lc).map((l) => ogLocale[l]),
    },
    twitter: {
      card: "summary_large_image",
      title: "FitMesh Sync",
      description: descriptions[lc],
    },
    // Smart App Banner iOS — attivo solo a go-live (flag) con App Store ID reale.
    ...(IOS_ENABLED && {
      other: { "apple-itunes-app": `app-id=${APPLE_APP_ID.replace(/^id/, "")}` },
    }),
  };
}

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
  const dict = await getDictionary(lc);

  return (
    <>
      <MarketingBackdrop />
      <Header dict={dict} locale={lc} />
      <main className="flex-1">{children}</main>
      <Footer dict={dict} locale={lc} />
      <CookieBanner dict={dict} />
    </>
  );
}
