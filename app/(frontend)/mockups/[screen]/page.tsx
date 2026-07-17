import type { Metadata } from "next";
import { notFound } from "next/navigation";

import {
  DashboardMockup,
  FamilyMockup,
  InsightsMockup,
  IntegrationsMockup,
  MultiDeviceMockup,
  OnboardingMockup,
  PairingMockup,
  SettingsMockup,
  SyncCenterMockup,
  SyncMockup,
} from "./screens";

/**
 * Mockup phone screen — viewport 1080×1920 (Play Store screenshot ratio).
 *
 * Renderizzato a schermo pieno (no header/footer), il <main> ha esattamente
 * 1080×1920 px così Playwright può catturare il PNG senza margini.
 *
 * Accedi via /mockups/<screen>:
 *   /mockups/dashboard, /mockups/sync, /mockups/settings,
 *   /mockups/onboarding, /mockups/pairing, /mockups/integrations
 *
 * Sprint P0.6B: strumento interno per generare screenshot Play/App Store
 * (via Playwright, vedi tools/screenshots.mjs) — non pensato per essere
 * indicizzato. Già assente da app/sitemap.ts, ma non aveva mai avuto un
 * robots noindex esplicito: una route statica raggiungibile e crawlabile
 * per URL diretto, anche senza link in entrata. Il noindex qui sotto non
 * sostituisce la correzione dei claim nel contenuto dei mockup stessi
 * (vedi screens.tsx) — copre solo l'indicizzabilità della route.
 */
export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Mockup: strumento interno",
  robots: { index: false, follow: false },
};

const SCREENS = {
  dashboard: DashboardMockup,
  sync: SyncMockup,
  settings: SettingsMockup,
  onboarding: OnboardingMockup,
  pairing: PairingMockup,
  integrations: IntegrationsMockup,
  "multi-device": MultiDeviceMockup,
  family: FamilyMockup,
  "sync-center": SyncCenterMockup,
  insights: InsightsMockup,
} as const;

export function generateStaticParams() {
  return Object.keys(SCREENS).map((screen) => ({ screen }));
}

export default async function MockupPage({
  params,
}: {
  params: Promise<{ screen: string }>;
}) {
  const { screen } = await params;
  const Screen = SCREENS[screen as keyof typeof SCREENS];
  if (!Screen) notFound();

  // Wrapper a dimensione phone Play Store esatta.
  // Playwright cattura questo div via getBoundingClientRect().
  return (
    <main
      id="mockup-root"
      style={{
        width: "1080px",
        height: "1920px",
        overflow: "hidden",
        position: "relative",
      }}
      className="bg-bg"
    >
      <Screen />
    </main>
  );
}
