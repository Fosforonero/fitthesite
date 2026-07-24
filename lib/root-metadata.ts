import type { Metadata, Viewport } from "next";

const SITE_URL = "https://www.fitmesh.fit";

/**
 * P0.9: campi globali che vivevano nell'unico `metadata` statico del vecchio
 * `app/(frontend)/layout.tsx` (metadataBase, icone, robots, verification).
 * Ogni root layout ora indipendente li spread-a nel proprio `generateMetadata`
 * (o `metadata` statico, per le isole non-locale) — Next.js non fa piu'
 * merge automatico da un layout padre condiviso, perche' quel padre non
 * esiste piu'.
 */
export const ROOT_METADATA_BASE: Metadata = {
  metadataBase: new URL(SITE_URL),
  robots: { index: true, follow: true },
  verification: {
    google: "EvwBVKmgChv3GxUVdL6lPEoaHc_ZeHSf1Y9G6F9RZf0",
  },
  // Next.js auto-rileva app/icon.png e app/apple-icon.png ma esplicitiamo
  // i sizes per browser legacy + iOS home screen sharpness.
  icons: {
    icon: [{ url: "/icon.png", type: "image/png", sizes: "any" }],
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

/**
 * Default title/description usati SOLO da route non-[locale] senza un
 * proprio title/description (nessuna oggi, verificato) — [locale]/layout.tsx
 * ha sempre il proprio title/description per lingua via generateMetadata.
 */
export const ROOT_DEFAULT_TITLE: Metadata["title"] = {
  default: "FitMesh Sync | Sync your smartwatch to a personal dashboard",
  template: "%s | FitMesh",
};
export const ROOT_DEFAULT_DESCRIPTION =
  "FitMesh Sync syncs Galaxy Watch and Wear OS to a premium personal dashboard. Steps, heart rate, sleep, calories. Privacy-first.";

export const ROOT_VIEWPORT: Viewport = {
  themeColor: "#050816",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};
