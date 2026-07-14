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
 * Team ID reale (Fosforonero): Y7G6B692S6, confermato da DEVELOPMENT_TEAM in
 * ios/Runner.xcodeproj/project.pbxproj (2026-07-14). Hardcoded qui, non un
 * env var: non e' un segreto (e' pubblico nello stesso file AASA che serviamo,
 * e non cambia mai per un dato team Apple), quindi tenerlo come env var creava
 * solo un altro modo di dimenticarsi di impostarlo — cosa che e' successa: il
 * fallback al placeholder letterale e' rimasto live per settimane, rompendo
 * ogni Universal Link iOS (OAuth, inviti Mesh Famiglia, pairing device) per
 * il 100% degli utenti iOS. Vedi Sprint "Universal Links iOS rotti".
 */
export const dynamic = 'force-static';

const APPLE_TEAM_ID = 'Y7G6B692S6';
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
