/**
 * Generatore del registro (npx tsx lib/blog/claims/generate-claim-registry.ts). Aggiunge le voci mancanti con una
 * classificazione AUTOMATICA e prudente. Per le voci gia' presenti (stessa cella e stessa impronta) ricalcola SOLO i
 * campi derivati dalla classificazione (tipo, soggetto, polarita', marcatori): fonte, riferimento, stato e data di
 * revisione restano com'erano, cosi' una revisione fatta a mano non viene sovrascritta. Non inventa fonti ne' URL e non
 * scrive mai «rivisto-da-matteo». Non e' eseguito dai test. La classificazione e' quella di classifyPostClaims (con la
 * coerenza per cella equivalente, S6-04), la stessa del test.
 */
import fs from "node:fs";
import path from "node:path";
import { COVERED_POSTS } from "./claim-cells";
import { classifyPostClaims, isGarminCta, isHonestStatusSentence } from "./claim-classify";
import type { ClaimEntry } from "./claim-registry";

const OUT = path.join(__dirname, "claim-registry.json");
const DATA = "2026-10-14";
const existing: ClaimEntry[] = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, "utf8")) : [];
const out: ClaimEntry[] = [...existing];

// Campi DERIVATI dalla classificazione (si ricalcolano a ogni esecuzione: cosi' un rilevatore migliorato aggiorna
// anche le voci gia' presenti). Fonte, riferimento, stato e data di revisione NON si toccano mai: sono decisioni.
const byKey = new Map(out.map((e, i) => [`${e.slug}|${e.ambito}|${e.impronta}`, i]));
let refreshed = 0;

for (const post of Object.keys(COVERED_POSTS)) {
  for (const s of classifyPostClaims(post)) {
    const d = s.det;
    const key = `${s.slug}|${s.path}|${s.impronta}`;
    const at = byKey.get(key);
    if (at !== undefined) {
      const e = out[at];
      if (e.tipo !== d.tipo || e.soggetto !== d.soggetto || e.polarita !== d.polarita || JSON.stringify(e.marcatori) !== JSON.stringify(d.marcatori)) {
        out[at] = { ...e, tipo: d.tipo, soggetto: d.soggetto, polarita: d.polarita, marcatori: d.marcatori };
        refreshed += 1;
      }
      continue;
    }
    const nordic = s.lang === "sv" || s.lang === "da";
    const behaviour = post === "garmin" && (isGarminCta(s.path) || isHonestStatusSentence(s.path, s.testo));
    const riferimentoFonte = !behaviour
      ? null
      : isGarminCta(s.path)
        ? "Etichetta della CTA in riga rossa: testo esatto ammesso dal test seo-metadata-batch1 (13 CTA uguali a main)."
        : "Stato onesto del prodotto: lettura via Health Connect e non tramite l'API ufficiale Garmin Connect; clausola di negazione ammessa dal test seo-metadata-batch1. Non provato sul telefono.";
    byKey.set(key, out.length);
    out.push({
      id: `${post}/${s.path}#${s.indice}`,
      post,
      slug: s.slug,
      ambito: s.path,
      indice: s.indice,
      lingue: [s.lang],
      tipo: d.tipo,
      soggetto: d.soggetto,
      polarita: d.polarita,
      marcatori: d.marcatori,
      impronta: s.impronta,
      anteprima: s.testo.slice(0, 48),
      fonte: behaviour ? "comportamento del prodotto" : "nessuna",
      riferimentoFonte,
      urlFonte: null,
      statoRevisione: nordic ? "da-rivedere-madrelingua" : behaviour ? "rivisto-da-agente" : "da-rivedere",
      dataRevisione: DATA,
    });
  }
}
out.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
fs.writeFileSync(OUT, "[\n" + out.map((e) => JSON.stringify(e)).join(",\n") + "\n]\n");
console.log(`voci: ${out.length} (nuove: ${out.length - existing.length}, classificazione aggiornata: ${refreshed})`);
