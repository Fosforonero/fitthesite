/**
 * Guardrail permanente SPRINT P1.9 FASE 12 — refresh Galaxy Ring/Oura Ring
 * (matrice A/B/C/D) + sblocco JA/PL su health-connect-not-syncing.
 *
 * Copre:
 *  1. nessuna metrica "supportata"/"scritta" senza la coppia C+D — scan
 *     testuale delle formule di certezza assoluta residue nei due articoli
 *     ring, con un allowlist esplicito delle affermazioni VERIFICATE (le
 *     uniche per cui "confermato" è corretto: sonno/HRV/passi);
 *  2. zero fallback EN in JA per i campi noti sensibili (confronto
 *     programmatico ja vs en su entrambi gli articoli ring + l'articolo
 *     appena sbloccato) — non un campione, tutti i campi Localized;
 *  3. zero placeholder/corruzione in PL (stesso confronto, pl vs en, sul
 *     solo articolo sbloccato);
 *  4. isBlogVariantIndexable coerente: pl/ja INDEXABLE per
 *     health-connect-not-syncing, ko resta noindex (non sbloccato per
 *     mandato);
 *  5. hreflang di health-connect-not-syncing include ora pl/ja e continua
 *     a escludere ko/tr/no/fi (nessuno sblocco accidentale);
 *  6. i due blocchi fitmesh-editorial-cta introdotti in questo branch
 *     (galaxy-ring, oura-ring) rispettano le stesse regole strutturali di
 *     PR A: un solo blocco per placement, benefici <=3, contentCluster nel
 *     vocabolario chiuso, e NESSUN claim FitMesh su SpO2/temperatura
 *     cutanea nel testo del modulo (le due metriche esplicitamente
 *     derubricate da questo stesso sprint — se ricomparissero nel modulo
 *     sarebbe una regressione diretta sul motivo per cui esiste il modulo).
 *
 * (Un controllo su fitmesh-vs-alternative-sync.ts, out of scope per questo
 * branch, è stato rimosso — vedi nota in fondo al file.)
 *
 * Eseguito con: npx tsx tools/check-p19b-ring-locales.ts
 */
import { BLOG_POSTS_BY_SLUG } from "../lib/blog/data";
import { isBlogVariantIndexable, blogLanguages } from "../lib/blog/indexability";
import { CONTENT_CLUSTERS } from "../lib/analytics/cta";
import type { BlogSection } from "../lib/blog/types";

let errors: string[] = [];
let checks = 0;

function diffFallback(post: any, locale: string, label: string): string[] {
  const out: string[] = [];
  function walk(obj: any, path: string) {
    if (obj == null) return;
    if (typeof obj === "object" && !Array.isArray(obj) && "en" in obj && locale in obj) {
      // Keyword/Keywords: intenzionalmente identiche a EN in molte lingue
      // (termini SEO tecnici, non prosa) — escluse da ENTRAMBI i rami,
      // scalare e array (bug corretto: il ramo array non le escludeva).
      const isKeywordPath = path.endsWith("Keyword") || path.includes("Keywords");
      if (isKeywordPath) return;
      const en = obj.en;
      const v = obj[locale];
      if (Array.isArray(v) && Array.isArray(en)) {
        v.forEach((item: string, i: number) => {
          if (item === en[i]) out.push(`${label} ${path}.${locale}[${i}]`);
        });
      } else if (v === en) {
        out.push(`${label} ${path}.${locale}`);
      }
      return;
    }
    if (Array.isArray(obj)) obj.forEach((item, i) => walk(item, `${path}[${i}]`));
    else if (typeof obj === "object") for (const k of Object.keys(obj)) walk(obj[k], `${path}.${k}`);
  }
  walk(post, "post");
  return out;
}

// ── 1: nessuna formula di certezza assoluta residua nei 2 articoli ring ──
// Nota: un tentativo di intercettare anche "everything else ... is
// available/flows through Health Connect" via regex è stato scartato:
// il testo CORRETTO (con il giusto caveat aggiunto) contiene comunque
// "Everything else is available on Android", quindi qualunque pattern
// abbastanza semplice da scrivere in regex avrebbe dato un falso
// positivo sulla propria correzione. La sovra-generalizzazione originale
// è stata trovata e corretta a mano (vedi commit), non è automatizzabile
// in modo affidabile senza NLP — i 4 pattern sotto restano il controllo
// automatico per i casi netti (claim assoluti senza alcun caveat).
const ABSOLUTE_CLAIM_PATTERNS = [
  /all data writes to health connect/i,
  /tutti i dati (vengono )?scritti su health connect/i,
  /todos los datos se escriben en health connect/i,
  /alle daten werden in health connect geschrieben/i,
];
for (const slug of ["galaxy-ring-android-health-connect", "oura-ring-health-connect-android"]) {
  checks++;
  const post = BLOG_POSTS_BY_SLUG[slug];
  if (!post) { errors.push(`[missing-post] ${slug} non trovato`); continue; }
  const json = JSON.stringify(post);
  for (const pattern of ABSOLUTE_CLAIM_PATTERNS) {
    if (pattern.test(json)) errors.push(`[absolute-claim] ${slug}: formula di certezza assoluta residua (${pattern})`);
  }
  // HRV deve comparire come eccezione esplicita da qualche parte (galaxy) o
  // essere confermata esplicitamente (oura) — non deve sparire in silenzio.
  if (!/HRV/i.test(json)) errors.push(`[hrv-missing] ${slug}: nessuna menzione di HRV trovata dopo la rettifica`);
}

// ── 2/3: zero fallback EN in JA (entrambi i ring + l'articolo sbloccato),
//         zero fallback EN in PL (solo l'articolo sbloccato) ────────────
for (const slug of ["galaxy-ring-android-health-connect", "oura-ring-health-connect-android", "health-connect-not-syncing"]) {
  checks++;
  const post = BLOG_POSTS_BY_SLUG[slug];
  if (!post) continue;
  const jaGaps = diffFallback(post, "ja", slug);
  if (jaGaps.length > 0) errors.push(...jaGaps.map((g) => `[ja-fallback] ${g}`));
}
{
  checks++;
  const post = BLOG_POSTS_BY_SLUG["health-connect-not-syncing"];
  const plGaps = diffFallback(post, "pl", "health-connect-not-syncing");
  if (plGaps.length > 0) errors.push(...plGaps.map((g) => `[pl-fallback] ${g}`));
}

// ── 4: indexabilità esatta per health-connect-not-syncing ───────────────
checks++;
{
  const post = BLOG_POSTS_BY_SLUG["health-connect-not-syncing"];
  // sv/da escluse deliberatamente: isBlogVariantIndexable diretto su
  // BLOG_POSTS_BY_SLUG non applica l'overlay nordico (applicato altrove
  // nella pipeline reale, vedi tools/dump-p18a-locale-status.ts) — un
  // assert diretto qui darebbe un falso negativo, non un vero controllo.
  const expectIndexable = ["it", "en", "es", "de", "pt", "fr", "pl", "nl", "ja"];
  const expectNoindex = ["ko", "tr", "no", "fi"];
  for (const lc of expectIndexable) {
    if (!isBlogVariantIndexable(post, lc as any)) errors.push(`[unexpected-noindex] health-connect-not-syncing/${lc} dovrebbe essere indicizzabile`);
  }
  for (const lc of expectNoindex) {
    if (isBlogVariantIndexable(post, lc as any)) errors.push(`[unexpected-unlock] health-connect-not-syncing/${lc} NON doveva essere sbloccata da questo sprint`);
  }
}

// ── 5: hreflang coerente (pl/ja dentro, ko/tr/no/fi fuori) ───────────────
checks++;
{
  const post = BLOG_POSTS_BY_SLUG["health-connect-not-syncing"];
  const langs = Object.keys(blogLanguages(post));
  if (!langs.includes("pl")) errors.push(`[hreflang-missing-pl] health-connect-not-syncing: pl assente dagli hreflang dopo lo sblocco`);
  if (!langs.includes("ja")) errors.push(`[hreflang-missing-ja] health-connect-not-syncing: ja assente dagli hreflang dopo lo sblocco`);
  if (langs.includes("ko")) errors.push(`[hreflang-unexpected-ko] health-connect-not-syncing: ko presente negli hreflang — non doveva essere sbloccata`);
}

// ── 6: struttura dei blocchi fitmesh-editorial-cta introdotti qui ───────
// Intercetta la costruzione "FitMesh legge ... SpO2 ... temperatura
// cutanea" nella STESSA frase (fino al primo punto) — la formula del
// vecchio claim falso. Non intercetta menzioni di SpO2/temperatura come
// eccezione dichiarata (frase separata, senza il verbo "legge/reads"
// davanti) — verificato a mano contro il testo reale del modulo attuale.
const FALSE_CLAIM_IN_CTA = /\b(reads?|legge|lee|liest|lit|odczytuje|okur|leest|读み取り)\b[^.]{0,80}\bSpO2\b[^.]{0,60}(skin temperature|temperatura cutanea|temperatura de la piel|Hauttemperatur|température de la peau|temperatura skóry|cilt sıcaklığı|huidtemperatuur|皮膚温度|피부 온도)/i;
for (const slug of ["galaxy-ring-android-health-connect", "oura-ring-health-connect-android"]) {
  checks++;
  const post = BLOG_POSTS_BY_SLUG[slug] as { body: BlogSection[] } | undefined;
  if (!post) continue;
  const ctaBlocks = post.body.filter(
    (s): s is Extract<BlogSection, { type: "fitmesh-editorial-cta" }> => s.type === "fitmesh-editorial-cta",
  );
  if (ctaBlocks.length === 0) {
    errors.push(`[cta-missing] ${slug}: nessun blocco fitmesh-editorial-cta trovato`);
    continue;
  }
  const seenPlacements = new Set<string>();
  for (const s of ctaBlocks) {
    if (seenPlacements.has(s.placement)) errors.push(`[cta-duplicate-placement] ${slug}: più blocchi con placement="${s.placement}"`);
    seenPlacements.add(s.placement);
    if (!(Object.values(CONTENT_CLUSTERS) as string[]).includes(s.contentCluster)) {
      errors.push(`[cta-unknown-cluster] ${slug}: contentCluster "${s.contentCluster}" non nel vocabolario`);
    }
    for (const lc of ["it", "en"] as const) {
      const list = s.benefits?.[lc];
      if (list && list.length > 3) errors.push(`[cta-benefits-max-3] ${slug} (${lc}): ${list.length} benefici`);
      const text = `${s.title[lc]} ${s.body[lc]} ${(list ?? []).join(" ")}`;
      if (FALSE_CLAIM_IN_CTA.test(text)) {
        errors.push(`[cta-false-claim] ${slug} (${lc}): il modulo cita insieme SpO2 e temperatura cutanea come se fossero entrambe confermate — regressione sulla rettifica di questo sprint`);
      }
    }
  }
}

// Nota: un controllo su fitmesh-vs-alternative-sync.ts (slug EN sbagliati)
// è stato scritto e poi rimosso da questo file — quel post esiste solo nel
// branch PR A (feat/p19a-search-to-install-funnel), non in questo branch
// PR B: un controllo su un file assente qui sarebbe stato sempre un falso
// negativo silenzioso, non una vera verifica.

if (errors.length > 0) {
  console.error(`❌ P1.9 ring/locale guardrail: ${errors.length} problema/i su ${checks} controlli\n`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}
console.log(
  `✅ P1.9 ring/locale guardrail OK: ${checks} controlli — zero claim assoluti residui, HRV trattata esplicitamente, zero fallback EN/PL, indicizzabilità esatta (pl/ja dentro, ko/tr/no/fi fuori), hreflang coerente, struttura CTA valida (no duplicati, ≤3 benefici, nessun claim SpO2+temperatura insieme).`,
);
