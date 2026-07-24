import type { Metadata } from "next";
import { inter, grotesk } from "@/lib/fonts";
import "@/app/(frontend)/globals.css";

/**
 * Layout per i mockup screenshot Play Store / sito.
 *
 * P0.9: root layout indipendente (era annidato sotto il vecchio
 * `app/(frontend)/layout.tsx` condiviso, rimosso). Niente RootHtmlShell
 * qui di proposito: questa route bypassa Header/Footer/CookieBanner/GA4
 * per renderizzare schermo pieno il device frame, esattamente come prima
 * — serve pero' comunque il proprio `<html>`/`<body>` con le font
 * variable, dato che non c'e' piu' un layout padre a fornirle.
 *
 * Le route /mockups/* sono usate solo da Playwright headless per generare i PNG
 * Play Store. Non devono essere indicizzate da Google.
 */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function MockupsLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${grotesk.variable}`}>
      <body
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
      </body>
    </html>
  );
}
