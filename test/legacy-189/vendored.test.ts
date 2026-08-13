/**
 * La copia della 189 e' ancora una copia?
 *
 * route-189.vendored.ts serve a far girare il backend VECCHIO contro il
 * database NUOVO. Vale come prova solo finche' e' identico a cio' che gira
 * davvero: una copia che ha smesso di esserlo non e' un test debole, e' un
 * test che afferma il falso.
 */
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { databaseRaggiungibile } from "@/test/db/psql-supabase";

// `new URL(...).pathname` lascia gli spazi come %20, e questo repo vive sotto
// "LOS ANGELES": fileURLToPath e' l'unico modo di ottenere un percorso vero.
const QUI = path.dirname(fileURLToPath(import.meta.url));
const MARCATORE = "/* INIZIO COPIA LETTERALE */\n";
const ORIGINE = "app/api/v1/billing/validate-purchase/route.ts";

function daMain(): string {
  return execFileSync("git", ["show", `main:${ORIGINE}`], {
    encoding: "utf8",
    cwd: path.resolve(QUI, "../.."),
    maxBuffer: 8 * 1024 * 1024,
  });
}

describe("copia letterale della 189", () => {
  it("e' identica a main, byte per byte", () => {
    const vendorato = readFileSync(path.join(QUI, "route-189.vendored.ts"), "utf8");
    const i = vendorato.indexOf(MARCATORE);
    expect(i, "il marcatore di inizio copia e' sparito dal file vendorato").toBeGreaterThan(-1);
    expect(vendorato.slice(i + MARCATORE.length)).toBe(daMain());
  });

  it("l'impronta registrata e' quella di main", () => {
    const atteso = readFileSync(path.join(QUI, "route-189.sha256"), "utf8").trim();
    expect(createHash("sha256").update(daMain()).digest("hex")).toBe(atteso);
  });
});

/**
 * Il test end-to-end contro il database si salta quando il database locale non
 * c'e'. Un salto silenzioso pero' e' come un test che non esiste: sembra verde
 * e non ha guardato niente.
 *
 * Prima di un rilascio si esegue con RICHIEDI_DB=1, e allora il salto diventa
 * un fallimento. E' la riga della lista di rilascio che rende la copertura una
 * scelta invece di un caso.
 */
describe("copertura end-to-end col database", () => {
  it("il database locale c'e' quando RICHIEDI_DB=1", () => {
    if (process.env.RICHIEDI_DB !== "1") {
      expect(true).toBe(true);
      return;
    }
    expect(
      databaseRaggiungibile(),
      "RICHIEDI_DB=1 ma il container non risponde: route.db.test.ts si sarebbe saltato in silenzio",
    ).toBe(true);
  });
});
