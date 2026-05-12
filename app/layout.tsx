import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CookieBanner from "@/components/CookieBanner";

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

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "FitMesh Sync — Sincronizza il tuo smartwatch a una dashboard personale",
    template: "%s — FitMesh Sync",
  },
  description:
    "FitMesh Sync sincronizza Galaxy Watch e Wear OS con una dashboard premium: passi, battito, sonno, calorie e VO₂ max. Privacy-first, niente cloud opachi, niente tracker.",
  keywords: [
    "FitMesh Sync",
    "Galaxy Watch dashboard",
    "Wear OS sync",
    "Health Connect",
    "Samsung Health",
    "fitness dashboard",
    "wearable analytics",
    "sleep tracker",
    "VO2 max",
  ],
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: "FitMesh Sync",
    title: "FitMesh Sync — Una dashboard premium per i dati del tuo smartwatch",
    description:
      "Passi, battito, sonno e calorie del tuo smartwatch su una dashboard tua. Privacy-first. Nessun tracker.",
    locale: "it_IT",
  },
  twitter: {
    card: "summary_large_image",
    title: "FitMesh Sync",
    description: "Dashboard premium per smartwatch. Privacy-first.",
  },
  alternates: { canonical: SITE_URL },
  robots: { index: true, follow: true },
  // Search Console verification (Google verifica anche tramite DNS TXT su Namecheap;
  // questo meta è un fallback aggiuntivo che non guasta).
  verification: {
    google: "EvwBVKmgChv3GxUVdL6lPEoaHc_ZeHSf1Y9G6F9RZf0",
  },
  appleWebApp: {
    title: "FitMesh Sync",
    statusBarStyle: "black-translucent",
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
        {/*
          GA4 with Consent Mode v2 (Google's GDPR-compliant pattern).

          1) We define gtag() and set ALL consent categories to 'denied' BEFORE
             the gtag.js script loads. This is the key step that makes the page
             cookieless on first visit.
          2) The gtag.js script then loads in the background.
          3) The CookieBanner component is the only place that can call
             gtag('consent', 'update', { analytics_storage: 'granted' }).

          Without explicit user consent, GA4 still receives traffic signals
          but never writes _ga* cookies and does not persist a client_id.
          This is the EU-compliant approach per Google's official docs.
        */}
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

          // Replay queued consent updates if the banner already fired before this loaded
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
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        <CookieBanner />
      </body>
    </html>
  );
}
