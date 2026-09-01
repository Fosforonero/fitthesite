/**
 * SUITE STORICA — DIAGNOSTICA. NON DECIDE NESSUN GO/NO-GO.
 *
 * Che cosa fa: esegue il route com'era quando usci' la 189 — la copia
 * congelata al commit 62bd53a9, il codice servito dal deployment che era in
 * produzione novantadue minuti prima del tag v3.9.8+189 — contro il database
 * di oggi, e guarda cosa risponde. Serve a documentare e riprodurre il difetto
 * ORIGINALE, quello che la 190 corregge.
 *
 * ── PERCHE' NON PUO' DECIDERE UN RILASCIO ───────────────────────────────────
 *
 * Non e' un'etichetta, e' una proprieta' strutturale: questa suite guarda solo
 * una fixture IMMUTABILE, verificata per impronta e per commit da
 * test/billing-route-fixtures/manifesto.test.ts. Non tocca la candidata, non
 * tocca cio' che gira in produzione. Se un giorno diventa rossa, l'unica cosa
 * che puo' essere successa e' che qualcuno abbia manomesso la copia storica.
 * Non puo' MAI diventare un argomento a favore o contro la spedizione della
 * 190, perche' non ne osserva un solo byte.
 *
 * La suite che blocca il rilascio e' l'altra: route.db.test.ts.
 *
 * ── IL DIFETTO, IN UNA RIGA ─────────────────────────────────────────────────
 *
 * La 189 costruisce il corpo del suo 200 dall'oggetto che stava provando a
 * scrivere:
 *
 *     const err = await upsertSubscription(admin, row);
 *     if (err) return jsonError(500, "upsert_failed", err);
 *     return jsonOk({ state: row.state, active_until: row.active_until, ... });
 *
 * e una scrittura scartata dal trigger non produce nessun errore — zero righe
 * toccate, `error` null. Il 200 esce lo stesso, e descrive `row`, non il
 * database.
 *
 * ── COSA E' VERO E COSA E' SOSTITUITO ───────────────────────────────────────
 *
 * Vero: il route handler, il database, i trigger, le RPC, la proiezione.
 * Sostituito: il trasporto verso PostgREST (qui e' psql, vedi
 * test/db/psql-supabase.ts) e la verifica presso Apple, che non e' cio' che
 * questi casi misurano. E i moduli importati dalla copia sono quelli di oggi:
 * congelato e' il file del route, non l'albero intero.
 */
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { creaClientPsql, databaseRaggiungibile } from "@/test/db/psql-supabase";
import {
  creaBanco,
  dichiaraUnDiritto,
  esigiModoCompatibilita,
  leggi,
  richiesta189,
} from "@/test/db/banco-billing";

/** Identita' PROPRIA di questo file: vitest esegue i file in parallelo, e due
 *  suite che scrivono lo stesso utente si cancellano i dati a vicenda. */
const banco = creaBanco({
  U: "00000000-0000-4000-8000-00000000e001",
  K1: "7000000000000001",
  K2: "7000000000000002",
});
const { K1, K2, U } = banco;

const mocks = vi.hoisted(() => ({
  requireUser: vi.fn(),
  validateAppleReceipt: vi.fn(),
  readAppleSharedSecret: vi.fn(() => "segreto-di-prova"),
}));

vi.mock("@/lib/api/auth-helpers", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api/auth-helpers")>();
  return { ...actual, requireUser: mocks.requireUser };
});
vi.mock("@/lib/billing/app-store", () => ({
  readAppleSharedSecret: mocks.readAppleSharedSecret,
  validateAppleReceipt: mocks.validateAppleReceipt,
}));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => creaClientPsql(),
}));

import { POST as postAtRelease } from "@/test/billing-route-fixtures/route-189-at-release.vendored";

const disponibile = databaseRaggiungibile();

describe.skipIf(!disponibile)("DIAGNOSTICA — il difetto originale della 189", () => {
  beforeAll(esigiModoCompatibilita);

  afterAll(() => banco.pulisci());

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
    banco.pulisci();
    banco.creaUtente();
  });

  // ── S1: acquisto revocato, nessun altro diritto ──────────────────────────
  it("S1 — la 189 risponde 200 active per un acquisto revocato; il database dice expired", async () => {
    banco.registra(K1, 3);
    banco.revoca(K1);
    expect(banco.proiezione()?.state).toBe("expired");

    const vecchia = await leggi(await postAtRelease(richiesta189()));

    // Il fatto, misurato e non dedotto.
    expect(vecchia.status).toBe(200);
    expect(vecchia.body.state).toBe("active");
    expect(dichiaraUnDiritto(vecchia.status, vecchia.body)).toBe(true);
    expect(banco.ilDatabasePossiedeUnDiritto()).toBe(false);

    // E il database non si e' fatto corrompere: e' esattamente la meta' che
    // il `return null` difende.
    expect(banco.proiezione()?.state).toBe("expired");
    expect(banco.statoRegistro(K1)).toBe("revoked");
  });

  // ── S2: K1 revocato, K2 ancora valido ────────────────────────────────────
  it("S2 — con K2 valido il database concede il diritto, e la 189 dice il vero per caso", async () => {
    banco.registra(K1, 4);
    banco.registra(K2, 3);
    banco.revoca(K1);
    expect(banco.ilDatabasePossiedeUnDiritto()).toBe(true);
    expect(banco.proiezione()?.source).toBe("apple_iap");

    const vecchia = await leggi(await postAtRelease(richiesta189()));
    // Qui la 189 dice il vero per caso: il cliente HA un diritto, solo che
    // non e' quello che la risposta descrive. Il danno e' zero, e va detto
    // com'e' — non e' una difesa, e' una coincidenza.
    expect(dichiaraUnDiritto(vecchia.status, vecchia.body)).toBe(true);
    expect(banco.ilDatabasePossiedeUnDiritto()).toBe(true);
    // La riga autorevole e' rimasta K2, non e' diventata K1 scaduto.
    expect(banco.sottoscrizioneAutorevole()).toBe(K2);
  });

  // ── S3: Founder ──────────────────────────────────────────────────────────
  it("S3 — il Founder resta Founder, e la 189 risponde apple_iap", async () => {
    banco.montaFounder();

    const vecchia = await leggi(await postAtRelease(richiesta189()));
    expect(vecchia.status).toBe(200);
    // La 189 dice apple_iap. Il database dice founder_grant.
    expect(vecchia.body.source).toBe("apple_iap");
    expect(banco.proiezione()?.source).toBe("founder_grant");
  });
});
