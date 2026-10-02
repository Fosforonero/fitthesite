/**
 * GATE DI RILASCIO DEL PACCHETTO HOME S02 (BASE-HOME-v2.1-8961c3f9), 13 lingue.
 *
 * IL ROSSO E' VOLUTO. Questo script esce con codice 1 finche' anche una sola
 * cella resta PENDENTE (ancora al testo di f142eac, oppure assente) o una
 * violazione e' presente. Le celle pendenti aspettano la consegna linguistica
 * di Gemini (RICHIESTA-GEMINI-ADATTAMENTI.md): fino ad allora il pacchetto NON
 * si rilascia. Non e' un test della suite e NON e' nel perimetro
 * (tools/perimetro-suite.conf): non va aggiunto al gate di CI finche' il
 * pacchetto non e' completo; serve a sapere cosa manca.
 *
 * Cosa controlla, per ognuna delle 13 lingue (es de fr pt pl tr nl ja ko sv da
 * no fi) e per ogni unita' di tools/data/s02-home-units.json:
 *   1. PENDENTE: la cella e' assente, oppure il suo SHA-256 e' ancora quello
 *      di f142eac. Se il manifest ha null (campo nuovo) basta che esista.
 *   2. Nei testi del pacchetto (le celle del manifest) nessun em dash (U+2014)
 *      ne' en dash (U+2013).
 *   3. Nelle celle del pacchetto e nei testi collegati di home e /about
 *      (dizionari hero/features/final_cta/footer.tagline/privacy_block,
 *      HOME_META_*, ORG_DESCRIPTIONS, ABOUT_COPY, HOMEPAGE_COPY,
 *      PRICING_SECTION, HOME_AI_COPY) nessuna stringa vietata: importi,
 *      «niente abbonamento», «gratis per sempre», «privacy-first» e
 *      equivalenti, «Trenta secondi», «legge tutto», «deduplica», «dashboard
 *      web» (non e' disponibile: i testi di stato vengono solo da
 *      lib/feature-status.ts).
 *
 * Uso: node_modules/.bin/tsx tools/check-s02-home-lingue.ts [--verbose]
 * Esito: 0 solo se PENDENTI = 0 e violazioni = 0, altrimenti 1.
 */
import fs from "node:fs";
import path from "node:path";
import { CELLS, LANGS13, cellLangs, cellStatus, dumpValues, type Ctx, type Manifest } from "./s02-home-cells";

const repoRoot = path.resolve(__dirname, "..");
const verbose = process.argv.includes("--verbose");


// ---------------------------------------------------------------------------
// Stringhe vietate: [etichetta, pattern globale per tutte le lingue + per lingua]
// ---------------------------------------------------------------------------
import { FORBIDDEN } from "./s02-forbidden";

// ---------------------------------------------------------------------------
// Raccolta dei testi collegati (S2)
// ---------------------------------------------------------------------------
type Any = any; // eslint-disable-line @typescript-eslint/no-explicit-any

/** Raccoglie le stringhe di `lc` da un oggetto di copy: oggetti Localized o strutture che li contengono. */
function collectLocalized(node: Any, lc: string, label: string, out: [string, string][]): void {
  if (node == null) return;
  if (typeof node === "string") {
    out.push([label, node]);
    return;
  }
  if (Array.isArray(node)) {
    node.forEach((n, i) => collectLocalized(n, lc, `${label}[${i}]`, out));
    return;
  }
  if (typeof node === "object") {
    if (Object.prototype.hasOwnProperty.call(node, lc) && typeof node.it === "string") {
      collectLocalized(node[lc], lc, label, out);
      return;
    }
    if (Object.prototype.hasOwnProperty.call(node, lc) && Array.isArray(node[lc])) {
      collectLocalized(node[lc], lc, label, out);
      return;
    }
    for (const [k, v] of Object.entries(node)) {
      // un oggetto Localized privo di questa lingua e' una cella assente: nessun testo da controllare
      if (v && typeof v === "object" && !Array.isArray(v) && "it" in (v as object) && "en" in (v as object) && !(lc in (v as object))) continue;
      collectLocalized(v, lc, `${label}.${k}`, out);
    }
  }
}

function collectLinked(ctx: Ctx, lc: string): [string, string][] {
  const out: [string, string][] = [];
  const d = ctx.dict[lc];
  for (const key of ["hero", "features", "final_cta", "privacy_block"]) collectLocalized(d?.[key], lc, `dict.${key}`, out);
  if (typeof d?.footer?.tagline === "string") out.push(["dict.footer.tagline", d.footer.tagline]);
  if (ctx.meta) {
    out.push(["HOME_META_TITLES", ctx.meta.HOME_META_TITLES[lc]]);
    out.push(["HOME_META_DESCRIPTIONS", ctx.meta.HOME_META_DESCRIPTIONS[lc]]);
  }
  if (ctx.facts?.ORG_DESCRIPTIONS?.[lc]) out.push(["ORG_DESCRIPTIONS", ctx.facts.ORG_DESCRIPTIONS[lc]]);
  collectLocalized(ctx.about, lc, "ABOUT_COPY", out);
  collectLocalized(ctx.homepage, lc, "HOMEPAGE_COPY", out);
  collectLocalized(ctx.pricing, lc, "PRICING_SECTION", out);
  collectLocalized(ctx.ai, lc, "HOME_AI_COPY", out);
  return out.filter(([, v]) => typeof v === "string" && v.length > 0);
}

// ---------------------------------------------------------------------------
async function main(): Promise<void> {
  const manifest: Manifest = JSON.parse(fs.readFileSync(path.join(repoRoot, "tools/data/s02-home-units.json"), "utf8"));
  const { ctx, values } = await dumpValues(repoRoot);

  const status = cellStatus(manifest, values);
  const problems: string[] = [];
  const have = new Set(CELLS.map((c) => c.id));
  for (const u of manifest.unita) if (!have.has(u.id)) problems.push(`manifest: unita' ${u.id} senza localizzatore`);
  for (const c of CELLS) if (!manifest.unita.find((u) => u.id === c.id)) problems.push(`manifest: manca ${c.id}`);

  type Row = { pend: string[]; consegnate: number; totali: number; dash: string[]; vietate: string[] };
  const rows: Record<string, Row> = {};

  for (const lc of LANGS13) {
    const row: Row = { pend: [], consegnate: 0, totali: 0, dash: [], vietate: [] };
    rows[lc] = row;

    const st = status[lc];
    row.pend = st.pendenti.map((p) => `${p.id} (${p.motivo})`);
    row.consegnate = st.consegnate.length;
    row.totali = st.consegnate.length + st.pendenti.length;
    for (const u of manifest.unita) {
      const v = values[u.id]?.[lc] ?? null;
      if (v !== null && /[\u2014\u2013]/.test(v)) row.dash.push(`${u.id}: em/en dash`);
    }

    // Stringhe vietate: celle del pacchetto + testi collegati di home e /about.
    const seen = new Set<string>();
    const texts: [string, string][] = [];
    for (const def of CELLS) {
      if (!cellLangs(def).includes(lc)) continue;
      const v = values[def.id][lc];
      if (v !== null) texts.push([def.id, v]);
    }
    texts.push(...collectLinked(ctx, lc));
    for (const [label, text] of texts) {
      for (const f of FORBIDDEN) {
        const m = text.match(f.re);
        if (!m) continue;
        const key = `${label}|${f.label}|${m[0]}`;
        if (seen.has(key)) continue;
        seen.add(key);
        row.vietate.push(`${label}: «${f.label}» (${m[0]})`);
      }
    }
  }

  // ------------------------------ report ------------------------------------
  console.log(`Gate di rilascio del pacchetto home S02, versione ${manifest.versione}, baseline ${manifest.baseline}`);
  console.log("ROSSO VOLUTO finche' Gemini non consegna le celle pendenti.\n");
  console.log("lingua | consegnate/totali | PENDENTI | em/en dash | stringhe vietate");
  console.log("-------|-------------------|----------|------------|-----------------");
  let tPend = 0;
  let tViol = 0;
  for (const lc of LANGS13) {
    const r = rows[lc];
    tPend += r.pend.length;
    tViol += r.dash.length + r.vietate.length;
    console.log(
      `${lc.padEnd(6)} | ${`${r.consegnate}/${r.totali}`.padEnd(17)} | ${String(r.pend.length).padEnd(8)} | ${String(r.dash.length).padEnd(10)} | ${r.vietate.length}`,
    );
  }
  console.log(`\nTOTALE PENDENTI: ${tPend}   TOTALE VIOLAZIONI: ${tViol}   problemi di manifest: ${problems.length}`);

  if (verbose) {
    for (const lc of LANGS13) {
      const r = rows[lc];
      console.log(`\n== ${lc} ==`);
      r.pend.forEach((p) => console.log(`  PENDENTE ${p}`));
      r.dash.forEach((p) => console.log(`  DASH ${p}`));
      r.vietate.forEach((p) => console.log(`  VIETATA ${p}`));
    }
  } else {
    console.log("\n(usa --verbose per l'elenco delle celle e delle violazioni)");
  }
  problems.forEach((p) => console.log(`PROBLEMA ${p}`));

  if (tPend > 0 || tViol > 0 || problems.length > 0) {
    console.log("\nGATE ROSSO: il pacchetto non e' rilasciabile.");
    process.exit(1);
  }
  console.log("\nGATE VERDE.");
}

main().catch((e) => {
  console.error(e);
  process.exit(2);
});
