import { NextResponse } from 'next/server';

/**
 * Digital Asset Links for Android App Links verification.
 *
 * NB: Next.js non supporta cartelle con `.` o `.well-known` come segmenti
 * di route nell'App Router. Soluzione: serviamo qui sotto `/api/assetlinks`
 * e in `next.config.mjs` aggiungiamo una rewrite da
 * `/.well-known/assetlinks.json` a `/api/assetlinks`.
 *
 * Aggiornare `sha256_cert_fingerprints` con la SHA-256 sia del keystore
 * locale (per APK installati via adb) che di Play App Signing (per
 * download da Play Store, ri-firmati da Google).
 */
export const dynamic = 'force-static';

const assetLinks = [
  {
    relation: ['delegate_permission/common.handle_all_urls'],
    target: {
      namespace: 'android_app',
      package_name: 'com.fitmeshsync.app',
      sha256_cert_fingerprints: [
        '52:E0:FC:C3:A2:33:AC:88:66:AC:23:E0:3E:1E:57:55:0D:C9:BC:21:36:C7:1C:D1:24:CC:A7:94:39:FF:BA:2C', // local keystore (debug + sideload)
        // TODO(release): Aggiungere SHA-256 Play App Signing (Play Console → Setup → App integrity →
        // App signing → SHA-256 certificate fingerprint). Senza questa SHA App Links NON
        // verifica per installazioni dal Play Store (Google ri-firma gli APK).
      ],
    },
  },
];

export function GET() {
  return NextResponse.json(assetLinks, {
    headers: {
      'cache-control': 'public, max-age=3600, s-maxage=3600',
      'content-type': 'application/json',
    },
  });
}
