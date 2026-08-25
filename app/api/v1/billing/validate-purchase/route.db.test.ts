/**
 * VECCHIA ROUTE -> TRIGGER -> RILETTURA DELLA PROIEZIONE -> RISPOSTA HTTP.
 *
 * Il `return null` della guardia difende il DATABASE: K2 e il Founder
 * sopravvivono a un acquisto revocato che la 189 ripresenta. Non difende la
 * RISPOSTA. La 189 costruisce il corpo del suo 200 dall'oggetto che stava
 * provando a scrivere:
 *
 *     const err = await upsertSubscription(admin, row);
 *     if (err) return jsonError(500, "upsert_failed", err);
 *     return jsonOk({ state: row.state, active_until: row.active_until, ... });
 *
 * e una scrittura scartata dal trigger non produce nessun errore — zero righe
 * toccate, `error` null. Il 200 esce lo stesso, e descrive `row`, non il
 * database.
 *
 * ── PERCHE' NON BASTAVA DEDURLO ─────────────────────────────────────────────
 *
 * Perche' la deduzione era gia' stata sbagliata una volta, sull'ordine dei
 * lock: si era ragionato su una UPDATE mentre il codice faceva un upsert.
 * Qui il backend vecchio viene ESEGUITO — la copia letterale in
 * test/legacy-189/, presa da `main` e verificata per impronta — contro il
 * database vero, con i trigger veri, e si guarda cosa risponde.
 *
 * ── COSA E' VERO E COSA E' SOSTITUITO ───────────────────────────────────────
 *
 * Vero: il route handler, il database, i trigger, le RPC, la proiezione.
 * Sostituito: il trasporto verso PostgREST (qui e' psql, vedi
 * test/db/psql-supabase.ts) e la verifica presso Apple, che non e' cio' che
 * questi casi misurano.
 */
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { creaClientPsql, databaseRaggiungibile, sql } from "@/test/db/psql-supabase";

const mocks = vi.hoisted(() => ({
  requireUser: vi.fn(),
  verifyJws: vi.fn(),
  validateAppleReceipt: vi.fn(),
  readAppleSharedSecret: vi.fn(() => "segreto-di-prova"),
}));

vi.mock("@/lib/api/auth-helpers", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api/auth-helpers")>();
  return { ...actual, requireUser: mocks.requireUser };
});
vi.mock("@/lib/billing/app-store-jws", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/billing/app-store-jws")>();
  return { ...actual, verifyAppleJwsTransaction: mocks.verifyJws };
});
vi.mock("@/lib/billing/app-store", () => ({
  readAppleSharedSecret: mocks.readAppleSharedSecret,
  validateAppleReceipt: mocks.validateAppleReceipt,
}));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => creaClientPsql(),
}));

import { POST as post189 } from "@/test/legacy-189/route-189.vendored";
import { POST as postNuova } from "./route";

const U = "00000000-0000-4000-8000-00000000e001";
const K1 = "7000000000000001";
const K2 = "7000000000000002";
const LIFETIME = "fitmesh_pro_lifetime";
const SENTINELLA = "9999-12-31T23:59:59Z";
/** Forma di un JWS reale: tre segmenti base64url. Il contenuto non conta, il
 *  verificatore e' mockato — ma la FORMA si', perche' e' cio' che sceglie il ramo. */
const JWS = "eyJhbGciOiJFUzI1NiJ9.eyJwcm9kdWN0SWQiOiJ4In0.c2lnbmF0dXJl";
const RICEVUTA = "MIIT2wYJKoZIhvcNAQcCoIITzDCCE8gCAQExCzAJBgUrDgMCGgUA";

const disponibile = databaseRaggiungibile();

function corpo(extra: Record<string, unknown>): Request {
  return new Request("https://www.fitmesh.fit/api/v1/billing/validate-purchase", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      product_id: LIFETIME,
      package_name: "fit.fitmesh.app",
      platform: "ios",
      ...extra,
    }),
  });
}

/** La 189: ricevuta StoreKit 1, nessuna dichiarazione di contratto. */
const richiesta189 = () => corpo({ purchase_token: RICEVUTA });
/** La 190: JWS StoreKit 2 e versione del contratto dichiarata. */
const richiesta190 = () =>
  corpo({ purchase_token: JWS, token_format: "sk2_jws", client_contract_version: 1 });

// ── Il banco ────────────────────────────────────────────────────────────────

function esegui(q: string): string {
  return sql(q);
}

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
          values ('${U}','route-db@test.local', now());`);
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

/**
 * "Questa risposta dichiara un diritto?" — cioe': se il client la prendesse per
 * buona, si considererebbe Pro?
 */
function dichiaraUnDiritto(status: number, body: Record<string, unknown>): boolean {
  if (status !== 200) return false;
  const stato = String(body.state ?? "");
  if (stato !== "active" && stato !== "grace") return false;
  const fino = Date.parse(String(body.active_until ?? ""));
  return Number.isFinite(fino) && fino > Date.now();
}

/** "Il database possiede quel diritto?" — la stessa domanda, fatta al database. */
function ilDatabasePossiedeUnDiritto(): boolean {
  const p = proiezione();
  if (!p) return false;
  if (p.state !== "active" && p.state !== "grace") return false;
  return Date.parse(p.activeUntil) > Date.now();
}

async function leggi(r: Response): Promise<{ status: number; body: Record<string, unknown> }> {
  return { status: r.status, body: (await r.json()) as Record<string, unknown> };
}

let modoIniziale = "compatibility";

describe.skipIf(!disponibile)(
  "vecchia route -> trigger -> proiezione -> risposta HTTP",
  () => {
    beforeAll(() => {
      modoIniziale = esegui(
        "select mode from private.billing_projection_guard_mode where singleton;",
      );
      esegui(`update private.billing_projection_guard_mode
              set mode='compatibility', note='route.db.test' where singleton;`);
    });

    afterAll(() => {
      pulisci();
      esegui(`update private.billing_projection_guard_mode
              set mode='${modoIniziale}', note='route.db.test teardown' where singleton;`);
    });

    beforeEach(() => {
      vi.clearAllMocks();
      mocks.requireUser.mockResolvedValue({ userId: U });
      mocks.readAppleSharedSecret.mockReturnValue("segreto-di-prova");
      // Quel che Apple risponde alla 189 per K1: un acquisto che esiste e non
      // dice niente di un rimborso. E' il caso reale — la ricevuta sul
      // dispositivo puo' benissimo non essere aggiornata.
      mocks.validateAppleReceipt.mockResolvedValue({
        kind: "ok",
        tx: { original_transaction_id: K1, transaction_id: K1 },
        autoRenewing: false,
        environment: "production",
        requestDateMs: Date.now(),
      });
      mocks.verifyJws.mockResolvedValue({
        kind: "ok",
        tx: {
          transactionId: K1,
          originalTransactionId: K1,
          productId: LIFETIME,
          appAccountToken: null,
          environment: "Production",
          purchaseDateMs: Date.now() - 86_400_000,
          // Fotografia PIU' VECCHIA della revoca: e' cosi' che si presenta una
          // ricevuta non aggiornata, ed e' il caso in cui la regola del
          // solo-in-avanti deve tenere.
          signedDateMs: Date.now() - 7_200_000,
        },
      });
      pulisci();
      creaUtente();
    });

    // ── S1: acquisto revocato, nessun altro diritto ────────────────────────
    it("S1 — la 189 risponde 200 active per un acquisto revocato; il database dice expired", async () => {
      registra(K1, 3);
      revoca(K1);
      expect(proiezione()?.state).toBe("expired");

      const vecchia = await leggi(await post189(richiesta189()));

      // Il fatto, misurato e non dedotto.
      expect(vecchia.status).toBe(200);
      expect(vecchia.body.state).toBe("active");
      expect(dichiaraUnDiritto(vecchia.status, vecchia.body)).toBe(true);
      expect(ilDatabasePossiedeUnDiritto()).toBe(false);

      // E il database non si e' fatto corrompere: e' esattamente la meta' che
      // il `return null` difende.
      expect(proiezione()?.state).toBe("expired");
      const statoRegistro = esegui(
        `select state from private.billing_purchase_states
          where billing_source='apple_iap' and ownership_key='${K1}';`,
      );
      expect(statoRegistro).toBe("revoked");
    });

    it("S1 — la 190 risponde con cio' che il database possiede, e non concede niente", async () => {
      registra(K1, 3);
      revoca(K1);

      const nuova = await leggi(await postNuova(richiesta190()));

      expect(nuova.status).toBe(200);
      expect(nuova.body.state).toBe("expired");
      expect(nuova.body.disposition).toBe("retryable");
      expect(dichiaraUnDiritto(nuova.status, nuova.body)).toBe(false);
      expect(ilDatabasePossiedeUnDiritto()).toBe(false);
    });

    // ── S2: K1 revocato, K2 ancora valido ──────────────────────────────────
    it("S2 — con K2 valido il database concede il diritto, e la 190 lo dichiara con i dati di K2", async () => {
      registra(K1, 4);
      registra(K2, 3);
      revoca(K1);
      expect(ilDatabasePossiedeUnDiritto()).toBe(true);
      expect(proiezione()?.source).toBe("apple_iap");

      const vecchia = await leggi(await post189(richiesta189()));
      // Qui la 189 dice il vero per caso: il cliente HA un diritto, solo che
      // non e' quello che la risposta descrive. Il danno e' zero, e va detto
      // com'e' — non e' una difesa, e' una coincidenza.
      expect(dichiaraUnDiritto(vecchia.status, vecchia.body)).toBe(true);
      expect(ilDatabasePossiedeUnDiritto()).toBe(true);
      // La riga autorevole e' rimasta K2, non e' diventata K1 scaduto.
      expect(
        esegui(`select external_subscription_id from public.b2c_subscriptions
                 where user_id='${U}';`),
      ).toBe(K2);

      const nuova = await leggi(await postNuova(richiesta190()));
      expect(nuova.status).toBe(200);
      expect(dichiaraUnDiritto(nuova.status, nuova.body)).toBe(true);
      expect(ilDatabasePossiedeUnDiritto()).toBe(true);
      expect(nuova.body.state).toBe(proiezione()?.state);
    });

    // ── S3: Founder ────────────────────────────────────────────────────────
    it("S3 — il Founder resta Founder, e la 190 risponde founder_grant invece di apple_iap", async () => {
      esegui(`begin; select set_config('billing.projection','on',true);
              insert into public.b2c_subscriptions
                (user_id, billing_source, external_product_id, external_subscription_id,
                 active_until, auto_renewing, state)
              values ('${U}','founder_grant','${LIFETIME}','founder-${U}',
                      '${SENTINELLA}'::timestamptz, false, 'active'); commit;`);

      const vecchia = await leggi(await post189(richiesta189()));
      expect(vecchia.status).toBe(200);
      // La 189 dice apple_iap. Il database dice founder_grant.
      expect(vecchia.body.source).toBe("apple_iap");
      expect(proiezione()?.source).toBe("founder_grant");

      const nuova = await leggi(await postNuova(richiesta190()));
      expect(nuova.status).toBe(200);
      expect(nuova.body.source).toBe("founder_grant");
      expect(nuova.body.source).toBe(proiezione()?.source);
      expect(dichiaraUnDiritto(nuova.status, nuova.body)).toBe(true);
      expect(ilDatabasePossiedeUnDiritto()).toBe(true);
    });

    // ── L'invariante, su tutti gli scenari ─────────────────────────────────
    it("la 190 non dichiara mai un diritto che il database non possiede", async () => {
      const scenari: { nome: string; monta: () => void }[] = [
        { nome: "revocato senza alternative", monta: () => { registra(K1, 3); revoca(K1); } },
        { nome: "revocato con K2 valido", monta: () => { registra(K1, 4); registra(K2, 3); revoca(K1); } },
        { nome: "mai visto prima", monta: () => {} },
        {
          nome: "gia' registrato e attivo",
          monta: () => { registra(K1, 3); },
        },
      ];

      for (const s of scenari) {
        pulisci();
        creaUtente();
        s.monta();
        const r = await leggi(await postNuova(richiesta190()));
        expect(
          dichiaraUnDiritto(r.status, r.body) && !ilDatabasePossiedeUnDiritto(),
          `scenario "${s.nome}": la risposta dichiara un diritto che il database non ha (${JSON.stringify(r.body)})`,
        ).toBe(false);
      }
    });
  },
);
