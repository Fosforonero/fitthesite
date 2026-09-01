import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";

import type { GooglePlayResult } from "@/lib/billing/google-play";
import {
  appleOwnershipKey,
  googleOwnershipKey,
  OwnershipKeyError,
  OWNERSHIP_KEY_DERIVATION_VERSION,
} from "@/lib/billing/ownership-key";

const okSubscription = (data: Record<string, unknown> = {}): Extract<
  GooglePlayResult,
  { kind: "ok_subscription" }
> => ({ kind: "ok_subscription", data: data as never });

const okProduct = (): Extract<GooglePlayResult, { kind: "ok_product" }> => ({
  kind: "ok_product",
  data: { purchaseState: 0, orderId: "GPA.3300-1234-5678-90123" },
});

describe("Apple: la chiave e' originalTransactionId, e nient'altro", () => {
  it("usa l'originalTransactionId cosi' com'e'", () => {
    expect(appleOwnershipKey("2000000900000001")).toBe("2000000900000001");
  });

  it("il rinnovo non cambia la proprieta'", () => {
    // Due transazioni diverse della stessa catena: transactionId cambia,
    // originalTransactionId no. E' esattamente il motivo per cui la chiave e'
    // il secondo e non il primo.
    const acquisto = appleOwnershipKey("2000000900000001");
    const rinnovo = appleOwnershipKey("2000000900000001");
    expect(rinnovo).toBe(acquisto);
  });

  it("assente: si rifiuta invece di inventare una chiave", () => {
    for (const v of [undefined, null, ""]) {
      expect(() => appleOwnershipKey(v)).toThrowError(OwnershipKeyError);
    }
    expect(() => appleOwnershipKey(undefined)).toThrowError(
      /apple_missing_original_transaction_id/,
    );
  });

  it("forma inservibile per la colonna del registro: rifiutata", () => {
    expect(() => appleOwnershipKey("2000000 900000001")).toThrowError(
      /apple_malformed/,
    );
    expect(() => appleOwnershipKey("x".repeat(65))).toThrowError(/apple_malformed/);
  });

  it("passa il vincolo di forma che il registro applica su apple_iap", () => {
    const key = appleOwnershipKey("2000000900000001");
    expect(key.length).toBeGreaterThan(0);
    expect(key.length).toBeLessThanOrEqual(64);
    expect(/\s/.test(key)).toBe(false);
  });
});

describe("Google: digest del purchase token, mai il token", () => {
  const token = "hjklmnop.AO-J1OxK8vN2mQ4rT6uW8yA0bC2dE4fG6hI8jK0lM2nO4pQ6rS8t";

  it("e' lo SHA-256 esadecimale, byte per byte", () => {
    const atteso = createHash("sha256").update(token, "utf8").digest("hex");
    expect(googleOwnershipKey(okProduct(), token)).toBe(atteso);
    expect(atteso).toMatch(/^[0-9a-f]{64}$/);
  });

  it("non contiene il token, nemmeno in parte", () => {
    const key = googleOwnershipKey(okProduct(), token);
    expect(key).not.toContain(token);
    expect(key).not.toContain(token.slice(0, 12));
  });

  it("passa il vincolo di forma che il registro applica su google_play", () => {
    expect(googleOwnershipKey(okProduct(), token)).toMatch(/^[0-9a-f]{64}$/);
  });

  it("token assente: si rifiuta", () => {
    for (const v of [undefined, null, "", "   "]) {
      expect(() => googleOwnershipKey(okProduct(), v)).toThrowError(
        /google_missing_purchase_token/,
      );
    }
  });

  it("stesso token, stessa chiave: un replay non crea una seconda proprieta'", () => {
    expect(googleOwnershipKey(okProduct(), token)).toBe(
      googleOwnershipKey(okSubscription(), token),
    );
  });

  it("token diversi, chiavi diverse", () => {
    expect(googleOwnershipKey(okProduct(), token)).not.toBe(
      googleOwnershipKey(okProduct(), `${token}x`),
    );
  });
});

describe("la chiave Google non si calcola prima della risposta di Google", () => {
  it("il tipo pretende un esito gia' validato", () => {
    // Non e' provabile a runtime: e' il compilatore a impedirlo. Il test
    // documenta il vincolo e fallirebbe se la firma tornasse ad accettare il
    // solo token, perche' allora questa riga compilerebbe.
    // @ts-expect-error la firma richiede un GooglePlayResult gia' validato
    expect(() => googleOwnershipKey("solo-il-token")).toThrow();
  });

  it("un esito di errore non e' assegnabile", () => {
    const errore = { kind: "error", status: 400, body: "{}" } as const;
    // Il tipo lo impedisce, ma il tipo non esiste a runtime: la stessa regola
    // e' scritta anche come controllo, perche' un cast o un chiamante
    // JavaScript la aggirerebbero in silenzio.
    // @ts-expect-error un esito 'error' non prova nessun acquisto
    expect(() => googleOwnershipKey(errore, "t")).toThrowError(
      /google_result_not_validated/,
    );
  });
});

describe("upgrade di abbonamento: fail-closed, non silenzioso", () => {
  it("linkedPurchaseToken presente: si rifiuta", () => {
    const conCatena = okSubscription({
      expiryTimeMillis: "4102444800000",
      linkedPurchaseToken: "vecchio-token-della-catena",
    });
    expect(() => googleOwnershipKey(conCatena, "nuovo-token")).toThrowError(
      /google_subscription_upgrade_chain_unsupported/,
    );
  });

  it("cosi' la stessa catena non diventa di due proprietari diversi", () => {
    // Il difetto che questo rifiuto evita: il token nuovo produce un digest
    // nuovo, quindi il registro vedrebbe un acquisto mai visto e lo
    // assegnerebbe a chi lo presenta, anche se la catena appartiene gia' a un
    // altro account. Nessun conflitto verrebbe mai rilevato.
    const vecchio = "token-originale";
    const nuovo = "token-dopo-upgrade";
    const chiaveVecchia = googleOwnershipKey(okSubscription(), vecchio);
    expect(() =>
      googleOwnershipKey(okSubscription({ linkedPurchaseToken: vecchio }), nuovo),
    ).toThrowError(OwnershipKeyError);
    // La chiave del vecchio resta valida e reclamabile: non e' stata toccata.
    expect(chiaveVecchia).toMatch(/^[0-9a-f]{64}$/);
  });

  it("linkedPurchaseToken vuoto o assente non blocca un acquisto sano", () => {
    for (const data of [{}, { linkedPurchaseToken: "" }, { linkedPurchaseToken: "  " }]) {
      expect(googleOwnershipKey(okSubscription(data), "t")).toMatch(/^[0-9a-f]{64}$/);
    }
  });

  it("i one-time non hanno catena: non vengono mai bloccati", () => {
    expect(googleOwnershipKey(okProduct(), "t")).toMatch(/^[0-9a-f]{64}$/);
  });
});

describe("versione della derivazione", () => {
  it("e' dichiarata: cambiarla invalida le chiavi gia' scritte", () => {
    expect(OWNERSHIP_KEY_DERIVATION_VERSION).toBe(1);
  });
});
