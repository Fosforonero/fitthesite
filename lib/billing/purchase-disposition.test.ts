/**
 * La tabella che decide se un cliente che ha pagato viene servito o lasciato a
 * mani vuote. Ogni caso è esercitato uno per uno, perché è più facile
 * sbagliarne uno leggendo che sbagliarlo qui.
 *
 * E, dal punto 8 del cancello di ripresa, c'è anche una prova STRUTTURALE: la
 * tabella viene confrontata con i sorgenti che emettono i codici. Fino a
 * quando non c'era, backend e client concordavano solo sui codici esercitati —
 * e la divergenza più grave era proprio su un codice che nessun test toccava.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  PURCHASE_DISPOSITION_CONTRACT,
  PURCHASE_DISPOSITION_CONTRACT_VERSION,
  dispositionForCode,
} from "./purchase-disposition";

const RADICE = join(__dirname, "..", "..");

function sorgente(relativo: string): string {
  return readFileSync(join(RADICE, relativo), "utf8");
}

/**
 * I codici che la route restituisce con un letterale.
 *
 * Non copre i due casi in cui il codice è una variabile — `jsonError(400,
 * outcome.reason)` per i rifiuti JWS e `jsonError(400, e.code)` per la chiave
 * di proprietà — che vengono raccolti dalle due funzioni sotto, dai loro tipi.
 */
function codiciLetteraliDellaRoute(): Set<string> {
  const src = sorgente("app/api/v1/billing/validate-purchase/route.ts");
  const out = new Set<string>();
  for (const m of src.matchAll(/jsonError\(\s*\d{3}\s*,\s*"([a-z0-9_]+)"/g)) {
    out.add(m[1]);
  }
  return out;
}

/** I rifiuti JWS, presi dal loro tipo: è lì che sono dichiarati per intero. */
function codiciDiRifiutoJws(): Set<string> {
  const src = sorgente("lib/billing/app-store-jws.ts");
  const blocco = src.match(/export type AppleJwsRejection =([\s\S]*?);/);
  if (!blocco) throw new Error("tipo AppleJwsRejection non trovato");
  const out = new Set<string>();
  for (const m of blocco[1].matchAll(/"([a-z0-9_]+)"/g)) out.add(m[1]);
  return out;
}

/**
 * Dei cinque errori di derivazione della chiave di proprietà, uno solo arriva
 * al client con il proprio nome: `responseForOwnershipKeyError` traduce due in
 * `jws_incomplete` e gli altri in `claim_failed`. Un contratto che li
 * elencasse tutti descriverebbe parole che sul filo non passano mai.
 */
const CODICE_CHIAVE_SUL_FILO = "google_subscription_upgrade_chain_unsupported";

function codiciChiaveDiProprieta(): Set<string> {
  const src = sorgente("lib/billing/ownership-key.ts");
  const out = new Set<string>();
  for (const m of src.matchAll(/OwnershipKeyError\(\s*"([a-z0-9_]+)"/g)) {
    out.add(m[1]);
  }
  return out;
}

describe("il contratto dei codici è esaustivo", () => {
  it("ogni codice che la route può restituire è classificato esplicitamente", () => {
    const emessi = codiciLetteraliDellaRoute();
    expect(emessi.size).toBeGreaterThan(10);
    const mancanti = [...emessi].filter(
      (c) => !(c in PURCHASE_DISPOSITION_CONTRACT),
    );
    expect(mancanti, "codici emessi dalla route e non classificati").toEqual([]);
  });

  it("ogni rifiuto JWS dichiarato dal tipo è classificato esplicitamente", () => {
    const jws = codiciDiRifiutoJws();
    expect(jws.size).toBe(8);
    const mancanti = [...jws].filter((c) => !(c in PURCHASE_DISPOSITION_CONTRACT));
    expect(mancanti, "rifiuti JWS non classificati").toEqual([]);
  });

  it("la tabella non contiene codici che nessuno emette più", () => {
    // Un codice fantasma non fa danno da solo, ma racconta un contratto che
    // non esiste — ed è così che il client si ritrova a difendersi da parole
    // che il backend non dice, e a non difendersi da quelle che dice.
    const emessi = new Set<string>([
      ...codiciLetteraliDellaRoute(),
      ...codiciDiRifiutoJws(),
      CODICE_CHIAVE_SUL_FILO,
    ]);
    const fantasmi = Object.keys(PURCHASE_DISPOSITION_CONTRACT).filter(
      (c) => !emessi.has(c),
    );
    expect(fantasmi, "codici classificati che nessuno emette").toEqual([]);
  });

  it("l'unico errore di chiave che arriva al client con il suo nome è classificato", () => {
    expect(codiciChiaveDiProprieta()).toContain(CODICE_CHIAVE_SUL_FILO);
    expect(dispositionForCode(CODICE_CHIAVE_SUL_FILO)).toBe(
      "client_contract_error",
    );
  });
});

describe("disposizione per codice", () => {
  it("solo TRE codici sono rifiuti dimostrati dallo store", () => {
    // Non uno di più. Ogni codice aggiunto qui chiude transazioni.
    const terminali = Object.entries(PURCHASE_DISPOSITION_CONTRACT)
      .filter(([, d]) => d === "store_verified_terminal_rejection")
      .map(([c]) => c)
      .sort();
    expect(terminali).toEqual([
      "jws_revoked",
      "jws_signature_invalid",
      "jws_wrong_app",
    ]);
  });

  it("purchase_not_in_receipt NON è un rifiuto dimostrato", () => {
    // Era il quarto terminale, e non lo è: una ricevuta App Store che non
    // contiene la transazione può essere una ricevuta non ancora aggiornata
    // sul dispositivo, cioè proprio il caso in cui il cliente ha pagato.
    expect(dispositionForCode("purchase_not_in_receipt")).toBe("retryable");
  });

  it("i cinque jws_* che NON sono terminali non chiudono niente", () => {
    for (const c of [
      "jws_malformed",
      "jws_incomplete",
      "jws_wrong_product",
      "jws_wrong_type",
    ]) {
      expect(dispositionForCode(c), c).toBe("client_contract_error");
    }
    // Dipende da dove gira la build, non dall'acquisto.
    expect(dispositionForCode("jws_sandbox_not_allowed")).toBe("retryable");
  });

  it("un prefisso jws_ non basta a decidere: cinque su otto non sono terminali", () => {
    const jws = [...codiciDiRifiutoJws()];
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
    expect(dispositionForCode("")).toBe("retryable");
    expect(dispositionForCode("codice_inventato_domani")).toBe("retryable");
    expect(dispositionForCode("jws_qualcosa_di_nuovo")).toBe("retryable");
  });

  it("la versione del contratto è dichiarata e non cambia per sbaglio", () => {
    expect(PURCHASE_DISPOSITION_CONTRACT_VERSION).toBe(1);
  });
});

describe("il contratto è pubblicato, e il file pubblicato è quello vero", () => {
  it("docs/billing/purchase-disposition-contract.json coincide con la tabella", () => {
    // Il client Flutter vive in un altro repository e non può importare questo
    // modulo. Il file JSON è il confine: qui si verifica che descriva davvero
    // la tabella in vigore, e nel repository dell'app un test verifica che le
    // sue tabelle Dart coincidano con lo stesso file. Senza questi due
    // controlli, "backend e client concordano" resta un'affermazione.
    const pubblicato = JSON.parse(
      sorgente("docs/billing/purchase-disposition-contract.json"),
    );
    expect(pubblicato.contract_version).toBe(
      PURCHASE_DISPOSITION_CONTRACT_VERSION,
    );
    expect(pubblicato.codes).toEqual(PURCHASE_DISPOSITION_CONTRACT);
  });
});
