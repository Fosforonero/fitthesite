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
    relation: [
      'delegate_permission/common.handle_all_urls',
      'delegate_permission/common.get_login_creds',
    ],
    target: {
      namespace: 'android_app',
      package_name: 'com.fitmeshsync.app',
      sha256_cert_fingerprints: [
        '52:E0:FC:C3:A2:33:AC:88:66:AC:23:E0:3E:1E:57:55:0D:C9:BC:21:36:C7:1C:D1:24:CC:A7:94:39:FF:BA:2C', // local keystore (debug + sideload)
        'BE:E8:1E:D7:00:0F:8D:CA:C6:24:B6:CF:DB:4D:C6:1B:5E:46:3F:62:A6:76:10:4C:9B:38:BF:67:A3:F4:10:E0', // Play App Signing (Google-managed, Play Store releases)
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
