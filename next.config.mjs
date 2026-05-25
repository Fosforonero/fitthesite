/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

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

    return [
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
    ];
  },
};

export default nextConfig;
