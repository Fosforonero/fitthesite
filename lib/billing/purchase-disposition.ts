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
 *
 * ── PERCHÉ LA TABELLA È UNA SOLA, ED ESAUSTIVA ─────────────────────────────
 *
 * Il punto 8 del cancello di ripresa diceva che backend e client concordavano
 * solo sui codici esercitati. Era vero, e la divergenza più grave era questa:
 * il backend dichiarava `purchase_not_in_receipt` come rifiuto VERIFICATO
 * DALLO STORE, cioè il permesso di chiudere la transazione; il client lo
 * classificava recuperabile. Vinceva il client — davanti a una contraddizione
 * ricade su `retryable` — ma solo per la sua diffidenza, non perché il
 * contratto fosse giusto.
 *
 * E il contratto era sbagliato dalla parte del backend. Una ricevuta App Store
 * che non contiene la transazione cercata non è una prova che l'acquisto non
 * esista: può essere una ricevuta non ancora aggiornata sul dispositivo, ed è
 * proprio il caso in cui il cliente ha pagato. Non è un rifiuto dimostrato.
 *
 * Da qui in avanti i codici sono elencati TUTTI in una sola tabella, e un test
 * strutturale legge i sorgenti che li emettono e verifica che nessuno manchi e
 * che nessuno sia di troppo. Il default `retryable` resta, ma solo per i codici
 * che non esistono ancora.
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
 * OGNI codice che questo backend può restituire, e la sua disposizione.
 *
 * Esaustiva per costruzione: `purchase-disposition.test.ts` legge i sorgenti
 * che emettono codici e fallisce se ne trova uno che non è qui, o se qui c'è
 * un codice che nessuno emette più. Una tabella che si aggiorna a mano
 * diverge; una che un test confronta con i sorgenti no.
 *
 * I TERMINALI SONO DUE, ed è un numero che va difeso: sono i soli casi in cui lo
 * store ha DIMOSTRATO che il diritto non esiste E in cui sappiamo che la
 * transazione che stiamo chiudendo è proprio quella — la revoca dichiarata da
 * Apple, sul ramo JWS (`jws_revoked`) e sul ramo StoreKit 1
 * (`purchase_revoked`). Sono lo stesso fatto detto da due protocolli. Tutto il resto —
 * guasti, timeout, difetti nostri, conflitti, codici sconosciuti — lascia la
 * transazione aperta, perché una transazione aperta torna da sola al prossimo
 * avvio ed è la rete di sicurezza che non costa niente.
 */
export const PURCHASE_DISPOSITION_CONTRACT: Readonly<
  Record<string, PurchaseDispositionWire>
> = Object.freeze({
  // ── Lo store ha dimostrato che il diritto non esiste ────────────────────
  //
  // DUE, e sono lo stesso fatto detto da due protocolli. Il motivo va letto
  // prima di aggiungerne un terzo.
  //
  // Chiudere una transazione senza aver concesso il diritto richiede di sapere
  // due cose: che quel diritto non esiste, e che la transazione che sto
  // chiudendo è proprio quella. La seconda è la parte che si dimentica.
  //
  // Su `jws_revoked` la firma VERIFICA: è Apple a dichiarare la revoca, e il
  // binding fra l'evidenza e la transazione lo stabilisce la firma stessa. Su
  // `purchase_revoked` lo stabilisce l'enumerazione che Apple restituisce a
  // verifyReceipt, transazione per transazione.
  //
  // Sui due qui sotto il binding manca, ma per DUE RAGIONI DIVERSE, e vanno
  // tenute separate: una sola motivazione le copre male, ed è confutabile.
  //
  // `jws_signature_invalid`: la firma NON verifica, quindi il payload non può
  // attestare niente su di sé, transactionId compreso. Quello che sappiamo è
  // che il blob ricevuto non è utilizzabile — corruzione in transito, errore
  // di codifica nostro — non che la transazione StoreKit sia nulla.
  //
  // `jws_wrong_app`: qui la firma VERIFICA, e il payload è autentico. Ma parla
  // di un'ALTRA app, quindi non descrive la transazione locale che staremmo
  // chiudendo: abbiamo mandato il blob sbagliato, e la transazione giusta è
  // ancora lì, aperta e pagata.
  //
  // Sono quindi difetti NOSTRI: non si chiude niente, si sopprime per 24 ore
  // (così non si ripresenta a ogni avvio) e si riparte da soli quando il
  // difetto viene corretto.
  /** Apple dichiara la transazione REVOCATA o RIMBORSATA. I soldi sono già tornati. */
  jws_revoked: "store_verified_terminal_rejection",
  /**
   * Lo stesso fatto, dal ramo StoreKit 1: `cancellation_date_ms` valorizzato
   * nella risposta di verifyReceipt.
   *
   * IL BINDING REGGE, ed e' il motivo per cui questo e' il SECONDO terminale e
   * non un terzo silenzio. La risposta arriva da Apple su TLS ed enumera le
   * transazioni della ricevuta che le abbiamo mandato, ciascuna col proprio
   * `original_transaction_id`: quando dice "questa e' stata annullata", sta
   * parlando di una transazione identificata, non di una generica.
   *
   * E l'obiezione che vale per `purchase_not_in_receipt` — la ricevuta sul
   * dispositivo puo' essere vecchia — qui non si applica, perche' e'
   * asimmetrica: una ricevuta non aggiornata puo' OMETTERE un rimborso, non
   * inventarlo. L'assenza non prova niente; la presenza si'.
   *
   * Come per `jws_revoked`, la route lo restituisce SOLO dopo che la revoca
   * risulta persistita nel registro. Se la scrittura non riesce risponde
   * `apple_unavailable`, che e' un silenzio e non chiude niente.
   */
  purchase_revoked: "store_verified_terminal_rejection",

  // ── La transazione è di qualcun altro ───────────────────────────────────
  purchase_already_linked: "account_conflict",
  purchase_belongs_to_other_account: "account_conflict",

  // ── Difetti NOSTRI: formato, prodotto, contratto ────────────────────────
  // Ritentare identici darebbe la stessa risposta, quindi non si ritenta; ma
  // non si chiude nemmeno, perché l'acquisto dietro può essere sanissimo.
  /**
   * La firma non regge. Dice che il blob non è utilizzabile, NON che la
   * transazione sia nulla: vedi la nota sopra sul binding.
   */
  jws_signature_invalid: "client_contract_error",
  /**
   * Il bundle id dentro il token è di un'altra app. Anche questo è un fatto
   * sul blob: se abbiamo mandato il token sbagliato, la transazione giusta è
   * ancora lì e va lasciata aperta.
   */
  jws_wrong_app: "client_contract_error",
  /**
   * Dipende da DOVE gira la build, non dall'acquisto: una transazione Sandbox
   * presentata a un backend di produzione. È PERMANENTE per quella coppia
   * build/backend — non si risolve da solo — quindi va nella classe che ha un
   * freno: `retryable` non sopprime niente e chiederebbe al backend a ogni
   * singolo avvio, per sempre. Chi lo incontra è chi testa da TestFlight e
   * App Review, che compra in sandbox contro il backend di produzione.
   */
  jws_sandbox_not_allowed: "client_contract_error",
  jws_malformed: "client_contract_error",
  jws_incomplete: "client_contract_error",
  jws_wrong_product: "client_contract_error",
  jws_wrong_type: "client_contract_error",
  token_format_mismatch: "client_contract_error",
  ios_subscription_not_supported: "client_contract_error",
  unknown_product: "client_contract_error",
  invalid_payload: "client_contract_error",
  invalid_json: "client_contract_error",
  google_subscription_upgrade_chain_unsupported: "client_contract_error",

  // ── Silenzi: non sappiamo ancora niente ─────────────────────────────────
  /**
   * NON è un rifiuto dimostrato, ed è la correzione più importante di questa
   * tabella. Una ricevuta App Store che non contiene la transazione cercata
   * può essere una ricevuta non ancora aggiornata sul dispositivo: il caso in
   * cui il cliente ha pagato e la prova arriverà al prossimo giro. Fino
   * all'11/08/2026 il backend la dichiarava terminale.
   */
  purchase_not_in_receipt: "retryable",
  apple_unavailable: "retryable",
  apple_validation_failed: "retryable",
  google_validation_failed: "retryable",
  app_store_not_configured: "retryable",
  google_play_not_configured: "retryable",
  /** La persistenza non ha scritto: niente è stato salvato, ritentare è sicuro. */
  claim_failed: "retryable",
  internal: "retryable",
  unexpected_result_kind: "retryable",
});

/**
 * Lo STATO HTTP con cui ciascun codice arriva al client.
 *
 * Sta qui e non solo dentro la route per una ragione operativa: il client
 * Flutter guarda anche lo stato, e il contratto pubblicato per l'altro
 * repository deve poter descrivere la risposta INTERA, non solo il suo corpo.
 * `purchase-disposition.test.ts` confronta ogni voce con la `jsonError(...)`
 * vera dei sorgenti, quindi questa tabella non può divergere in silenzio.
 */
export const PURCHASE_HTTP_STATUS: Readonly<Record<string, number>> =
  Object.freeze({
    jws_signature_invalid: 400,
    jws_revoked: 400,
    purchase_revoked: 400,
    jws_wrong_app: 400,

    purchase_already_linked: 409,
    purchase_belongs_to_other_account: 409,

    jws_malformed: 400,
    jws_incomplete: 400,
    jws_wrong_product: 400,
    jws_wrong_type: 400,
    token_format_mismatch: 400,
    ios_subscription_not_supported: 400,
    unknown_product: 400,
    invalid_payload: 400,
    invalid_json: 400,
    google_subscription_upgrade_chain_unsupported: 400,

    purchase_not_in_receipt: 400,
    jws_sandbox_not_allowed: 400,
    apple_unavailable: 503,
    apple_validation_failed: 502,
    google_validation_failed: 502,
    app_store_not_configured: 503,
    google_play_not_configured: 503,
    claim_failed: 500,
    internal: 500,
    unexpected_result_kind: 500,
  });

/**
 * Da un codice di errore alla disposizione.
 *
 * Il default è `retryable`, e non è pigrizia: un codice che non sappiamo
 * classificare non è una prova che l'acquisto sia invalido. Sbagliare verso
 * "riprova" costa una richiesta in più; sbagliare verso "terminale" costa un
 * cliente.
 */
export function dispositionForCode(code: string): PurchaseDispositionWire {
  return PURCHASE_DISPOSITION_CONTRACT[code] ?? "retryable";
}
