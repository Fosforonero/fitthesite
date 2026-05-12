import type { Metadata, Viewport } from "next";
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
};

export const viewport: Viewport = {
  themeColor: "#050816",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it" className={`${inter.variable} ${grotesk.variable}`}>
      <head>
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
          strategy="afterInteractive"
        />
      </head>
      <body className="min-h-screen flex flex-col font-sans bg-page antialiased">
        {children}
      </body>
    </html>
  );
}
