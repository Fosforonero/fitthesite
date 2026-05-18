import { NextResponse } from 'next/server';

/**
 * Digital Asset Links — verifica che com.fitmeshsync.app può intercettare
 * gli URL https://fitmesh.fit/oauth/* via Android App Links.
 *
 * Servito via Route Handler invece di `public/.well-known/` per evitare
 * il middleware Next.js + qualsiasi bug Vercel CDN su path con dot-prefix
 * nelle cartelle public statiche.
 *
 * Aggiornare `sha256_cert_fingerprints`:
 * - Sviluppo locale: SHA-256 del keystore in flutter_app/keystore/healthsync-release.jks
 * - Production Play Store: aggiungere anche il SHA-256 di "Play App Signing"
 *   (Play Console → Setup → App integrity → App signing key certificate)
 */
export const dynamic = 'force-static';

const assetLinks = [
  {
    relation: ['delegate_permission/common.handle_all_urls'],
    target: {
      namespace: 'android_app',
      package_name: 'com.fitmeshsync.app',
      sha256_cert_fingerprints: [
        '52:E0:FC:C3:A2:33:AC:88:66:AC:23:E0:3E:1E:57:55:0D:C9:BC:21:36:C7:1C:D1:24:CC:A7:94:39:FF:BA:2C',
      ],
    },
  },
];

export function GET() {
  return NextResponse.json(assetLinks, {
    headers: {
      'cache-control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
