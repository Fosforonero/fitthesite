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

/**
 * Gating geo-aware: l'app iOS è già live nel mondo, ma NON nei 27 paesi UE
 * (verifica DSA Apple in corso). Mostriamo "scarica" fuori UE e "in arrivo"
 * nei 27 UE. Il paese arriva dal cookie `fm_geo` (impostato dal middleware via
 * header Vercel x-vercel-ip-country) e viene letto lato client, così le pagine
 * restano statiche e il default è il caso sicuro (in arrivo).
 */
export const GEO_COOKIE = "fm_geo";

/** 27 stati membri UE (ISO 3166-1 alpha-2) dove iOS è bloccato finché la DSA non passa. */
export const EU27 = new Set([
  "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR",
  "HU", "IE", "IT", "LV", "LT", "LU", "MT", "NL", "PL", "PT", "RO", "SK",
  "SI", "ES", "SE",
]);

/** iOS disponibile se globalmente abilitato, oppure se il visitatore è fuori dai 27 UE. */
export function isIosAvailable(country?: string | null): boolean {
  if (IOS_ENABLED) return true;
  if (!country) return false;
  return !EU27.has(country.toUpperCase());
}

/** Legge il country dal cookie fm_geo (uso client). */
export function countryFromCookie(): string | null {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(/(?:^|;\s*)fm_geo=([A-Za-z]{2})/);
  return m ? m[1].toUpperCase() : null;
}

/** Apple ID numerico dell'app — App Store: .../app/fitmesh-sync/id6779751708. */
export const APPLE_APP_ID = process.env.NEXT_PUBLIC_APPLE_APP_ID ?? "6779751708";

/** URL completo della scheda App Store. */
export const APPLE_STORE_URL = `https://apps.apple.com/app/fitmesh-sync/${
  APPLE_APP_ID.startsWith("id") ? APPLE_APP_ID : `id${APPLE_APP_ID}`
}`;
