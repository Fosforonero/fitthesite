import { NextResponse } from 'next/server';

/**
 * Apple App Site Association (AASA) — universal links per iOS app.
 *
 * Apple richiede questo file pubblico su:
 *   https://www.fitmesh.fit/.well-known/apple-app-site-association
 *
 * NB: Next.js non supporta cartelle con `.` come segmenti di route nell'App
 * Router. Soluzione: serviamo qui sotto `/api/apple-app-site-association` e
 * in `next.config.mjs` aggiungiamo una rewrite da
 * `/.well-known/apple-app-site-association` a `/api/apple-app-site-association`.
 *
 * Il contenuto va servito SENZA estensione, content-type `application/json`,
 * senza redirect (Apple non segue). HTTPS valido obbligatorio.
 *
 * Struttura `applinks`:
 *   - appID = <TEAM_ID>.<BUNDLE_ID>
 *   - paths = lista path inclusi/esclusi (es. /oauth/* per OAuth callback)
 *
 * Il TEAM_ID Apple lo trovi in App Store Connect → Membership → "Team ID"
 * (10 char alfanumerici tipo `9X2BY7Z3LW`). Va aggiornato qui MANUALMENTE
 * la prima volta che l'app e' registrata in App Store Connect.
 *
 * TODO: sostituire `__APPLE_TEAM_ID__` con il team ID reale appena disponibile.
 */
export const dynamic = 'force-static';

const APPLE_TEAM_ID = process.env.NEXT_PUBLIC_APPLE_TEAM_ID || '__APPLE_TEAM_ID__';
const BUNDLE_ID = 'com.fitmeshsync.app';

const aasa = {
  applinks: {
    apps: [],
    details: [
      {
        appID: `${APPLE_TEAM_ID}.${BUNDLE_ID}`,
        paths: [
          // OAuth callback (Strava, Polar, Fitbit, Withings, Oura, Suunto)
          '/oauth/*',
          // Mesh Famiglia deep-link join group
          '/famiglia/join/*',
          '/it/famiglia/join/*',
          '/en/famiglia/join/*',
          // Pairing device QR redirect
          '/app/devices/*',
        ],
      },
    ],
  },
  // Empty webcredentials = no Safari autofill cross-app (non ci serve).
  webcredentials: {
    apps: [`${APPLE_TEAM_ID}.${BUNDLE_ID}`],
  },
};

export async function GET() {
  // Apple richiede content-type application/json + no redirects.
  return NextResponse.json(aasa, {
    headers: {
      'cache-control': 'public, max-age=3600, s-maxage=86400',
    },
  });
}
