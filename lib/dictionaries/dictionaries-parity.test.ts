/**
 * Parita' dei dizionari fra le 15 lingue (S02, 02/10/2026).
 *
 * it e' la fonte. Le chiavi devono essere le stesse in tutte le lingue e le
 * chiavi tolte dal pacchetto home (hero.pricing, privacy_block.kicker/heading/
 * description) devono essere sparite dappertutto. I campi NUOVI opzionali non
 * stanno nei dizionari (vivono in Localized con tlOwn, vedi
 * lib/content/localized-own.ts): qui non si ammette una chiave presente in una
 * lingua e assente in un'altra, perche' vorrebbe dire ripiego silenzioso.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { locales } from "@/lib/i18n";

type Json = string | number | boolean | null | Json[] | { [k: string]: Json };
const load = (lc: string): Json => JSON.parse(readFileSync(join(__dirname, `${lc}.json`), "utf8"));

function paths(node: Json, prefix = "", out: string[] = []): string[] {
  if (Array.isArray(node)) {
    out.push(`${prefix}[#${node.length}]`);
    node.forEach((n, i) => paths(n, `${prefix}[${i}]`, out));
  } else if (node && typeof node === "object") {
    for (const [k, v] of Object.entries(node)) paths(v, prefix ? `${prefix}.${k}` : k, out);
  } else out.push(prefix);
  return out;
}

const DICT = Object.fromEntries(locales.map((l) => [l, load(l)]));
const IT = new Set(paths(DICT.it));

/**
 * Namespace opzionali dichiarati: esistono solo in it/en (preesistente a S02,
 * la pagina /prova-scaduta li legge con ripiego: segnalato nel riepilogo di A4).
 * Un campo opzionale NUOVO si aggiunge qui di proposito, mai per caso.
 */
const OPZIONALI_SOLO_IT_EN = ["app.trialExpired."];
const isOpz = (p: string) => OPZIONALI_SOLO_IT_EN.some((pre) => p.startsWith(pre));

describe("dizionari: 15 lingue con le stesse chiavi", () => {
  it("le lingue sono 15 e ognuna ha il suo file", () => {
    expect(locales).toHaveLength(15);
  });

  it.each(locales.filter((l) => l !== "it"))("%s ha esattamente le chiavi di it, salvo gli opzionali dichiarati (nessuna in piu')", (lc) => {
    const own = new Set(paths(DICT[lc]));
    expect([...IT].filter((p) => !own.has(p) && !isOpz(p)), `mancanti in ${lc}`).toEqual([]);
    expect([...own].filter((p) => !IT.has(p)), `in piu' in ${lc}`).toEqual([]);
  });

  it("gli opzionali dichiarati: identici in it ed en, assenti nelle altre 13 lingue (segnalati, non rimpiazzati dall'inglese)", () => {
    const opz = (lc: string) => paths(DICT[lc]).filter(isOpz).sort();
    expect(opz("it").length).toBeGreaterThan(0);
    expect(opz("en")).toEqual(opz("it"));
    for (const lc of locales.filter((l) => l !== "it" && l !== "en")) expect(opz(lc), lc).toEqual([]);
  });

  it("app.trialExpired.iosNote (promessa sull'abbonamento App Store) non esiste piu' in nessuna lingua", () => {
    for (const lc of locales) expect(paths(DICT[lc]), lc).not.toContain("app.trialExpired.iosNote");
  });

  it("nessun valore stringa vuoto", () => {
    for (const lc of locales) {
      const walk = (n: Json, p: string) => {
        if (typeof n === "string") expect(n.trim().length, `${lc} ${p}`).toBeGreaterThan(0);
        else if (Array.isArray(n)) n.forEach((x, i) => walk(x, `${p}[${i}]`));
        else if (n && typeof n === "object") for (const [k, v] of Object.entries(n)) walk(v, `${p}.${k}`);
      };
      walk(DICT[lc], "");
    }
  });

  it("le chiavi tolte dal pacchetto home sono sparite in tutte le lingue", () => {
    const TOLTE = ["hero.pricing", "privacy_block.kicker", "privacy_block.heading", "privacy_block.description"];
    for (const lc of locales) {
      const own = new Set(paths(DICT[lc]));
      for (const k of TOLTE) expect(own.has(k), `${lc} ${k}`).toBe(false);
      expect(own.has("privacy_block.cta"), `${lc} privacy_block.cta`).toBe(true);
    }
  });
});
