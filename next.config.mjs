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
          // P0.4C — incidente reload iOS Safari/Reddit (2026-07-13): in
          // produzione OGNI risposta (documento HTML, chunk JS, immagini
          // ottimizzate, font, payload RSC) porta `Accept-CH`/`Critical-CH:
          // Sec-CH-Prefers-Color-Scheme`, verificato via curl e via un
          // guardrail Playwright (tools/check-anti-loop.ts) su ~200 risposte
          // reali. Per specifica Client Hints, `Critical-CH` forza un retry
          // OBBLIGATORIO del browser sulla primissima richiesta di un
          // contesto senza quell'hint in cache per l'origin — cioe' un
          // secondo "load" automatico, riprodotto in modo deterministico
          // (evento `beforeunload` reale, non un artefatto di conteggio) su
          // /it, /en, /de e l'apex. FitMesh non fa alcun rendering
          // server-side dipendente da colorScheme (dark/light e' puro CSS
          // `prefers-color-scheme`), quindi non serve a nulla.
          //
          // Impostarli qui a stringa vuota NON basta da solo: una dipendenza
          // di terze parti usata da questo sito accoda una PROPRIA regola
          // `headers()` che reimposta questi stessi header al valore reale,
          // DOPO questa regola — quindi vince lei. La rimozione effettiva
          // avviene nel wrapper subito dopo la sua inizializzazione in fondo
          // a questo file, che filtra quella regola come ultimo passo.
          // Questo override a stringa vuota resta qui solo come prima difesa
          // e per coprire gli asset statici (_next/static, _next/image) che
          // middleware.ts non puo' toccare.
          { key: 'Accept-CH', value: '' },
          { key: 'Critical-CH', value: '' },
        ],
      },
      // Password recovery hotfix (2026-07-24): pagina con OTP/password in
      // transito, mai da cachare (CDN o browser) e mai da mandare come
      // referrer a link esterni. Regola piu' specifica dopo quella globale:
      // per Cache-Control/Referrer-Policy vince l'ultima che matcha lo stesso
      // path (vedi Next.js headers() config merge order).
      {
        source: '/:locale/auth/reset-password',
        headers: [
          { key: 'Cache-Control', value: 'no-store' },
          { key: 'Referrer-Policy', value: 'no-referrer' },
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
      // Addendum P0.11-D (2026-08-04): la coppia Health Connect NON era una
      // vera cannibalizzazione — "how-does-health-connect-work" è sempre
      // stato lo slug EN localizzato dello stesso post bilingue
      // (lib/blog/slugs.ts: BLOG_SLUGS["come-funziona-health-connect"].en),
      // mai un file/post separato. Il redirect EN sopra creava un loop
      // infinito 308: questa entry mandava /en/.../how-does-health-connect-work
      // -> /en/.../come-funziona-health-connect, poi resolveBlogPost() in
      // app/(frontend)/[locale]/(marketing)/blog/[slug]/page.tsx vedeva che
      // lo slug EN corretto per quel post è how-does-health-connect-work e
      // rimandava indietro -> ciclo A->B->A. Rimossa SOLO la gamba /en/: la
      // gamba /it/ resta (nessun loop lì, /it/blog/how-does-health-connect-work
      // non e' mai lo slug corretto per nessuna locale quindi il redirect
      // verso il post reale resta utile) e la vera pagina EN canonica
      // (/en/blog/how-does-health-connect-work, 200 diretto, gia' cosi'
      // secondo il registro slug corrente + sitemap.xml + data di
      // pubblicazione piu' vecchia) resta raggiungibile senza redirect.
      {
        source: '/it/blog/how-does-health-connect-work',
        destination: '/it/blog/come-funziona-health-connect',
        permanent: true,
      },
      // Addendum P0.11-D: stesso bug di cannibalRedirect('how-does-health-...')
      // sopra, trovato dal nuovo guardrail seo:redirect-integrity-check (non
      // dal crawl originale) — cannibalRedirect() usa lo slug IT `winner`
      // anche per la gamba /en/, ma lo slug EN corretto (lib/blog/slugs.ts)
      // e' quasi sempre diverso da quello IT. Per queste 3 coppie non e' un
      // loop infinito (a differenza di Health Connect) ma una catena a 2 hop
      // reale: /en/blog/<loser> -> /en/blog/<winner-IT> -> resolveBlogPost()
      // rimanda ANCORA verso lo slug EN vero. Gamba /it/ via helper generico
      // (corretta, IT usa sempre il canonico), gamba /en/ esplicita verso lo
      // slug EN realmente localizzato — 1 solo hop.
      { source: '/it/blog/what-is-hrv-heart-rate-variability', destination: '/it/blog/hrv-cose-significato-valori', permanent: true },
      { source: '/en/blog/what-is-hrv-heart-rate-variability', destination: '/en/blog/what-is-hrv-meaning-values', permanent: true },
      { source: '/it/blog/galaxy-watch-steps-not-syncing', destination: '/it/blog/passi-non-si-sincronizzano-galaxy-watch', permanent: true },
      { source: '/en/blog/galaxy-watch-steps-not-syncing', destination: '/en/blog/steps-not-syncing-galaxy-watch', permanent: true },
      { source: '/it/blog/how-to-export-garmin-data', destination: '/it/blog/esportare-dati-garmin', permanent: true },
      { source: '/en/blog/how-to-export-garmin-data', destination: '/en/blog/export-garmin-data', permanent: true },
      // Questa coppia invece NON ha il bug: BLOG_SLUGS["sync-samsung-health-google-fit"].en
      // e' "sync-samsung-health-google-fit" (self-mapping), quindi il winner
      // IT-named E' gia' lo slug EN corretto — helper generico va bene.
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
      // Addendum P0.11-D: stesso bug delle entry cannibalRedirect sopra —
      // lo slug EN corretto di alternative-app-sync-wearable-2026 e'
      // wearable-sync-apps-alternatives-2026 (lib/blog/slugs.ts), non lo
      // slug IT-named usato qui prima. Senza questa correzione la gamba /en/
      // era una catena a 2 hop (trovato da seo:redirect-integrity-check).
      { source: '/en/blog/alternative-health-sync-2026', destination: '/en/blog/wearable-sync-apps-alternatives-2026', permanent: true },
    ];

    // Cannibalization consolidation smartwatch-anziani EN (addendum P0.11-D,
    // 2026-08-04): /en/blog/smartwatch-for-elderly-guide (post reale,
    // lib/blog/posts/smartwatch-per-anziani-guida.ts) e
    // /en/blog/best-smartwatch-for-elderly (lib/blog/posts/best-smartwatch-for-elderly.ts)
    // sono due FILE distinti, entrambi 200, entrambi self-canonical, con
    // title IT identico byte-per-byte in EN. GSC non disponibile in questa
    // sessione. Winner = best-smartwatch-for-elderly: referenziato da un
    // altro post (anello-smart-guida-completa.ts) mentre l'altro ha zero
    // link interni in ingresso, ed è stato aggiornato più di recente
    // (updatedAt 2026-06-16 contro 2026-05-23, mai toccato dopo la
    // pubblicazione) — stesso publishedAt (2026-05-23) quindi la seniority
    // non discrimina, ma linking interno + manutenzione recente sì.
    // Scope SOLO EN: le altre 10 locale di smartwatch-per-anziani-guida
    // (IT compreso) mostrano title diversi da quelli dell'equivalente
    // locale di best-smartwatch-for-elderly (verificato live su IT/DE, non
    // identici) — nessuna prova di duplicazione lì, nessuna modifica.
    const elderlyConsolidationRedirects = [
      { source: '/en/blog/smartwatch-for-elderly-guide', destination: '/en/blog/best-smartwatch-for-elderly', permanent: true },
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
      // L'apex `fitmesh.fit` -> `www.fitmesh.fit` NON e' piu' gestito qui
      // (P0.4C, incidente reload iOS Safari/Reddit, 2026-07-13): il redirect
      // dichiarativo di next.config.mjs risultava in produzione con un
      // header `Refresh: 0;url=...` aggiuntivo e `content-type: text/plain`
      // (verificato via curl -D-, non riproducibile in locale — comportamento
      // del meccanismo Vercel-side che processa questa config, non del nostro
      // codice), oltre a produrre DUE hop (apex->www, poi www->locale) invece
      // di uno. Sostituito da un redirect esplicito in middleware.ts che
      // collassa canonicalizzazione host + negoziazione lingua in un solo
      // hop, senza header Refresh, e preserva `/.well-known/*` senza redirect
      // per Android/Apple App Links. Vedi middleware.ts per l'implementazione
      // e per la nota operativa Vercel (dominio "assegnato al progetto", non
      // "Redirect to www.fitmesh.fit", altrimenti il redirect Vercel a monte
      // vince su QUALSIASI meccanismo applicativo, questo incluso).
      //
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
      // Consolidamento smartwatch-anziani EN (vedi sopra).
      ...elderlyConsolidationRedirects,
      // Brand standalone cleanup (vedi sopra).
      ...standaloneRedirects,
      // Cannibalization consolidation garmin-health-connect (vedi sopra).
      ...garminSamsungConsolidationRedirects,
      // Slug IT fix (vedi sopra).
      ...itSlugFixRedirects,
    ];
  },
};

const payloadConfig = withPayload(nextConfig);

/**
 * P0.4C follow-up (2026-07-13): il wrapper di terze parti sopra accoda,
 * DOPO la nostra regola, una propria voce `headers()` (applicata a tutto
 * il sito) che reimposta `Accept-CH`/`Critical-CH`/`Vary` al valore reale.
 * Non esiste un'opzione di configurazione per disattivarlo: l'iniezione
 * e' incondizionata a monte. Wrappiamo qui il config GIA' completo
 * restituito dal wrapper e filtriamo quella regola come ultimissimo passo
 * prima che Next.js la usi — nessun altro livello puo' piu' sovrascriverla
 * dopo.
 */
export default {
  ...payloadConfig,
  headers: async () => {
    const rules = await payloadConfig.headers();
    return rules.map((rule) => ({
      ...rule,
      headers: rule.headers.filter(
        (h) =>
          h.key !== 'Accept-CH' &&
          h.key !== 'Critical-CH' &&
          !(h.key === 'Vary' && h.value === 'Sec-CH-Prefers-Color-Scheme'),
      ),
    }));
  },
};
