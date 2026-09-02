import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * L'UNICA porta fra il backend e il registro degli acquisti.
 *
 * Prima di questo file la route scriveva `public.b2c_subscriptions` con un
 * upsert diretto su `user_id`. Quella tabella ha una riga per utente: un
 * secondo acquisto sostituiva il primo, l'identificativo della transazione
 * precedente smetteva di esistere e da quel momento chiunque poteva
 * reclamarla. Era il difetto HIGH che tutto questo sprint esiste per chiudere.
 *
 * Da qui in avanti nessun percorso commerciale scrive quella tabella: si passa
 * da `public.claim_store_purchase`, che dentro una sola transazione reclama la
 * proprieta', aggiorna lo stato dell'acquisto se l'evidenza store e' piu'
 * recente, ricalcola il MIGLIORE diritto posseduto dall'utente e proietta
 * quello.
 *
 * CONFINE: questo modulo non verifica niente. Chi lo chiama deve gia' avere in
 * mano una transazione verificata crittograficamente da Apple o una risposta
 * 200 di Google. Chiamarlo con dati non verificati significa registrare una
 * proprieta' su un acquisto che potrebbe non esistere, e il registro non si
 * corregge.
 */

export type BillingSource = "apple_iap" | "google_play";
export type PurchaseKind = "lifetime" | "subscription";

/** Stati che la proiezione sa rappresentare. `revoked` NON passa da qui. */
export type VerifiedPurchaseState =
  | "active"
  | "grace"
  | "on_hold"
  | "paused"
  | "expired"
  | "cancelled";

/**
 * Da quale orologio viene `storeEventAt`.
 *
 * Non e' un'etichetta descrittiva: e' cio' che rende lecito il confronto. Le
 * due sorgenti Apple sono lo stesso orologio (quello di Apple) e sono quindi
 * confrontabili fra loro; quella Google e' il nostro, all'istante in cui Play
 * ha risposto 200. Una chiave d'acquisto appartiene a un solo store, quindi
 * non si confronta mai un timestamp Apple con uno Google — e il vincolo sulla
 * tabella lo impone invece di sperarlo.
 */
export type StoreEventSource =
  | "apple_signed_date"
  | "apple_request_date"
  | "google_backend_fetch";

export type ClaimInput = {
  billingSource: BillingSource;
  /** Derivata dal backend dai soli dati verificati. Mai dal client. */
  ownershipKey: string;
  /** Dalla sessione autenticata. Mai dal corpo della richiesta. */
  ownerUserId: string;
  productId: string;
  purchaseKind: PurchaseKind;
  environment: "production" | "sandbox";
  state: VerifiedPurchaseState;
  activeUntil: string;
  autoRenewing: boolean;
  storeEventAt: string;
  storeEventSource: StoreEventSource;
  externalTransactionId?: string | null;
  appAccountToken?: string | null;
};

/** L'entitlement che risulta DAVVERO proiettato, che puo' non essere questo acquisto. */
export type ProjectedEntitlement = {
  source: string;
  productId: string;
  state: string;
  activeUntil: string;
  autoRenewing: boolean;
  isLifetime: boolean;
  /** Vero quando ha vinto una riga founder, che nessuna scrittura commerciale tocca. */
  protectedFounderRow: boolean;
};

export type ClaimResult =
  | {
      kind: "ok";
      /**
       * `reclaimed_after_owner_deletion`: la transazione era una tombstone —
       * il proprietario precedente aveva cancellato il proprio account — ed e'
       * tornata a chi ne ha appena dimostrato il possesso con un JWS Apple
       * valido. Per il chiamante e' un successo pieno quanto gli altri due, e
       * deve esserlo al PRIMO tentativo: trattarlo come esito ignoto
       * significava rispondere 503 e costringere l'utente a un secondo
       * «Ripristina acquisti» per vedersi riconoscere quello che aveva gia'
       * ottenuto.
       */
      outcome:
        | "claimed"
        | "already_owned_by_same_user"
        | "reclaimed_after_owner_deletion";
      /** Falso quando l'evidenza portata era piu' vecchia di quella registrata. */
      stateApplied: boolean;
      entitlement: ProjectedEntitlement | null;
    }
  /** La transazione e' di un altro account FitMesh, o di un account cancellato. */
  | { kind: "conflict"; ownerDeleted: boolean }
  /**
   * Il registro ha RIFIUTATO la scrittura per una ragione che non cambiera'
   * ritentando: oggi e' il cancello Sandbox (transazione di prova presentata da
   * un account che non e' un revisore autorizzato, o senza legame di account).
   *
   * Tenuto distinto da `persistence_failed` perche' le due cose portano a
   * comportamenti opposti nel client: quello dice "riprova", questo dice
   * "smetti". Un rifiuto travestito da guasto e' un ciclo di tentativi
   * infiniti su una cosa che non sara' mai concessa.
   */
  | { kind: "rejected"; reason: string }
  /**
   * Il database non ha scritto. Niente e' stato salvato — ne' la proprieta' ne'
   * lo stato — quindi ritentare e' sicuro e corretto.
   */
  | { kind: "persistence_failed"; reason: string }
  /**
   * Non siamo riusciti nemmeno a parlare col database, oppure ha risposto una
   * forma che non sappiamo leggere. Come sopra: non si conclude niente.
   */
  | { kind: "unavailable"; reason: string };

function parseEntitlement(raw: unknown): ProjectedEntitlement | null {
  if (raw === null || typeof raw !== "object") return null;
  const e = raw as Record<string, unknown>;
  if (e.projected !== true) return null;
  if (typeof e.source !== "string" || typeof e.state !== "string") return null;
  if (typeof e.activeUntil !== "string") return null;
  return {
    source: e.source,
    productId: typeof e.productId === "string" ? e.productId : "",
    state: e.state,
    activeUntil: e.activeUntil,
    autoRenewing: e.autoRenewing === true,
    isLifetime: e.isLifetime === true,
    protectedFounderRow: e.protectedFounderRow === true,
  };
}

/**
 * Chiama la RPC e traduce la sua risposta in un esito tipizzato.
 *
 * Ogni forma inattesa diventa `unavailable`, mai un successo: una risposta che
 * non sappiamo leggere non e' una prova che il diritto sia stato concesso, ed
 * e' esattamente scambiando un silenzio per un successo che un acquisto pagato
 * il 5 agosto 2026 non ha mai prodotto un Pro.
 */
export async function claimStorePurchase(
  admin: SupabaseClient,
  input: ClaimInput,
): Promise<ClaimResult> {
  const { data, error } = await admin.rpc("claim_store_purchase", {
    p_billing_source: input.billingSource,
    p_ownership_key: input.ownershipKey,
    p_owner_user_id: input.ownerUserId,
    p_external_product_id: input.productId,
    p_purchase_kind: input.purchaseKind,
    p_environment: input.environment,
    p_state: input.state,
    p_active_until: input.activeUntil,
    p_auto_renewing: input.autoRenewing,
    p_store_event_at: input.storeEventAt,
    p_store_event_source: input.storeEventSource,
    p_external_transaction_id: input.externalTransactionId ?? null,
    p_app_account_token: input.appAccountToken ?? null,
  });

  if (error) {
    // Il messaggio non viene propagato al client: puo' contenere frammenti di
    // parametri, e questa e' una risposta che l'utente legge.
    console.error(`[Billing] claim rpc error code=${error.code ?? "none"}`);
    // 42501 = insufficient_privilege. Lo solleva il cancello Sandbox sul
    // registro, ed e' un NO definitivo: ritentare non lo fara' diventare un si'.
    // Gli altri codici restano `unavailable`, cioe' ritentabili — un difetto
    // nostro non deve far chiudere al client una transazione pagata.
    if (error.code === "42501") {
      return { kind: "rejected", reason: "sandbox_gate" };
    }
    return { kind: "unavailable", reason: error.code ?? "rpc_error" };
  }

  const body = data as Record<string, unknown> | null;
  const outcome = typeof body?.outcome === "string" ? body.outcome : null;

  switch (outcome) {
    case "claimed":
    case "already_owned_by_same_user":
    case "reclaimed_after_owner_deletion":
      return {
        kind: "ok",
        outcome,
        stateApplied: body?.stateApplied === true,
        entitlement: parseEntitlement(body?.entitlement),
      };
    case "owned_by_other_user":
      return { kind: "conflict", ownerDeleted: body?.ownerDeleted === true };
    case "persistence_failed":
      return {
        kind: "persistence_failed",
        reason: typeof body?.reason === "string" ? body.reason : "unknown",
      };
    default:
      return { kind: "unavailable", reason: "unknown_outcome" };
  }
}

/**
 * Registra un rimborso o una revoca su un acquisto GIA' reclamato.
 *
 * Non assegna proprieta' a nessuno: chi porta la prova di una revoca non
 * diventa il proprietario di quell'acquisto. L'entitlement ricalcolato e'
 * quello del proprietario REGISTRATO, che puo' non essere chi sta chiamando —
 * l'evidenza e' firmata dallo store, quindi vale a prescindere da chi la
 * consegna.
 */
export type RevocationResult =
  /**
   * La revoca è REGISTRATA. `applied` distingue "l'ho scritta adesso" da "era
   * già registrata": entrambe sono persistenza avvenuta.
   */
  | { kind: "recorded"; applied: boolean }
  /**
   * Quell'acquisto non è nel registro, o il suo proprietario è stato
   * cancellato. Non c'è nessun entitlement da togliere e non c'è niente da
   * persistere: non è un guasto.
   */
  | { kind: "not_claimed"; reason: string }
  /**
   * NON è stato scritto niente. È il caso che il punto 7 del cancello ha
   * trovato scoperto: prima finiva qui dentro insieme al successo, e la route
   * rispondeva comunque un rifiuto terminale. Una revoca non persistita più un
   * rifiuto terminale significa che quell'utente tiene il Pro di un acquisto
   * rimborsato e non tornerà mai più a farcelo sapere, perché la transazione
   * l'ha chiusa.
   */
  | { kind: "not_persisted"; reason: string };

export async function recordStorePurchaseRevocation(
  admin: SupabaseClient,
  input: {
    billingSource: BillingSource;
    ownershipKey: string;
    productId: string;
    purchaseKind: PurchaseKind;
    /** Freschezza della fotografia: signedDate del JWS, o request_date. */
    storeEventAt: string;
    storeEventSource: StoreEventSource;
    /**
     * Quando il rimborso e' diventato efficace (revocationDate /
     * cancellation_date_ms). NON ordina: e' un fatto sull'acquisto, non una
     * fotografia. Tenerli separati e' cio' che permette a REFUND_REVERSED di
     * ripristinare l'accesso con una fotografia piu' recente.
     */
    revocationAt?: string | null;
  },
): Promise<RevocationResult> {
  const { data, error } = await admin.rpc("record_store_purchase_revocation", {
    p_billing_source: input.billingSource,
    p_ownership_key: input.ownershipKey,
    p_external_product_id: input.productId,
    p_purchase_kind: input.purchaseKind,
    p_store_event_at: input.storeEventAt,
    p_store_event_source: input.storeEventSource,
    p_revocation_at: input.revocationAt ?? null,
  });
  if (error) {
    console.error(`[Billing] revocation rpc error code=${error.code ?? "none"}`);
    return { kind: "not_persisted", reason: error.code ?? "rpc_error" };
  }
  const body = data as Record<string, unknown> | null;
  const outcome = typeof body?.outcome === "string" ? body.outcome : null;

  switch (outcome) {
    case "revoked":
      // `applied` NON basta a dire che la revoca sia registrata: falso può
      // voler dire "era già revocato" (persistito) oppure "non ho scritto".
      // Su questo esito il client CHIUDE la transazione, quindi la differenza
      // è tutta. È la RPC a dichiararlo con `persisted`; se un backend più
      // vecchio non lo mandasse, non si dà per buono.
      if (body?.persisted !== true) {
        return { kind: "not_persisted", reason: "revocation_not_persisted" };
      }
      return { kind: "recorded", applied: body?.applied === true };
    case "not_persisted":
      return { kind: "not_persisted", reason: "stale_or_unwritten" };
    case "unknown_purchase":
      // Terminale, e adesso lecito: la RPC scrive comunque la revoca in
      // private.billing_pending_revocations, quindi il primo claim su quella
      // chiave se la trovera' addosso. Se pero' quella scrittura non fosse
      // dichiarata, non ci sarebbe nessuna prova che il fatto sia al sicuro, e
      // chiudere la transazione tornerebbe a essere una scommessa.
      if (body?.pendingRegistrata !== true) {
        return { kind: "not_persisted", reason: "pending_non_registrata" };
      }
      return { kind: "not_claimed", reason: outcome };
    case "owner_deleted":
      return { kind: "not_claimed", reason: outcome };
    case "claim_in_flight":
      // Il claim ha committato mentre la revoca aspettava. Il fatto e' scritto
      // in attesa, ma NON e' stato applicato: la risposta non e' terminale, e
      // al giro dopo il percorso normale revoca davvero.
      return { kind: "not_persisted", reason: "claim_in_flight" };
    case "persistence_failed":
      return {
        kind: "not_persisted",
        reason: typeof body?.reason === "string" ? body.reason : "write_failed",
      };
    default:
      // Una forma che non sappiamo leggere non è una prova che la revoca sia
      // stata registrata.
      return { kind: "not_persisted", reason: "unknown_outcome" };
  }
}
