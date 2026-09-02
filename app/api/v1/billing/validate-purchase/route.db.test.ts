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
  esegui,
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

  // ══ L'INVARIANTE, OTTO CASI NOMINATI ══════════════════════════════════════
  //
  // Era un solo `it` che ciclava 2 client x 4 scenari: otto montaggi del banco
  // e otto risposte, circa venticinque `docker exec psql` dentro un unico caso.
  // In locale 3,3-4,1 s contro i 5 s di timeout predefinito di vitest; sul
  // runner GitHub sforava, e il gate diceva soltanto `Error: STACK_TRACE_ERROR`
  // — che e' come il rapporto JSON serializza un timeout.
  //
  // Adesso sono otto casi separati. Non e' un timeout alzato: e' lo stesso
  // lavoro diviso per otto, quindi ognuno sta ampiamente sotto il limite
  // PREDEFINITO e nessun timeout locale serve. Se un giorno servisse, va
  // dichiarato sul singolo caso e motivato col numero di processi, mai alzando
  // quello globale — che nasconderebbe la lentezza di tutti gli altri.
  //
  // Il `beforeEach` monta gia' un banco pulito con l'utente, e vitest esegue i
  // casi di un file in sequenza: l'ordine sequenziale serve qui, perche' gli
  // otto casi condividono l'unico database del run.
  //
  // Asserzione IDENTICA a prima, scritta una volta sola: se venisse ricopiata
  // otto volte, prima o poi otto copie direbbero otto cose leggermente diverse.
  const MONTAGGI: Record<string, () => void> = {
    "revocato senza alternative": () => {
      banco.registra(K1, 3);
      banco.revoca(K1);
    },
    "revocato con K2 valido": () => {
      banco.registra(K1, 4);
      banco.registra(K2, 3);
      banco.revoca(K1);
    },
    "mai visto prima": () => {},
    "gia' registrato e attivo": () => {
      banco.registra(K1, 3);
    },
  };

  async function invariante(
    cliente: "189" | "190",
    scenario: keyof typeof MONTAGGI,
  ): Promise<void> {
    MONTAGGI[scenario]();
    const fai = cliente === "189" ? richiesta189 : richiesta190;
    const r = await leggi(await postCandidata(fai()));
    expect(
      dichiaraUnDiritto(r.status, r.body) && !banco.ilDatabasePossiedeUnDiritto(),
      `client ${cliente}, scenario "${scenario}": la risposta dichiara un diritto che il database non ha (${JSON.stringify(r.body)})`,
    ).toBe(false);
  }

  const CASI: { cliente: "189" | "190"; scenario: keyof typeof MONTAGGI }[] = [
    { cliente: "189", scenario: "revocato senza alternative" },
    { cliente: "189", scenario: "revocato con K2 valido" },
    { cliente: "189", scenario: "mai visto prima" },
    { cliente: "189", scenario: "gia' registrato e attivo" },
    { cliente: "190", scenario: "revocato senza alternative" },
    { cliente: "190", scenario: "revocato con K2 valido" },
    { cliente: "190", scenario: "mai visto prima" },
    { cliente: "190", scenario: "gia' registrato e attivo" },
  ];

  it.each(CASI)(
    "invariante — client $cliente, $scenario: mai un diritto che il database non possiede",
    async ({ cliente, scenario }) => {
      await invariante(cliente, scenario);
    },
  );
});

/**
 * CASO 4 — un JWS rifiutato non arriva MAI al registro.
 *
 * L'ordine dentro la route e' cio' che rende sicura tutta la porta aperta
 * dalla riacquisizione: `claim_store_purchase` riassegna una tombstone a chi
 * presenta un JWS valido, e l'unico motivo per cui questo non e' un varco e'
 * che la verifica viene PRIMA. Se un giorno qualcuno invertisse i due passi,
 * chiunque conoscesse una ownership key potrebbe prendersi l'acquisto di un
 * altro.
 *
 * Non si prova con una spia sulla funzione: si prova con gli EFFETTI. Se la
 * RPC non e' stata chiamata, nel registro non c'e' niente di nuovo — ed e'
 * una prova che regge anche se domani il claim passasse da un'altra strada.
 */
describe("caso 4 — la verifica viene prima del registro", () => {
  it.runIf(disponibile)(
    "JWS rifiutato: nessun claim, nessuno stato, nessuna riacquisizione — solo la traccia del tentativo",
    async () => {
      montaBanco();
      esigiModoCompatibilita();
      mocks.verifyJws.mockResolvedValue({ kind: "rejected", reason: "jws_untrusted" });

      const claimPrima = esegui("select count(*) from private.billing_purchase_claims");
      const statiPrima = esegui("select count(*) from private.billing_purchase_states");
      const riacqPrima = esegui("select count(*) from private.billing_riacquisizioni");

      const r = await leggi(await postCandidata(richiesta190()));

      expect(r.status).toBe(400);
      expect(esegui("select count(*) from private.billing_purchase_claims")).toBe(claimPrima);
      expect(esegui("select count(*) from private.billing_purchase_states")).toBe(statiPrima);
      expect(esegui("select count(*) from private.billing_riacquisizioni")).toBe(riacqPrima);

      // La telemetria del tentativo invece DEVE esserci: si scrive prima di
      // qualunque giudizio, ed e' l'unica scrittura ammessa su questo ramo.
      expect(
        Number(
          esegui(
            `select count(*) from private.billing_tentativi_acquisto where user_id = '${U}'`,
          ),
        ),
      ).toBeGreaterThan(0);
    },
  );
});

/**
 * CORREZIONE 1 — il PRIMO «Ripristina acquisti» deve bastare.
 *
 * La RPC risponde `reclaimed_after_owner_deletion` quando riassegna una
 * tombstone. Se il backend non conosce quell'esito lo tratta come ignoto e
 * risponde 503: il diritto e' stato scritto, ma l'utente vede un errore e
 * deve toccare il pulsante una seconda volta perche' il secondo giro torni
 * `already_owned_by_same_user`. Un recupero che funziona solo al secondo
 * tentativo non e' un recupero: e' un difetto con un rimedio nascosto.
 */
describe("correzione 1 — riacquisizione riconosciuta al primo colpo", () => {
  it.runIf(disponibile)(
    "tombstone + JWS valido: la PRIMA chiamata risponde 200 e dichiara il Lifetime",
    async () => {
      montaBanco();
      esigiModoCompatibilita();

      // Il claim nasce di un altro utente, che poi cancella il proprio
      // account: e' la tombstone di Katie, riprodotta con i meccanismi veri.
      const vecchio = "00000000-0000-4000-8000-00000000e099";
      esegui(
        `insert into auth.users (id, email, created_at)
         values ('${vecchio}', 'tomb-route@test.local', now() - interval '400 days')`,
      );
      esegui(
        `select public.claim_store_purchase('apple_iap','${K1}','${vecchio}',
           'fitmesh_pro_lifetime','lifetime','production','active',
           '9999-12-31T23:59:59Z',false, now() - interval '6 hours',
           'apple_signed_date','${K1}', null)`,
      );
      esegui(`delete from auth.users where id = '${vecchio}'`);
      expect(
        esegui(
          `select owner_user_id is null and anonymized_at is not null
             from private.billing_purchase_claims
            where billing_source='apple_iap' and ownership_key='${K1}'`,
        ),
      ).toBe("t");

      const r = await leggi(await postCandidata(richiesta190()));

      expect(r.status).toBe(200);
      expect(dichiaraUnDiritto(r.status, r.body)).toBe(true);
      expect(r.body.state).toBe("active");
      expect(banco.ilDatabasePossiedeUnDiritto()).toBe(true);
      expect(
        esegui(
          `select owner_user_id::text from private.billing_purchase_claims
            where billing_source='apple_iap' and ownership_key='${K1}'`,
        ),
      ).toBe(U);
    },
  );
});
