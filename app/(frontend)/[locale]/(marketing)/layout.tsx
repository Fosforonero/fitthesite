import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { locales, type Locale, getDictionary } from "@/lib/i18n";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CookieBanner from "@/components/CookieBanner";
import MarketingBackdrop from "@/components/MarketingBackdrop";
import { APPLE_APP_ID } from "@/lib/flags";

/** Pre-render both locales at build time for SEO. */
export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

/** Layout marketing: Smart App Banner iOS condiviso per tutte le pagine marketing */
export async function generateMetadata(): Promise<Metadata> {
  return {
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
  // Rettifica 21/10/2026: i componenti client (CookieBanner, e MobileMenu via Header) ricevono SOLO la chiave che usano:
  // tutto cio' che passa a un componente client finisce nei dati incorporati di ogni pagina. Prima ci finiva il
  // dizionario intero (voce promozionale Mesh, etichette dell'area impostazioni). Nessun dizionario modificato.

  return (
    <>
      <MarketingBackdrop />
      <Header dict={dict} locale={lc} />
      <main className="flex-1">{children}</main>
      <Footer dict={dict} locale={lc} />
      <CookieBanner dict={{ cookie_banner: dict.cookie_banner }} />
    </>
  );
}
