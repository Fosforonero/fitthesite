import { X509Certificate, createHash } from "node:crypto";

import {
  Environment,
  Type,
  VerificationException,
  VerificationStatus,
  type JWSTransactionDecodedPayload,
} from "@apple/app-store-server-library";
import { afterEach, describe, expect, it } from "vitest";

import {
  APPLE_APP_APPLE_ID,
  APPLE_BUNDLE_ID,
  VerificationDeadlineExceeded,
  evaluateDecodedTransaction,
  looksLikeJws,
  outcomeForVerificationError,
  sandboxTransactionsAllowed,
  verifyAppleJwsTransaction,
  withDeadline,
} from "./app-store-jws";
import {
  APPLE_ROOT_CERTIFICATES,
  APPLE_ROOT_CERTIFICATE_SOURCES,
} from "./apple-root-ca";

const LIFETIME = "fitmesh_pro_lifetime";

/** Transazione valida: da qui in giù ogni test rompe UNA cosa sola. */
function validPayload(
  overrides: Partial<JWSTransactionDecodedPayload> = {},
): JWSTransactionDecodedPayload {
  return {
    bundleId: APPLE_BUNDLE_ID,
    productId: LIFETIME,
    type: Type.NON_CONSUMABLE,
    transactionId: "2000000900000001",
    originalTransactionId: "2000000900000001",
    purchaseDate: 1_754_400_000_000,
    environment: Environment.PRODUCTION,
    ...overrides,
  };
}

describe("trust store Apple", () => {
  /**
   * Impronte fissate a mano dai certificati scaricati da Apple PKI il
   * 07/08/2026 e verificate con `openssl x509 -fingerprint -sha256`. Sono
   * qui, ripetute, apposta: se qualcuno sostituisse un blob nel modulo E
   * l'impronta accanto, questo test resterebbe verde. Duplicarle qui
   * significa che la sostituzione va fatta in due punti indipendenti.
   */
  const EXPECTED = [
    {
      name: "Apple Inc. Root Certificate",
      subject: "Apple Root CA",
      sha256:
        "b0b1730ecbc7ff4505142c49f1295e6eda6bcaed7e2c68c5be91b5a11001f024",
    },
    {
      name: "Apple Root CA - G2",
      subject: "Apple Root CA - G2",
      sha256:
        "c2b9b042dd57830e7d117dac55ac8ae19407d38e41d88f3215bc3a890444a050",
    },
    {
      name: "Apple Root CA - G3",
      subject: "Apple Root CA - G3",
      sha256:
        "63343abfb89a6a03ebb57e9b3f5fa7be7c4f5c756f3017b3a8c488c3653e9179",
    },
  ] as const;

  it("contiene esattamente i root pubblicati da Apple, nell'ordine atteso", () => {
    expect(APPLE_ROOT_CERTIFICATE_SOURCES.map((c) => c.name)).toEqual(
      EXPECTED.map((e) => e.name),
    );
    expect(APPLE_ROOT_CERTIFICATES).toHaveLength(EXPECTED.length);
  });

  for (const [index, expected] of EXPECTED.entries()) {
    it(`${expected.name}: impronta, identità e validità`, () => {
      const source = APPLE_ROOT_CERTIFICATE_SOURCES[index]!;
      const der = APPLE_ROOT_CERTIFICATES[index]!;

      const fingerprint = createHash("sha256").update(der).digest("hex");
      expect(fingerprint).toBe(expected.sha256);
      // L'impronta dichiarata nel modulo deve combaciare col blob accanto.
      expect(source.sha256).toBe(expected.sha256);

      const cert = new X509Certificate(der);
      expect(cert.subject).toContain(expected.subject);
      // Root: autofirmato per definizione.
      expect(cert.issuer).toBe(cert.subject);
      // Se scadesse, ogni verifica smetterebbe di funzionare: meglio
      // accorgersene qui che in produzione.
      expect(new Date(cert.validTo).getTime()).toBeGreaterThan(Date.now());
    });
  }
});

describe("riconoscimento del formato", () => {
  it("accetta la forma di un JWS", () => {
    expect(looksLikeJws("eyJhbGciOiJFUzI1NiJ9.eyJhIjoxfQ.c2ln")).toBe(true);
  });

  it("rifiuta una ricevuta base64 StoreKit 1", () => {
    // Le ricevute App Store sono base64 standard: nessun punto, e con '+' e '/'
    // che in base64url non esistono.
    expect(looksLikeJws("MIIT2wYJKoZIhvcNAQcCoIITzDCCE8gCAQ+xy/z=")).toBe(false);
  });

  it("rifiuta stringhe con un numero di segmenti sbagliato", () => {
    expect(looksLikeJws("solo.due")).toBe(false);
    expect(looksLikeJws("a.b.c.d")).toBe(false);
    expect(looksLikeJws("")).toBe(false);
  });
});

describe("verifica crittografica", () => {
  it("un token che non è un JWS viene respinto senza chiamare Apple", async () => {
    const outcome = await verifyAppleJwsTransaction({
      signedTransaction: "questa-non-e-una-transazione",
      expectedProductId: LIFETIME,
    });
    expect(outcome).toEqual({ kind: "rejected", reason: "jws_malformed" });
  });

  it("un JWS ben formato ma non firmato da Apple non passa mai", async () => {
    // Forma giusta, contenuto inventato: è il caso di chi prova a fabbricarsi
    // un acquisto. Non deve MAI risultare ok.
    const header = Buffer.from(
      JSON.stringify({ alg: "ES256", x5c: [] }),
    ).toString("base64url");
    const body = Buffer.from(
      JSON.stringify(validPayload()),
    ).toString("base64url");
    const forged = `${header}.${body}.ZmFrZS1zaWduYXR1cmU`;

    const outcome = await verifyAppleJwsTransaction({
      signedTransaction: forged,
      expectedProductId: LIFETIME,
    });

    expect(outcome.kind).not.toBe("ok");
  });
});

/**
 * PROVA POSITIVA REALE.
 *
 * Tutto il resto dimostra che un JWS falso viene respinto. Questo è l'unico
 * test che dimostra il contrario, cioè che un JWS AUTENTICO di Apple attraversa
 * davvero firma, catena e OCSP e arriva a `ok`. Nessun mock può dimostrarlo:
 * serve una transazione vera, che si ottiene con un acquisto in Sandbox o
 * TestFlight.
 *
 * Come si esegue, senza che il token finisca da nessuna parte:
 *
 *   FITMESH_SANDBOX_JWS='ey...' pnpm vitest run lib/billing/app-store-jws.test.ts
 *
 * Il token sta solo nell'ambiente del processo: non va nel repository, non nei
 * log, non negli snapshot. Il test non lo stampa mai, nemmeno fallendo. Se la
 * variabile non c'è il test viene saltato, e il salto è dichiarato nel nome
 * così nessuno lo scambia per una prova che non è stata data.
 */
const SANDBOX_JWS = process.env.FITMESH_SANDBOX_JWS;

describe("prova positiva con JWS Apple autentico", () => {
  it.skipIf(!SANDBOX_JWS)(
    "un JWS reale attraversa firma, catena e OCSP fino a ok",
    async () => {
      const outcome = await verifyAppleJwsTransaction({
        signedTransaction: SANDBOX_JWS!,
        expectedProductId: LIFETIME,
      });

      // Il messaggio di fallimento riporta solo l'esito, mai il token.
      expect(
        outcome.kind,
        `esito inatteso: ${outcome.kind === "rejected" ? outcome.reason : outcome.kind}`,
      ).toBe("ok");
      if (outcome.kind === "ok") {
        expect(outcome.tx.transactionId).toMatch(/^\d+$/);
        expect(outcome.tx.originalTransactionId).toMatch(/^\d+$/);
        expect(outcome.tx.productId).toBe(LIFETIME);
        expect(["Sandbox", "Production"]).toContain(outcome.tx.environment);
      }
    },
    // OCSP parla con Apple: la rete può essere lenta e il default di vitest è
    // troppo stretto per una verifica che esce davvero su internet.
    30_000,
  );
});

describe("budget di tempo", () => {
  it("una verifica che non risponde entro il limite viene troncata", async () => {
    // Un OCSP che non risponde mai: senza limite la funzione resterebbe
    // appesa fino al timeout di piattaforma, che non produce una risposta
    // strutturata.
    const neverSettles = new Promise<string>(() => {});
    await expect(withDeadline(neverSettles, 5)).rejects.toBeInstanceOf(
      VerificationDeadlineExceeded,
    );
  });

  it("una verifica che risponde in tempo passa intatta", async () => {
    await expect(withDeadline(Promise.resolve("ok"), 1_000)).resolves.toBe(
      "ok",
    );
  });
});

describe("di chi è la colpa quando la verifica non riesce", () => {
  it("scadenza: ritentabile, mai un rifiuto dell'acquisto", () => {
    expect(
      outcomeForVerificationError(new VerificationDeadlineExceeded()),
    ).toEqual({ kind: "retryable" });
  });

  it("errore dichiarato ritentabile da Apple (OCSP/rete): ritentabile", () => {
    expect(
      outcomeForVerificationError(
        new VerificationException(
          VerificationStatus.RETRYABLE_VERIFICATION_FAILURE,
        ),
      ),
    ).toEqual({ kind: "retryable" });
  });

  it("errore sconosciuto e non tipizzato: ritentabile, si sbaglia dalla parte giusta", () => {
    expect(outcomeForVerificationError(new Error("boom"))).toEqual({
      kind: "retryable",
    });
    expect(outcomeForVerificationError("stringa qualunque")).toEqual({
      kind: "retryable",
    });
  });

  it("firma o catena non valide: rifiuto terminale", () => {
    for (const status of [
      VerificationStatus.VERIFICATION_FAILURE,
      VerificationStatus.INVALID_CHAIN_LENGTH,
      VerificationStatus.INVALID_CERTIFICATE,
    ]) {
      expect(
        outcomeForVerificationError(new VerificationException(status)),
      ).toEqual({ kind: "rejected", reason: "jws_signature_invalid" });
    }
  });

  it("identità dell'app o ambiente sbagliati: rifiuto terminale dedicato", () => {
    for (const status of [
      VerificationStatus.INVALID_APP_IDENTIFIER,
      VerificationStatus.INVALID_ENVIRONMENT,
    ]) {
      expect(
        outcomeForVerificationError(new VerificationException(status)),
      ).toEqual({ kind: "rejected", reason: "jws_wrong_app" });
    }
  });
});

/**
 * ISOLAMENTO PRODUZIONE / SANDBOX.
 *
 * Una transazione Sandbox e' gratuita: la ottiene chiunque abbia un Apple ID di
 * test. Accettarla in produzione significherebbe regalare un Pro a vita a chi
 * sa come chiederlo. La decisione vive nell'ambiente del server, dove il client
 * non arriva: non e' negoziabile via payload.
 */
describe("isolamento fra produzione e sandbox", () => {
  const original = process.env.APPLE_ALLOW_SANDBOX;
  afterEach(() => {
    if (original === undefined) {
      delete process.env.APPLE_ALLOW_SANDBOX;
    } else {
      process.env.APPLE_ALLOW_SANDBOX = original;
    }
  });

  it("default: sandbox NON consentito, anche senza variabile impostata", () => {
    delete process.env.APPLE_ALLOW_SANDBOX;
    expect(sandboxTransactionsAllowed()).toBe(false);
  });

  it("solo il valore esplicito 'true' apre la porta", () => {
    for (const value of ["", "false", "1", "yes", "TRUE"]) {
      process.env.APPLE_ALLOW_SANDBOX = value;
      expect(sandboxTransactionsAllowed()).toBe(false);
    }
    process.env.APPLE_ALLOW_SANDBOX = "true";
    expect(sandboxTransactionsAllowed()).toBe(true);
  });

  it("JWS Sandbox in produzione: ZERO entitlement, nessun dato da scrivere", () => {
    delete process.env.APPLE_ALLOW_SANDBOX;
    const outcome = evaluateDecodedTransaction(
      validPayload({ environment: Environment.SANDBOX }),
      LIFETIME,
    );
    expect(outcome).toEqual({
      kind: "rejected",
      reason: "jws_sandbox_not_allowed",
    });
    // Nessuna transazione estratta = niente che possa finire in una riga.
    expect(outcome).not.toHaveProperty("tx");
  });

  it("una transazione Sandbox altrimenti perfetta resta respinta", () => {
    // Firma buona, prodotto giusto, tipo giusto, non revocata: l'unica cosa
    // che non torna e' l'ambiente, e basta quella.
    delete process.env.APPLE_ALLOW_SANDBOX;
    const outcome = evaluateDecodedTransaction(
      validPayload({
        environment: Environment.SANDBOX,
        appAccountToken: "4a1c7f9e-4b7a-4c3d-9f21-8b6d5e2a1c40",
      }),
      LIFETIME,
    );
    expect(outcome.kind).toBe("rejected");
  });

  it("in QA, con la variabile accesa, la stessa transazione passa", () => {
    process.env.APPLE_ALLOW_SANDBOX = "true";
    const outcome = evaluateDecodedTransaction(
      validPayload({ environment: Environment.SANDBOX }),
      LIFETIME,
    );
    expect(outcome.kind).toBe("ok");
    if (outcome.kind === "ok") {
      expect(outcome.tx.environment).toBe("Sandbox");
    }
  });

  it("la produzione resta accettata a prescindere dalla variabile", () => {
    delete process.env.APPLE_ALLOW_SANDBOX;
    expect(evaluateDecodedTransaction(validPayload(), LIFETIME).kind).toBe("ok");
    process.env.APPLE_ALLOW_SANDBOX = "true";
    expect(evaluateDecodedTransaction(validPayload(), LIFETIME).kind).toBe("ok");
  });
});

describe("tabella di decisione sulla transazione verificata", () => {
  it("transazione buona: passa e riporta gli identificativi", () => {
    const outcome = evaluateDecodedTransaction(validPayload(), LIFETIME);
    expect(outcome).toEqual({
      kind: "ok",
      tx: {
        transactionId: "2000000900000001",
        originalTransactionId: "2000000900000001",
        productId: LIFETIME,
        appAccountToken: null,
        environment: "Production",
        purchaseDateMs: 1_754_400_000_000,
      },
    });
  });

  it("app diversa: rifiutata", () => {
    const outcome = evaluateDecodedTransaction(
      validPayload({ bundleId: "com.qualcunaltro.app" }),
      LIFETIME,
    );
    expect(outcome).toEqual({ kind: "rejected", reason: "jws_wrong_app" });
  });

  it("prodotto diverso da quello richiesto: rifiutata", () => {
    const outcome = evaluateDecodedTransaction(
      validPayload({ productId: "fitmesh_pro_sub" }),
      LIFETIME,
    );
    expect(outcome).toEqual({ kind: "rejected", reason: "jws_wrong_product" });
  });

  it("tipo non consumabile obbligatorio: un abbonamento non entra da qui", () => {
    const outcome = evaluateDecodedTransaction(
      validPayload({ type: Type.AUTO_RENEWABLE_SUBSCRIPTION }),
      LIFETIME,
    );
    expect(outcome).toEqual({ kind: "rejected", reason: "jws_wrong_type" });
  });

  it("rimborsata: niente Pro, anche se tutto il resto torna", () => {
    const outcome = evaluateDecodedTransaction(
      validPayload({ revocationDate: 1_754_500_000_000, revocationReason: 1 }),
      LIFETIME,
    );
    expect(outcome).toEqual({ kind: "rejected", reason: "jws_revoked" });
  });

  it("revoca dichiarata dal solo motivo, senza data: comunque rifiutata", () => {
    const outcome = evaluateDecodedTransaction(
      validPayload({ revocationReason: 0 }),
      LIFETIME,
    );
    expect(outcome).toEqual({ kind: "rejected", reason: "jws_revoked" });
  });

  it("senza identificativi non si scrive niente", () => {
    expect(
      evaluateDecodedTransaction(
        validPayload({ transactionId: undefined }),
        LIFETIME,
      ),
    ).toEqual({ kind: "rejected", reason: "jws_incomplete" });
    expect(
      evaluateDecodedTransaction(
        validPayload({ originalTransactionId: undefined }),
        LIFETIME,
      ),
    ).toEqual({ kind: "rejected", reason: "jws_incomplete" });
  });

  it("appAccountToken riportato quando c'è, così il chiamante può verificarlo", () => {
    const uuid = "4a1c7f9e-4b7a-4c3d-9f21-8b6d5e2a1c40";
    const outcome = evaluateDecodedTransaction(
      validPayload({ appAccountToken: uuid }),
      LIFETIME,
    );
    expect(outcome.kind).toBe("ok");
    if (outcome.kind === "ok") {
      expect(outcome.tx.appAccountToken).toBe(uuid);
    }
  });

  it("l'identità dell'app è quella dichiarata e non cambia per sbaglio", () => {
    expect(APPLE_BUNDLE_ID).toBe("com.fitmeshsync.app");
    expect(APPLE_APP_APPLE_ID).toBe(6779751708);
  });
});
