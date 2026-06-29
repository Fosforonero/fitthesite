/**
 * Feature flag centrali — un solo interruttore per il go-live iOS.
 *
 * iOS è stato approvato da Apple ma resta nascosto sul sito finché la
 * disponibilità nei 27 paesi UE non è confermata (verifica DSA "trader status").
 *
 * GO-LIVE (quando l'app è live in UE):
 *   1. App Store Connect → app → App Information → copia l'"Apple ID" numerico.
 *   2. Su Vercel (Production + Preview) imposta:
 *        NEXT_PUBLIC_IOS_ENABLED = true
 *        NEXT_PUBLIC_APPLE_APP_ID = <id numerico, es. 1234567890>
 *   3. Redeploy. Tutto il sito (bottoni store, CTA, JSON-LD, smart banner)
 *      passa automaticamente a "iOS disponibile".
 *
 * Default OFF: senza le env nulla cambia visivamente.
 */

export const IOS_ENABLED = process.env.NEXT_PUBLIC_IOS_ENABLED === "true";

/** Apple ID numerico dell'app — App Store: .../app/fitmesh-sync/id6779751708. */
export const APPLE_APP_ID = process.env.NEXT_PUBLIC_APPLE_APP_ID ?? "6779751708";

/** URL completo della scheda App Store. */
export const APPLE_STORE_URL = `https://apps.apple.com/app/fitmesh-sync/${
  APPLE_APP_ID.startsWith("id") ? APPLE_APP_ID : `id${APPLE_APP_ID}`
}`;
