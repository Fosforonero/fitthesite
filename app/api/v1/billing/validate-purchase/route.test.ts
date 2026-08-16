/**
 * La traccia del tentativo di acquisto.
 *
 * Questa route ha quattordici punti di ritorno e almeno cinque possono lasciare
 * l'utente pagato e non servito — lo store che risponde 502, la ricevuta che
 * non contiene l'acquisto, e soprattutto `upsert_failed`, dove lo store ha
 * confermato e noi non siamo riusciti a scrivere. Prima di questa traccia, in
 * nessuno di quei casi restava qualcosa sul server: solo un log su Vercel, che
 * scade. E' gia' costato un cliente.
 *
 * Due proprieta', ed e' la seconda quella che conta di piu':
 *
 *   1. la traccia si scrive PRIMA di provare a validare;
 *   2. se la traccia fallisce, il pagamento va avanti lo stesso.
 *
 * La seconda dice che questo codice nuovo puo' rompersi in un modo solo — non
 * lasciare la traccia — e mai diventare il motivo per cui un pagamento non va
 * a buon fine.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireUser: vi.fn(),
  adminRpc: vi.fn(),
  adminUpsert: vi.fn(),
  validateAppleReceipt: vi.fn(),
  readAppleSharedSecret: vi.fn(),
}));

vi.mock("@/lib/api/auth-helpers", async (importOriginal) => {
  const reale = await importOriginal<typeof import("@/lib/api/auth-helpers")>();
  return { ...reale, requireUser: (req: Request) => mocks.requireUser(req) };
});

vi.mock("@/lib/billing/app-store", () => ({
  validateAppleReceipt: (a: unknown) => mocks.validateAppleReceipt(a),
  readAppleSharedSecret: () => mocks.readAppleSharedSecret(),
}));

vi.mock("@/lib/billing/google-play", () => ({
  readServiceAccount: () => null,
  validateProduct: vi.fn(),
  validateSubscription: vi.fn(),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    rpc: (nome: string, params: unknown) => mocks.adminRpc(nome, params),
    from: () => ({
      upsert: (row: unknown) => mocks.adminUpsert(row),
    }),
  }),
}));

const { POST } = await import("./route");

const UTENTE = "11111111-1111-4111-8111-111111111111";
const LIFETIME = "fitmesh_pro_lifetime";

function richiestaApple(): Request {
  return new Request("https://fitmesh.fit/api/v1/billing/validate-purchase", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: "Bearer t" },
    body: JSON.stringify({
      product_id: LIFETIME,
      purchase_token: "ricevuta-base64-finta",
      package_name: "com.fitmeshsync.app",
      platform: "ios",
    }),
  });
}

describe("traccia del tentativo di acquisto", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireUser.mockResolvedValue({ userId: UTENTE, supabase: {} });
    mocks.readAppleSharedSecret.mockReturnValue("segreto");
    mocks.adminRpc.mockResolvedValue({ data: null, error: null });
    mocks.adminUpsert.mockResolvedValue({ error: null });
    mocks.validateAppleReceipt.mockResolvedValue({
      kind: "ok",
      tx: { original_transaction_id: "oti-1", transaction_id: "tx-1" },
    });
  });

  it("scrive la traccia con utente, piattaforma e prodotto", async () => {
    await POST(richiestaApple());

    expect(mocks.adminRpc).toHaveBeenCalledWith("registra_tentativo_acquisto", {
      p_user_id: UTENTE,
      p_piattaforma: "ios",
      p_product_id: LIFETIME,
    });
  });

  it("la scrive PRIMA di chiedere allo store", async () => {
    // Se si scrivesse dopo, perderebbe esattamente i casi che deve catturare:
    // lo store che risponde male, o la nostra scrittura che fallisce.
    await POST(richiestaApple());

    const traccia = mocks.adminRpc.mock.invocationCallOrder[0];
    const store = mocks.validateAppleReceipt.mock.invocationCallOrder[0];
    expect(traccia).toBeLessThan(store);
  });

  it("se la traccia FALLISCE, il pagamento va avanti lo stesso", async () => {
    // La proprieta' che conta: questo codice non deve mai essere il motivo per
    // cui un pagamento non va a buon fine.
    mocks.adminRpc.mockResolvedValue({ data: null, error: { code: "42501" } });

    const res = await POST(richiestaApple());

    expect(res.status).toBe(200);
    expect(mocks.validateAppleReceipt).toHaveBeenCalledTimes(1);
  });

  it("se la traccia SOLLEVA, il pagamento va avanti lo stesso", async () => {
    mocks.adminRpc.mockRejectedValue(new Error("rete giu'"));

    const res = await POST(richiestaApple());

    expect(res.status).toBe(200);
  });

  it("resta traccia anche quando lo store rifiuta e non concediamo niente", async () => {
    // Il caso che ha perso il cliente: pagamento tentato, nessun diritto
    // concesso, e prima di adesso nessuna riga da nessuna parte.
    mocks.validateAppleReceipt.mockResolvedValue({ kind: "invalid", status: 21002 });

    const res = await POST(richiestaApple());

    expect(res.status).not.toBe(200);
    expect(mocks.adminRpc).toHaveBeenCalledWith(
      "registra_tentativo_acquisto",
      expect.objectContaining({ p_user_id: UTENTE }),
    );
  });

  it("resta traccia anche quando lo store conferma e la NOSTRA scrittura fallisce", async () => {
    // `upsert_failed`: il caso peggiore di tutti, perche' i soldi sono usciti
    // e la colpa e' nostra.
    mocks.adminUpsert.mockResolvedValue({ error: { message: "boom" } });

    const res = await POST(richiestaApple());

    expect(res.status).toBe(500);
    expect(mocks.adminRpc).toHaveBeenCalledTimes(1);
  });

  it("non traccia un prodotto sconosciuto: li' non c'e' nessun pagamento da perdere", async () => {
    const req = new Request("https://fitmesh.fit/api/v1/billing/validate-purchase", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: "Bearer t" },
      body: JSON.stringify({
        product_id: "prodotto_inventato",
        purchase_token: "abcdefgh",
        package_name: "com.fitmeshsync.app",
        platform: "ios",
      }),
    });

    const res = await POST(req);

    expect(res.status).toBe(400);
    expect(mocks.adminRpc).not.toHaveBeenCalled();
  });
});
