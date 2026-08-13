import { createHash } from "node:crypto";

import type { GooglePlayResult } from "@/lib/billing/google-play";

/**
 * La chiave stabile di proprieta' di un acquisto, per store.
 *
 * Serve a rispondere a una domanda sola: "di chi e' questo acquisto?", e a
 * continuare a rispondere alla stessa maniera dopo un restore, una
 * reinstallazione, un cambio di telefono e un rinnovo. Gli identificatori che
 * gli store espongono NON sono intercambiabili, e sceglierne uno sbagliato non
 * si vede subito: si vede mesi dopo, quando un cliente che ha pagato si ritrova
 * senza niente perche' la chiave che avevamo salvato non esiste piu'.
 *
 *   transactionId (Apple)        cambia a ogni rinnovo. NON e' proprieta'.
 *   originalTransactionId        stabile per sempre sulla catena. E' questo.
 *   il JWS                       e' un blob riemesso a ogni consegna, non un
 *                                identificatore.
 *   orderId (Google)             opzionale, e cambia sui rinnovi. NON e' questo.
 *   purchaseToken (Google)       stabile per l'acquisto, ma e' un SEGRETO: non
 *                                puo' essere salvato in chiaro, quindi si
 *                                salva il suo digest.
 */

/** Versione della derivazione. Cambiarla invalida le chiavi gia' scritte. */
export const OWNERSHIP_KEY_DERIVATION_VERSION = 1;

export type OwnershipKeyFailure =
  | "apple_missing_original_transaction_id"
  | "apple_malformed_original_transaction_id"
  | "google_missing_purchase_token"
  | "google_result_not_validated"
  | "google_subscription_upgrade_chain_unsupported";

export class OwnershipKeyError extends Error {
  constructor(readonly code: OwnershipKeyFailure) {
    super(code);
    this.name = "OwnershipKeyError";
  }
}

/**
 * Apple: `originalTransactionId`, cosi' com'e'.
 *
 * Non si normalizza e non si tronca: e' l'identificatore che Apple emette, e
 * qualunque trasformazione lo renderebbe diverso da quello che lo stesso
 * acquisto produrra' la prossima volta.
 *
 * Il vincolo di forma sul registro accetta fino a 64 caratteri senza spazi.
 * Apple usa cifre decimali, ma non lo diamo per scontato al punto di rifiutare
 * un acquisto vero: si controlla solo cio' che renderebbe la chiave inservibile
 * (vuota, con spazi, o troppo lunga per la colonna).
 */
export const SANDBOX_KEY_PREFIX = "sandbox:";

export function appleOwnershipKey(
  originalTransactionId: string | undefined | null,
  /**
   * L'ambiente della transazione. Non e' decorativo: Sandbox e produzione
   * numerano gli `originalTransactionId` in spazi DIVERSI, quindi due
   * transazioni diverse possono avere lo stesso identificativo. Il registro ha
   * un vincolo di unicita' su (billing_source, ownership_key): senza
   * separazione, una transazione di prova potrebbe rivendicare la proprieta'
   * di un acquisto vero — o, altrettanto grave, farsi respingere come "gia' di
   * un altro account" un acquisto legittimo.
   *
   * Il valore predefinito e' 'production' perche' e' cio' che erano tutte le
   * chiavi scritte fino a qui: cambiare la forma di quelle esistenti
   * significherebbe non riconoscere piu' gli acquisti gia' registrati.
   */
  environment: "production" | "sandbox" = "production",
): string {
  if (!originalTransactionId) {
    throw new OwnershipKeyError("apple_missing_original_transaction_id");
  }
  const grezza = originalTransactionId.trim();
  const key =
    environment === "sandbox" ? `${SANDBOX_KEY_PREFIX}${grezza}` : grezza;
  if (grezza.length === 0 || key.length > 64 || /\s/.test(key)) {
    throw new OwnershipKeyError("apple_malformed_original_transaction_id");
  }
  return key;
}

/**
 * Google: SHA-256 esadecimale del purchase token.
 *
 * Il token in chiaro non entra nel registro. E' la credenziale con cui si
 * interroga Google per conto di quell'acquisto: salvarla equivale a salvare una
 * password, e il registro serve a dire di chi e' un acquisto, non a poterlo
 * riesercitare.
 *
 * Il primo parametro NON e' decorativo. Pretendere il risultato gia' validato
 * rende impossibile calcolare una chiave prima che Google abbia risposto 200:
 * senza, basterebbe un token inventato per scrivere una proprieta' su un
 * acquisto che non esiste, e il registro e' append-only.
 */
export function googleOwnershipKey(
  validated: Extract<GooglePlayResult, { kind: "ok_subscription" | "ok_product" }>,
  purchaseToken: string | undefined | null,
): string {
  // Il tipo lo impedisce gia', ma il tipo sparisce a runtime: basta un cast,
  // un `any` di passaggio o un chiamante JavaScript e un esito di ERRORE
  // arriverebbe qui producendo una chiave per un acquisto che Google non ha
  // mai confermato. In un percorso di pagamento la stessa regola va scritta
  // due volte.
  if (validated?.kind !== "ok_subscription" && validated?.kind !== "ok_product") {
    throw new OwnershipKeyError("google_result_not_validated");
  }
  if (!purchaseToken || purchaseToken.trim().length === 0) {
    throw new OwnershipKeyError("google_missing_purchase_token");
  }
  assertNoUpgradeChain(validated);
  return createHash("sha256").update(purchaseToken, "utf8").digest("hex");
}

/**
 * Upgrade e downgrade di abbonamento: NON SUPPORTATI, e fail-closed.
 *
 * Quando un abbonamento Play cambia piano, Google emette un purchase token
 * NUOVO e mette in `linkedPurchaseToken` quello vecchio. Il digest del token
 * nuovo e' una chiave diversa da quella del token vecchio, quindi il registro
 * vedrebbe un acquisto mai visto prima e lo assegnerebbe a chiunque lo
 * presenti: se nel frattempo l'utente ha cambiato account FitMesh, la stessa
 * catena di abbonamento risulterebbe di proprieta' di due persone diverse,
 * senza che nessun conflitto venga mai rilevato.
 *
 * La continuita' vera richiede di risalire la catena e riusare la proprieta'
 * della prima transazione. Finche' non e' implementata e provata, questo
 * percorso si RIFIUTA invece di creare in silenzio una proprieta' indipendente.
 * Un abbonamento che non si aggiorna e' un problema; una proprieta' attribuita
 * alla persona sbagliata e' irreversibile.
 *
 * FitMesh oggi vende su Android un lifetime (one-time, nessuna catena) e un
 * semestrale senza piani alternativi, quindi il caso non si presenta ancora.
 * Presentarsi senza essere gestito e' pero' esattamente cio' che rende un
 * difetto invisibile fino al giorno in cui costa un cliente.
 */
function assertNoUpgradeChain(
  validated: Extract<GooglePlayResult, { kind: "ok_subscription" | "ok_product" }>,
): void {
  if (validated.kind !== "ok_subscription") return;
  // `linkedPurchaseToken` non e' nel sottoinsieme tipizzato che parsiamo, ma
  // arriva davvero nella risposta: si legge dal dato a runtime, non dal tipo.
  const linked = (validated.data as Record<string, unknown>).linkedPurchaseToken;
  if (typeof linked === "string" && linked.trim().length > 0) {
    throw new OwnershipKeyError("google_subscription_upgrade_chain_unsupported");
  }
}
