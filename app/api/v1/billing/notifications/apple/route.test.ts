/**
 * Il ciclo di vita di una notifica, dal lato della route.
 *
 * Le tre cose che questo file esiste per tenere ferme:
 *  1. nessun 2xx prima che l'effetto sia persistito;
 *  2. `in_corso` non e' `gia_applicata` — confonderle perde per sempre
 *     l'effetto di una notifica il cui primo tentativo e' morto a meta';
 *  3. un tipo di notifica sconosciuto non viene dedotto «quindi e' una
 *     revoca». Il giorno in cui Apple ne aggiunge uno, quella deduzione
 *     toglierebbe a qualcuno il diritto per cui ha pagato.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  verifica: vi.fn(),
  rpc: vi.fn(),
  revoca: vi.fn(),
}));

vi.mock("@/lib/billing/app-store-notifications", async (originale) => {
  const vero = await originale<
    typeof import("@/lib/billing/app-store-notifications")
  >();
  return { ...vero, verificaNotificaApple: mocks.verifica };
});
vi.mock("@/lib/billing/claim-purchase", () => ({
  recordStorePurchaseRevocation: mocks.revoca,
}));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({ rpc: mocks.rpc }),
}));

import { POST } from "./route";

const UUID = "11111111-2222-3333-4444-555555555555";

function notifica(tipo = "REFUND") {
  return {
    kind: "ok" as const,
    notifica: {
      notificationUUID: UUID,
      notificationType: tipo,
      subtype: null,
      environment: "Production" as const,
      transaction: {
        originalTransactionId: "2000000900000001",
        productId: "fitmesh_pro_lifetime",
        revocationDate: 1_756_000_000_000,
      },
      signedDateMs: 1_756_000_001_000,
    },
  };
}

function req() {
  return new Request("https://www.fitmesh.fit/api/v1/billing/notifications/apple", {
    method: "POST",
    body: JSON.stringify({ signedPayload: "a.b.c" }),
  });
}

/** Le chiamate RPC per nome, nell'ordine in cui sono avvenute. */
function ordineRpc(): string[] {
  return mocks.rpc.mock.calls.map((c: unknown[]) => String(c[0]));
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.verifica.mockResolvedValue(notifica());
  mocks.rpc.mockImplementation(async (fn: string) =>
    fn === "apri_notifica_store"
      ? { data: "nuova", error: null }
      : { data: true, error: null },
  );
  mocks.revoca.mockResolvedValue({ kind: "recorded", applied: true });
});

describe("notifiche Apple: l'ordine", () => {
  it("apre PRIMA di applicare, e chiude PRIMA di rispondere 200", async () => {
    const res = await POST(req());
    expect(res.status).toBe(200);
    expect(ordineRpc()).toEqual(["apri_notifica_store", "chiudi_notifica_store"]);
    // L'apertura precede la revoca: e' la persistenza durevole prima
    // dell'effetto, non dopo.
    expect(mocks.rpc.mock.invocationCallOrder[0]!).toBeLessThan(
      mocks.revoca.mock.invocationCallOrder[0]!,
    );
    expect(mocks.revoca.mock.invocationCallOrder[0]!).toBeLessThan(
      mocks.rpc.mock.invocationCallOrder[1]!,
    );
  });

  it("se l'apertura fallisce non si applica niente, e si chiede di riprovare", async () => {
    mocks.rpc.mockResolvedValueOnce({ data: null, error: { code: "42501" } });
    const res = await POST(req());
    expect(res.status).toBe(503);
    expect(mocks.revoca).not.toHaveBeenCalled();
  });

  it("se la revoca NON e' persistita non si risponde 200", async () => {
    mocks.revoca.mockResolvedValue({ kind: "not_persisted", reason: "boh" });
    const res = await POST(req());
    expect(res.status).toBe(503);
    expect(ordineRpc()).toEqual(["apri_notifica_store"]);
  });

  it("se la chiusura fallisce si chiede di riprovare, anche se l'effetto e' avvenuto", async () => {
    mocks.rpc.mockImplementation(async (fn: string) =>
      fn === "apri_notifica_store"
        ? { data: "nuova", error: null }
        : { data: false, error: null },
    );
    const res = await POST(req());
    expect(res.status).toBe(503);
  });
});

describe("notifiche Apple: idempotenza", () => {
  it("gia_applicata: 200 senza rifare l'effetto", async () => {
    mocks.rpc.mockResolvedValueOnce({ data: "gia_applicata", error: null });
    const res = await POST(req());
    expect(res.status).toBe(200);
    expect(mocks.revoca).not.toHaveBeenCalled();
    expect(ordineRpc()).toEqual(["apri_notifica_store"]);
  });

  it("in_corso: l'effetto SI rifa'. Non e' un replay gia' risolto", async () => {
    mocks.rpc.mockImplementation(async (fn: string) =>
      fn === "apri_notifica_store"
        ? { data: "in_corso", error: null }
        : { data: true, error: null },
    );
    const res = await POST(req());
    expect(res.status).toBe(200);
    expect(mocks.revoca).toHaveBeenCalledTimes(1);
  });
});

describe("notifiche Apple: cosa NON fa", () => {
  it("un tipo sconosciuto viene registrato, non interpretato come revoca", async () => {
    mocks.verifica.mockResolvedValue(notifica("QUALCOSA_DI_NUOVO"));
    const res = await POST(req());
    expect(res.status).toBe(200);
    expect(mocks.revoca).not.toHaveBeenCalled();
    const chiusura = mocks.rpc.mock.calls.find(
      (c: unknown[]) => c[0] === "chiudi_notifica_store",
    );
    expect((chiusura![1] as Record<string, unknown>).p_esito).toBe("ignorata");
  });

  it("firma non valida: 400, e nel registro non entra niente", async () => {
    mocks.verifica.mockResolvedValue({ kind: "rejected", reason: "jws_signature_invalid" });
    const res = await POST(req());
    expect(res.status).toBe(400);
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it("verifica non riuscita per rete: 503, non 400", async () => {
    // La differenza fra «non e' autentica» e «non siamo riusciti a
    // verificarla» e' la differenza fra scartare una revoca vera e ritentarla.
    mocks.verifica.mockResolvedValue({ kind: "retryable" });
    const res = await POST(req());
    expect(res.status).toBe(503);
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it("nessun corpo nella risposta: ad Apple interessa solo lo stato", async () => {
    const res = await POST(req());
    expect(await res.text()).toBe("");
  });
});
