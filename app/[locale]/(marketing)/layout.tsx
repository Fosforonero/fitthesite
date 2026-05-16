import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { locales, type Locale, ogLocale, getDictionary } from "@/lib/i18n";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CookieBanner from "@/components/CookieBanner";
import { JsonLd } from "@/components/seo/JsonLd";

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
    it: "FitMesh Sync — Sincronizza il tuo smartwatch a una dashboard personale",
    en: "FitMesh Sync — Sync your smartwatch to a personal dashboard",
  };
  const descriptions: Record<Locale, string> = {
    it: "FitMesh Sync sincronizza Galaxy Watch e Wear OS con una dashboard premium: passi, battito, sonno, calorie e VO₂ max. Privacy-first, niente cloud opachi, niente tracker.",
    en: "FitMesh Sync mirrors Galaxy Watch and Wear OS data to a premium personal dashboard: steps, heart rate, sleep, calories, VO₂ max. Privacy-first. No opaque clouds. No trackers.",
  };

  return {
    title: titles[lc],
    description: descriptions[lc],
    alternates: {
      canonical: `${SITE_URL}/${lc}`,
      languages: {
        it: `${SITE_URL}/it`,
        en: `${SITE_URL}/en`,
        "x-default": `${SITE_URL}/it`,
      },
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

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${SITE_URL}#organization`,
        name: "FitMesh Sync",
        url: SITE_URL,
        description: orgDescription,
        logo: {
          "@type": "ImageObject",
          url: `${SITE_URL}/logo-horizontal.webp`,
          contentUrl: `${SITE_URL}/logo-horizontal.webp`,
          width: 1600,
          height: 420,
          caption: "FitMesh Sync — official horizontal logo",
        },
        image: `${SITE_URL}/logo-horizontal.webp`,
        sameAs: ["https://play.google.com/store/apps/details?id=com.fitmeshsync.app"],
        email: "hello@fitmesh.fit",
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
        inLanguage: lc === "it" ? "it-IT" : "en-US",
        publisher: { "@id": `${SITE_URL}#organization` },
      },
      {
        "@type": "MobileApplication",
        "@id": `${SITE_URL}#mobile-app`,
        name: "FitMesh Sync",
        description: appDescription,
        operatingSystem: "ANDROID",
        applicationCategory: "HealthApplication",
        applicationSubCategory: "Fitness",
        inLanguage: lc === "it" ? "it-IT" : "en-US",
        offers: [
          { "@type": "Offer", price: "3.49", priceCurrency: "EUR", category: "Onetime purchase" },
          { "@type": "Offer", price: "0.99", priceCurrency: "EUR", category: "Subscription" },
        ],
        url: "https://play.google.com/store/apps/details?id=com.fitmeshsync.app",
        downloadUrl: "https://play.google.com/store/apps/details?id=com.fitmeshsync.app",
        publisher: { "@id": `${SITE_URL}#organization` },
      },
    ],
  };

  return (
    <>
      <JsonLd data={jsonLd} />
      <Header dict={dict} locale={lc} />
      <main className="flex-1">{children}</main>
      <Footer dict={dict} locale={lc} />
      <CookieBanner dict={dict} />
    </>
  );
}
