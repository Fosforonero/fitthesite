/**
 * IL RIMBORSO STOREKIT 1 NON SI BUTTA PIU' VIA.
 *
 * Il filtro era una riga sola:
 *
 *     .filter((t) => t.product_id === args.productId && !t.cancellation_date_ms)
 *
 * e metteva sullo stesso piano due cose diversissime: "questa transazione e' di
 * un altro prodotto" e "questa transazione e' stata rimborsata". La prima e'
 * rumore. La seconda e' la notizia.
 *
 * Conseguenza misurabile: una ricevuta che conteneva SOLO l'acquisto rimborsato
 * diventava una lista vuota, cioe' `not_found`, cioe' `purchase_not_in_receipt`
 * — un silenzio, che si ritenta. Il rimborso non veniva registrato da nessuna
 * parte, e un lifetime rimborsato restava per sempre il migliore diritto del
 * suo proprietario: nessuno lo revocava perche' nessuno lo vedeva. Non c'e'
 * nemmeno un secondo canale che avrebbe rimediato — App Store Server
 * Notifications V2 non e' collegato (vedi il limite dichiarato in
 * supabase/rollback/README-rollout-registro.md).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { validateAppleReceipt } from "./app-store";

const PRODOTTO = "fitmesh_pro_lifetime";
const ALTRO_PRODOTTO = "fitmesh_pro_sub";
const ADESSO = 1_760_000_000_000;

function rispostaApple(payload: Record<string, unknown>): typeof fetch {
  return vi.fn(async () =>
    new Response(JSON.stringify({ status: 0, request_date_ms: String(ADESSO), ...payload }), {
      status: 200,
      headers: { "content-type": "application/json" },
    }),
  ) as unknown as typeof fetch;
}

function tx(over: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    product_id: PRODOTTO,
    original_transaction_id: "1000000111111111",
    transaction_id: "1000000111111111",
    purchase_date_ms: String(ADESSO - 86_400_000),
    ...over,
  };
}

const fetchVero = globalThis.fetch;

beforeEach(() => {
  vi.stubEnv("APPLE_SHARED_SECRET", "segreto-di-prova");
});

afterEach(() => {
  globalThis.fetch = fetchVero;
  vi.unstubAllEnvs();
});

describe("validateAppleReceipt — rimborsi", () => {
  it("una ricevuta col solo acquisto rimborsato e' una REVOCA, non un silenzio", async () => {
    globalThis.fetch = rispostaApple({
      receipt: {
        in_app: [tx({ cancellation_date_ms: String(ADESSO - 3_600_000) })],
      },
    });

    const r = await validateAppleReceipt({ receiptData: "x", productId: PRODOTTO });

    // Prima di questa correzione: { kind: "not_found" }.
    expect(r.kind).toBe("revoked");
    if (r.kind !== "revoked") return;
    expect(r.annullate).toEqual([
      {
        originalTransactionId: "1000000111111111",
        cancellationDateMs: ADESSO - 3_600_000,
      },
    ]);
    // L'orologio di ORDINAMENTO e' quello della risposta, non quello del
    // rimborso: il secondo e' anteriore per costruzione e ordinerebbe
    // all'indietro.
    expect(r.requestDateMs).toBe(ADESSO);
  });

  it("un acquisto vivo vince, ma il rimborso della stessa ricevuta viene comunque riportato", async () => {
    globalThis.fetch = rispostaApple({
      receipt: {
        in_app: [
          tx({
            original_transaction_id: "1000000000000001",
            cancellation_date_ms: String(ADESSO - 7_200_000),
          }),
          tx({ original_transaction_id: "1000000000000002" }),
        ],
      },
    });

    const r = await validateAppleReceipt({ receiptData: "x", productId: PRODOTTO });

    expect(r.kind).toBe("ok");
    if (r.kind !== "ok") return;
    // Il diritto lo concede la transazione viva…
    expect(r.tx.original_transaction_id).toBe("1000000000000002");
    // …e il rimborso resta un fatto da registrare. Buttarlo via qui
    // significherebbe non revocarlo mai, perche' nessun altro canale ce lo
    // ripetera'.
    expect(r.annullate).toEqual([
      {
        originalTransactionId: "1000000000000001",
        cancellationDateMs: ADESSO - 7_200_000,
      },
    ]);
  });

  it("le transazioni di un ALTRO prodotto restano rumore, rimborsate o no", async () => {
    globalThis.fetch = rispostaApple({
      receipt: {
        in_app: [
          tx({
            product_id: ALTRO_PRODOTTO,
            original_transaction_id: "1000000000000009",
            cancellation_date_ms: String(ADESSO - 3_600_000),
          }),
        ],
      },
    });

    const r = await validateAppleReceipt({ receiptData: "x", productId: PRODOTTO });

    // Nessun acquisto del prodotto richiesto, e nessun rimborso DI QUEL
    // prodotto: questo si' che e' un silenzio.
    expect(r.kind).toBe("not_found");
  });

  it("un rimborso senza original_transaction_id non diventa una revoca a caso", async () => {
    globalThis.fetch = rispostaApple({
      receipt: {
        in_app: [
          tx({
            original_transaction_id: undefined,
            cancellation_date_ms: String(ADESSO - 3_600_000),
          }),
        ],
      },
    });

    const r = await validateAppleReceipt({ receiptData: "x", productId: PRODOTTO });

    // Senza la chiave non si sa CHE COSA revocare: revocare l'acquisto
    // sbagliato e' peggio che non revocarne nessuno.
    expect(r.kind).toBe("not_found");
  });

  it("una ricevuta senza request_date_ms non porta un ordinamento inventato", async () => {
    globalThis.fetch = vi.fn(async () =>
      new Response(
        JSON.stringify({
          status: 0,
          receipt: { in_app: [tx({ cancellation_date_ms: String(ADESSO - 3_600_000) })] },
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      ),
    ) as unknown as typeof fetch;

    const r = await validateAppleReceipt({ receiptData: "x", productId: PRODOTTO });

    expect(r.kind).toBe("revoked");
    if (r.kind !== "revoked") return;
    // La route, davanti a questo, non scrive: senza orologio non si puo' dire
    // se questa evidenza sia piu' recente di quella gia' registrata.
    expect(r.requestDateMs).toBeNull();
  });
});
