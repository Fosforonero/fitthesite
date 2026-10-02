import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { locales, type Locale, ogLocale, htmlLang, getDictionary, localeAlternates } from "@/lib/i18n";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CookieBanner from "@/components/CookieBanner";
import MarketingBackdrop from "@/components/MarketingBackdrop";
import { APPLE_APP_ID } from "@/lib/flags";
import { SITE_URL } from "@/lib/product-facts";
import { HOME_META_DESCRIPTIONS, HOME_META_TITLES } from "@/lib/content/home-meta";

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

  // Fonte unica di title/description (U-META-01..03): lib/content/home-meta.ts.
  const titles = HOME_META_TITLES;
  const descriptions = HOME_META_DESCRIPTIONS;

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
    // Smart App Banner iOS — sempre emesso, l'app è live sull'App Store
    // (incluse tutte le storefront UE, verificato 2026-07-13).
    other: { "apple-itunes-app": `app-id=${APPLE_APP_ID}` },
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
