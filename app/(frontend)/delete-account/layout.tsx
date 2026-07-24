import type { Metadata, Viewport } from "next";
import MarketingBackdrop from "@/components/MarketingBackdrop";
import CookieBanner from "@/components/CookieBanner";
import { getDictionary } from "@/lib/i18n";
import { RootHtmlShell } from "@/components/RootHtmlShell";
import { ROOT_METADATA_BASE, ROOT_DEFAULT_TITLE, ROOT_DEFAULT_DESCRIPTION, ROOT_VIEWPORT } from "@/lib/root-metadata";

/**
 * P0.9: root layout indipendente (era annidato sotto il vecchio
 * `app/(frontend)/layout.tsx` condiviso, rimosso — vedi
 * components/RootHtmlShell.tsx). `<html lang="en">` fisso: questa route
 * vive fuori da `[locale]` di proposito (URL unico, non localizzato,
 * richiesto da Google Play/App Store) e il suo contenuto SSR e' sempre in
 * inglese (il toggle IT client-side aggiorna solo il testo a schermo, non
 * l'attributo lang — vedi components/DeleteAccountView.tsx).
 *
 * Niente <Header/> globale qui: il suo `<LanguageSwitcher/>` costruisce i
 * link cambiando il primo segmento di `usePathname()` (es.
 * `/de/delete-account`), che non esiste per questa route e produrrebbe un
 * 404 — vedi lib/i18n.ts + middleware.ts `NON_LOCALIZED_PREFIXES`. Il
 * cookie banner resta invece invariato: il consent GA4 si applica a ogni
 * pagina del sito, questa inclusa.
 */
export const metadata: Metadata = {
  ...ROOT_METADATA_BASE,
  title: ROOT_DEFAULT_TITLE,
  description: ROOT_DEFAULT_DESCRIPTION,
};
export const viewport: Viewport = ROOT_VIEWPORT;

export default async function DeleteAccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const dict = await getDictionary("en");
  return (
    <RootHtmlShell lang="en">
      <MarketingBackdrop />
      <main className="flex-1">{children}</main>
      <CookieBanner dict={dict} />
    </RootHtmlShell>
  );
}
