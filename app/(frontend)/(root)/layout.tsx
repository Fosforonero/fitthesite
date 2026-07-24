import type { Metadata, Viewport } from "next";
import { RootHtmlShell } from "@/components/RootHtmlShell";
import { ROOT_METADATA_BASE, ROOT_DEFAULT_TITLE, ROOT_DEFAULT_DESCRIPTION, ROOT_VIEWPORT } from "@/lib/root-metadata";

/**
 * P0.9: root layout indipendente per la bare "/" (page.tsx qui accanto).
 * Route group `(root)`, sibling di `[locale]`, `delete-account`, `mockups`,
 * `oauth` sotto `(frontend)` — nessun segmento URL introdotto (i route
 * group non compaiono mai nel path), quindi "/" resta "/".
 *
 * Prima di P0.9 questa page.tsx viveva come sibling diretto di `[locale]/`
 * sotto lo stesso `app/(frontend)/layout.tsx` condiviso: per dare a
 * `[locale]` un root layout realmente indipendente (pattern ufficiale
 * Next.js "multiple root layouts") page.tsx doveva spostarsi in un proprio
 * route group, altrimenti avrebbe continuato a condividere lo stesso
 * root layout di `[locale]` semplicemente stando nella stessa cartella.
 *
 * `<html lang="en">`: page.tsx qui sotto usa gia' cookies()/headers() per
 * negoziare e fare redirect verso `/${locale}` PRIMA di renderizzare
 * qualunque markup visibile — resta legittimamente dinamica (safety net
 * dietro al middleware, che intercetta "/" prima nella stragrande
 * maggioranza dei casi), "en" e' solo il valore attribuito nell'istante
 * (irrilevante) in cui questo shell viene creato prima del redirect.
 */
export const metadata: Metadata = {
  ...ROOT_METADATA_BASE,
  title: ROOT_DEFAULT_TITLE,
  description: ROOT_DEFAULT_DESCRIPTION,
};
export const viewport: Viewport = ROOT_VIEWPORT;

export default function RootPathLayout({ children }: { children: React.ReactNode }) {
  return <RootHtmlShell lang="en">{children}</RootHtmlShell>;
}
