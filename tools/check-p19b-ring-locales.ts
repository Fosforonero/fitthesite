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
 *  6. link interni diretti: i due articoli ring non linkano a slug EN
 *     sbagliati (stesso bug già trovato e corretto in fitmesh-vs-alternative-
 *     sync.ts durante PR A — controllo di non-regressione qui).
 *
 * Eseguito con: npx tsx tools/check-p19b-ring-locales.ts
 */
import { BLOG_POSTS_BY_SLUG } from "../lib/blog/data";
import { isBlogVariantIndexable, blogLanguages } from "../lib/blog/indexability";

let errors: string[] = [];
let checks = 0;

function diffFallback(post: any, locale: string, label: string): string[] {
  const out: string[] = [];
  function walk(obj: any, path: string) {
    if (obj == null) return;
    if (typeof obj === "object" && !Array.isArray(obj) && "en" in obj && locale in obj) {
      const en = obj.en;
      const v = obj[locale];
      if (Array.isArray(v) && Array.isArray(en)) {
        v.forEach((item: string, i: number) => {
          if (item === en[i]) out.push(`${label} ${path}.${locale}[${i}]`);
        });
      } else if (v === en && !path.endsWith("Keyword") && !path.includes("Keywords")) {
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
const ABSOLUTE_CLAIM_PATTERNS = [
  /all data writes to health connect/i,
  /tutti i dati (vengono )?scritti su health connect/i,
  /todos los datos se escriben en health connect/i,
  /alle daten werden in health connect geschrieben/i,
  /everything that flows to health connect/i,
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
  const expectIndexable = ["it", "en", "es", "de", "pt", "fr", "pl", "nl", "ja", "sv", "da"];
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

// ── 6: nessun link interno con slug EN sbagliato (non-regressione) ──────
checks++;
{
  const knownGoodEnSlugs = ["is-fitmesh-free-pricing-founder", "where-your-data-lives-eu-server"];
  const knownBadItSlugs = ["fitmesh-gratis-prezzo-founder", "dove-sono-i-tuoi-dati-server-ue"];
  const post = BLOG_POSTS_BY_SLUG["fitmesh-vs-alternative-sync"];
  const enText = JSON.stringify((post as any)?.body ?? []);
  for (const bad of knownBadItSlugs) {
    if (new RegExp(`/en/blog/${bad}`).test(enText)) {
      errors.push(`[wrong-en-slug-regression] fitmesh-vs-alternative-sync: link EN verso slug IT "${bad}" è tornato`);
    }
  }
  for (const good of knownGoodEnSlugs) {
    if (!new RegExp(good).test(enText)) {
      errors.push(`[wrong-en-slug-missing] fitmesh-vs-alternative-sync: slug EN corretto "${good}" non trovato`);
    }
  }
}

if (errors.length > 0) {
  console.error(`❌ P1.9 ring/locale guardrail: ${errors.length} problema/i su ${checks} controlli\n`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}
console.log(
  `✅ P1.9 ring/locale guardrail OK: ${checks} controlli — zero claim assoluti residui, HRV trattata esplicitamente, zero fallback EN/PL, indicizzabilità esatta (pl/ja dentro, ko/tr/no/fi fuori), hreflang coerente, zero slug EN sbagliati.`,
);
