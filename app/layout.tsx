import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import Script from "next/script";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";

const SITE_URL = "https://www.fitmesh.fit";
const GA_MEASUREMENT_ID = "G-WLBXXFB21G";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const grotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-grotesk",
  display: "swap",
});

/**
 * Root-level metadata. Locale-specific metadata is added by [locale]/layout.tsx
 * which extends this. We keep `metadataBase` and global verification here.
 */
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "FitMesh Sync — Sync your smartwatch to a personal dashboard",
    template: "%s — FitMesh Sync",
  },
  description:
    "FitMesh Sync syncs Galaxy Watch and Wear OS to a premium personal dashboard. Steps, heart rate, sleep, calories, VO₂ max. Privacy-first.",
  robots: { index: true, follow: true },
  verification: {
    google: "EvwBVKmgChv3GxUVdL6lPEoaHc_ZeHSf1Y9G6F9RZf0",
  },
  // Next.js auto-rileva app/icon.png e app/apple-icon.png ma esplicitiamo
  // i sizes per browser legacy + iOS home screen sharpness.
  icons: {
    icon: [
      { url: "/icon.png", type: "image/png", sizes: "any" },
    ],
    apple: [
      { url: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: "#050816",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const headersList = await headers();
  // Read the locale injected by middleware (x-fitmesh-locale header).
  // Falls back to "it" for non-locale routes (mockups, oauth, etc.).
  const locale = headersList.get("x-fitmesh-locale") ?? "it";
  return (
    <html lang={locale} className={`${inter.variable} ${grotesk.variable}`}>
      <head>
        {/* Preload del monogramma FM (above-the-fold nell'Header — usato dal
            componente Logo variant="horizontal" che ora compose icon-square +
            wordmark testuale invece di un file logo-horizontal statico). */}
        <link
          rel="preload"
          as="image"
          href="/icon-square.png"
          type="image/png"
          fetchPriority="high"
        />

        {/* GA4 with Consent Mode v2 — applies to ALL pages regardless of locale.
            See BRAND.md §15. */}
        <Script id="gtag-consent-default" strategy="beforeInteractive">{`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          window.gtag = gtag;
          gtag('consent', 'default', {
            'ad_storage': 'denied',
            'ad_user_data': 'denied',
            'ad_personalization': 'denied',
            'analytics_storage': 'denied',
            'functionality_storage': 'granted',
            'security_storage': 'granted',
            'wait_for_update': 500
          });
          gtag('js', new Date());
          gtag('config', '${GA_MEASUREMENT_ID}', {
            anonymize_ip: true,
            allow_google_signals: false,
            allow_ad_personalization_signals: false
          });
          try {
            var stored = window.localStorage.getItem('fitmesh_cookie_consent');
            if (stored) {
              var v = JSON.parse(stored);
              if (v && v.analytics === true) {
                gtag('consent', 'update', { 'analytics_storage': 'granted' });
              }
            }
          } catch (_) {}
        `}</Script>
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
          strategy="lazyOnload"
        />
      </head>
      <body className="min-h-screen flex flex-col font-sans bg-page antialiased">
        {children}
      </body>
    </html>
  );
}
