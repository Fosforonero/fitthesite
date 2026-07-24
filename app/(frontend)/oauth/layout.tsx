import type { Metadata, Viewport } from "next";
import { RootHtmlShell } from "@/components/RootHtmlShell";
import { ROOT_METADATA_BASE, ROOT_VIEWPORT } from "@/lib/root-metadata";

/**
 * P0.9: root layout indipendente per `/oauth/*` (callback provider — Strava,
 * Fitbit, Polar, Withings, Oura). Prima viveva sotto il vecchio
 * `app/(frontend)/layout.tsx` condiviso, rimosso — queste route non avevano
 * alcun layout.tsx proprio. `<html lang="it">`: il contenuto SSR di
 * entrambe le pagine sotto `/oauth/*` e' hardcoded in italiano (vedi
 * strava-callback/page.tsx, [provider]/callback/page.tsx). Non indicizzabile
 * di natura (nessun contenuto, solo un redirect/deep-link handoff verso
 * l'app), ma senza `noindex` esplicito perche' nessuno l'ha mai richiesto —
 * non introdotto qui, fuori scope P0.9.
 */
export const metadata: Metadata = ROOT_METADATA_BASE;
export const viewport: Viewport = ROOT_VIEWPORT;

export default function OauthLayout({ children }: { children: React.ReactNode }) {
  return <RootHtmlShell lang="it">{children}</RootHtmlShell>;
}
