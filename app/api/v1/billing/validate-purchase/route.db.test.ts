/**
 * SUITE CHE BLOCCA IL RILASCIO.
 *
 * La catena e' una sola e va letta cosi': il CLIENT LETTERALE v3.9.8+189 — che
 * e' quello che sta sui telefoni adesso — contro il backend che incontra OGGI
 * (route-live-pre190, verificato risolvendo l'alias di produzione) e contro il
 * backend che incontrera' DOPO (la candidata, `./route`). Piu' il client 190
 * contro la candidata, che e' la coppia nuova.
 *
 * Cio' che la 189 faceva quando usci' non e' qui: sta in route.storica.db.test.ts,
 * e' marcato diagnostico e non decide niente. Un rilascio non si blocca su come
 * si comportava un backend che non gira piu' da nessuna parte.
 *
 * ── VECCHIA ROUTE -> TRIGGER -> RILETTURA DELLA PROIEZIONE -> RISPOSTA HTTP ──
 *
 * Il `return null` della guardia difende il DATABASE: K2 e il Founder
 * sopravvivono a un acquisto revocato che il backend vecchio ripresenta. Non
 * difende la RISPOSTA, che viene costruita dall'oggetto che si stava provando a
 * scrivere.
 *
 * ── PERCHE' NON BASTAVA DEDURLO ─────────────────────────────────────────────
 *
 * Perche' la deduzione era gia' stata sbagliata una volta, sull'ordine dei
 * lock: si era ragionato su una UPDATE mentre il codice faceva un upsert. Qui i
 * backend vengono ESEGUITI, contro il database vero, con i trigger veri.
 *
 * ── COSA E' VERO E COSA E' SOSTITUITO ───────────────────────────────────────
 *
 * Vero: i route handler, il database, i trigger, le RPC, la proiezione.
 * Sostituito: il trasporto verso PostgREST (qui e' psql, vedi
 * test/db/psql-supabase.ts) e la verifica presso gli store, che non e' cio' che
 * questi casi misurano.
 */
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { creaClientPsql, databaseRaggiungibile } from "@/test/db/psql-supabase";
import {
  LIFETIME,
  creaBanco,
  dichiaraUnDiritto,
  esigiModoCompatibilita,
  leggi,
  richiesta189,
  richiesta190,
} from "@/test/db/banco-billing";

/** Identita' PROPRIA di questo file, distinta da quella della suite storica:
 *  vitest esegue i file in parallelo e due suite che scrivono lo stesso utente
 *  si cancellano i dati a vicenda. */
const banco = creaBanco({
  U: "00000000-0000-4000-8000-00000000e002",
  K1: "7000000000000011",
  K2: "7000000000000012",
});
const { K1, K2, U } = banco;

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

import { POST as postLivePre190 } from "@/test/billing-route-fixtures/route-live-pre190.vendored";
import { POST as postCandidata } from "./route";

const disponibile = databaseRaggiungibile();

function montaBanco(): void {
  vi.clearAllMocks();
  mocks.requireUser.mockResolvedValue({ userId: U });
  mocks.readAppleSharedSecret.mockReturnValue("segreto-di-prova");
  // Quel che Apple risponde per K1: un acquisto che esiste e non dice niente
  // di un rimborso. E' il caso reale — la ricevuta sul dispositivo puo'
  // benissimo non essere aggiornata.
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
  banco.pulisci();
  banco.creaUtente();
}

describe.skipIf(!disponibile)("client 189 -> live pre-190 -> candidata 190", () => {
  beforeAll(esigiModoCompatibilita);

  afterAll(() => banco.pulisci());

  beforeEach(montaBanco);

  // ══ IL BACKEND CHE UN 189 INCONTRA OGGI ═══════════════════════════════════
  //
  // Stesse asserzioni della suite diagnostica: la domanda e' se il difetto e'
  // ancora in produzione, e la risposta deve essere misurata, non ereditata.
  describe("client letterale 189 -> live pre-190", () => {
    it("S1 — risponde 200 active per un acquisto revocato; il database dice expired", async () => {
      banco.registra(K1, 3);
      banco.revoca(K1);
      expect(banco.proiezione()?.state).toBe("expired");

      const vecchia = await leggi(await postLivePre190(richiesta189()));

      expect(vecchia.status).toBe(200);
      expect(vecchia.body.state).toBe("active");
      expect(dichiaraUnDiritto(vecchia.status, vecchia.body)).toBe(true);
      expect(banco.ilDatabasePossiedeUnDiritto()).toBe(false);

      // E il database non si e' fatto corrompere: e' esattamente la meta' che
      // il `return null` difende.
      expect(banco.proiezione()?.state).toBe("expired");
      expect(banco.statoRegistro(K1)).toBe("revoked");
    });

    it("S2 — con K2 valido il database concede il diritto, e la risposta dice il vero per caso", async () => {
      banco.registra(K1, 4);
      banco.registra(K2, 3);
      banco.revoca(K1);
      expect(banco.ilDatabasePossiedeUnDiritto()).toBe(true);
      expect(banco.proiezione()?.source).toBe("apple_iap");

      const vecchia = await leggi(await postLivePre190(richiesta189()));
      expect(dichiaraUnDiritto(vecchia.status, vecchia.body)).toBe(true);
      expect(banco.ilDatabasePossiedeUnDiritto()).toBe(true);
      expect(banco.sottoscrizioneAutorevole()).toBe(K2);
    });

    it("S3 — il Founder resta Founder, e la risposta dice apple_iap", async () => {
      banco.montaFounder();

      const vecchia = await leggi(await postLivePre190(richiesta189()));
      expect(vecchia.status).toBe(200);
      expect(vecchia.body.source).toBe("apple_iap");
      expect(banco.proiezione()?.source).toBe("founder_grant");
    });
  });

  // ══ LO STESSO CLIENT, CONTRO LA CANDIDATA ═════════════════════════════════
  //
  // La cella che non era mai stata provata: un telefono fermo alla 189 che
  // parla col backend della 190. Non dichiara `client_contract_version`, quindi
  // la candidata lo riconosce come build che precede il contratto; manda un JWS
  // senza `token_format`, quindi il formato si deduce dalla forma del token.
  describe("client letterale 189 -> candidata 190", () => {
    it("S1 — risponde con cio' che il database possiede, e non concede niente", async () => {
      banco.registra(K1, 3);
      banco.revoca(K1);

      const nuova = await leggi(await postCandidata(richiesta189()));

      expect(nuova.status).toBe(200);
      expect(nuova.body.state).toBe("expired");
      expect(dichiaraUnDiritto(nuova.status, nuova.body)).toBe(false);
      expect(banco.ilDatabasePossiedeUnDiritto()).toBe(false);
    });

    it("S2 — con K2 valido dichiara il diritto, e con i dati di K2", async () => {
      banco.registra(K1, 4);
      banco.registra(K2, 3);
      banco.revoca(K1);

      const nuova = await leggi(await postCandidata(richiesta189()));
      expect(nuova.status).toBe(200);
      expect(dichiaraUnDiritto(nuova.status, nuova.body)).toBe(true);
      expect(banco.ilDatabasePossiedeUnDiritto()).toBe(true);
      expect(nuova.body.state).toBe(banco.proiezione()?.state);
    });

    it("S3 — risponde founder_grant invece di apple_iap", async () => {
      banco.montaFounder();

      const nuova = await leggi(await postCandidata(richiesta189()));
      expect(nuova.status).toBe(200);
      expect(nuova.body.source).toBe("founder_grant");
      expect(nuova.body.source).toBe(banco.proiezione()?.source);
      expect(dichiaraUnDiritto(nuova.status, nuova.body)).toBe(true);
      expect(banco.ilDatabasePossiedeUnDiritto()).toBe(true);
    });
  });

  // ══ LA COPPIA NUOVA ═══════════════════════════════════════════════════════
  describe("client letterale 190 -> candidata 190", () => {
    it("S1 — risponde con cio' che il database possiede, e non concede niente", async () => {
      banco.registra(K1, 3);
      banco.revoca(K1);

      const nuova = await leggi(await postCandidata(richiesta190()));

      expect(nuova.status).toBe(200);
      expect(nuova.body.state).toBe("expired");
      expect(nuova.body.disposition).toBe("retryable");
      expect(dichiaraUnDiritto(nuova.status, nuova.body)).toBe(false);
      expect(banco.ilDatabasePossiedeUnDiritto()).toBe(false);
    });

    it("S2 — con K2 valido dichiara il diritto, e con i dati di K2", async () => {
      banco.registra(K1, 4);
      banco.registra(K2, 3);
      banco.revoca(K1);

      const nuova = await leggi(await postCandidata(richiesta190()));
      expect(nuova.status).toBe(200);
      expect(dichiaraUnDiritto(nuova.status, nuova.body)).toBe(true);
      expect(banco.ilDatabasePossiedeUnDiritto()).toBe(true);
      expect(nuova.body.state).toBe(banco.proiezione()?.state);
    });

    it("S3 — risponde founder_grant invece di apple_iap", async () => {
      banco.montaFounder();

      const nuova = await leggi(await postCandidata(richiesta190()));
      expect(nuova.status).toBe(200);
      expect(nuova.body.source).toBe("founder_grant");
      expect(nuova.body.source).toBe(banco.proiezione()?.source);
      expect(dichiaraUnDiritto(nuova.status, nuova.body)).toBe(true);
      expect(banco.ilDatabasePossiedeUnDiritto()).toBe(true);
    });
  });

  // ══ L'INVARIANTE, SU TUTTI GLI SCENARI E SU ENTRAMBI I CLIENT ═════════════
  it("la candidata non dichiara mai un diritto che il database non possiede", async () => {
    const scenari: { nome: string; monta: () => void }[] = [
      { nome: "revocato senza alternative", monta: () => { banco.registra(K1, 3); banco.revoca(K1); } },
      { nome: "revocato con K2 valido", monta: () => { banco.registra(K1, 4); banco.registra(K2, 3); banco.revoca(K1); } },
      { nome: "mai visto prima", monta: () => {} },
      { nome: "gia' registrato e attivo", monta: () => { banco.registra(K1, 3); } },
    ];
    const client: { nome: string; fai: () => Request }[] = [
      { nome: "189", fai: richiesta189 },
      { nome: "190", fai: richiesta190 },
    ];

    for (const c of client) {
      for (const s of scenari) {
        banco.pulisci();
        banco.creaUtente();
        s.monta();
        const r = await leggi(await postCandidata(c.fai()));
        expect(
          dichiaraUnDiritto(r.status, r.body) && !banco.ilDatabasePossiedeUnDiritto(),
          `client ${c.nome}, scenario "${s.nome}": la risposta dichiara un diritto che il database non ha (${JSON.stringify(r.body)})`,
        ).toBe(false);
      }
    }
  });
});
