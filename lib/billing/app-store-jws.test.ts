import { X509Certificate, createHash } from "node:crypto";

import {
  Environment,
  Type,
  type JWSTransactionDecodedPayload,
} from "@apple/app-store-server-library";
import { describe, expect, it } from "vitest";

import {
  APPLE_APP_APPLE_ID,
  APPLE_BUNDLE_ID,
  evaluateDecodedTransaction,
  looksLikeJws,
  verifyAppleJwsTransaction,
} from "./app-store-jws";
import { APPLE_ROOT_CERTIFICATES } from "./apple-root-ca";

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

describe("certificato root Apple", () => {
  it("è davvero Apple Root CA G3 e non è stato sostituito", () => {
    expect(APPLE_ROOT_CERTIFICATES).toHaveLength(1);
    const der = APPLE_ROOT_CERTIFICATES[0]!;
    const fingerprint = createHash("sha256").update(der).digest("hex");
    expect(fingerprint).toBe(
      "63343abfb89a6a03ebb57e9b3f5fa7be7c4f5c756f3017b3a8c488c3653e9179",
    );

    // Autofirmato e ancora valido: se scadesse, ogni verifica smetterebbe di
    // funzionare e vogliamo accorgercene qui, non in produzione.
    const cert = new X509Certificate(der);
    expect(cert.subject).toContain("Apple Root CA - G3");
    expect(cert.issuer).toBe(cert.subject);
    expect(new Date(cert.validTo).getTime()).toBeGreaterThan(Date.now());
  });
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

  it("sandbox riconosciuto e riportato come tale", () => {
    const outcome = evaluateDecodedTransaction(
      validPayload({ environment: Environment.SANDBOX }),
      LIFETIME,
    );
    expect(outcome.kind).toBe("ok");
    if (outcome.kind === "ok") {
      expect(outcome.tx.environment).toBe("Sandbox");
    }
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
