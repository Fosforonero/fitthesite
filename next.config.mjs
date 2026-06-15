import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { withPayload } from '@payloadcms/next/withPayload';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Lockfile multipli nelle directory genitrici facevano inferire a Next una
  // workspace root sbagliata (file tracing/output errati). Root esplicita.
  outputFileTracingRoot: path.dirname(fileURLToPath(import.meta.url)),

  // TEMP (debug importMap Payload): disabilita la cache persistente webpack.
  // Su Vercel l'admin /cms renderizzava vuoto (getFromImportMap not found)
  // mentre in locale con build pulito funziona: sospetto cache build Vercel
  // che riusa la compilazione di quando l'importMap era vuoto. Forziamo un
  // build pulito. Da rimuovere una volta verificato.
  webpack: (config) => {
    config.cache = false;
    return config;
  },

  /**
   * Redirect 308 permanenti per gli URL marketing senza prefix locale.
   *
   * Necessario perché:
   * - La struttura è /[locale]/(marketing)/{privacy,terms,...}/page.tsx
   * - Google Play Console (e qualsiasi link esterno senza /it/) accede a
   *   /privacy direttamente → senza redirect riceve 404
   *
   * 308 = "Permanent Redirect" che mantiene il metodo HTTP (vs 301 che può
   * convertire POST in GET in alcuni client). Per link che possono ricevere
   * solo GET (browser, crawler) la differenza pratica è zero, ma 308 è
   * tecnicamente più corretto per "questo URL ha trovato casa altrove".
   */
  /**
   * Rewrites — mappa "magic paths" a route handlers che Next.js può compilare.
   *
   * Next.js App Router non supporta cartelle con `.` (es. `.well-known`)
   * come segmenti di route. Per servire i Digital Asset Links Android
   * richiesti a `/.well-known/assetlinks.json`, abbiamo un route handler
   * standard in `app/api/assetlinks/route.ts` e qui mappiamo l'URL pubblico.
   */
  /**
   * Security headers (cybersec audit 2026-05-26, P0-004).
   *
   * CSP: 'unsafe-inline' presente per script/style perche' Next.js bootstrap
   * + Vercel Analytics + tag JSON-LD inline non funzionerebbero senza.
   * Migrazione a strict-dynamic + nonces e' lavoro futuro.
   * connect-src include Supabase project + Resend (welcome email cron) +
   * Vercel insights. Aggiungere domini OAuth (Strava, Garmin, ecc.) qui
   * quando vengono integrati.
   */
  async headers() {
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' https://*.vercel-scripts.com https://va.vercel-scripts.com https://challenges.cloudflare.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      "connect-src 'self' https://xcdyhkuyxukaifhhtadr.supabase.co https://api.resend.com https://*.vercel-scripts.com https://vitals.vercel-insights.com https://www.strava.com https://challenges.cloudflare.com",
      "frame-src https://challenges.cloudflare.com",
      "frame-ancestors 'none'",
      "form-action 'self'",
      "base-uri 'self'",
      "object-src 'none'",
    ].join('; ');

    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' },
          // CSP in Report-Only per 1-2 settimane: vediamo eventuali violazioni
          // in console browser senza rompere il sito. Quando confermato pulito,
          // sostituire la chiave con 'Content-Security-Policy' (enforce).
          { key: 'Content-Security-Policy-Report-Only', value: csp },
        ],
      },
    ];
  },

  async rewrites() {
    return [
      {
        source: '/.well-known/assetlinks.json',
        destination: '/api/assetlinks',
      },
      // iOS Universal Links: Apple cerca questo file SENZA estensione su
      // /.well-known/apple-app-site-association. Niente redirect ammessi.
      {
        source: '/.well-known/apple-app-site-association',
        destination: '/api/apple-app-site-association',
      },
    ];
  },

  async redirects() {
    const it = (path) => ({
      source: path,
      destination: `/it${path}`,
      permanent: true,
    });

    // Blog cannibalization cleanup (2026-05-25): 5 coppie di slug duplicati
    // creati come "versione EN" che in realtà servivano lo stesso contenuto
    // bilingue → 4 URL competing per stessa keyword IT. Killiamo i 5 slug
    // "EN-named" e redirect 308 ai winner IT-named (canonical brand-side).
    // Per ogni coppia loser → winner, redirect su entrambi i locale.
    const cannibalRedirect = (loser, winner) => [
      {
        source: `/it/blog/${loser}`,
        destination: `/it/blog/${winner}`,
        permanent: true,
      },
      {
        source: `/en/blog/${loser}`,
        destination: `/en/blog/${winner}`,
        permanent: true,
      },
    ];
    const cannibalRedirects = [
      ...cannibalRedirect('how-does-health-connect-work', 'come-funziona-health-connect'),
      ...cannibalRedirect('what-is-hrv-heart-rate-variability', 'hrv-cose-significato-valori'),
      ...cannibalRedirect('galaxy-watch-steps-not-syncing', 'passi-non-si-sincronizzano-galaxy-watch'),
      ...cannibalRedirect('how-to-export-garmin-data', 'esportare-dati-garmin'),
      ...cannibalRedirect('sync-samsung-health-to-google-fit', 'sync-samsung-health-google-fit'),
    ];

    // Brand standalone cleanup (2026-05-26): rimossi LP e blog post che
    // posizionavano FitMesh come "alternativa a X". Redirect 308 verso
    // target sensati per preservare link juice + traffic esistente.
    const standaloneRedirects = [
      // LP killata: era /lp/health-sync-alternative
      { source: '/it/lp/health-sync-alternative', destination: '/it/integrations', permanent: true },
      { source: '/en/lp/health-sync-alternative', destination: '/en/integrations', permanent: true },
      // Blog post riscritto: alternative-health-sync-2026 -> alternative-app-sync-wearable-2026
      { source: '/it/blog/alternative-health-sync-2026', destination: '/it/blog/alternative-app-sync-wearable-2026', permanent: true },
      { source: '/en/blog/alternative-health-sync-2026', destination: '/en/blog/alternative-app-sync-wearable-2026', permanent: true },
    ];

    return [
      // App Links / Universal Links: l'apex `fitmesh.fit` deve poter servire
      // `/.well-known/*` SENZA redirect — Android (assetlinks.json) e Apple
      // (apple-app-site-association) NON seguono i redirect quando verificano
      // la proprietà del dominio. Per tutto il resto l'apex resta rediretto a
      // www (canonical SEO, 308 via `permanent`), così le pagine non vengono
      // duplicate.
      // NB OPERATIVO (Vercel): il dominio `fitmesh.fit` NON deve essere in
      // "Redirect to www.fitmesh.fit" ma ASSEGNATO al progetto, altrimenti il
      // redirect Vercel a monte vince e questa regola non viene mai raggiunta.
      {
        source: "/",
        has: [{ type: "host", value: "fitmesh.fit" }],
        destination: "https://www.fitmesh.fit/",
        permanent: true,
      },
      {
        source: "/:path((?!\\.well-known).*)",
        has: [{ type: "host", value: "fitmesh.fit" }],
        destination: "https://www.fitmesh.fit/:path",
        permanent: true,
      },
      // /privacy → EN: usato da Google Play Console + audience globale.
      // I link IT-specifici (Header app, footer) puntano già a /it/privacy.
      { source: '/privacy', destination: '/en/privacy', permanent: true },
      // Gli altri restano su IT (default brand-side, target user italiani).
      it('/terms'),
      it('/cookies'),
      it('/support'),
      it('/integrations'),
      // Provider landing pages: /sync/garmin → /it/sync/garmin etc.
      // Next.js path-matching: :slug matcha qualsiasi segment senza /
      {
        source: '/sync/:slug',
        destination: '/it/sync/:slug',
        permanent: true,
      },
      // Blog cannibalization cleanup (vedi sopra).
      ...cannibalRedirects,
      // Brand standalone cleanup (vedi sopra).
      ...standaloneRedirects,
    ];
  },
};

export default withPayload(nextConfig);
