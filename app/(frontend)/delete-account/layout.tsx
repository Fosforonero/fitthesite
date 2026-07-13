import MarketingBackdrop from "@/components/MarketingBackdrop";
import CookieBanner from "@/components/CookieBanner";
import { getDictionary } from "@/lib/i18n";

/**
 * Layout dedicato per /delete-account: NON riusa `[locale]/(marketing)/layout.tsx`
 * (questa route vive fuori da `[locale]`, di proposito: URL unico, non
 * localizzato, richiesto da Google Play/App Store). Niente <Header/> globale
 * qui: il suo `<LanguageSwitcher/>` costruisce i link cambiando il primo
 * segmento di `usePathname()` (es. `/de/delete-account`), che non esiste per
 * questa route e produrrebbe un 404 — vedi lib/i18n.ts + middleware.ts
 * `NON_LOCALIZED_PREFIXES`. Il cookie banner resta invece invariato: il
 * consent GA4 (root layout) si applica a ogni pagina del sito, questa inclusa.
 */
export default async function DeleteAccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const dict = await getDictionary("en");
  return (
    <>
      <MarketingBackdrop />
      <main className="flex-1">{children}</main>
      <CookieBanner dict={dict} />
    </>
  );
}
