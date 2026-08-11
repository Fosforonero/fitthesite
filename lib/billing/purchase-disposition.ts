/**
 * La DISPOSIZIONE di un esito di validazione: non "è andata bene?", ma "che
 * cosa deve farne il client?".
 *
 * Fino alla 189 questa decisione la prendeva il client, deducendola dal codice
 * di errore con una lista scritta a mano. Quella lista dichiarava terminali tre
 * codici che non lo erano — `jws_malformed`, `jws_incomplete`,
 * `jws_sandbox_not_allowed` — e chiudere una transazione terminale significa
 * cancellare l'unica prova che resta di un acquisto pagato.
 *
 * Il backend è l'unico che sa perché ha risposto quel codice. Dirlo
 * esplicitamente toglie al client il compito di indovinare.
 *
 * ── PERCHÉ È VERSIONATO ────────────────────────────────────────────────────
 *
 * Un client che non riconosce la versione NON deve usare questo campo: deve
 * ricadere sulla propria classificazione, che è conservativa. Una disposizione
 * che il client interpreta male è peggio di una disposizione assente, perché
 * l'errore più costoso in entrambe le direzioni è lo stesso — chiudere una
 * transazione che andava tenuta aperta.
 *
 * ── COMPATIBILITÀ CON LA 189 ───────────────────────────────────────────────
 *
 * I campi che la 189 legge (`state`, `active_until`, `source`,
 * `auto_renewing`, `error`) restano dove sono, con gli stessi nomi e gli stessi
 * tipi. Questi due si AGGIUNGONO. Una build che non li conosce li ignora, ed è
 * esattamente cosa fa la 189: legge `body['error']` e `body['active_until']`
 * per nome, senza validare la forma dell'oggetto.
 */

/** Cambiala solo se il SIGNIFICATO di una disposizione cambia, mai per aggiungerne una. */
export const PURCHASE_DISPOSITION_CONTRACT_VERSION = 1;

export type PurchaseDispositionWire =
  /** Diritto concesso e persistito: il cliente ha quello che ha pagato. */
  | "verified"
  /**
   * Non sappiamo ancora niente di definitivo: rete, timeout, 5xx, persistenza
   * fallita, configurazione mancante. Non è un rifiuto, è un silenzio.
   */
  | "retryable"
  /** La transazione è di un altro account FitMesh. Terminale per questo, ma non si chiude. */
  | "account_conflict"
  /**
   * Il rifiuto dimostra un difetto NOSTRO di formato, prodotto o contratto.
   * L'acquisto è probabilmente sano e i soldi incassati: non si chiude.
   */
  | "client_contract_error"
  /** Lo store ha DIMOSTRATO che il diritto non esiste e non nascerà. */
  | "store_verified_terminal_rejection";

/**
 * I soli codici in cui lo store ha dimostrato che il diritto non esiste.
 *
 * Elencati a mano, senza prefissi e senza pattern: degli otto codici `jws_*`
 * che questo backend emette, cinque NON sono terminali, e uno
 * `startsWith('jws_')` li butterebbe via tutti insieme.
 */
const STORE_VERIFIED_TERMINAL = new Set<string>([
  // La firma crittografica non regge: quel token non lo ha emesso Apple.
  "jws_signature_invalid",
  // Apple dichiara la transazione REVOCATA o RIMBORSATA. Non è un certificato
  // revocato: è l'acquisto a essere stato annullato alla fonte.
  "jws_revoked",
  // La transazione non è della nostra app.
  "jws_wrong_app",
  // L'acquisto non è nella ricevuta presentata.
  "purchase_not_in_receipt",
]);

/** Difetti nostri: formato, prodotto, contratto. L'acquisto probabilmente è sano. */
const CLIENT_CONTRACT_ERROR = new Set<string>([
  "jws_malformed",
  "jws_incomplete",
  "jws_wrong_product",
  "jws_wrong_type",
  "jws_sandbox_not_allowed",
  "token_format_mismatch",
  "ios_subscription_not_supported",
  "unknown_product",
  "invalid_payload",
  "invalid_json",
  "google_subscription_upgrade_chain_unsupported",
]);

const ACCOUNT_CONFLICT = new Set<string>([
  "purchase_already_linked",
  "purchase_belongs_to_other_account",
]);

/**
 * Da un codice di errore alla disposizione.
 *
 * Il default è `retryable`, e non è pigrizia: un codice che non sappiamo
 * classificare non è una prova che l'acquisto sia invalido. Sbagliare verso
 * "riprova" costa una richiesta in più; sbagliare verso "terminale" costa un
 * cliente.
 */
export function dispositionForCode(code: string): PurchaseDispositionWire {
  if (STORE_VERIFIED_TERMINAL.has(code)) return "store_verified_terminal_rejection";
  if (ACCOUNT_CONFLICT.has(code)) return "account_conflict";
  if (CLIENT_CONTRACT_ERROR.has(code)) return "client_contract_error";
  return "retryable";
}
