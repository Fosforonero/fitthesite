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
 * r/FitMesh — community ufficiale su Reddit. Il subreddit è privato oggi
 * (2026-08-12): un link porterebbe a una pagina che chiede l'accesso.
 *
 * NON mettere a `true` finché Matteo non conferma che il subreddit è
 * pubblico. Governa TUTTE le superfici collegate (Footer, /support,
 * `sameAs` dell'Organization in JSON-LD) da un'unica fonte di verità —
 * un solo flip quando arriva il via libera, nessun posto dimenticato.
 */
export const REDDIT_COMMUNITY_LIVE = false;
