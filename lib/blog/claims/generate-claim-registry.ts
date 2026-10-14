/**
 * Generatore del registro (npx tsx lib/blog/claims/generate-claim-registry.ts). Aggiunge le voci mancanti con una
 * classificazione AUTOMATICA e prudente; le voci gia' presenti (stessa cella e stessa impronta) restano com'erano,
 * cosi' una revisione fatta a mano non viene sovrascritta. Non inventa fonti ne' URL e non scrive mai
 * «rivisto-da-matteo». Non e' eseguito dai test.
 */
import fs from "node:fs";
import path from "node:path";
import { COVERED_POSTS, claimSentences } from "./claim-cells";
import { classifyClaim, isGarminCta, isHonestStatusSentence } from "./claim-classify";
import type { ClaimEntry } from "./claim-registry";

const OUT = path.join(__dirname, "claim-registry.json");
const DATA = "2026-10-14";
const existing: ClaimEntry[] = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, "utf8")) : [];
const have = new Set(existing.map((e) => `${e.slug}|${e.ambito}|${e.impronta}`));
const out: ClaimEntry[] = [...existing];

for (const [post, slug] of Object.entries(COVERED_POSTS)) {
  const seen = new Set<string>();
  for (const s of claimSentences(slug)) {
    const key = `${slug}|${s.path}|${s.impronta}`;
    if (seen.has(key)) continue;
    const d = classifyClaim(post, s.path, s.testo);
    if (!d) continue;
    seen.add(key);
    if (have.has(key)) continue;
    const nordic = s.lang === "sv" || s.lang === "da";
    const behaviour =
      post === "garmin" && (isGarminCta(s.path) || isHonestStatusSentence(s.path, s.testo));
    const riferimentoFonte = !behaviour
      ? null
      : isGarminCta(s.path)
        ? "Etichetta della CTA in riga rossa: testo esatto ammesso dal test seo-metadata-batch1 (13 CTA uguali a main)."
        : "Stato onesto del prodotto: lettura via Health Connect e non tramite l'API ufficiale Garmin Connect; clausola di negazione ammessa dal test seo-metadata-batch1. Non provato sul telefono.";
    out.push({
      id: `${post}/${s.path}#${s.indice}`,
      post,
      slug,
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
console.log(`voci: ${out.length} (nuove: ${out.length - existing.length})`);
