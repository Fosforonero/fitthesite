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
  rpc: vi.fn(),
  validateAppleReceipt: vi.fn(),
  readAppleSharedSecret: vi.fn(),
  readServiceAccount: vi.fn(),
  validateProduct: vi.fn(),
  validateSubscription: vi.fn(),
}));

vi.mock("@/lib/billing/google-play", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/billing/google-play")>();
  return {
    ...actual,
    readServiceAccount: mocks.readServiceAccount,
    validateProduct: mocks.validateProduct,
    validateSubscription: mocks.validateSubscription,
  };
});

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

// Il client admin non espone piu' `from(...).upsert(...)`: da B' la route non
// scrive nessuna tabella. L'unico modo che ha di toccare i dati commerciali e'
// la RPC, e questo mock lo rende letterale — se qualcuno reintroducesse una
// scrittura diretta, qui esploderebbe invece di passare inosservata.
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({ rpc: mocks.rpc }),
}));

/**
 * Le chiamate RPC che SCRIVONO lo stato dell'acquisto — cioe' tutte tranne la
 * traccia del tentativo.
 *
 * `registra_tentativo_acquisto` non e' una scrittura dello stato: e' il
 * registro d'indagine, e la sua ragione d'esistere e' proprio comparire nelle
 * finestre in cui NON si scrive niente altro. Un acquisto che muore fra la
 * verifica e la prima scrittura, senza traccia, e' un cliente che ha pagato e
 * che nessuno sapra' mai di dover cercare: e' gia' successo.
 *
 * I test qui sotto dicevano «nessuna RPC» intendendo «nessuna scrittura dello
 * stato». Da quando la traccia si scrive per OGNI richiesta autenticata e
 * sintatticamente valida — prodotto sconosciuto compreso — le due frasi non
 * coincidono piu', e questa funzione tiene ferma quella che intendevano.
 */
function rpcDiScrittura(): unknown[][] {
  return mocks.rpc.mock.calls.filter(
    (c: unknown[]) => c[0] !== "registra_tentativo_acquisto",
  );
}

import { POST } from "./route";
import {
  PURCHASE_DISPOSITION_CONTRACT_VERSION,
  dispositionForCode,
} from "@/lib/billing/purchase-disposition";

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

/**
 * Come parla la 190: dichiara la versione del contratto. `req` resta il
 * payload LETTERALE, che serve a riprodurre la 189 e le build precedenti.
 */
function req190(body: Record<string, unknown>): Request {
  return req({ ...body, client_contract_version: 1 });
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
    signedDateMs: 1_754_400_500_000,
  },
};

/** Cio' che la RPC restituisce su un claim riuscito: l'entitlement PROIETTATO. */
const claimed = {
  data: {
    outcome: "claimed",
    billingSource: "apple_iap",
    stateApplied: true,
    ownerDeleted: false,
    entitlement: {
      projected: true,
      source: "apple_iap",
      productId: LIFETIME,
      state: "active",
      activeUntil: "9999-12-31T23:59:59+00:00",
      autoRenewing: false,
      isLifetime: true,
      protectedFounderRow: false,
    },
  },
  error: null,
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.requireUser.mockResolvedValue({ userId: USER_ID });
  mocks.verifyJws.mockResolvedValue(okTransaction);
  mocks.rpc.mockResolvedValue(claimed);
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
    expect(rpcDiScrittura()).toHaveLength(1);
    expect(rpcDiScrittura()[0]![0]).toBe("claim_store_purchase");
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.source).toBe("apple_iap");
    expect(body.state).toBe("active");
    // I quattro campi che la 189 legge, negli stessi nomi e tipi di sempre.
    expect(body.active_until).toBe("9999-12-31T23:59:59+00:00");
    expect(body.auto_renewing).toBe(false);
    // E i due che si AGGIUNGONO: una build che non li conosce li ignora.
    expect(body.contract_version).toBe(1);
    expect(body.disposition).toBe("verified");
  });

  it("un 200 che proietta un diritto NON attivo non dice 'verified'", async () => {
    // Dirgli verified autorizzerebbe il client a chiudere la transazione per
    // un diritto che non ha.
    mocks.rpc.mockResolvedValue({
      data: {
        outcome: "already_owned_by_same_user",
        stateApplied: true,
        entitlement: {
          projected: true,
          source: "google_play",
          productId: "fitmesh_pro_sub",
          state: "expired",
          activeUntil: "2026-01-01T00:00:00+00:00",
          autoRenewing: false,
          isLifetime: false,
          protectedFounderRow: false,
        },
      },
      error: null,
    });

    const res = await POST(
      req({
        product_id: LIFETIME,
        purchase_token: JWS_TOKEN,
        package_name: "com.fitmeshsync.app",
        platform: "ios",
      }),
    );

    expect(res.status).toBe(200);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.state).toBe("expired");
    expect(body.disposition).toBe("retryable");
  });

  it("ogni risposta d'errore porta versione e disposizione", async () => {
    mocks.verifyJws.mockResolvedValue({
      kind: "rejected",
      reason: "jws_malformed",
    });
    const res = await POST(
      req({
        product_id: LIFETIME,
        purchase_token: JWS_TOKEN,
        package_name: "com.fitmeshsync.app",
        platform: "ios",
      }),
    );
    const body = (await res.json()) as Record<string, unknown>;
    // `error` resta dov'era: la 189 legge quello, e non deve accorgersi di
    // niente.
    expect(body.error).toBe("jws_malformed");
    expect(body.contract_version).toBe(1);
    // jws_malformed NON e' un rifiuto dimostrato dallo store: e' un difetto
    // nostro, e chiudere la transazione cancellerebbe l'unica prova che resta.
    expect(body.disposition).toBe("client_contract_error");
  });

  it("i campi privilegiati vengono RESPINTI, non ignorati", async () => {
    const res = await POST(
      req({
        product_id: LIFETIME,
        purchase_token: JWS_TOKEN,
        package_name: "com.fitmeshsync.app",
        platform: "ios",
        // Il client prova a dichiarare di chi e' l'acquisto.
        ownership_key: "2000000900000099",
      }),
    );

    expect(res.status).toBe(400);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.error).toBe("invalid_payload");
    expect(mocks.rpc).not.toHaveBeenCalled();
    expect(mocks.verifyJws).not.toHaveBeenCalled();
  });

  it("payload senza token_format ma con ricevuta legacy: resta sul ramo storico", async () => {
    const res = await POST(
      req190({
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
    expect(rpcDiScrittura()).toEqual([]);
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
    // Non e' piu' un vincolo di unicita' che scatta per caso: e' un esito
    // tipizzato del registro, deciso sotto lock e senza scrivere niente.
    mocks.rpc.mockResolvedValue({
      data: { outcome: "owned_by_other_user", ownerDeleted: false },
      error: null,
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
      req190({
        product_id: LIFETIME,
        purchase_token: JWS_TOKEN,
        package_name: "com.fitmeshsync.app",
        platform: "ios",
        token_format: "sk2_jws",
      }),
    );

    expect(res.status).toBe(503);
    expect((await res.json()).error).toBe("apple_unavailable");
    expect(rpcDiScrittura()).toEqual([]);
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
    mocks.rpc.mockResolvedValue({
      data: { outcome: "persistence_failed", reason: "write_failed" },
      error: null,
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
    expect((await res.json()).error).toBe("claim_failed");
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

    // La sola RPC di SCRITTURA ammessa e' la domanda "questo account e' un
    // revisore autorizzato?", che qui risponde no. Al REGISTRO non arriva
    // niente. La traccia del tentativo c'e', e ci deve essere: e' proprio il
    // caso in cui serve sapere che qualcuno ha provato.
    const chiamate = rpcDiScrittura().map((c) => c[0]);
    expect(chiamate).toEqual(["is_sandbox_reviewer"]);
    expect(
      mocks.rpc.mock.calls.map((c) => c[0]),
    ).toContain("registra_tentativo_acquisto");
    expect(
      chiamate,
      "una transazione Sandbox non autorizzata non deve mai arrivare al registro",
    ).not.toContain("claim_store_purchase");
  });

  it("revisore autorizzato: la Sandbox passa, e finisce in uno spazio suo", async () => {
    // Il caso che rende iOS rilasciabile. Senza, il revisore di Apple
    // completa l'acquisto e vede un paywall.
    mocks.verifyJws
      .mockResolvedValueOnce({ kind: "rejected", reason: "jws_sandbox_not_allowed" })
      .mockResolvedValueOnce({
        kind: "ok",
        tx: {
          ...okTransaction.tx,
          environment: "Sandbox",
          // Obbligatorio su questo percorso: senza, un account autorizzato
          // potrebbe presentare la transazione Sandbox di chiunque altro.
          appAccountToken: USER_ID,
        },
      });
    mocks.rpc.mockImplementation(async (fn: string) =>
      fn === "is_sandbox_reviewer" ? { data: true, error: null } : claimed,
    );

    const res = await POST(
      req190({
        product_id: LIFETIME,
        purchase_token: JWS_TOKEN,
        package_name: "com.fitmeshsync.app",
        platform: "ios",
        token_format: "sk2_jws",
      }),
    );

    expect(res.status).toBe(200);
    expect(mocks.verifyJws).toHaveBeenCalledTimes(2);
    // La seconda verifica apre la porta, non abbassa i controlli.
    expect(mocks.verifyJws.mock.calls[1][0]).toMatchObject({ allowSandbox: true });

    const claim = mocks.rpc.mock.calls.find(
      (c) => c[0] === "claim_store_purchase",
    );
    expect(claim).toBeDefined();
    expect(claim![1]).toMatchObject({
      // Spazio separato: Sandbox e produzione numerano gli identificativi in
      // modo indipendente, e senza prefisso una transazione di prova potrebbe
      // rivendicare la proprieta' di un acquisto vero.
      p_ownership_key: `sandbox:${okTransaction.tx.originalTransactionId}`,
      p_environment: "sandbox",
    });
  });

  it("revisore autorizzato ma Sandbox SENZA appAccountToken: respinta", async () => {
    mocks.verifyJws
      .mockResolvedValueOnce({ kind: "rejected", reason: "jws_sandbox_not_allowed" })
      .mockResolvedValueOnce({
        kind: "ok",
        tx: { ...okTransaction.tx, environment: "Sandbox", appAccountToken: null },
      });
    mocks.rpc.mockImplementation(async (fn: string) =>
      fn === "is_sandbox_reviewer" ? { data: true, error: null } : claimed,
    );

    const res = await POST(
      req190({
        product_id: LIFETIME,
        purchase_token: JWS_TOKEN,
        package_name: "com.fitmeshsync.app",
        platform: "ios",
        token_format: "sk2_jws",
      }),
    );

    expect(res.status).toBe(400);
    expect(
      mocks.rpc.mock.calls.map((c) => c[0]),
    ).not.toContain("claim_store_purchase");
  });

  it("NON revisore: la seconda verifica non viene nemmeno tentata", async () => {
    mocks.verifyJws.mockResolvedValue({
      kind: "rejected",
      reason: "jws_sandbox_not_allowed",
    });
    mocks.rpc.mockResolvedValue({ data: false, error: null });

    const res = await POST(
      req190({
        product_id: LIFETIME,
        purchase_token: JWS_TOKEN,
        package_name: "com.fitmeshsync.app",
        platform: "ios",
        token_format: "sk2_jws",
      }),
    );

    expect(res.status).toBe(400);
    expect(mocks.verifyJws).toHaveBeenCalledTimes(1);
  });

  it("un guasto della tabella dei revisori NON apre la Sandbox", async () => {
    // In dubbio si risponde no: un guasto costa un revisore che non riesce a
    // comprare, non un Pro a vita regalato a chiunque abbia un Apple ID di
    // test.
    mocks.verifyJws.mockResolvedValue({
      kind: "rejected",
      reason: "jws_sandbox_not_allowed",
    });
    mocks.rpc.mockResolvedValue({ data: null, error: { code: "42883" } });

    const res = await POST(
      req190({
        product_id: LIFETIME,
        purchase_token: JWS_TOKEN,
        package_name: "com.fitmeshsync.app",
        platform: "ios",
        token_format: "sk2_jws",
      }),
    );

    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("jws_sandbox_not_allowed");
    expect(mocks.verifyJws).toHaveBeenCalledTimes(1);
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

  it("nessun argomento della RPC trasporta il token, e il payload non si passa piu'", async () => {
    await POST(
      req({
        product_id: LIFETIME,
        purchase_token: JWS_TOKEN,
        package_name: "com.fitmeshsync.app",
        platform: "ios",
        token_format: "sk2_jws",
      }),
    );

    const args = rpcDiScrittura()[0]![1] as Record<string, unknown>;
    // Il JWS non compare da nessuna parte, in nessun campo.
    expect(JSON.stringify(args)).not.toContain(JWS_TOKEN);
    // E non esiste piu' un canale capace di trasportarlo: il payload della
    // proiezione lo costruisce la RPC, non lo riceve.
    expect(Object.keys(args)).not.toContain("p_raw_payload");
    // La chiave di proprieta' e' l'originalTransactionId, derivata qui dal
    // payload verificato — non un valore arrivato dal client.
    expect(args.p_ownership_key).toBe("2000000900000001");
    expect(args.p_store_event_source).toBe("apple_signed_date");
    expect(args.p_owner_user_id).toBe(USER_ID);
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
    // Service account non configurato in test → 503 del ramo Google, attenuato
    // a 502 perche' questo payload non dichiara la versione del contratto.
    expect(res.status).toBe(502);
    expect((await res.json()).error).toBe("google_play_not_configured");
  });
});

/**
 * PUNTO 7 DEL CANCELLO — una revoca che non e' stata registrata non e' un
 * rifiuto dimostrato.
 *
 * Apple dichiara l'acquisto revocato o rimborsato. Verso il client e' un
 * rifiuto terminale, e va bene: quel diritto non esiste. Ma il fatto va anche
 * REGISTRATO, perche' l'utente potrebbe avere ancora il Pro proiettato da quel
 * lifetime, e solo la registrazione fa ricalcolare la proiezione.
 *
 * Fino all'11/08/2026 la route provava a registrare, annotava l'eventuale
 * errore in un log e rispondeva `jws_revoked` comunque. Il client chiudeva la
 * transazione. Se la registrazione era fallita, quell'utente restava Pro con un
 * acquisto rimborsato e non sarebbe mai piu' tornato a farcelo sapere: la
 * transazione chiusa non si ripresenta.
 */
describe("revoca Apple: la risposta dipende da come e' andata la registrazione", () => {
  const revocato = {
    kind: "revoked" as const,
    tx: okTransaction.tx,
    revokedAtMs: 1_754_400_900_000,
  };

  function richiesta() {
    return POST(
      req190({
        product_id: LIFETIME,
        purchase_token: JWS_TOKEN,
        package_name: "com.fitmeshsync.app",
        platform: "ios",
        token_format: "sk2_jws",
      }),
    );
  }

  beforeEach(() => {
    mocks.requireUser.mockResolvedValue({ userId: USER_ID });
    mocks.verifyJws.mockResolvedValue(revocato);
  });

  it("registrata: 400 terminale, e la revoca e' finita nel registro", async () => {
    mocks.rpc.mockResolvedValue({
      data: { outcome: "revoked", applied: true, persisted: true },
      error: null,
    });

    const res = await richiesta();
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe("jws_revoked");
    expect(body.disposition).toBe("store_verified_terminal_rejection");

    expect(mocks.rpc).toHaveBeenCalledWith(
      "record_store_purchase_revocation",
      expect.objectContaining({
        p_billing_source: "apple_iap",
        p_ownership_key: "2000000900000001",
        p_store_event_source: "apple_signed_date",
      }),
    );
  });

  it("revoca SANDBOX: la chiave resta nello spazio sandbox, non tocca produzione", async () => {
    // IL DIFETTO. Il claim namespacia la chiave (`sandbox:<id>`); la revoca no,
    // passava l'`originalTransactionId` nudo. Sandbox e produzione numerano gli
    // identificativi in spazi INDIPENDENTI e possono coincidere, quindi una
    // revoca Sandbox faceva due danni insieme: non revocava il proprio
    // acquisto (che nel registro sta sotto `sandbox:<id>`) e, a identificativo
    // coincidente, revocava quello di un cliente vero che aveva pagato.
    mocks.verifyJws.mockResolvedValue({
      ...revocato,
      tx: { ...okTransaction.tx, environment: "Sandbox" as const },
    });
    mocks.rpc.mockResolvedValue({
      data: { outcome: "revoked", applied: true, persisted: true },
      error: null,
    });

    await richiesta();

    expect(mocks.rpc).toHaveBeenCalledWith(
      "record_store_purchase_revocation",
      expect.objectContaining({
        p_ownership_key: "sandbox:2000000900000001",
      }),
    );
    // E la controprova, che e' la meta' che conta: la chiave di produzione non
    // dev'essere stata toccata da nessuna chiamata.
    for (const [, args] of mocks.rpc.mock.calls) {
      expect((args as { p_ownership_key?: string }).p_ownership_key).not.toBe(
        "2000000900000001",
      );
    }
  });

  it("gia' registrata: resta terminale, applied=false non e' un guasto", async () => {
    // `applied: false` con `persisted: true` significa "era gia' revocato":
    // la revoca E' nel registro, quindi il rifiuto terminale e' onesto.
    mocks.rpc.mockResolvedValue({
      data: { outcome: "revoked", applied: false, persisted: true },
      error: null,
    });

    const res = await richiesta();
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("jws_revoked");
  });

  it("acquisto mai reclamato: terminale SOLO se la revoca e' rimasta in attesa", async () => {
    // `unknown_purchase` non significa piu' "non c'era niente da fare": la RPC
    // scrive comunque la revoca in private.billing_pending_revocations, cosi'
    // il primo claim su quella chiave se la trova addosso. E' quella scrittura
    // a rendere lecito chiudere la transazione, quindi dev'essere DICHIARATA.
    mocks.rpc.mockResolvedValue({
      data: { outcome: "unknown_purchase", applied: false, pendingRegistrata: true },
      error: null,
    });

    const res = await richiesta();
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("jws_revoked");
  });

  it("acquisto mai reclamato e nemmeno messo in attesa: NON terminale", async () => {
    // Un backend piu' vecchio, o una RPC che non ha scritto: senza la conferma
    // dell'attesa, chiudere la transazione tornerebbe a essere una scommessa —
    // il rimborso sparirebbe e il claim successivo darebbe il Pro.
    mocks.rpc.mockResolvedValue({
      data: { outcome: "unknown_purchase", applied: false },
      error: null,
    });

    const res = await richiesta();
    expect(res.status).toBe(503);
    expect((await res.json()).error).toBe("apple_unavailable");
  });

  it("claim in volo: la revoca aspetta, e la risposta non chiude niente", async () => {
    // Il claim ha committato mentre la revoca aspettava l'advisory lock. Il
    // fatto e' al sicuro in attesa, ma NON e' stato applicato: se il client
    // chiudesse qui, resterebbe un Pro attivo su un acquisto rimborsato.
    mocks.rpc.mockResolvedValue({
      data: { outcome: "claim_in_flight", applied: false, pendingRegistrata: true },
      error: null,
    });

    const res = await richiesta();
    expect(res.status).toBe(503);
    expect((await res.json()).error).toBe("apple_unavailable");
  });

  it("persistenza fallita: NON terminale, il client deve ritentare", async () => {
    mocks.rpc.mockResolvedValue({
      data: { outcome: "persistence_failed", reason: "write_failed" },
      error: null,
    });

    const res = await richiesta();
    const body = await res.json();

    // Il diritto non viene concesso in nessun caso: la risposta resta un
    // errore. Ma non e' terminale, quindi la transazione non si chiude e al
    // prossimo giro la revoca viene registrata davvero.
    expect(res.status).toBe(503);
    expect(body.error).toBe("apple_unavailable");
    expect(body.disposition).toBe("retryable");
  });

  it("evidenza scartata (revoca non scritta): NON terminale", async () => {
    // Il caso che la review avversariale ha trovato: `applied: false` senza
    // `persisted` significava "non ho scritto niente", e la route rispondeva
    // comunque jws_revoked, che e' terminale. Il cliente teneva il Pro di un
    // acquisto rimborsato E chiudeva la transazione: la forma esatta del
    // difetto del 5 agosto, con i ruoli invertiti.
    mocks.rpc.mockResolvedValue({
      data: { outcome: "revoked", applied: false, persisted: false },
      error: null,
    });

    const res = await richiesta();
    expect(res.status).toBe(503);
    expect((await res.json()).disposition).toBe("retryable");
  });

  it("un backend che non dichiara `persisted` non viene creduto", async () => {
    mocks.rpc.mockResolvedValue({
      data: { outcome: "revoked", applied: true },
      error: null,
    });

    const res = await richiesta();
    expect(res.status).toBe(503);
  });

  it("database irraggiungibile: NON terminale", async () => {
    mocks.rpc.mockResolvedValue({ data: null, error: { code: "PGRST000" } });

    const res = await richiesta();
    expect(res.status).toBe(503);
    expect((await res.json()).disposition).toBe("retryable");
  });

  it("una risposta di forma sconosciuta non vale come registrazione", async () => {
    // Non sapere leggere una risposta non e' una prova che la revoca sia stata
    // scritta. E' lo stesso errore che il 5 agosto 2026 ha scambiato un
    // silenzio per un successo.
    mocks.rpc.mockResolvedValue({ data: { qualcosa: "di nuovo" }, error: null });

    const res = await richiesta();
    expect(res.status).toBe(503);
    expect((await res.json()).disposition).toBe("retryable");
  });
});

/**
 * Il payload che la 189 LEGGE, campo per campo e tipo per tipo.
 *
 * La 189 e' la build piu' diffusa e non si aggiorna da sola. Legge
 * `body['error']`, `body['state']`, `body['active_until']`, `body['source']` e
 * `body['auto_renewing']` per nome, senza validare la forma dell'oggetto: un
 * campo rinominato, sparito o cambiato di tipo non le da' un errore, le da' un
 * `null` — e un `null` su `active_until` significa "nessun diritto" per un
 * cliente che ha appena pagato.
 *
 * I campi nuovi (`contract_version`, `disposition`) si AGGIUNGONO e lei li
 * ignora. Questo test esiste perche' "si aggiungono" resti vero.
 */
describe("il contratto letto dalla 189 non si muove", () => {
  beforeEach(() => {
    mocks.requireUser.mockResolvedValue({ userId: USER_ID });
    mocks.verifyJws.mockResolvedValue(okTransaction);
    mocks.rpc.mockResolvedValue(claimed);
  });

  it("il 200 porta i cinque campi storici, con i tipi di sempre", async () => {
    const res = await POST(
      req({
        product_id: LIFETIME,
        purchase_token: JWS_TOKEN,
        package_name: "com.fitmeshsync.app",
        platform: "ios",
      }),
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(typeof body.state).toBe("string");
    expect(typeof body.active_until).toBe("string");
    expect(typeof body.source).toBe("string");
    expect(typeof body.auto_renewing).toBe("boolean");
    // Su un successo `error` non c'e', ed e' cosi' che la 189 distingue.
    expect("error" in body).toBe(false);

    // I campi nuovi ci sono e non hanno preso il posto di nessuno.
    expect(body.contract_version).toBe(1);
    expect(typeof body.disposition).toBe("string");
  });

  it("su errore, `error` resta una stringa e i campi nuovi non la coprono", async () => {
    mocks.verifyJws.mockResolvedValue({
      kind: "rejected",
      reason: "jws_malformed",
    });

    const res = await POST(
      req({
        product_id: LIFETIME,
        purchase_token: JWS_TOKEN,
        package_name: "com.fitmeshsync.app",
        platform: "ios",
      }),
    );
    const body = await res.json();

    expect(typeof body.error).toBe("string");
    expect(body.error).toBe("jws_malformed");
    expect(body.contract_version).toBe(1);
    expect(body.disposition).toBe("client_contract_error");
  });
});

/**
 * LE FINESTRE DI CRASH CHE VIVONO NEL BACKEND.
 *
 * Le dieci sono elencate in `supabase/rollback/README-finestre-di-crash.md`.
 * Quattro le dimostra il database (F4, F5, F6/F7, F10), tre il client, e queste
 * due stanno qui: sono le uniche in cui il processo puo' morire fra la verifica
 * dello store e la prima scrittura.
 *
 * Fino all'12/08/2026 erano ARGOMENTATE, non esercitate. L'argomento era
 * corretto — "la verifica non ha effetti collaterali" — ma era un'affermazione
 * su codice che nessuno controllava, e un domani in cui la verifica cominciasse
 * a scrivere qualcosa (una cache, un contatore, un audit) non se ne
 * accorgerebbe nessuno.
 */
describe("finestre di crash: fra la verifica e la prima scrittura", () => {
  beforeEach(() => {
    mocks.requireUser.mockResolvedValue({ userId: USER_ID });
    mocks.rpc.mockResolvedValue(claimed);
  });

  it("F2. il processo muore DURANTE la verifica: niente e' stato scritto", async () => {
    // Rete, timeout, OCSP che non risponde. Il verificatore dichiara
    // `retryable`, che non e' un rifiuto: e' un silenzio.
    mocks.verifyJws.mockResolvedValue({ kind: "retryable" });

    const res = await POST(
      req({
        product_id: LIFETIME,
        purchase_token: JWS_TOKEN,
        package_name: "com.fitmeshsync.app",
        platform: "ios",
        token_format: "sk2_jws",
        // Client 190: dichiara la versione del contratto, quindi riceve il 503
        // pieno. Senza, verrebbe attenuato a 502 — vedi "il 503 non si dice a
        // chi non sa gestirlo".
        client_contract_version: 1,
      }),
    );
    const body = await res.json();

    expect(res.status).toBe(503);
    expect(body.error).toBe("apple_unavailable");
    // La disposizione lo dice al client invece di lasciarglielo dedurre.
    expect(body.disposition).toBe("retryable");
    // Nessuna scrittura: la transazione resta aperta e torna da sola.
    expect(rpcDiScrittura()).toEqual([]);
  });

  it("F2bis. anche un'eccezione del verificatore non scrive niente", async () => {
    // Un guasto che nemmeno il verificatore sa classificare non deve
    // trasformarsi in un rifiuto dell'acquisto.
    mocks.verifyJws.mockRejectedValue(new Error("connessione interrotta"));

    const res = await POST(
      req({
        product_id: LIFETIME,
        purchase_token: JWS_TOKEN,
        package_name: "com.fitmeshsync.app",
        platform: "ios",
      }),
    );

    expect(res.status).toBeGreaterThanOrEqual(500);
    expect((await res.json()).disposition).toBe("retryable");
    expect(rpcDiScrittura()).toEqual([]);
  });

  it("F3. la verifica non ha effetti collaterali: morire dopo non lascia niente", async () => {
    // L'argomento della finestra 3 e' "nessuna scrittura e' avvenuta, perche'
    // la verifica non ne fa". Qui l'argomento diventa una misura: al momento
    // in cui il verificatore viene invocato, e per tutta la sua durata, il
    // client del database non e' ancora stato toccato. Se un domani la
    // verifica cominciasse a scrivere qualcosa, questo test diventerebbe
    // rosso — ed e' l'unico modo di accorgersene.
    let scrittureDuranteLaVerifica = -1;
    mocks.verifyJws.mockImplementation(async () => {
      scrittureDuranteLaVerifica = rpcDiScrittura().length;
      return okTransaction;
    });

    await POST(
      req({
        product_id: LIFETIME,
        purchase_token: JWS_TOKEN,
        package_name: "com.fitmeshsync.app",
        platform: "ios",
      }),
    );

    expect(scrittureDuranteLaVerifica).toBe(0);
    // E dopo, una sola: il claim. Non due, e non zero.
    expect(rpcDiScrittura()).toHaveLength(1);
    expect(rpcDiScrittura()[0]![0]).toBe("claim_store_purchase");
  });
});

describe("un guasto interno non racconta niente di quello che aveva in mano", () => {
  beforeEach(() => {
    mocks.requireUser.mockResolvedValue({ userId: USER_ID });
  });

  it("il messaggio dell'eccezione non esce dal backend", async () => {
    // I messaggi di eccezione dei client HTTP contengono spesso l'URL e il
    // corpo della richiesta. Qui dentro passano un JWS e una ricevuta App
    // Store: credenziali ripresentabili. Fino all'12/08/2026 il ramo Google e
    // il ramo StoreKit 1 rimandavano il messaggio al dispositivo dentro
    // `details`.
    const segreto = "eyJhbGciOiJFUzI1NiJ9.PEZZO-DI-TOKEN.firma";
    mocks.verifyJws.mockRejectedValue(new Error(`fallita con ${segreto}`));

    const res = await POST(
      req({
        product_id: LIFETIME,
        purchase_token: JWS_TOKEN,
        package_name: "com.fitmeshsync.app",
        platform: "ios",
      }),
    );
    const testo = await res.text();

    expect(res.status).toBe(500);
    expect(testo).not.toContain(segreto);
    expect(testo).not.toContain("PEZZO-DI-TOKEN");
    expect(JSON.parse(testo).error).toBe("internal");
    expect(JSON.parse(testo).disposition).toBe("retryable");
  });
});

/**
 * IL 503 VERSO UN CLIENT CHE PRECEDE LA 190.
 *
 * Misurato sul sorgente della 189 in store: quella build chiude la transazione
 * in ogni modo di guasto, ma i 5xx generici le costano tre tentativi con
 * backoff — tre possibilita' che il guasto passi. Il 503 no: e' l'unico codice
 * che mappa su `notConfigured`, si arrende al primo colpo e chiude.
 *
 * Il discriminante e' `token_format`, che la 189 non manda perche' il campo
 * non esisteva. NON la forma del token: la 189 manda JWS come la 190.
 */
describe("il 503 non si dice a chi non sa gestirlo", () => {
  beforeEach(() => {
    mocks.requireUser.mockResolvedValue({ userId: USER_ID });
    mocks.verifyJws.mockResolvedValue({ kind: "retryable" });
  });

  it("client 189 (senza token_format): 502, che gli concede tre tentativi", async () => {
    const res = await POST(
      req({
        product_id: LIFETIME,
        purchase_token: JWS_TOKEN,
        package_name: "com.fitmeshsync.app",
        platform: "ios",
      }),
    );
    expect(res.status).toBe(502);
    // Il codice e la disposizione non cambiano: cambia solo lo stato, che e'
    // l'unica leva che abbiamo su una build che non si aggiorna.
    const body = await res.json();
    expect(body.error).toBe("apple_unavailable");
    expect(body.disposition).toBe("retryable");
  });

  it("client 190 (che dichiara la versione): 503, col suo significato pieno", async () => {
    const res = await POST(
      req190({
        product_id: LIFETIME,
        purchase_token: JWS_TOKEN,
        package_name: "com.fitmeshsync.app",
        platform: "ios",
        token_format: "sk2_jws",
      }),
    );
    expect(res.status).toBe(503);
  });

  it("189 ANDROID: anche li' il 503 diventa 502", async () => {
    // La protezione non e' del ramo Apple: anche la 189 Android fa
    // acknowledge dopo un errore, e acknowledge senza diritto concesso ci
    // toglie pure il rimborso automatico di Play.
    const res = await POST(
      req({
        product_id: LIFETIME,
        purchase_token: "play-token-senza-punti",
        package_name: "com.fitmeshsync.app",
        platform: "android",
      }),
    );
    expect(res.status).toBe(502);
    expect((await res.json()).error).toBe("google_play_not_configured");
  });

  it("190 Android: 503 pieno", async () => {
    const res = await POST(
      req190({
        product_id: LIFETIME,
        purchase_token: "play-token-senza-punti",
        package_name: "com.fitmeshsync.app",
        platform: "android",
      }),
    );
    expect(res.status).toBe(503);
  });

  it("anche la revoca non persistita rispetta la stessa regola", async () => {
    mocks.verifyJws.mockResolvedValue({
      kind: "revoked",
      tx: okTransaction.tx,
      revokedAtMs: 1_754_400_900_000,
    });
    mocks.rpc.mockResolvedValue({
      data: { outcome: "revoked", applied: false, persisted: false },
      error: null,
    });

    const res = await POST(
      req({
        product_id: LIFETIME,
        purchase_token: JWS_TOKEN,
        package_name: "com.fitmeshsync.app",
        platform: "ios",
      }),
    );
    expect(res.status).toBe(502);
  });

  it("la revoca passa il signedDate come freschezza e il revocationDate a parte", async () => {
    // Erano scambiati: la route mandava `revokedAtMs` come orologio di
    // ordinamento etichettandolo `apple_signed_date`, e ogni revoca risultava
    // piu' vecchia della validazione che la precedeva.
    mocks.verifyJws.mockResolvedValue({
      kind: "revoked",
      tx: okTransaction.tx,
      revokedAtMs: 1_754_000_000_000,
    });
    mocks.rpc.mockResolvedValue({
      data: { outcome: "revoked", applied: true, persisted: true },
      error: null,
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

    const args = mocks.rpc.mock.calls.find(
      (c) => c[0] === "record_store_purchase_revocation",
    )?.[1];
    expect(args.p_store_event_at).toBe(
      new Date(okTransaction.tx.signedDateMs).toISOString(),
    );
    expect(args.p_revocation_at).toBe(new Date(1_754_000_000_000).toISOString());
  });
});

describe("rimborso StoreKit 1: il ramo che prima non esisteva", () => {
  const RIMBORSATO = "1000000222222222";
  const QUANDO = 1_754_400_900_000;
  const RISPOSTA = 1_754_401_000_000;

  function richiesta189() {
    // La 189: ricevuta StoreKit 1, nessuna versione di contratto dichiarata.
    return POST(
      req({
        product_id: LIFETIME,
        purchase_token: RECEIPT_TOKEN,
        package_name: "com.fitmeshsync.app",
        platform: "ios",
        token_format: "app_receipt",
      }),
    );
  }

  beforeEach(() => {
    mocks.requireUser.mockResolvedValue({ userId: USER_ID });
    mocks.readAppleSharedSecret.mockReturnValue("segreto");
    mocks.validateAppleReceipt.mockResolvedValue({
      kind: "revoked",
      annullate: [
        { originalTransactionId: RIMBORSATO, cancellationDateMs: QUANDO },
      ],
      environment: "production",
      requestDateMs: RISPOSTA,
    });
  });

  it("registra la revoca con le DUE date separate, e risponde terminale", async () => {
    mocks.rpc.mockResolvedValue({
      data: { outcome: "revoked", applied: true, persisted: true },
      error: null,
    });

    const res = await richiesta189();
    const body = await res.json();

    expect(mocks.rpc).toHaveBeenCalledWith(
      "record_store_purchase_revocation",
      expect.objectContaining({
        p_billing_source: "apple_iap",
        p_ownership_key: RIMBORSATO,
        // FOTOGRAFIA: quando Apple ce l'ha detto. E' cio' che ordina.
        p_store_event_at: new Date(RISPOSTA).toISOString(),
        p_store_event_source: "apple_request_date",
        // EFFICACIA: quando il rimborso e' avvenuto. Anteriore, e non ordina.
        p_revocation_at: new Date(QUANDO).toISOString(),
      }),
    );

    expect(res.status).toBe(400);
    expect(body.error).toBe("purchase_revoked");
    expect(body.disposition).toBe("store_verified_terminal_rejection");
  });

  it("ricevuta SANDBOX: la revoca resta nello spazio sandbox", async () => {
    // Lo stesso difetto del ramo JWS, sul ramo StoreKit 1: `registraAnnullate`
    // derivava la chiave senza ambiente. Una ricevuta Sandbox rimborsata
    // andava quindi a colpire lo spazio di produzione, dove lo stesso
    // `original_transaction_id` puo' appartenere a un cliente che ha pagato.
    mocks.validateAppleReceipt.mockResolvedValue({
      kind: "revoked",
      annullate: [
        { originalTransactionId: RIMBORSATO, cancellationDateMs: QUANDO },
      ],
      environment: "sandbox",
      requestDateMs: RISPOSTA,
    });
    mocks.rpc.mockResolvedValue({
      data: { outcome: "revoked", applied: true, persisted: true },
      error: null,
    });

    await richiesta189();

    expect(mocks.rpc).toHaveBeenCalledWith(
      "record_store_purchase_revocation",
      expect.objectContaining({ p_ownership_key: `sandbox:${RIMBORSATO}` }),
    );
    for (const [, args] of mocks.rpc.mock.calls) {
      expect((args as { p_ownership_key?: string }).p_ownership_key).not.toBe(
        RIMBORSATO,
      );
    }
  });

  it("revoca NON persistita: nessun terminale, e alla 189 il 503 diventa 502", async () => {
    // Stessa regola del ramo JWS: una revoca non scritta e' un silenzio.
    // Rispondere terminale qui farebbe chiudere la transazione mentre il
    // rimborso non e' registrato, e quella transazione non tornerebbe mai piu'
    // a dircelo.
    mocks.rpc.mockResolvedValue({
      data: { outcome: "not_persisted", applied: false, persisted: false },
      error: null,
    });

    const res = await richiesta189();
    const body = await res.json();

    expect(res.status).toBe(502);
    expect(body.error).toBe("apple_unavailable");
    expect(body.disposition).toBe("retryable");
  });

  it("alla 190 lo stesso guasto resta un 503 tipizzato", async () => {
    mocks.rpc.mockResolvedValue({
      data: { outcome: "not_persisted", applied: false, persisted: false },
      error: null,
    });

    const res = await POST(
      req190({
        product_id: LIFETIME,
        purchase_token: RECEIPT_TOKEN,
        package_name: "com.fitmeshsync.app",
        platform: "ios",
        token_format: "app_receipt",
      }),
    );

    expect(res.status).toBe(503);
    expect((await res.json()).error).toBe("apple_unavailable");
  });

  it("senza request_date_ms non si scrive niente: l'evidenza non e' ordinabile", async () => {
    mocks.validateAppleReceipt.mockResolvedValue({
      kind: "revoked",
      annullate: [
        { originalTransactionId: RIMBORSATO, cancellationDateMs: QUANDO },
      ],
      environment: "production",
      requestDateMs: null,
    });

    const res = await richiesta189();

    expect(res.status).toBe(502); // 503 tradotto per la 189
    expect((await res.json()).error).toBe("apple_unavailable");
    expect(
      mocks.rpc.mock.calls.filter(
        (c) => c[0] === "record_store_purchase_revocation",
      ),
    ).toHaveLength(0);
  });

  it("acquisto vivo accanto a un rimborso: il diritto si concede E la revoca si registra", async () => {
    mocks.validateAppleReceipt.mockResolvedValue({
      kind: "ok",
      tx: {
        product_id: LIFETIME,
        original_transaction_id: "1000000333333333",
        transaction_id: "1000000333333333",
        purchase_date_ms: String(RISPOSTA - 86_400_000),
      },
      autoRenewing: false,
      environment: "production",
      requestDateMs: RISPOSTA,
      annullate: [
        { originalTransactionId: RIMBORSATO, cancellationDateMs: QUANDO },
      ],
    });
    mocks.rpc.mockImplementation(async (fn: string) =>
      fn === "record_store_purchase_revocation"
        ? { data: { outcome: "revoked", applied: true, persisted: true }, error: null }
        : claimed,
    );

    const res = await richiesta189();

    expect(res.status).toBe(200);
    const chiamate = mocks.rpc.mock.calls.map((c) => c[0]);
    expect(chiamate).toContain("record_store_purchase_revocation");
    expect(chiamate).toContain("claim_store_purchase");
  });

  it("un rimborso non registrabile NON toglie il diritto a un acquisto vivo", async () => {
    // Il cliente ha davanti a se' un acquisto valido. Rifiutarglielo per un
    // problema di contabilita' su una transazione VECCHIA sarebbe fargli
    // pagare un guasto nostro.
    mocks.validateAppleReceipt.mockResolvedValue({
      kind: "ok",
      tx: {
        product_id: LIFETIME,
        original_transaction_id: "1000000333333333",
        transaction_id: "1000000333333333",
        purchase_date_ms: String(RISPOSTA - 86_400_000),
      },
      autoRenewing: false,
      environment: "production",
      requestDateMs: RISPOSTA,
      annullate: [
        { originalTransactionId: RIMBORSATO, cancellationDateMs: QUANDO },
      ],
    });
    mocks.rpc.mockImplementation(async (fn: string) =>
      fn === "record_store_purchase_revocation"
        ? { data: { outcome: "not_persisted", applied: false, persisted: false }, error: null }
        : claimed,
    );

    const res = await richiesta189();
    expect(res.status).toBe(200);
  });
});

describe("StoreKit 1 e Sandbox: un percorso che NON esiste, e va detto", () => {
  // Questo gruppo prima si chiamava "Sandbox anche su StoreKit 1: un revisore
  // su iOS 14 esiste" e provava che la ricevuta Sandbox passava. Provava una
  // cosa falsa, e ci riusciva perche' simulava il claim: il registro pretende
  // `app_account_token` per ogni claim Sandbox, e una ricevuta StoreKit 1 non
  // lo contiene. Contro il database vero quel percorso finiva con un rifiuto
  // DOPO che il revisore aveva pagato.
  function richiesta() {
    return POST(
      req190({
        product_id: LIFETIME,
        purchase_token: RECEIPT_TOKEN,
        package_name: "com.fitmeshsync.app",
        platform: "ios",
        token_format: "app_receipt",
      }),
    );
  }

  beforeEach(() => {
    mocks.requireUser.mockResolvedValue({ userId: USER_ID });
    mocks.readAppleSharedSecret.mockReturnValue("segreto");
    // `body`, non `message`. Il tipo vero e'
    // `{ kind: "error"; status: number; body: string }` (lib/billing/app-store.ts),
    // e la route fa `result.body.slice(0, 200)` per il log.
    //
    // Con `message` questi test erano VERDI PER SBAGLIO: `body` era undefined,
    // `.slice` sollevava un TypeError, il catch rispondeva 500 e l'unica
    // asserzione — `status !== 200` — era soddisfatta da un errore interno.
    // Passavano provando l'esatto contrario di quello che dicevano di provare.
    // Da qui in poi si pretende la risposta per intero.
    mocks.validateAppleReceipt.mockResolvedValue({
      kind: "error",
      status: 21007,
      body: "sandbox receipt",
    });
  });

  /** La risposta attesa, in un posto solo: la pretendono tutti i casi. */
  async function pretendiRifiutoDichiarato(res: Response) {
    expect(res.status).toBe(400);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.error).toBe("jws_sandbox_not_allowed");
    expect(body.contract_version).toBe(PURCHASE_DISPOSITION_CONTRACT_VERSION);
    // client_contract_error: non si ritenta e NON si chiude. Una transazione
    // Sandbox e' reale, e a rifiutarla siamo noi, non Apple.
    expect(body.disposition).toBe("client_contract_error");
  }

  it("la ricevuta Sandbox viene rifiutata anche a un revisore autorizzato", async () => {
    // L'account E' un revisore autorizzato: e non cambia niente lo stesso.
    mocks.rpc.mockResolvedValue({ data: true, error: null });

    await pretendiRifiutoDichiarato(await richiesta());

    // Una sola verifica: non si ritenta accettando la Sandbox.
    expect(mocks.validateAppleReceipt).toHaveBeenCalledTimes(1);
    // E il fail-closed e' DICHIARATO nella chiamata, non lasciato al default
    // della libreria, che ricadrebbe su una variabile d'ambiente.
    expect(mocks.validateAppleReceipt).toHaveBeenCalledWith(
      expect.objectContaining({ allowSandbox: false }),
    );
  });

  it("non si iscrive nemmeno nel registro: nessun claim parte", async () => {
    // L'account E' un revisore autorizzato: e non cambia niente lo stesso.
    mocks.rpc.mockResolvedValue({ data: true, error: null });

    await pretendiRifiutoDichiarato(await richiesta());

    // Il difetto vero non era la risposta: era arrivare a chiedere al registro
    // una scrittura che il registro rifiuta per costruzione.
    const claim = mocks.rpc.mock.calls.filter(
      (c: unknown[]) => c[0] === "claim_store_purchase",
    );
    expect(claim).toHaveLength(0);
  });

  it("un account qualunque riceve lo stesso trattamento", async () => {
    mocks.rpc.mockResolvedValue({ data: false, error: null });

    await pretendiRifiutoDichiarato(await richiesta());

    expect(mocks.validateAppleReceipt).toHaveBeenCalledTimes(1);
  });

  it("non e' un guasto nostro: non risponde 5xx e non ritenta all'infinito", async () => {
    // Prima di questa correzione il ramo cadeva in `apple_validation_failed`
    // (502, retryable): un rifiuto permanente vestito da guasto temporaneo, che
    // il client avrebbe ripresentato a ogni avvio per sempre.
    mocks.rpc.mockResolvedValue({ data: false, error: null });

    const res = await richiesta();
    const body = (await res.json()) as Record<string, unknown>;

    expect(res.status).toBeLessThan(500);
    expect(body.error).not.toBe("apple_validation_failed");
    expect(body.error).not.toBe("internal");
    expect(dispositionForCode(String(body.error))).not.toBe("retryable");
  });
});

/**
 * LA MATRICE `purchaseState` DI GOOGLE, TUTTA E TRE.
 *
 * `purchaseState`: 0 acquistato, 1 ANNULLATO, 2 in attesa di pagamento.
 *
 * Il caso 1 entrava nel registro dal percorso della PROPRIETA' invece che da
 * quello del RIMBORSO: `productFacts` restituiva `state: 'cancelled'` e la
 * route chiamava `claim_store_purchase`. Due conseguenze, entrambe pesanti:
 * le regole di precedenza fra evidenze vivono sul percorso della revoca e non
 * venivano mai applicate, e un rimborso arrivato PRIMA del claim non aveva
 * dove aspettare, perche' la rete di riserva la alimenta solo quel percorso.
 *
 * Ed e' il motivo per cui oggi lato Play non esiste NESSUN canale di revoca:
 * ne' questo, ne' voidedPurchases, ne' RTDN.
 */
describe("Google: purchaseState 0 / 1 / 2", () => {
  const GOOGLE_TOKEN = "token-play-abcdefghijklmnop";

  function reqGoogle(): Request {
    return req190({
      product_id: LIFETIME,
      purchase_token: GOOGLE_TOKEN,
      package_name: "com.fitmeshsync.app",
      platform: "android",
    });
  }

  function rispostaPlay(purchaseState: 0 | 1 | 2) {
    return {
      kind: "ok_product" as const,
      data: {
        purchaseState,
        orderId: "GPA.0000-0000-0000-00000",
        purchaseTimeMillis: "1754400000000",
        acknowledgementState: 1,
      },
    };
  }

  beforeEach(() => {
    mocks.requireUser.mockResolvedValue({ userId: USER_ID });
    mocks.readServiceAccount.mockReturnValue({
      client_email: "test@esempio.invalid",
      private_key: "chiave-finta",
    });
    mocks.rpc.mockResolvedValue({
      data: {
        outcome: "claimed",
        billingSource: "google_play",
        stateApplied: true,
        ownerDeleted: false,
        entitlement: {
          projected: true,
          source: "google_play",
          productId: LIFETIME,
          state: "active",
          activeUntil: "9999-12-31T23:59:59+00:00",
          autoRenewing: false,
          isLifetime: true,
          protectedFounderRow: false,
        },
      },
      error: null,
    });
  });

  it("0 acquistato: passa dal claim e concede il diritto", async () => {
    mocks.validateProduct.mockResolvedValue(rispostaPlay(0));

    const res = await POST(reqGoogle());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.state).toBe("active");
    const chiamate = mocks.rpc.mock.calls.map((c) => c[0]);
    expect(chiamate).toContain("claim_store_purchase");
    expect(chiamate).not.toContain("record_store_purchase_revocation");
  });

  it("1 annullato: passa dalla REVOCA, mai dal claim, e non concede niente", async () => {
    mocks.validateProduct.mockResolvedValue(rispostaPlay(1));
    mocks.rpc.mockResolvedValue({
      data: { outcome: "revoked", applied: true, persisted: true, entitlement: null },
      error: null,
    });

    const res = await POST(reqGoogle());
    const body = await res.json();

    const chiamate = mocks.rpc.mock.calls.map((c) => c[0]);
    expect(chiamate).toContain("record_store_purchase_revocation");
    expect(chiamate).not.toContain("claim_store_purchase");

    expect(res.status).toBe(200);
    expect(body.state).not.toBe("active");
    expect(body.state).toBe("expired");
    // Terminale: insistere su un acquisto annullato non puo' servire, e la
    // transazione va chiusa invece che ripresentata a ogni avvio.
    expect(body.disposition).toBe("store_verified_terminal_rejection");
  });

  // ── La disposizione del ramo Google, gemella di quella Apple ─────────────
  //
  // Apple esclude dal terminale SOLO `not_persisted` (route.ts:426 e :583).
  // Google pretendeva `recorded`, quindi il caso piu' comune — un acquisto
  // annullato che nessuno ha mai reclamato — rispondeva `retryable`, cioe'
  // proprio lo scenario che quella riga dichiarava di aver chiuso. Questi
  // quattro casi fissano la simmetria.

  it("1 annullato e mai reclamato, revoca messa in attesa: TERMINALE", async () => {
    // La RPC scrive comunque la revoca fra le pending, quindi il primo claim
    // su quella chiave se la trovera' addosso: il fatto e' al sicuro e la
    // transazione si puo' chiudere.
    mocks.validateProduct.mockResolvedValue(rispostaPlay(1));
    mocks.rpc.mockResolvedValue({
      data: { outcome: "unknown_purchase", applied: false, pendingRegistrata: true },
      error: null,
    });

    const body = await (await POST(reqGoogle())).json();
    expect(body.state).toBe("expired");
    expect(body.disposition).toBe("store_verified_terminal_rejection");
  });

  it("1 annullato e mai reclamato, revoca NON messa in attesa: ritentabile", async () => {
    // Senza la conferma dell'attesa non c'e' nessuna prova che il rimborso sia
    // al sicuro: chiudere la transazione lo farebbe sparire, e il claim
    // successivo darebbe il Pro a un acquisto annullato.
    mocks.validateProduct.mockResolvedValue(rispostaPlay(1));
    mocks.rpc.mockResolvedValue({
      data: { outcome: "unknown_purchase", applied: false },
      error: null,
    });

    const body = await (await POST(reqGoogle())).json();
    expect(body.disposition).toBe("retryable");
  });

  it("1 annullato con un claim in volo: ritentabile, non terminale", async () => {
    // Il claim ha committato mentre la revoca aspettava: il fatto e' scritto
    // in attesa ma NON applicato. Al giro dopo il percorso normale revoca
    // davvero, quindi la transazione non va chiusa adesso.
    mocks.validateProduct.mockResolvedValue(rispostaPlay(1));
    mocks.rpc.mockResolvedValue({
      data: { outcome: "claim_in_flight", applied: false },
      error: null,
    });

    const body = await (await POST(reqGoogle())).json();
    expect(body.disposition).toBe("retryable");
  });

  it("1 annullato di un proprietario cancellato: terminale", async () => {
    // Non c'e' nessuno a cui dare il diritto e niente da recuperare.
    mocks.validateProduct.mockResolvedValue(rispostaPlay(1));
    mocks.rpc.mockResolvedValue({
      data: { outcome: "owner_deleted", applied: false },
      error: null,
    });

    const body = await (await POST(reqGoogle())).json();
    expect(body.disposition).toBe("store_verified_terminal_rejection");
  });

  it("1 annullato con la scrittura fallita: ritentabile", async () => {
    mocks.validateProduct.mockResolvedValue(rispostaPlay(1));
    mocks.rpc.mockResolvedValue({
      data: { outcome: "persistence_failed", reason: "deadlock" },
      error: null,
    });

    const body = await (await POST(reqGoogle())).json();
    expect(body.disposition).toBe("retryable");
  });

  it("2 in attesa di pagamento: la proprieta' si registra, il diritto no", async () => {
    mocks.validateProduct.mockResolvedValue(rispostaPlay(2));
    mocks.rpc.mockResolvedValue({
      data: {
        outcome: "claimed",
        billingSource: "google_play",
        stateApplied: true,
        ownerDeleted: false,
        entitlement: {
          projected: true,
          source: "google_play",
          productId: LIFETIME,
          state: "on_hold",
          activeUntil: "9999-12-31T23:59:59+00:00",
          autoRenewing: false,
          isLifetime: false,
          protectedFounderRow: false,
        },
      },
      error: null,
    });

    const res = await POST(reqGoogle());
    const body = await res.json();

    // La proprieta' SI registra: quella transazione e' sua e nessun altro
    // deve poterla reclamare mentre il pagamento e' in corso.
    expect(mocks.rpc.mock.calls.map((c) => c[0])).toContain("claim_store_purchase");
    // Ma il diritto arriva col pagamento, non con la promessa.
    expect(body.state).not.toBe("active");
    expect(body.disposition).not.toBe("verified");
  });
});
