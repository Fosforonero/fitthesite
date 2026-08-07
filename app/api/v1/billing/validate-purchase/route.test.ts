/**
 * Test del route handler vero per il ramo Apple.
 *
 * Il caso che conta più di tutti è il primo: il payload LETTERALE che manda la
 * build 189 già in store, che non conosce `token_format`. Se il backend lo
 * respinge, il cliente che ha già pagato non può recuperare l'acquisto nemmeno
 * premendo "Ripristina acquisti" — cioè il P0 resterebbe aperto proprio per la
 * persona per cui è stato aperto.
 *
 * Il verificatore crittografico è mockato (la sua tabella di decisione è
 * coperta in lib/billing/app-store-jws.test.ts); `looksLikeJws` resta invece
 * quello vero, perché è ciò che decide il ramo.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireUser: vi.fn(),
  verifyJws: vi.fn(),
  upsert: vi.fn(),
  validateAppleReceipt: vi.fn(),
  readAppleSharedSecret: vi.fn(),
}));

vi.mock("@/lib/api/auth-helpers", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api/auth-helpers")>();
  return { ...actual, requireUser: mocks.requireUser };
});

vi.mock("@/lib/billing/app-store-jws", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/lib/billing/app-store-jws")>();
  return { ...actual, verifyAppleJwsTransaction: mocks.verifyJws };
});

vi.mock("@/lib/billing/app-store", () => ({
  readAppleSharedSecret: mocks.readAppleSharedSecret,
  validateAppleReceipt: mocks.validateAppleReceipt,
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: () => ({ upsert: mocks.upsert }),
  }),
}));

import { POST } from "./route";

const USER_ID = "4a1c7f9e-4b7a-4c3d-9f21-8b6d5e2a1c40";
const OTHER_USER = "99999999-4b7a-4c3d-9f21-8b6d5e2a1c40";
const LIFETIME = "fitmesh_pro_lifetime";

/** Forma di un JWS reale: tre segmenti base64url. Contenuto irrilevante. */
const JWS_TOKEN = "eyJhbGciOiJFUzI1NiJ9.eyJwcm9kdWN0SWQiOiJ4In0.c2lnbmF0dXJl";
/** Ricevuta StoreKit 1: base64 standard, nessun punto. */
const RECEIPT_TOKEN = "MIIT2wYJKoZIhvcNAQcCoIITzDCCE8gCAQExCzAJBgUrDgMCGgUA";

function req(body: Record<string, unknown>): Request {
  return new Request("https://www.fitmesh.fit/api/v1/billing/validate-purchase", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

const okTransaction = {
  kind: "ok" as const,
  tx: {
    transactionId: "2000000900000001",
    originalTransactionId: "2000000900000001",
    productId: LIFETIME,
    appAccountToken: null as string | null,
    environment: "Production" as const,
    purchaseDateMs: 1_754_400_000_000,
  },
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.requireUser.mockResolvedValue({ userId: USER_ID });
  mocks.verifyJws.mockResolvedValue(okTransaction);
  mocks.upsert.mockResolvedValue({ error: null });
  mocks.readAppleSharedSecret.mockReturnValue(null);
});

describe("compatibilità con la build 189 già in store", () => {
  it("payload 189 letterale, senza token_format: va al ramo StoreKit 2 e scrive la riga", async () => {
    // Esattamente i campi che manda la 189, niente di più.
    const res = await POST(
      req({
        product_id: LIFETIME,
        purchase_token: JWS_TOKEN,
        package_name: "com.fitmeshsync.app",
        platform: "ios",
      }),
    );

    expect(res.status).toBe(200);
    expect(mocks.verifyJws).toHaveBeenCalledWith({
      signedTransaction: JWS_TOKEN,
      expectedProductId: LIFETIME,
    });
    expect(mocks.upsert).toHaveBeenCalledTimes(1);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.source).toBe("apple_iap");
    expect(body.state).toBe("active");
  });

  it("payload senza token_format ma con ricevuta legacy: resta sul ramo storico", async () => {
    const res = await POST(
      req({
        product_id: LIFETIME,
        purchase_token: RECEIPT_TOKEN,
        package_name: "com.fitmeshsync.app",
        platform: "ios",
      }),
    );

    // Shared secret non configurato → il ramo legacy risponde 503, che è la
    // prova che ci è andato davvero senza passare dal verificatore JWS.
    expect(res.status).toBe(503);
    expect(mocks.verifyJws).not.toHaveBeenCalled();
  });
});

describe("formato dichiarato dal client", () => {
  it("dichiara sk2_jws e manda un JWS: accettato", async () => {
    const res = await POST(
      req({
        product_id: LIFETIME,
        purchase_token: JWS_TOKEN,
        package_name: "com.fitmeshsync.app",
        platform: "ios",
        token_format: "sk2_jws",
      }),
    );
    expect(res.status).toBe(200);
  });

  it("dichiara sk2_jws e manda una ricevuta: respinto, non assecondato", async () => {
    const res = await POST(
      req({
        product_id: LIFETIME,
        purchase_token: RECEIPT_TOKEN,
        package_name: "com.fitmeshsync.app",
        platform: "ios",
        token_format: "sk2_jws",
      }),
    );
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("token_format_mismatch");
    expect(mocks.verifyJws).not.toHaveBeenCalled();
  });

  it("dichiara app_receipt e manda un JWS: respinto con un errore che lo dice", async () => {
    const res = await POST(
      req({
        product_id: LIFETIME,
        purchase_token: JWS_TOKEN,
        package_name: "com.fitmeshsync.app",
        platform: "ios",
        token_format: "app_receipt",
      }),
    );
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("token_format_mismatch");
  });
});

describe("attribuzione dell'acquisto", () => {
  it("appAccountToken di un altro account: nessun Pro, nessuna scrittura", async () => {
    mocks.verifyJws.mockResolvedValue({
      ...okTransaction,
      tx: { ...okTransaction.tx, appAccountToken: OTHER_USER },
    });

    const res = await POST(
      req({
        product_id: LIFETIME,
        purchase_token: JWS_TOKEN,
        package_name: "com.fitmeshsync.app",
        platform: "ios",
        token_format: "sk2_jws",
      }),
    );

    expect(res.status).toBe(409);
    expect((await res.json()).error).toBe("purchase_belongs_to_other_account");
    expect(mocks.upsert).not.toHaveBeenCalled();
  });

  it("appAccountToken del chiamante: accettato anche con maiuscole diverse", async () => {
    mocks.verifyJws.mockResolvedValue({
      ...okTransaction,
      tx: { ...okTransaction.tx, appAccountToken: USER_ID.toUpperCase() },
    });

    const res = await POST(
      req({
        product_id: LIFETIME,
        purchase_token: JWS_TOKEN,
        package_name: "com.fitmeshsync.app",
        platform: "ios",
        token_format: "sk2_jws",
      }),
    );

    expect(res.status).toBe(200);
  });

  it("transazione già collegata a un altro utente: 409 esplicito, non 500", async () => {
    mocks.upsert.mockResolvedValue({
      error: { code: "23505", message: "duplicate key value" },
    });

    const res = await POST(
      req({
        product_id: LIFETIME,
        purchase_token: JWS_TOKEN,
        package_name: "com.fitmeshsync.app",
        platform: "ios",
        token_format: "sk2_jws",
      }),
    );

    expect(res.status).toBe(409);
    expect((await res.json()).error).toBe("purchase_already_linked");
  });
});

describe("esiti che il client deve saper distinguere", () => {
  it("Apple irraggiungibile: 503 ritentabile, mai un rifiuto dell'acquisto", async () => {
    mocks.verifyJws.mockResolvedValue({ kind: "retryable" });

    const res = await POST(
      req({
        product_id: LIFETIME,
        purchase_token: JWS_TOKEN,
        package_name: "com.fitmeshsync.app",
        platform: "ios",
        token_format: "sk2_jws",
      }),
    );

    expect(res.status).toBe(503);
    expect((await res.json()).error).toBe("apple_unavailable");
    expect(mocks.upsert).not.toHaveBeenCalled();
  });

  it("rifiuto terminale del verificatore: 400 col motivo stabile", async () => {
    mocks.verifyJws.mockResolvedValue({
      kind: "rejected",
      reason: "jws_revoked",
    });

    const res = await POST(
      req({
        product_id: LIFETIME,
        purchase_token: JWS_TOKEN,
        package_name: "com.fitmeshsync.app",
        platform: "ios",
        token_format: "sk2_jws",
      }),
    );

    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("jws_revoked");
  });

  it("database che non scrive: 500, così il client ritenta", async () => {
    mocks.upsert.mockResolvedValue({
      error: { code: "08006", message: "connection failure" },
    });

    const res = await POST(
      req({
        product_id: LIFETIME,
        purchase_token: JWS_TOKEN,
        package_name: "com.fitmeshsync.app",
        platform: "ios",
        token_format: "sk2_jws",
      }),
    );

    expect(res.status).toBe(500);
    expect((await res.json()).error).toBe("upsert_failed");
  });
});

describe("abbonamento semestrale su iOS", () => {
  it("fail-closed dichiarato finché non esiste la validazione AUTO_RENEWABLE", async () => {
    const res = await POST(
      req({
        product_id: "fitmesh_pro_sub",
        purchase_token: JWS_TOKEN,
        package_name: "com.fitmeshsync.app",
        platform: "ios",
        token_format: "sk2_jws",
      }),
    );

    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("ios_subscription_not_supported");
    // Il punto: NON deve arrivare al verificatore e tornare "jws_wrong_type",
    // che farebbe sembrare corrotto un acquisto sano.
    expect(mocks.verifyJws).not.toHaveBeenCalled();
  });
});

describe("isolamento produzione / sandbox al livello del route", () => {
  it("JWS Sandbox respinto dalla verifica: nessuna riga, zero entitlement", async () => {
    // In produzione il verificatore respinge le transazioni Sandbox. Qui si
    // dimostra la conseguenza che conta: non arriva NIENTE al database.
    mocks.verifyJws.mockResolvedValue({
      kind: "rejected",
      reason: "jws_sandbox_not_allowed",
    });

    const res = await POST(
      req({
        product_id: LIFETIME,
        purchase_token: JWS_TOKEN,
        package_name: "com.fitmeshsync.app",
        platform: "ios",
        token_format: "sk2_jws",
      }),
    );

    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("jws_sandbox_not_allowed");
    expect(
      mocks.upsert,
      "una transazione Sandbox non deve mai toccare b2c_subscriptions",
    ).not.toHaveBeenCalled();
  });
});

describe("il JWS non esce mai", () => {
  it("non compare né nei log né nella riga scritta", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const error = vi.spyOn(console, "error").mockImplementation(() => {});

    mocks.verifyJws.mockResolvedValue({
      kind: "rejected",
      reason: "jws_signature_invalid",
    });
    await POST(
      req({
        product_id: LIFETIME,
        purchase_token: JWS_TOKEN,
        package_name: "com.fitmeshsync.app",
        platform: "ios",
        token_format: "sk2_jws",
      }),
    );

    const logged = [...warn.mock.calls, ...error.mock.calls].flat().join(" ");
    expect(logged).not.toContain(JWS_TOKEN);

    warn.mockRestore();
    error.mockRestore();
  });

  it("raw_payload contiene gli identificativi, mai il token", async () => {
    await POST(
      req({
        product_id: LIFETIME,
        purchase_token: JWS_TOKEN,
        package_name: "com.fitmeshsync.app",
        platform: "ios",
        token_format: "sk2_jws",
      }),
    );

    const row = mocks.upsert.mock.calls[0]![0] as { raw_payload: unknown };
    expect(JSON.stringify(row.raw_payload)).not.toContain(JWS_TOKEN);
    expect(row.raw_payload).toMatchObject({
      source: "sk2_jws",
      transaction_id: "2000000900000001",
    });
  });
});

describe("Android non è toccato", () => {
  it("una richiesta android non entra mai nei rami Apple", async () => {
    const res = await POST(
      req({
        product_id: LIFETIME,
        purchase_token: "play-token-senza-punti",
        package_name: "com.fitmeshsync.app",
        platform: "android",
      }),
    );

    expect(mocks.verifyJws).not.toHaveBeenCalled();
    // Service account non configurato in test → 503 del ramo Google.
    expect(res.status).toBe(503);
    expect((await res.json()).error).toBe("google_play_not_configured");
  });
});
