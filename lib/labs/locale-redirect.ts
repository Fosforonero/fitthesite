import type { Locale } from "@/lib/i18n";

/**
 * FitMesh Labs esiste solo in italiano e inglese (vedi LABS_LOCALES in
 * registry.ts). Il middleware globale (`middleware.ts`) negozia già la
 * lingua fra tutte le 15 locale del sito (cookie -> Accept-Language -> geo
 * IP -> 'en') PRIMA che una richiesta arrivi qui: questa funzione non
 * inventa un nuovo sistema di geolocalizzazione, si limita a restringere il
 * risultato di quella negoziazione già avvenuta alle sole due lingue che
 * Labs supporta: 'it' resta 'it', qualunque altra locale (incluse le 13 non
 * supportate da Labs) diventa 'en'.
 *
 * Uso nelle page.tsx di /labs: se `labsLocale(locale)` differisce dal
 * parametro ricevuto, la pagina deve fare `redirect()` al path equivalente
 * nella lingua risolta, PRIMA di renderizzare qualunque contenuto: così
 * nessuna delle 13 lingue non supportate serve mai una pagina Labs (con o
 * senza fallback), solo un redirect pulito.
 */
export function resolveLabsLocale(locale: Locale): "it" | "en" {
  return locale === "it" ? "it" : "en";
}
