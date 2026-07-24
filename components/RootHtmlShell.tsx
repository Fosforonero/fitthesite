import Script from "next/script";
import { inter, grotesk } from "@/lib/fonts";
import OutboundTracker from "@/components/OutboundTracker";
import "@/app/(frontend)/globals.css";

const GA_MEASUREMENT_ID = "G-WLBXXFB21G";

/**
 * P0.9: corpo del vecchio, unico `app/(frontend)/layout.tsx` — quel file
 * chiamava `await headers()` solo per leggere `x-fitmesh-locale` (iniettato
 * dal middleware) e impostare `<html lang>`. `headers()` e' una Dynamic API
 * in Next.js 15: il suo solo uso rende dinamico l'intero albero sotto
 * `(frontend)`, `generateStaticParams()` dei singoli tool/pagine incluso
 * (verificato: i due calcolatori Labs, che HANNO `generateStaticParams()`,
 * servivano comunque `Cache-Control: private, no-store` + `x-vercel-cache:
 * MISS` in produzione prima di questo fix — vedi
 * docs/ops/vercel-fluid-cpu-audit-2026-07-24.md).
 *
 * Fix: multipli root layout Next.js ufficiali (un file layout.tsx per ogni
 * "isola" di route — [locale], delete-account, mockups, oauth, la "/" bare
 * — ciascuno il vero root della propria sotto-albero, nessun layout.tsx
 * condiviso sopra di loro). Ognuno conosce la propria lingua SENZA leggere
 * header di richiesta: [locale]/layout.tsx la riceve da `params.locale`
 * (sempre noto staticamente per le 15 locale via generateStaticParams),
 * le altre isole hanno una lingua fissa nota a compile-time. Questo
 * componente e' il corpo HTML condiviso — SENZA alcuna Dynamic API — che
 * ogni root layout invoca passando la propria `lang` gia' risolta.
 */
export function RootHtmlShell({
  lang,
  children,
}: {
  lang: string;
  children: React.ReactNode;
}) {
  return (
    <html lang={lang} className={`${inter.variable} ${grotesk.variable}`}>
      <head>
        {/* Preload del monogramma FM (above-the-fold nell'Header — usato dal
            componente Logo variant="horizontal" che ora compose icon-square +
            wordmark testuale invece di un file logo-horizontal statico). */}
        <link
          rel="preload"
          as="image"
          href="/icon-square-128.png"
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
        <OutboundTracker />
      </body>
    </html>
  );
}
