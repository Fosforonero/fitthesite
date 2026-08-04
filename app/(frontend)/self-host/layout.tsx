import type { Metadata, Viewport } from "next";
import MarketingBackdrop from "@/components/MarketingBackdrop";
import CookieBanner from "@/components/CookieBanner";
import { getDictionary } from "@/lib/i18n";
import { RootHtmlShell } from "@/components/RootHtmlShell";
import { ROOT_METADATA_BASE, ROOT_VIEWPORT } from "@/lib/root-metadata";
import { SELF_HOST_COPY, t } from "@/lib/content/self-host-copy";
import { SITE_URL } from "@/lib/product-facts";

/**
 * Addendum pre-merge PR#39 — `/self-host` bare (nessun prefisso locale)
 * deve rispondere 200 direttamente sulla stringa letterale compilata
 * nell'app (`https://www.fitmesh.fit/self-host`), mai un redirect. Stesso
 * pattern di `/delete-account` (P0.4D): route indipendente fuori da
 * `[locale]`, `<html lang="en">` fisso lato SSR, negoziazione lingua
 * interamente client-side (toggle in components/SelfHostStatusView.tsx,
 * mai un redirect di path) — vedi middleware.ts `NON_LOCALIZED_PREFIXES`.
 *
 * Noindex (follow): la feature non è disponibile al pubblico, questa è una
 * nota tecnica di stato, non una pagina di acquisizione — vedi
 * app/sitemap.ts (nessuna entry /self-host) e
 * tools/check-self-host-privacy-truth.ts.
 */
const PAGE_URL = `${SITE_URL}/self-host`;

export const metadata: Metadata = {
  ...ROOT_METADATA_BASE,
  title: t(SELF_HOST_COPY.metaTitle, "en"),
  description: t(SELF_HOST_COPY.metaDescription, "en"),
  alternates: {
    canonical: PAGE_URL,
  },
  robots: { index: false, follow: true },
};
export const viewport: Viewport = ROOT_VIEWPORT;

export default async function SelfHostBareLayout({
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
