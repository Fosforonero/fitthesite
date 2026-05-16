import type { Metadata } from "next";

/**
 * Layout per i mockup screenshot Play Store / sito.
 *
 * Bypassa Header/Footer/CookieBanner (cuore di /[locale]/(marketing)/layout.tsx)
 * per renderizzare schermo pieno il device frame.
 *
 * Le route /mockups/* sono usate solo da Playwright headless per generare i PNG
 * Play Store. Non devono essere indicizzate da Google.
 */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function MockupsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="bg-bg text-text-primary"
      style={{ fontFamily: "var(--font-inter), system-ui, sans-serif" }}
    >
      {/* Nasconde il devtools Next.js indicator (badge N in basso a sinistra
          + toast errori). Visibile in dev mode → contamina gli screenshot. */}
      <style>{`
        [data-nextjs-toast],
        [data-nextjs-toast-wrapper],
        [data-nextjs-dev-indicator],
        nextjs-portal {
          display: none !important;
        }
      `}</style>
      {children}
    </div>
  );
}
