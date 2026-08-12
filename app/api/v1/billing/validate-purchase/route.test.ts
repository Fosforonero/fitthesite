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

// Il client admin non espone piu' `from(...).upsert(...)`: da B' la route non
// scrive nessuna tabella. L'unico modo che ha di toccare i dati commerciali e'
// la RPC, e questo mock lo rende letterale — se qualcuno reintroducesse una
// scrittura diretta, qui esploderebbe invece di passare inosservata.
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({ rpc: mocks.rpc }),
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
    expect(mocks.rpc).toHaveBeenCalledTimes(1);
    expect(mocks.rpc.mock.calls[0]![0]).toBe("claim_store_purchase");
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
    expect(mocks.rpc).not.toHaveBeenCalled();
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
    expect(mocks.rpc).not.toHaveBeenCalled();
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
    expect(
      mocks.rpc,
      "una transazione Sandbox non deve mai arrivare al registro",
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

    const args = mocks.rpc.mock.calls[0]![1] as Record<string, unknown>;
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
    // Service account non configurato in test → 503 del ramo Google.
    expect(res.status).toBe(503);
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
      req({
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
      data: { outcome: "revoked", applied: true },
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

  it("gia' registrata: resta terminale, applied=false non e' un guasto", async () => {
    mocks.rpc.mockResolvedValue({
      data: { outcome: "revoked", applied: false },
      error: null,
    });

    const res = await richiesta();
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("jws_revoked");
  });

  it("acquisto mai reclamato: niente da togliere, resta terminale", async () => {
    mocks.rpc.mockResolvedValue({
      data: { outcome: "unknown_purchase", applied: false },
      error: null,
    });

    const res = await richiesta();
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("jws_revoked");
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
      }),
    );
    const body = await res.json();

    expect(res.status).toBe(503);
    expect(body.error).toBe("apple_unavailable");
    // La disposizione lo dice al client invece di lasciarglielo dedurre.
    expect(body.disposition).toBe("retryable");
    // Nessuna scrittura: la transazione resta aperta e torna da sola.
    expect(mocks.rpc).not.toHaveBeenCalled();
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
    expect(mocks.rpc).not.toHaveBeenCalled();
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
      scrittureDuranteLaVerifica = mocks.rpc.mock.calls.length;
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
    expect(mocks.rpc).toHaveBeenCalledTimes(1);
    expect(mocks.rpc.mock.calls[0][0]).toBe("claim_store_purchase");
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
