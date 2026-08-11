/**
 * La tabella che decide se un cliente che ha pagato viene servito o lasciato a
 * mani vuote. Ogni caso è esercitato uno per uno, perché è più facile
 * sbagliarne uno leggendo che sbagliarlo qui.
 */
import { describe, expect, it } from "vitest";

import {
  PURCHASE_DISPOSITION_CONTRACT_VERSION,
  dispositionForCode,
} from "./purchase-disposition";

describe("disposizione per codice", () => {
  it("solo quattro codici sono rifiuti DIMOSTRATI dallo store", () => {
    // Non uno di più. Ogni codice aggiunto qui chiude transazioni.
    for (const c of [
      "jws_signature_invalid",
      "jws_revoked",
      "jws_wrong_app",
      "purchase_not_in_receipt",
    ]) {
      expect(dispositionForCode(c), c).toBe("store_verified_terminal_rejection");
    }
  });

  it("i cinque jws_* che NON sono terminali non chiudono niente", () => {
    // Sono il difetto che ha prodotto "pagato, niente Pro": una lista scritta
    // col prefisso li avrebbe buttati via tutti insieme.
    for (const c of [
      "jws_malformed",
      "jws_incomplete",
      "jws_wrong_product",
      "jws_wrong_type",
      "jws_sandbox_not_allowed",
    ]) {
      expect(dispositionForCode(c), c).toBe("client_contract_error");
    }
  });

  it("un prefisso jws_ non basta a decidere: cinque su nove non sono terminali", () => {
    const jws = [
      "jws_signature_invalid",
      "jws_revoked",
      "jws_wrong_app",
      "jws_malformed",
      "jws_incomplete",
      "jws_wrong_product",
      "jws_wrong_type",
      "jws_sandbox_not_allowed",
    ];
    const terminali = jws.filter(
      (c) => dispositionForCode(c) === "store_verified_terminal_rejection",
    );
    expect(terminali).toHaveLength(3);
  });

  it("conflitto di account: terminale per questo account, non per la transazione", () => {
    expect(dispositionForCode("purchase_already_linked")).toBe("account_conflict");
    expect(dispositionForCode("purchase_belongs_to_other_account")).toBe(
      "account_conflict",
    );
  });

  it("guasti e configurazione mancante: si riprova", () => {
    for (const c of [
      "apple_unavailable",
      "claim_failed",
      "internal",
      "google_validation_failed",
      "apple_validation_failed",
      "app_store_not_configured",
      "google_play_not_configured",
      "unexpected_result_kind",
    ]) {
      expect(dispositionForCode(c), c).toBe("retryable");
    }
  });

  it("un codice sconosciuto o vuoto è ritentabile, mai terminale", () => {
    // Sbagliare verso "riprova" costa una richiesta. Sbagliare verso
    // "terminale" costa un cliente.
    expect(dispositionForCode("")).toBe("retryable");
    expect(dispositionForCode("codice_inventato_domani")).toBe("retryable");
    expect(dispositionForCode("jws_qualcosa_di_nuovo")).toBe("retryable");
  });

  it("la versione del contratto è dichiarata e non cambia per sbaglio", () => {
    expect(PURCHASE_DISPOSITION_CONTRACT_VERSION).toBe(1);
  });
});
