/**
 * FitMesh Sync è live sull'App Store in tutti i 27 paesi UE (verificato
 * 2026-07-13 via l'API pubblica di lookup Apple su ogni storefront UE —
 * resultCount 1, stesso App ID, iOS 14.0+ ovunque). Il gating geografico
 * iOS/UE è stato rimosso: il download non dipende più da IP, cookie, o
 * hydration lato client.
 */

/** Apple ID numerico dell'app — App Store: .../app/fitmesh-sync/id6779751708. */
export const APPLE_APP_ID = "6779751708";

/** URL completo della scheda App Store. */
export const APPLE_STORE_URL = `https://apps.apple.com/app/fitmesh-sync/id${APPLE_APP_ID}`;

/**
 * r/FitMesh — community ufficiale su Reddit. Era privata (2026-08-12);
 * Matteo ha confermato che è pubblica il 2026-08-12 (P0.14A) — attivata da
 * qui, unica fonte di verità per Footer, /support e `sameAs` dell'Organization
 * in JSON-LD: un solo flip, nessun posto dimenticato.
 */
export const REDDIT_COMMUNITY_LIVE = true;
