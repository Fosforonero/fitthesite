import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { locales, type Locale, ogLocale, htmlLang, getDictionary, localeAlternates } from "@/lib/i18n";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CookieBanner from "@/components/CookieBanner";
import MarketingBackdrop from "@/components/MarketingBackdrop";
import MotionProvider from "@/components/motion/MotionProvider";
import RevealObserver from "@/components/motion/RevealObserver";
import SmoothScroll from "@/components/motion/SmoothScroll";
import { JsonLd } from "@/components/seo/JsonLd";
import { PRICE_LIFETIME_ANDROID_RAW } from "@/lib/pricing";
import { TRADER, TRADER_POSTAL_ADDRESS } from "@/lib/legal/trader";
import { IOS_ENABLED, APPLE_APP_ID, APPLE_STORE_URL } from "@/lib/flags";

const SITE_URL = "https://www.fitmesh.fit";

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

  // JSON-LD @graph: Organization + WebSite + MobileApplication. Tutti gli
  // schemi sono cross-referenziati via @id per knowledge graph stability.
  const orgDescription = lc === "it"
    ? "FitMesh Sync sincronizza i dati del tuo smartwatch su una dashboard personale privacy-first. Galaxy Watch, Wear OS, Health Connect."
    : "FitMesh Sync mirrors your smartwatch data to a privacy-first personal dashboard. Galaxy Watch, Wear OS, Health Connect.";
  const appDescription = lc === "it"
    ? "Sincronizza Galaxy Watch e Wear OS con una dashboard premium: passi, battito, sonno, calorie e VO₂ max. Niente cloud opachi."
    : "Mirror Galaxy Watch and Wear OS data to a premium personal dashboard: steps, heart rate, sleep, calories, VO₂ max. No opaque clouds.";

  const featureList = lc === "it"
    ? [
        "Sincronizza Galaxy Watch, Wear OS e wearable Health Connect",
        "Dashboard premium per passi, battito, sonno, calorie, VO2 max",
        "Mesh Famiglia — monitora salute familiari (passi, sonno, attivita)",
        "Privacy-first: server EU, GDPR, niente tracker o cloud opachi",
        "Offline-first con sync background ogni 15-30 minuti",
      ]
    : [
        "Sync Galaxy Watch, Wear OS, and Health Connect wearables",
        "Premium dashboard for steps, heart rate, sleep, calories, VO2 max",
        "Family Mesh — monitor family health (steps, sleep, activity)",
        "Privacy-first: EU servers, GDPR, no trackers or opaque clouds",
        "Offline-first with background sync every 15-30 minutes",
      ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${SITE_URL}#organization`,
        name: "FitMesh Sync",
        alternateName: ["FitMesh", "FitMesh Sync Health Dashboard", "FitMesh Android Health Tracker"],
        legalName: TRADER.legalName,
        url: SITE_URL,
        description: orgDescription,
        address: TRADER_POSTAL_ADDRESS,
        ...(TRADER.vat !== "IT00000000000" && { vatID: TRADER.vat, taxID: TRADER.vat }),
        logo: {
          "@type": "ImageObject",
          url: `${SITE_URL}/icon-square.png`,
          contentUrl: `${SITE_URL}/icon-square.png`,
          width: 1254,
          height: 1254,
          caption: "FitMesh Sync — app icon (FM monogram)",
        },
        image: `${SITE_URL}/icon-square.png`,
        sameAs: [
          "https://play.google.com/store/apps/details?id=com.fitmeshsync.app",
          "https://www.fosforonero.com",
        ],
        email: "hello@fitmesh.fit",
        founder: {
          "@type": "Person",
          name: "Matteo Pizzi",
        },
        foundingDate: "2026-04",
        areaServed: ["IT", "EU"],
        contactPoint: [
          {
            "@type": "ContactPoint",
            email: "support@fitmesh.fit",
            contactType: "customer support",
            availableLanguage: ["Italian", "English"],
          },
        ],
      },
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}#website`,
        url: `${SITE_URL}/${lc}`,
        name: "FitMesh Sync",
        description: orgDescription,
        inLanguage: ogLocale[lc].replace("_", "-"),
        publisher: { "@id": `${SITE_URL}#organization` },
        // SearchAction → eligibility per sitelinks search box in Google SERP.
        // Target template URL deve contenere {search_term_string} (segnaposto
        // sostituito da Google con la query). Anche se internal search non
        // esiste come pagina dedicata, Google indicizza le URL articoli/landing
        // via il template di redirect.
        potentialAction: {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: `${SITE_URL}/${lc}/blog?q={search_term_string}`,
          },
          "query-input": "required name=search_term_string",
        },
      },
      {
        "@type": "MobileApplication",
        "@id": `${SITE_URL}#mobile-app`,
        name: "FitMesh Sync",
        alternateName: "FitMesh Android Health Tracker",
        description: appDescription,
        operatingSystem: "Android 8.0 and up",
        applicationCategory: "HealthApplication",
        applicationSubCategory: "Fitness",
        inLanguage: ogLocale[lc].replace("_", "-"),
        offers: [
          { "@type": "Offer", price: PRICE_LIFETIME_ANDROID_RAW, priceCurrency: "EUR", category: "Onetime purchase" },
        ],
        url: "https://play.google.com/store/apps/details?id=com.fitmeshsync.app",
        downloadUrl: "https://play.google.com/store/apps/details?id=com.fitmeshsync.app",
        publisher: { "@id": `${SITE_URL}#organization` },
        image: `${SITE_URL}/icon-square.png`,
        // Screenshot reali dell'app. Solo it/ e en/ hanno asset propri;
        // tutte le altre locale usano en/ come fallback per evitare 404.
        screenshot: (() => {
          const sl = lc === "it" ? "it" : "en";
          const captions: Record<string, [string, string]> = {
            dashboard: [
              "Dashboard FitMesh Sync: passi, battito, calorie, sonno e Recovery Index",
              "FitMesh Sync dashboard: steps, heart rate, calories, sleep and Recovery Index",
            ],
            sleep: [
              "Sonno con fasi (profondo, REM, leggero) e salute del cuore",
              "Sleep stages (deep, REM, light) and heart health",
            ],
            week: [
              "Confronto settimanale: passi, sonno, calorie e battito medio",
              "Week-over-week comparison: steps, sleep, calories and average heart rate",
            ],
            trends: [
              "Trend di passi e calorie negli ultimi 7 giorni",
              "Steps and calories trends over the last 7 days",
            ],
            vitals: [
              "SpO₂, piani saliti e metriche avanzate",
              "SpO₂, floors climbed and advanced metrics",
            ],
          };
          return Object.entries(captions).map(([name, [capIt, capEn]]) => ({
            "@type": "ImageObject",
            url: `${SITE_URL}/screens/${sl}/${name}.jpg`,
            caption: lc === "it" ? capIt : capEn,
            width: 720,
            height: 1440,
          }));
        })(),
        featureList,
        softwareVersion: "3.2.2",
        // releaseNotes deliberatamente omesso: i tester non vedono la SERP
        // public-facing, e popolarlo richiede manutenzione ad ogni release.
      },
      // App iOS — emessa nel @graph solo a go-live (IOS_ENABLED). Tenuta OFF
      // finché l'app non è disponibile nei 27 paesi UE (verifica DSA Apple).
      ...(IOS_ENABLED
        ? [
            {
              "@type": "MobileApplication",
              "@id": `${SITE_URL}#mobile-app-ios`,
              name: "FitMesh Sync",
              alternateName: "FitMesh iOS Health Tracker",
              description: appDescription,
              operatingSystem: "iOS 15.0 and up",
              applicationCategory: "HealthApplication",
              applicationSubCategory: "Fitness",
              inLanguage: ogLocale[lc].replace("_", "-"),
              offers: [
                { "@type": "Offer", price: PRICE_LIFETIME_ANDROID_RAW, priceCurrency: "EUR", category: "Onetime purchase" },
              ],
              url: APPLE_STORE_URL,
              downloadUrl: APPLE_STORE_URL,
              publisher: { "@id": `${SITE_URL}#organization` },
              image: `${SITE_URL}/icon-square.png`,
              featureList,
            },
          ]
        : []),
    ],
  };

  return (
    <>
      {/* Attiva il gating dei reveal PRIMA del paint (no FOUC): senza questo
          script (JS off / reduced-motion) tutto il contenuto resta visibile.
          Vedi RevealObserver + globals.css ([data-reveal]). */}
      <script
        dangerouslySetInnerHTML={{
          __html: "document.documentElement.classList.add('reveal-ready')",
        }}
      />
      <JsonLd data={jsonLd} />
      <MotionProvider>
        <MarketingBackdrop />
        <Header dict={dict} locale={lc} />
        <main className="flex-1">{children}</main>
        <Footer dict={dict} locale={lc} />
      </MotionProvider>
      <RevealObserver />
      <SmoothScroll />
      <CookieBanner dict={dict} />
    </>
  );
}
