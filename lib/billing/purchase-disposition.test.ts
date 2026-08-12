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
  costruisciContratto,
  digestDeiCodici,
} from "../../tools/build-billing-contract";
import {
  PURCHASE_DISPOSITION_CONTRACT,
  PURCHASE_DISPOSITION_CONTRACT_VERSION,
  PURCHASE_HTTP_STATUS,
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
  it("UN SOLO codice è un rifiuto dimostrato dallo store", () => {
    // Non due. Chiudere una transazione senza aver concesso il diritto
    // richiede di sapere che quel diritto non esiste E che la transazione che
    // sto chiudendo è proprio quella: su `jws_revoked` il binding lo
    // stabilisce la firma, che verifica. Su un rifiuto di firma no.
    const terminali = Object.entries(PURCHASE_DISPOSITION_CONTRACT)
      .filter(([, d]) => d === "store_verified_terminal_rejection")
      .map(([c]) => c)
      .sort();
    expect(terminali).toEqual(["jws_revoked"]);
  });

  it("un blob che non verifica non autorizza a chiudere niente", () => {
    // Un token la cui firma non regge non può attestare niente su di sé,
    // transactionId compreso. Quello che sappiamo è che il BLOB ricevuto non
    // è utilizzabile, non che la transazione StoreKit sia nulla: corruzione
    // in transito, errore di codifica nostro e scambio di token producono lo
    // stesso codice, e in tutti e tre i casi l'acquisto sotto può essere
    // pagato.
    expect(dispositionForCode("jws_signature_invalid")).toBe(
      "client_contract_error",
    );
    expect(dispositionForCode("jws_wrong_app")).toBe("client_contract_error");
  });

  it("purchase_not_in_receipt NON è un rifiuto dimostrato", () => {
    // Era il quarto terminale, e non lo è: una ricevuta App Store che non
    // contiene la transazione può essere una ricevuta non ancora aggiornata
    // sul dispositivo, cioè proprio il caso in cui il cliente ha pagato.
    expect(dispositionForCode("purchase_not_in_receipt")).toBe("retryable");
  });

  it("i sette jws_* che NON sono terminali non chiudono niente", () => {
    for (const c of [
      "jws_malformed",
      "jws_incomplete",
      "jws_wrong_product",
      "jws_wrong_type",
      "jws_signature_invalid",
      "jws_wrong_app",
      // Dipende da dove gira la build, non dall'acquisto — ed è PERMANENTE
      // per quella coppia build/backend, quindi ha bisogno del freno di 24
      // ore invece di chiedere a ogni avvio per sempre.
      "jws_sandbox_not_allowed",
    ]) {
      expect(dispositionForCode(c), c).toBe("client_contract_error");
    }
  });

  it("un prefisso jws_ non basta a decidere: sette su otto non sono terminali", () => {
    const jws = [...codiciDiRifiutoJws()];
    const terminali = jws.filter(
      (c) => dispositionForCode(c) === "store_verified_terminal_rejection",
    );
    expect(terminali).toEqual(["jws_revoked"]);
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

describe("lo stato HTTP dichiarato è quello che la route usa davvero", () => {
  it("ogni jsonError letterale ha lo stato che il contratto dichiara", () => {
    // Una tabella di stati scritta a mano e mai confrontata coi sorgenti è una
    // tabella che diverge. Qui la si confronta.
    const src = sorgente("app/api/v1/billing/validate-purchase/route.ts");
    const disallineati: string[] = [];
    for (const m of src.matchAll(/jsonError\(\s*(\d{3})\s*,\s*"([a-z0-9_]+)"/g)) {
      const [, stato, code] = m;
      if (PURCHASE_HTTP_STATUS[code] !== Number(stato)) {
        disallineati.push(
          `${code}: route=${stato} contratto=${PURCHASE_HTTP_STATUS[code]}`,
        );
      }
    }
    expect(disallineati).toEqual([]);
  });

  it("ogni codice classificato ha uno stato dichiarato, e viceversa", () => {
    expect(Object.keys(PURCHASE_HTTP_STATUS).sort()).toEqual(
      Object.keys(PURCHASE_DISPOSITION_CONTRACT).sort(),
    );
  });

  it("le sole jsonError NON letterali sono le due note", () => {
    // La scansione per letterali è esaustiva solo finché i codici sono
    // letterali. Se qualcuno introducesse `jsonError(400, `jws_${x}`)` o una
    // variabile nuova, l'esaustività diventerebbe una finzione: il test
    // passerebbe conoscendo meno codici di quelli che esistono.
    const src = sorgente("app/api/v1/billing/validate-purchase/route.ts");
    const dinamiche = [
      ...src.matchAll(/jsonError\(\s*\d{3}\s*,\s*([^"\s][^,)]*)/g),
    ].map((m) => m[1].trim());
    // `outcome.reason` copre i rifiuti JWS (tipo AppleJwsRejection),
    // `e.code` i soli errori di chiave di proprietà.
    expect(dinamiche.sort()).toEqual(["e.code", "outcome.reason"]);
  });
});

describe("la fixture condivisa coi due repository", () => {
  const pubblicato = JSON.parse(
    sorgente("docs/billing/purchase-validation-contract.json"),
  );

  it("descrive la tabella in vigore, non una sua copia invecchiata", () => {
    expect(pubblicato.contract_version).toBe(
      PURCHASE_DISPOSITION_CONTRACT_VERSION,
    );
    expect(pubblicato.codes).toEqual(PURCHASE_DISPOSITION_CONTRACT);
  });

  it("contiene la risposta HTTP INTERA per ogni codice", () => {
    // Il client non decide sul solo `error`: guarda stato, `disposition` e
    // `contract_version` insieme. Una fixture che desse solo la mappa dei
    // codici proverebbe metà del contratto.
    const perCodice = new Map<string, { status: number; body: Record<string, unknown> }>(
      (pubblicato.responses as { status: number; body: { error: string } }[]).map(
        (r) => [r.body.error, r as { status: number; body: Record<string, unknown> }],
      ),
    );
    expect(perCodice.size).toBe(Object.keys(PURCHASE_DISPOSITION_CONTRACT).length);
    for (const [code, disposizione] of Object.entries(
      PURCHASE_DISPOSITION_CONTRACT,
    )) {
      const r = perCodice.get(code);
      expect(r, code).toBeDefined();
      expect(r!.status, code).toBe(PURCHASE_HTTP_STATUS[code]);
      expect(r!.body.disposition, code).toBe(disposizione);
      expect(r!.body.contract_version, code).toBe(
        PURCHASE_DISPOSITION_CONTRACT_VERSION,
      );
    }
  });

  it("il digest è il legame con la copia dell'app, e non è ricalcolato a caso", () => {
    expect(pubblicato.codes_sha256).toBe(
      digestDeiCodici(PURCHASE_DISPOSITION_CONTRACT),
    );
    // Se il digest fosse calcolato su una serializzazione non canonica,
    // riordinare le chiavi lo cambierebbe senza che il contratto sia cambiato.
    const riordinato = Object.fromEntries(
      Object.entries(PURCHASE_DISPOSITION_CONTRACT).reverse(),
    );
    expect(digestDeiCodici(riordinato)).toBe(pubblicato.codes_sha256);
  });

  it("il file è esattamente quello che il generatore produce", () => {
    const atteso = `${JSON.stringify(costruisciContratto(), null, 2)}\n`;
    expect(readFileSync(
      join(RADICE, "docs/billing/purchase-validation-contract.json"),
      "utf8",
    )).toBe(atteso);
  });
});
