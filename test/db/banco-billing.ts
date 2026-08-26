/**
 * Il banco condiviso dalle suite di validate-purchase.
 *
 * Sta qui e non dentro i file di test perche' le suite sono due — quella
 * DIAGNOSTICA sulla copia storica e quella che BLOCCA il rilascio — e uno
 * scenario montato in due modi leggermente diversi renderebbe incomparabili
 * proprio i due risultati che devono essere confrontati.
 *
 * ── PERCHE' E' UNA FABBRICA E NON UN MODULO DI COSTANTI ─────────────────────
 *
 * Vitest esegue i file in parallelo. Due file che scrivono lo STESSO utente e
 * le STESSE chiavi sullo stesso database si cancellano i dati a vicenda: la
 * prima stesura di questa separazione e' finita con un 500 da chiave esterna e
 * un diritto sparito a meta' scenario, che sembravano difetti del prodotto e
 * invece erano due test che si pestavano i piedi. Ogni file dichiara la
 * propria identita' e non tocca quella dell'altro.
 *
 * I mock (`vi.mock`) restano invece nei singoli file: sono per-modulo, e un
 * file di test deve poter vedere a colpo d'occhio cosa ha sostituito.
 */
import { expect } from "vitest";

import { sql } from "@/test/db/psql-supabase";

export const LIFETIME = "fitmesh_pro_lifetime";
export const SENTINELLA = "9999-12-31T23:59:59Z";

/**
 * Forma di un JWS reale: tre segmenti base64url. Il contenuto non conta, i
 * verificatori sono mockati — ma la FORMA si', perche' e' cio' che sceglie il
 * ramo nella candidata (`looksLikeJws`).
 */
export const JWS = "eyJhbGciOiJFUzI1NiJ9.eyJwcm9kdWN0SWQiOiJ4In0.c2lnbmF0dXJl";

/** Il nome pacchetto vero, letto dal client. */
export const PACCHETTO = "com.fitmeshsync.app";

export function corpo(extra: Record<string, unknown>): Request {
  return new Request("https://www.fitmesh.fit/api/v1/billing/validate-purchase", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      product_id: LIFETIME,
      package_name: PACCHETTO,
      platform: "ios",
      ...extra,
    }),
  });
}

/**
 * IL CLIENT LETTERALE v3.9.8+189 — letto dal tag, non ricostruito a memoria.
 *
 * `AppFitmesh/flutter_app/lib/features/billing/data/validate_purchase_api.dart`
 * al tag `v3.9.8+189` compone il corpo con QUATTRO campi e basta:
 * product_id, purchase_token, package_name, platform.
 *
 * E su iOS `purchase_token` e' `verificationData.serverVerificationData`.
 * Dalla 0.4.0 del plugin StoreKit 2 e' il DEFAULT, quindi quel campo porta un
 * JWS — non la ricevuta base64 che il commento di quella stessa build
 * dichiarava. La versione precedente di questi test mandava una ricevuta
 * StoreKit 1 e un `package_name` che nessun client ha mai mandato: misurava
 * una richiesta che non esiste.
 *
 * Niente `token_format`, niente `client_contract_version`, niente
 * `request_id`: sono esattamente le assenze da cui la candidata riconosce una
 * build che precede il contratto delle disposizioni.
 */
export const richiesta189 = (): Request => corpo({ purchase_token: JWS });

/**
 * IL CLIENT LETTERALE 190 — stesso file, in testa al ramo: aggiunge
 * `client_contract_version` (1) e `request_id`. Non manda `token_format`, che
 * nessun client ha mai mandato.
 */
export const richiesta190 = (): Request =>
  corpo({
    purchase_token: JWS,
    client_contract_version: 1,
    request_id: "test-190-correlatore",
  });

export function esegui(q: string): string {
  return sql(q);
}

/**
 * La modalita' della guardia di proiezione e' una riga SINGLETON: globale al
 * database. Due file che la salvano e la ripristinano in parallelo si
 * riscrivono l'ultimo valore a vicenda. Quindi non si tocca: si PRETENDE.
 *
 * `compatibility` e' lo stato iniziale seminato dalla migration delle
 * fondamenta, quindi in un database di release appena ricostruito e' sempre
 * quello. Se non lo e', questi scenari misurerebbero un'altra cosa, e vale
 * molto di piu' saperlo che aggiustarlo di nascosto.
 */
export function esigiModoCompatibilita(): void {
  const modo = esegui("select mode from private.billing_projection_guard_mode where singleton;");
  expect(
    modo,
    "la guardia di proiezione non e' in 'compatibility': questi scenari misurerebbero un'altra cosa",
  ).toBe("compatibility");
}

/** "Questa risposta dichiara un diritto?" — cioe': se il client la prendesse
 *  per buona, si considererebbe Pro? */
export function dichiaraUnDiritto(status: number, body: Record<string, unknown>): boolean {
  if (status !== 200) return false;
  const stato = String(body.state ?? "");
  if (stato !== "active" && stato !== "grace") return false;
  const fino = Date.parse(String(body.active_until ?? ""));
  return Number.isFinite(fino) && fino > Date.now();
}

export async function leggi(r: Response): Promise<{ status: number; body: Record<string, unknown> }> {
  return { status: r.status, body: (await r.json()) as Record<string, unknown> };
}

export type Identita = { U: string; K1: string; K2: string };

export function creaBanco({ U, K1, K2 }: Identita) {
  function pulisci(): void {
    esegui(`begin; select set_config('billing.projection','on',true);
            delete from public.b2c_subscriptions where user_id='${U}'; commit;`);
    esegui(`alter table private.billing_purchase_states disable trigger billing_purchase_states_forward_only;
            alter table private.billing_purchase_claims disable trigger trg_billing_purchase_claims_immutable;
            delete from private.billing_purchase_states where ownership_key in ('${K1}','${K2}');
            delete from private.billing_purchase_claims where ownership_key in ('${K1}','${K2}');
            alter table private.billing_purchase_claims enable trigger trg_billing_purchase_claims_immutable;
            alter table private.billing_purchase_states enable trigger billing_purchase_states_forward_only;`);
    esegui(`delete from auth.users where id='${U}';`);
  }

  function creaUtente(): void {
    esegui(`insert into auth.users (id, email, created_at)
            values ('${U}','${U}@test.local', now());`);
  }

  function registra(chiave: string, quandoOre = 0): void {
    esegui(`select public.claim_store_purchase(
              'apple_iap', '${chiave}', '${U}'::uuid, '${LIFETIME}', 'lifetime',
              'production', 'active', '${SENTINELLA}'::timestamptz, false,
              now() - interval '${quandoOre} hours', 'apple_signed_date', 'tx-${chiave}', null);`);
  }

  function revoca(chiave: string): void {
    esegui(`select public.record_store_purchase_revocation(
              'apple_iap', '${chiave}', '${LIFETIME}', 'lifetime',
              now(), 'apple_signed_date', now() - interval '1 hour');`);
  }

  /** Cio' che il database possiede DAVVERO, letto dopo la risposta. */
  function proiezione(): { source: string; state: string; activeUntil: string } | null {
    const riga = esegui(
      `select coalesce((select t.billing_source || '~' || t.state || '~' || t.active_until
                          from public.b2c_subscriptions t where t.user_id='${U}'), '');`,
    );
    if (!riga) return null;
    const [source, state, activeUntil] = riga.split("~");
    return { source, state, activeUntil };
  }

  /** "Il database possiede quel diritto?" — la stessa domanda, al database. */
  function ilDatabasePossiedeUnDiritto(): boolean {
    const p = proiezione();
    if (!p) return false;
    if (p.state !== "active" && p.state !== "grace") return false;
    return Date.parse(p.activeUntil) > Date.now();
  }

  function montaFounder(): void {
    esegui(`begin; select set_config('billing.projection','on',true);
            insert into public.b2c_subscriptions
              (user_id, billing_source, external_product_id, external_subscription_id,
               active_until, auto_renewing, state)
            values ('${U}','founder_grant','${LIFETIME}','founder-${U}',
                    '${SENTINELLA}'::timestamptz, false, 'active'); commit;`);
  }

  function statoRegistro(chiave: string): string {
    return esegui(
      `select state from private.billing_purchase_states
        where billing_source='apple_iap' and ownership_key='${chiave}';`,
    );
  }

  function sottoscrizioneAutorevole(): string {
    return esegui(
      `select external_subscription_id from public.b2c_subscriptions where user_id='${U}';`,
    );
  }

  return {
    U,
    K1,
    K2,
    pulisci,
    creaUtente,
    registra,
    revoca,
    proiezione,
    ilDatabasePossiedeUnDiritto,
    montaFounder,
    statoRegistro,
    sottoscrizioneAutorevole,
  };
}
