import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { locales, type Locale, ogLocale, getDictionary } from "@/lib/i18n";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CookieBanner from "@/components/CookieBanner";

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

  // JSON-LD: Organization + WebSite + MobileApplication
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${SITE_URL}#organization`,
        name: "FitMesh Sync",
        url: SITE_URL,
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
        name: "FitMesh Sync",
        operatingSystem: "ANDROID",
        applicationCategory: "HealthApplication",
        offers: [
          { "@type": "Offer", price: "3.49", priceCurrency: "EUR", category: "Onetime purchase" },
          { "@type": "Offer", price: "0.99", priceCurrency: "EUR", category: "Subscription" },
        ],
        url: "https://play.google.com/store/apps/details?id=com.fitmeshsync.app",
        publisher: { "@id": `${SITE_URL}#organization` },
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Header dict={dict} locale={lc} />
      <main className="flex-1">{children}</main>
      <Footer dict={dict} locale={lc} />
      <CookieBanner dict={dict} />
    </>
  );
}
