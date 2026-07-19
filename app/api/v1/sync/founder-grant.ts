/**
 * Pure helpers for the Founder P0 first-sync-success grant call from
 * POST /api/v1/sync. Same extraction pattern as schema.ts: no Next/Supabase
 * dependency, testable in isolation.
 */

export type FounderGrantStatus =
  | "granted"
  | "already_granted"
  | "ineligible"
  | "cap_reached"
  | "retry_needed";

/**
 * Platform per record_first_sync_transition e' telemetria opzionale
 * (P0.4): non deve mai bloccare la transizione o il grant. Il client
 * Flutter scrive sempre osVersion come 'iOS <ver>' o 'Android <ver>'
 * (auto_pairing_screen.dart / pairing_screen.dart) — prefisso stabile.
 */
export function derivePlatform(
  osVersion: string | null | undefined,
): "ios" | "android" | null {
  const v = osVersion?.trim().toLowerCase();
  if (!v) return null;
  if (v.startsWith("ios")) return "ios";
  if (v.startsWith("android")) return "android";
  return null;
}

type FirstSyncTransitionResult = {
  firstSyncRecorded?: boolean;
  grantCreated?: boolean;
  alreadyHadEligibleGrant?: boolean;
  capReached?: boolean;
  notEligibleReason?: string | null;
};

/**
 * Mappa il jsonb di record_first_sync_transition (o un errore RPC) sullo
 * stato compatto restituito al client. "retry_needed" copre sia un errore
 * RPC vero e proprio sia notEligibleReason='no_metrics_evidence' (l'unico
 * esito di non-eleggibilita' che un sync successivo puo' risolvere da
 * solo, dato che il P0.3 garantisce che la transizione non resti mai
 * terminale senza evidenza).
 */
export function resolveFounderGrantStatus(
  result: FirstSyncTransitionResult | null | undefined,
  hadError: boolean,
): FounderGrantStatus {
  if (hadError || result == null) return "retry_needed";
  if (result.grantCreated) return "granted";
  if (result.alreadyHadEligibleGrant) return "already_granted";
  if (result.capReached) return "cap_reached";
  if (result.notEligibleReason === "no_metrics_evidence") return "retry_needed";
  return "ineligible";
}
