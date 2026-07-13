import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { withPayload } from '@payloadcms/next/withPayload';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Lockfile multipli nelle directory genitrici facevano inferire a Next una
  // workspace root sbagliata (file tracing/output errati). Root esplicita.
  outputFileTracingRoot: path.dirname(fileURLToPath(import.meta.url)),

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
      // /llms.txt generato da lib/product-facts.ts (route handler, force-static)
      // invece del file statico obsoleto che viveva in public/.
      {
        source: '/llms.txt',
        destination: '/api/llms-txt',
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

    // Cannibalization consolidation (sprint P0.2 Fase 5, 2026-07-12): la
    // landing /lp/garmin-health-connect e il blog post
    // /blog/garmin-samsung-health-sync-guide competevano per lo stesso query
    // cluster ("garmin health connect android sync"). Winner = il blog post
    // (guida passo-passo + troubleshooting + FAQ + CTA verso FitMesh, contenuto
    // piu' ricco e difendibile della landing, che era generica e senza la
    // parte Samsung Health). Entry landing rimossa da lib/landing/data.ts,
    // LANDING_SLUGS["garmin-health-connect"] rimossa da lib/blog/slugs.ts.
    // Redirect 308 su tutte le 11 locale con slug tradotto (sv/da/no/fi non
    // hanno mai avuto ne' la landing ne' questo blog post tradotti).
    const garminSamsungConsolidationSlugs = {
      it: { from: 'garmin-health-connect', to: 'garmin-samsung-health-sync-guide' },
      en: { from: 'garmin-health-connect-sync', to: 'sync-garmin-samsung-health-guide' },
      es: { from: 'garmin-health-connect-sincronizacion', to: 'sincronizar-garmin-samsung-health-guia' },
      de: { from: 'garmin-health-connect-synchronisierung', to: 'garmin-samsung-health-synchronisieren-anleitung' },
      pt: { from: 'garmin-health-connect-sincronizacao', to: 'sincronizar-garmin-samsung-health-guia' },
      fr: { from: 'garmin-health-connect-synchronisation', to: 'synchroniser-garmin-samsung-health-guide' },
      pl: { from: 'garmin-health-connect-synchronizacja', to: 'synchronizacja-garmin-samsung-health-poradnik' },
      tr: { from: 'garmin-health-connect-senkronizasyon', to: 'garmin-samsung-health-senkronizasyon-rehberi' },
      nl: { from: 'garmin-health-connect-synchronisatie', to: 'garmin-samsung-health-synchroniseren-gids' },
      ja: { from: 'garmin-health-connect-douki', to: 'garmin-samsung-health-douki-gaido' },
      ko: { from: 'garmin-health-connect-dongkihwa', to: 'garmin-samsung-health-dongkihwa-gaidu' },
    };
    const garminSamsungConsolidationRedirects = Object.entries(garminSamsungConsolidationSlugs).map(
      ([lc, { from, to }]) => ({
        source: `/${lc}/lp/${from}`,
        destination: `/${lc}/blog/${to}`,
        permanent: true,
      }),
    );

    // Slug IT fix (2026-07-10): la chiave canonico/IT era rimasta per errore in
    // spagnolo ("cierra-alternativas") invece di uno slug italiano. Contenuto
    // sempre stato in italiano corretto, solo l'URL era sbagliato. Il vecchio
    // slug canonico viene rediretto sotto TUTTI i 15 locali supportati (non
    // solo /it/), per intercettare eventuali URL indicizzati/salvati con lo
    // slug canonico sotto un prefisso locale diverso da /it/. Destinazione =
    // slug localizzato attualmente valido per quel locale (vedi
    // lib/blog/slugs.ts). sv/da/no/fi non hanno un override in BLOG_SLUGS per
    // questo post (contenuto ancora in fallback EN, vedi
    // UNTRANSLATED_CONTENT_LOCALES in lib/i18n.ts): localizedBlogSlug() cade
    // sul canonico per quei 4 locali, quindi puntano allo stesso slug IT.
    const oldCanonicalGoogleFitSlug = 'google-fit-cierra-alternativas-health-connect';
    const googleFitApiSlugByLocale = {
      it: 'google-fit-api-dismissione-2026',
      en: 'google-fit-shutting-down-alternative',
      es: 'google-fit-cierra-alternativa-health-connect',
      de: 'google-fit-eingestellt-alternative',
      pt: 'google-fit-encerrando-alternativa',
      fr: 'google-fit-fermeture-alternative',
      pl: 'google-fit-zamkniety-alternatywa-health-connect',
      tr: 'google-fit-kapaniyor-alternatif',
      nl: 'google-fit-gesloten-alternatieven-health-connect',
      ja: 'google-fit-shuuryou-health-connect-daian',
      ko: 'google-fit-jongryeo-health-connect-daean',
      sv: 'google-fit-api-dismissione-2026',
      da: 'google-fit-api-dismissione-2026',
      no: 'google-fit-api-dismissione-2026',
      fi: 'google-fit-api-dismissione-2026',
    };
    const itSlugFixRedirects = Object.entries(googleFitApiSlugByLocale).map(([lc, slug]) => ({
      source: `/${lc}/blog/${oldCanonicalGoogleFitSlug}`,
      destination: `/${lc}/blog/${slug}`,
      permanent: true,
    }));

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
      // Cannibalization consolidation garmin-health-connect (vedi sopra).
      ...garminSamsungConsolidationRedirects,
      // Slug IT fix (vedi sopra).
      ...itSlugFixRedirects,
    ];
  },
};

export default withPayload(nextConfig);
