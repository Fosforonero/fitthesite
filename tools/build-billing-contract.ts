/**
 * Genera il contratto condiviso fra questo backend e l'app Flutter, che vive
 * in un repository diverso e non può importare `lib/billing/`.
 *
 * Il file prodotto NON è documentazione: è una fixture che entrambi i lati
 * eseguono. Qui `purchase-disposition.test.ts` verifica che descriva la tabella
 * vera e le risposte vere; nel repository dell'app,
 * `purchase_disposition_contract_test.dart` verifica che le tabelle Dart e la
 * logica di chiusura delle transazioni ci corrispondano.
 *
 * Il legame fra le due copie è il digest: `codes_sha256` è calcolato qui sopra
 * la serializzazione canonica dei codici, il test dell'app lo ricalcola sul
 * proprio file E lo confronta con una costante scritta nel suo sorgente.
 * Modificare una sola delle due copie fa fallire un test; modificarle entrambe
 * senza aggiornare la costante ne fa fallire un altro. Non è crittografia, è
 * un modo per rendere RUMOROSA una divergenza che finora era silenziosa.
 *
 * Uso:
 *   npx tsx tools/build-billing-contract.ts          # scrive il file
 *   npx tsx tools/build-billing-contract.ts --check  # esce 1 se è disallineato
 */
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import {
  PURCHASE_DISPOSITION_CONTRACT,
  PURCHASE_DISPOSITION_CONTRACT_VERSION,
  PURCHASE_HTTP_STATUS,
} from "../lib/billing/purchase-disposition";

const DESTINAZIONE = join(
  __dirname,
  "..",
  "docs",
  "billing",
  "purchase-validation-contract.json",
);

/** Serializzazione canonica: chiavi ordinate, nessuno spazio. */
export function serializzazioneCanonica(
  codici: Record<string, string>,
): string {
  const ordinate = Object.keys(codici).sort();
  return JSON.stringify(ordinate.map((k) => [k, codici[k]]));
}

export function digestDeiCodici(codici: Record<string, string>): string {
  return createHash("sha256")
    .update(serializzazioneCanonica(codici))
    .digest("hex");
}

export function costruisciContratto() {
  const codici = { ...PURCHASE_DISPOSITION_CONTRACT };

  // Le risposte come arrivano davvero al client: stato HTTP e corpo completo.
  // La forma del corpo è quella prodotta da `jsonError` nella route — `error`,
  // `contract_version`, `disposition` — e i tre campi vanno insieme, perché è
  // sulla loro combinazione che il client decide se chiudere una transazione.
  const risposte = Object.keys(codici)
    .sort()
    .map((code) => ({
      status: PURCHASE_HTTP_STATUS[code],
      body: {
        error: code,
        contract_version: PURCHASE_DISPOSITION_CONTRACT_VERSION,
        disposition: codici[code],
      },
    }));

  return {
    _: "Fixture contrattuale CONDIVISA fra il backend (repository fitthesite) e l'app Flutter (repository AppFitmesh). Non e' documentazione: entrambi i lati la eseguono. Rigenerare con `npx tsx tools/build-billing-contract.ts` e copiare il file identico in AppFitmesh/flutter_app/test/features/billing/contract/.",
    contract_version: PURCHASE_DISPOSITION_CONTRACT_VERSION,
    dispositions: {
      verified: "Diritto concesso e persistito.",
      retryable:
        "Silenzio, non rifiuto: rete, timeout, 5xx, persistenza fallita, configurazione mancante. La transazione resta aperta.",
      account_conflict:
        "La transazione e' di un altro account FitMesh. Terminale per questo account, ma la transazione non si chiude.",
      client_contract_error:
        "Difetto NOSTRO di formato, prodotto o contratto. L'acquisto e' probabilmente sano: non si chiude.",
      store_verified_terminal_rejection:
        "Lo store ha DIMOSTRATO che il diritto non esiste. Gli unici casi in cui la transazione si puo' chiudere senza aver concesso niente. Emesso su iOS (ricevuta o JWS che nega il diritto) e su Google Play (purchaseState=1, acquisto annullato, con la revoca registrata).",
    },
    codes: codici,
    responses: risposte,
    codes_sha256: digestDeiCodici(codici),
  };
}

function main(): void {
  const contratto = costruisciContratto();
  const testo = `${JSON.stringify(contratto, null, 2)}\n`;

  if (process.argv.includes("--check")) {
    const attuale = readFileSync(DESTINAZIONE, "utf8");
    if (attuale !== testo) {
      console.error(
        "Il contratto pubblicato non corrisponde alla tabella in vigore.\n" +
          "Rigenerare con: npx tsx tools/build-billing-contract.ts\n" +
          "e copiare il file IDENTICO in AppFitmesh/flutter_app/test/features/billing/contract/",
      );
      process.exit(1);
    }
    console.log(`✓ contratto allineato (${contratto.codes_sha256.slice(0, 12)}…)`);
    return;
  }

  writeFileSync(DESTINAZIONE, testo);
  console.log(`✓ scritto ${DESTINAZIONE}`);
  console.log(`  digest dei codici: ${contratto.codes_sha256}`);
  console.log(
    "  ora copiarlo IDENTICO in AppFitmesh/flutter_app/test/features/billing/contract/",
  );
}

if (require.main === module) main();
