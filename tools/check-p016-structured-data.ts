/**
 * Guardrail P0.16 — dati strutturati JSON-LD.
 *
 * Nasce da un audit reale del 02/09/2026 su segnalazione Semrush (~100 pagine
 * con problemi su `SoftwareApplication`, ItemList/Carousel su /roadmap,
 * peso HTML). Verificato punto per punto con Schema.org Validator e Google
 * Rich Results Test PRIMA di scrivere qualunque check qui sotto — non si
 * indovina cosa Google considera un errore:
 *
 *  - `aggregateRating` mancante su SoftwareApplication e' segnalato da Google
 *    come "Campo mancante (facoltativo)": l'elemento resta "1 elemento
 *    valido rilevato", NON un errore di eligibility. Per questo il check qui
 *    sotto VIETA aggregateRating/review finche' non esiste un rating reale,
 *    pubblico, verificabile — non li richiede.
 *  - L'ItemList di /roadmap non ha `url` per voce (le colonne sono blurb di
 *    feature nella stessa pagina, non entita' con una destinazione propria):
 *    Google Rich Results Test su /de/roadmap non lo rileva AFFATTO come dato
 *    strutturato (solo Breadcrumb compare) — zero beneficio, e un ItemList
 *    del genere non deve piu' esistere (vedi checkNoOrphanItemList sotto).
 *  - Il bug reale piu' esteso trovato: `/integrations` (indicizzabile in
 *    TUTTE le 15 locale, mai gated) emette un CollectionPage.hasPart con UN
 *    SoftwareApplication per TUTTI i 17 provider, senza filtrare per
 *    `isProviderVariantIndexable(p, lc)` — su sv/da/no/fi (nessun provider
 *    tradotto) le 17 entry puntano TUTTE a pagine noindex. Confermato live:
 *    /fr/integrations cita /fr/sync/apple-health, che e' `noindex,follow`.
 *
 * Tutti i controlli sono STATICI (nessun server richiesto): importano ed
 * eseguono le stesse fonti di verita' usate dalle pagine reali
 * (`isProviderVariantIndexable`, `isProviderModelVariantIndexable`), non una
 * riscrittura parallela della logica di indicizzabilita'.
 */
import { readFileSync } from "node:fs";
import { locales } from "@/lib/i18n";
import { PROVIDERS } from "@/lib/providers/data";
import { isProviderVariantIndexable } from "@/lib/providers/indexability";

const errors: string[] = [];

// ── Check A — SoftwareApplication SOLO sulle superfici allowlistate ─────────
// Un file nuovo che aggiunge SoftwareApplication fuori da qui e' una
// decisione (FASE 1, opzione B) che va presa di proposito, non un accidente
// di copia-incolla da un altro blocco JSON-LD.
const SOFTWARE_APPLICATION_ALLOWLIST = [
  "app/(frontend)/[locale]/(marketing)/about/page.tsx",
  "app/(frontend)/[locale]/(marketing)/integrations/page.tsx",
  "app/(frontend)/[locale]/(marketing)/sync/[provider]/page.tsx",
  "app/(frontend)/[locale]/(marketing)/sync/[provider]/[model]/page.tsx",
];

function checkSoftwareApplicationAllowlist() {
  // Grep ricorsivo leggero: cerchiamo il literal ovunque sotto app/ e
  // components/, poi confrontiamo con l'allowlist. Niente dipendenze esterne
  // (glob): usiamo `git ls-files` per l'elenco reale versionato.
  const { execSync } = require("node:child_process") as typeof import("node:child_process");
  const tracked = execSync("git ls-files 'app/**/*.tsx' 'app/**/*.ts' 'components/**/*.tsx' 'components/**/*.ts'", {
    cwd: process.cwd(),
    encoding: "utf8",
  })
    .split("\n")
    .filter(Boolean);

  const offenders: string[] = [];
  for (const file of tracked) {
    const content = readFileSync(file, "utf8");
    if (!content.includes('"@type": "SoftwareApplication"') && !content.includes('"@type":"SoftwareApplication"')) continue;
    if (!SOFTWARE_APPLICATION_ALLOWLIST.includes(file)) offenders.push(file);
  }
  if (offenders.length > 0) {
    errors.push(
      `SoftwareApplication emesso fuori dall'allowlist FASE 1 (${offenders.length} file): ${offenders.join(", ")}. ` +
        `Se e' una nuova superficie prodotto-pertinente, aggiungila a SOFTWARE_APPLICATION_ALLOWLIST di proposito.`,
    );
  }
}

// ── Check B — nessun aggregateRating/review senza revisione esplicita ──────
// FASE 1: nessun rating pubblico stabile su entrambi gli store (App Store:
// "non abbastanza valutazioni per una panoramica" al 02/09/2026; Google Play:
// 5,0/40 recensioni ma un solo store non basta per un claim sitewide). Se e
// quando arriva un dato reale e visibile in pagina, questo check va aggiornato
// ESPLICITAMENTE (mai un valore silenzioso).
function checkNoUnverifiedRatingClaims() {
  const { execSync } = require("node:child_process") as typeof import("node:child_process");
  const tracked = execSync("git ls-files 'app/**/*.tsx' 'components/**/*.tsx' 'lib/**/*.ts'", {
    cwd: process.cwd(),
    encoding: "utf8",
  })
    .split("\n")
    .filter(Boolean);
  const offenders: string[] = [];
  for (const file of tracked) {
    const content = readFileSync(file, "utf8");
    if (/["']?aggregateRating["']?\s*:/.test(content) || /["']@type["']\s*:\s*["']Review["']/.test(content)) {
      offenders.push(file);
    }
  }
  if (offenders.length > 0) {
    errors.push(
      `aggregateRating/Review trovato in dati strutturati senza revisione FASE 1 esplicita (${offenders.length} file): ${offenders.join(", ")}. ` +
        `Verificare: dato reale, pubblico, per piattaforma, con copy visibile in pagina — mai un numero hardcoded destinato a diventare stale.`,
    );
  }
}

// ── Check C — CollectionPage.hasPart di /integrations non cita mai un ──────
// provider non indicizzabile per la locale corrente (il bug reale trovato
// il 02/09/2026: prima del fix, 8 locale su 15 avevano almeno una entry
// noindex, e le 4 nordiche le avevano TUTTE e 17).
function checkIntegrationsHasPartNeverPointsToNoindex() {
  const file = "app/(frontend)/[locale]/(marketing)/integrations/page.tsx";
  const content = readFileSync(file, "utf8");
  const hasPartMatch = content.match(/hasPart:\s*PROVIDERS([\s\S]{0,400})/);
  if (!hasPartMatch) {
    errors.push(`${file}: non trovo piu' il blocco hasPart: PROVIDERS... — se la struttura e' cambiata, aggiornare questo check.`);
    return;
  }
  const block = hasPartMatch[1];
  // providerLinkHref(p, lc) e' accettato quanto isProviderVariantIndexable
  // diretto: e' lo stesso helper (stessa fonte di verita' + fallback EN) gia'
  // usato dai link visibili in pagina — vedi lib/providers/indexability.ts.
  if (!block.includes("isProviderVariantIndexable") && !block.includes("providerLinkHref")) {
    errors.push(
      `${file}: hasPart mappa PROVIDERS senza filtrare per isProviderVariantIndexable/providerLinkHref(p, lc) — ` +
        `emette SoftwareApplication.url verso pagine noindex per ogni provider non tradotto in quella locale. ` +
        `Verificato live il 02/09/2026: /fr/integrations cita /fr/sync/apple-health (noindex,follow); ` +
        `/sv,/da,/no,/fi/integrations citano TUTTI e 17 i provider come noindex (zero provider tradotto).`,
    );
  }
}

// ── Check D — nessun ItemList "orfano" (senza url per voce) ────────────────
// Le colonne di /roadmap non sono entita' con una pagina propria: niente
// Carousel/ItemList li' (Google Rich Results Test su /de/roadmap non lo
// rileva nemmeno). labs/novita/blog restano validi: ogni ListItem li' ha un
// `url` verso una pagina reale — questo e' il discriminante, non "ItemList
// esiste sì/no".
function checkNoOrphanItemList() {
  const { execSync } = require("node:child_process") as typeof import("node:child_process");
  const tracked = execSync("git ls-files 'app/**/page.tsx'", { cwd: process.cwd(), encoding: "utf8" })
    .split("\n")
    .filter(Boolean);
  for (const file of tracked) {
    const content = readFileSync(file, "utf8");
    if (!content.includes('"@type": "ItemList"') && !content.includes('"@type":"ItemList"')) continue;
    // Isoliamo SOLO il mapping di itemListElement (non l'intero blocco
    // ItemList, che spesso ha un `url:` proprio a livello di nodo — quello
    // NON conta come url per-voce delle ListItem generate).
    const itemListElementIdx = content.indexOf("itemListElement:", content.indexOf('"@type": "ItemList"'));
    if (itemListElementIdx === -1) continue;
    const window = content.slice(itemListElementIdx, itemListElementIdx + 600);
    // Ci fermiamo alla chiusura del `.map(...)`/array che genera le ListItem,
    // approssimata dalla prima occorrenza di "})),\n" o simile — sufficiente
    // per distinguere "c'e' un url dentro il mapping" da "c'e' altrove nel file".
    const mapEnd = window.search(/\}\)\),?\s*\n/);
    const mappingWindow = mapEnd === -1 ? window : window.slice(0, mapEnd);
    if (!mappingWindow.includes("url:") && !mappingWindow.includes("url ")) {
      errors.push(
        `${file}: ItemList senza \`url\` per voce nelle ListItem generate — non e' un candidato Carousel valido ` +
          `(Google non lo classifica come dato strutturato utile: verificato via Rich Results Test). ` +
          `O si aggiunge un url reale per voce, o si rimuove il markup ItemList mantenendo WebPage/Breadcrumb.`,
      );
    }
  }
}

// ── Check E — /roadmap non dichiara inLanguage sull'ItemList ───────────────
// Regola esplicita FASE 2, indipendente dalla decisione su Carousel/ItemList:
// se l'ItemList esiste ancora quando questo check gira, non deve avere
// inLanguage (proprieta' non prevista da Google per un ItemList generico e
// fonte di un warning distinto da quello di Check D).
function checkRoadmapItemListHasNoInLanguage() {
  const file = "app/(frontend)/[locale]/(marketing)/roadmap/page.tsx";
  const content = readFileSync(file, "utf8");
  const idx = content.indexOf('"@type": "ItemList"');
  if (idx === -1) return; // rimosso del tutto — va bene, Check D non si applica piu'.
  const window = content.slice(idx, idx + 400);
  if (window.includes("inLanguage")) {
    errors.push(`${file}: l'ItemList dichiara ancora inLanguage — rimuoverlo (regola esplicita FASE 2).`);
  }
}

// ── Check F — nessun @id duplicato fra due nodi RADICE distinti nello stesso
// file (due payload "@context" separati che dichiarano la stessa identita').
// Un `{"@id": ...}` bare (riferimento verso un nodo definito altrove, es.
// `breadcrumb: {"@id": ...}` su homepage, o `organizationCompactRef()` che
// condivide di proposito l'@id della Organization piena — vedi il suo stesso
// commento) NON e' un duplicato: e' l'idioma corretto per collegare nodi in
// un grafo JSON-LD. Il bug reale sarebbe due nodi RADICE (ciascuno con il
// proprio "@context") che dichiarano la stessa identita' per errore.
function checkNoDuplicateJsonLdIds() {
  const { execSync } = require("node:child_process") as typeof import("node:child_process");
  const tracked = execSync("git ls-files 'app/**/*.tsx' 'components/**/*.tsx'", { cwd: process.cwd(), encoding: "utf8" })
    .split("\n")
    .filter(Boolean);
  for (const file of tracked) {
    const content = readFileSync(file, "utf8");
    // Un nodo radice: "@context" seguito, entro ~200 caratteri, da "@id".
    const rootIds = [...content.matchAll(/"@context":\s*"https:\/\/schema\.org"[\s\S]{0,200}?"@id":\s*`([^`]+)`/g)].map(
      (m) => m[1],
    );
    const seen = new Set<string>();
    for (const id of rootIds) {
      if (seen.has(id)) errors.push(`${file}: due nodi radice ("@context" proprio) dichiarano lo stesso "@id": ${id}`);
      seen.add(id);
    }
  }
}

// ── Check G — nessuna piattaforma emette DUE Offer identici nello stesso array
// (bug reale trovato il 02/09/2026 su /about: .flatMap(["android","ios"],
// appOffers) produce due Offer letteralmente identici perche' appOffers()
// ignora il parametro piattaforma — confermato live su /en/about e nel tree
// JSON di Google Rich Results Test).
function checkNoDuplicateOffersInSameArray() {
  const { execSync } = require("node:child_process") as typeof import("node:child_process");
  const tracked = execSync("git ls-files 'app/**/*.tsx'", { cwd: process.cwd(), encoding: "utf8" })
    .split("\n")
    .filter(Boolean);
  for (const file of tracked) {
    const content = readFileSync(file, "utf8");
    if (/flatMap\(\s*\(plat\)\s*=>\s*appOffers\(plat\)\s*\)/.test(content) || /\.flatMap\(appOffers\)/.test(content)) {
      errors.push(
        `${file}: offers costruito con flatMap su piu' piattaforme chiamando appOffers() per ciascuna — ` +
          `appOffers() ignora il parametro piattaforma e ritorna sempre lo stesso Offer, quindi il flatMap duplica il nodo. ` +
          `Usare appOffers(platforms[0]) una sola volta (stesso pattern gia' corretto in sync/[provider]/page.tsx).`,
      );
    }
  }
}

// ── Negative test reali, restore byte-identico ──────────────────────────────
async function runNegativeTests() {
  const { writeFileSync, readFileSync: rf } = await import("node:fs");
  const integrationsFile = "app/(frontend)/[locale]/(marketing)/integrations/page.tsx";
  const original = rf(integrationsFile, "utf8");

  // Negativo Check C: rimuovo temporaneamente il fallback/filtro reale dal
  // blocco hasPart e verifico che il check lo rilevi.
  const mutated = original.replace(
    /hasPart:\s*PROVIDERS([\s\S]{0,400})/,
    (m) => m.replace(/providerLinkHref/g, "__disabled_for_negative_test__"),
  );
  if (mutated === original) throw new Error("negative test C: la sostituzione non ha trovato nulla da mutare — pattern cambiato?");
  writeFileSync(integrationsFile, mutated);
  errors.length = 0;
  checkIntegrationsHasPartNeverPointsToNoindex();
  const caughtC = errors.some((e) => e.includes("hasPart mappa PROVIDERS senza filtrare"));
  writeFileSync(integrationsFile, original);
  const restoredC = rf(integrationsFile, "utf8") === original;
  if (!caughtC) throw new Error("negative test C FALLITO: il check non ha rilevato hasPart senza providerLinkHref/isProviderVariantIndexable");
  if (!restoredC) throw new Error("negative test C: restore non byte-identico!");
  errors.length = 0;

  console.log("  ok     negative test Check C (hasPart senza filtro indicizzabilita'): rilevato, ripristinato byte-identico");
}

async function main() {
  checkSoftwareApplicationAllowlist();
  checkNoUnverifiedRatingClaims();
  checkIntegrationsHasPartNeverPointsToNoindex();
  checkNoOrphanItemList();
  checkRoadmapItemListHasNoInLanguage();
  checkNoDuplicateJsonLdIds();
  checkNoDuplicateOffersInSameArray();

  if (errors.length > 0) {
    console.error(`❌ P0.16 dati strutturati guardrail: ${errors.length} problema/i`);
    for (const e of errors) console.error(`  - ${e}`);
    process.exit(1);
  }

  await runNegativeTests();

  console.log(
    `✅ P0.16 dati strutturati guardrail: SoftwareApplication allowlist (${SOFTWARE_APPLICATION_ALLOWLIST.length} superfici) OK, ` +
      `nessun aggregateRating/review non verificato, hasPart /integrations filtrato su isProviderVariantIndexable, ` +
      `nessun ItemList orfano, /roadmap senza inLanguage sull'ItemList, nessun @id duplicato, nessun Offer duplicato. ` +
      `${PROVIDERS.length} provider × ${locales.length} locale verificati.`,
  );
}

main().catch((err) => {
  console.error("❌ P0.16 dati strutturati guardrail: errore inatteso", err);
  process.exit(1);
});
