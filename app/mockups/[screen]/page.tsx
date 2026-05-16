import { notFound } from "next/navigation";

import {
  DashboardMockup,
  IntegrationsMockup,
  OnboardingMockup,
  PairingMockup,
  SettingsMockup,
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
 */
export const dynamic = "force-static";

const SCREENS = {
  dashboard: DashboardMockup,
  sync: SyncMockup,
  settings: SettingsMockup,
  onboarding: OnboardingMockup,
  pairing: PairingMockup,
  integrations: IntegrationsMockup,
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
