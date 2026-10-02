/**
 * tools/build-s02-home-units.ts: costruisce tools/data/s02-home-units.json.
 *
 * Per ogni unita' del testo base BASE-HOME-v2.1-8961c3f9 che richiede un testo
 * nelle 13 lingue (azione TRANSLATE_NEEDED, piu' ja e ko per U-PRICE-03 e
 * U-ABOUT-08) e per ogni lingua registra: id, file, keyPath e lo SHA-256 del
 * valore che la cella aveva a f142eac (null se il campo e' nuovo, cioe' non
 * esisteva a f142eac). Il gate tools/check-s02-home-lingue.ts confronta il
 * valore di oggi con questo hash: se coincide la cella e' ancora al testo
 * vecchio (PENDENTE), se e' null nel manifest basta che oggi esista.
 *
 * Il baseline NON si legge dalla working dir: si estrae da git (git archive
 * f142eac) in una cartella temporanea e si rilancia tools/s02-home-cells.ts
 * --dump li' dentro. Nessuna rete, nessun checkout.
 *
 * Uso: node_modules/.bin/tsx tools/build-s02-home-units.ts [--base-json <TESTO-BASE-v2-FINALE.json>] [--tmp <dir>]
 */
import { execFileSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { CELLS, cellLangs, type CellDump } from "./s02-home-cells";

const repoRoot = path.resolve(__dirname, "..");
const BASELINE = "f142eac";
const DEFAULT_BASE_JSON =
  "/Volumes/LOS ANGELES/Matteo/Dev Roba Mia/App Orologio/.claude/stato-lavoro/sprint-pm-02ott/base-v2/TESTO-BASE-v2-FINALE.json";

function arg(name: string, dflt: string): string {
  const i = process.argv.indexOf(name);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : dflt;
}

export const sha256 = (s: string): string => crypto.createHash("sha256").update(s, "utf8").digest("hex");

function extractBaseline(tmp: string): void {
  fs.rmSync(tmp, { recursive: true, force: true });
  fs.mkdirSync(tmp, { recursive: true });
  // Solo cio' che serve: sorgenti dei moduli di copy, dizionari, layout, tsconfig.
  const archive = execFileSync(
    "git",
    ["archive", BASELINE, "lib", "tsconfig.json", "app/(frontend)/[locale]/(marketing)/layout.tsx"],
    { cwd: repoRoot, maxBuffer: 512 * 1024 * 1024 },
  );
  execFileSync("tar", ["-x", "-C", tmp], { input: archive, maxBuffer: 512 * 1024 * 1024 });
  const nm = path.join(repoRoot, "node_modules");
  if (fs.existsSync(nm)) fs.symlinkSync(nm, path.join(tmp, "node_modules"));
}

function dumpBaseline(tmp: string): CellDump {
  const out = execFileSync(
    path.join(repoRoot, "node_modules/.bin/tsx"),
    ["--tsconfig", path.join(tmp, "tsconfig.json"), path.join(repoRoot, "tools/s02-home-cells.ts"), "--dump"],
    { cwd: tmp, maxBuffer: 256 * 1024 * 1024, encoding: "utf8" },
  );
  return JSON.parse(out) as CellDump;
}

function main(): void {
  const baseJson = JSON.parse(fs.readFileSync(arg("--base-json", DEFAULT_BASE_JSON), "utf8"));
  const units: { id: string; file: string; keyPath: string; azione_altre_13_lingue: string }[] = baseJson.unita;
  const version: string = baseJson.versione;

  // Gli id del localizzatore devono coincidere con le unita' che chiedono testo.
  const needsText = new Set(
    units
      .filter((u) => u.azione_altre_13_lingue.startsWith("TRANSLATE_NEEDED") && u.id !== "U-PRIV-12")
      .map((u) => u.id),
  );
  needsText.add("U-PRICE-03");
  needsText.add("U-ABOUT-08");
  const have = new Set(CELLS.map((c) => c.id));
  const missing = [...needsText].filter((i) => !have.has(i));
  const extra = [...have].filter((i) => !needsText.has(i));
  if (missing.length || extra.length) {
    console.error(`Localizzatore non allineato al testo base. Mancano: ${missing.join(",")} In piu': ${extra.join(",")}`);
    process.exit(1);
  }

  const tmp = arg("--tmp", path.join(os.tmpdir(), "s02-baseline-f142eac"));
  extractBaseline(tmp);
  const base = dumpBaseline(tmp);
  fs.rmSync(tmp, { recursive: true, force: true });

  const byId = new Map(units.map((u) => [u.id, u]));
  const manifest = {
    versione: version,
    baseline: BASELINE,
    nota:
      "sha256 = hash del valore della cella a f142eac (UTF-8); null = campo nuovo (non esisteva). " +
      "Cella PENDENTE se oggi e' assente o ha ancora l'hash di baseline. FAQ: hash di «q\\na».",
    unita: CELLS.map((def) => {
      const u = byId.get(def.id)!;
      const celle: Record<string, { sha256: string | null }> = {};
      for (const lc of cellLangs(def)) {
        const v = base[def.id]?.[lc] ?? null;
        celle[lc] = { sha256: v === null ? null : sha256(v) };
      }
      return { id: def.id, file: u.file, keyPath: u.keyPath, sito: def.locator, celle };
    }),
  };

  const outPath = path.join(repoRoot, "tools/data/s02-home-units.json");
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(manifest, null, 2) + "\n");
  const nCelle = manifest.unita.reduce((n, u) => n + Object.keys(u.celle).length, 0);
  const nNuovi = manifest.unita.reduce((n, u) => n + Object.values(u.celle).filter((c) => c.sha256 === null).length, 0);
  console.log(`Manifest scritto: ${manifest.unita.length} unita', ${nCelle} celle (${nNuovi} con campo nuovo, sha256 null).`);
}

main();
