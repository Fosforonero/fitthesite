/**
 * Guardrail P0.16 — dati strutturati JSON-LD.
 *
 * STORIA (per non ripetere gli stessi errori):
 *
 *  1. Audit reale del 02/09/2026 su segnalazione Semrush (~100 pagine con
 *     problemi su `SoftwareApplication`, ItemList/Carousel su /roadmap, peso
 *     HTML). Trovati e corretti 3 bug reali (hasPart verso noindex, Offer
 *     duplicato su /about, ItemList orfano su /roadmap).
 *
 *  2. MICRO-GATE P0.16-A: rettifica. La documentazione ufficiale Google
 *     (developers.google.com/search/docs/appearance/structured-data/software-app)
 *     elenca "Rating or review" fra le proprieta' REQUIRED per il rich
 *     result Software App — non facoltative (serve `aggregateRating` O
 *     `review`, non nessuno dei due). Le linee guida generali (.../sd-policies)
 *     sono esplicite: "Items that are missing required properties are not
 *     eligible for rich results." "1 elemento valido rilevato" nel Rich
 *     Results Test certifica l'assenza di errori di FORMATO, non l'idoneita'
 *     al rich result specifico — Google lo scrive a chiare lettere: "does
 *     not guarantee that your structured data will show up in search
 *     results, even if your page is marked up correctly". Nessun effetto
 *     diretto su indicizzazione o ranking organico in ogni caso.
 *
 *  3. MICRO-GATE P0.16-B: pulizia definitiva. Nessuno store (App Store: "non
 *     abbastanza valutazioni per una panoramica" al 02/09/2026; Google Play:
 *     5,0/40, ma un solo store non basta per un claim sitewide, e l'app e'
 *     anche iOS) da' oggi un rating pubblico, stabile e onestamente
 *     sitewide. `SoftwareApplication` (468 URL, 708 nodi) e
 *     `MobileApplication` (30 URL, 60 nodi — homepage + /beta) sono stati
 *     RIMOSSI dal sito, sostituiti da `WebPage`/riferimenti a `Organization`
 *     dove pertinente. Questo guardrail impedisce che tornino in massa senza
 *     i dati reali richiesti.
 *
 * Tutti i controlli sono STATICI (nessun server richiesto), salvo la sezione
 * facoltativa in fondo (gated da BASE_URL, stesso pattern di
 * check-seo-redirect-integrity.ts) che verifica live gli URL di hasPart.
 *
 * ═══════════════════════════════════════════════════════════════════════
 * CONVENZIONE per una FUTURA reintroduzione di SoftwareApplication/
 * MobileApplication (vedi PR #64 per il criterio completo):
 *   - richiede `name`, `offers` con un `price` reale, e ALMENO UNO fra
 *     `aggregateRating`/`review` — verificato dal Check A sotto;
 *   - il file NON puo' avere un segmento di route dinamico nel path
 *     (niente `[provider]`, `[model]`, `[slug]`, ...): solo un numero
 *     piccolo di pagine esplicitamente app-centriche, mai un tipo
 *     replicato su centinaia di pagine generate;
 *   - la property aggregateRating/review deve avere, entro 300 caratteri
 *     PRIMA di se stessa nel sorgente, un commento che contiene il marcatore
 *     letterale `RATING_SOURCE:` seguito da una spiegazione di dove il dato
 *     viene letto e con quale garanzia di aggiornamento — verificato dal
 *     Check B sotto. Nessun numero silenzioso.
 * ═══════════════════════════════════════════════════════════════════════
 */
import { readFileSync } from "node:fs";
import { execSync } from "node:child_process";
import { locales } from "@/lib/i18n";
import { PROVIDERS } from "@/lib/providers/data";

const errors: string[] = [];

function trackedFiles(patterns: string): string[] {
  return execSync(`git ls-files ${patterns}`, { cwd: process.cwd(), encoding: "utf8" })
    .split("\n")
    .filter(Boolean);
}

const APP_TYPE_RE = /"@type":\s*"(SoftwareApplication|MobileApplication)"/g;

// ── Check A — SoftwareApplication/MobileApplication: vietati in massa, ─────
// ammessi SOLO su una manciata di pagine statiche (path senza `[...]`) e SOLO
// con name + offers.price + almeno uno fra aggregateRating/review.
function checkNoIncompleteAppSchema() {
  const pageFiles = trackedFiles("'app/**/page.tsx'");
  for (const file of pageFiles) {
    const content = readFileSync(file, "utf8");
    const matches = [...content.matchAll(APP_TYPE_RE)];
    if (matches.length === 0) continue;

    const isDynamicRoute = file.includes("[");
    if (isDynamicRoute) {
      errors.push(
        `${file}: emette ${matches.map((m) => m[1]).join("/")} su una route dinamica — ` +
          `mai ammesso qui, indipendentemente dalle proprieta' presenti: una route con [...] genera ` +
          `una pagina per provider/modello/slug, cioe' esattamente la "massa" che questo check vieta.`,
      );
      continue;
    }

    for (const m of matches) {
      const idx = m.index ?? 0;
      const window = content.slice(idx, idx + 800);
      const hasOffersPrice = /offers[\s\S]{0,200}?price/.test(window);
      const hasRatingOrReview = /aggregateRating|"@type":\s*"Review"/.test(window);
      if (!hasOffersPrice || !hasRatingOrReview) {
        errors.push(
          `${file}: ${m[1]} senza tutte le proprieta' required (name sempre presente qui, ` +
            `offers.price: ${hasOffersPrice ? "OK" : "MANCANTE"}, aggregateRating/review: ${hasRatingOrReview ? "OK" : "MANCANTE"}) — ` +
            `non idoneo al rich result Software App per la documentazione ufficiale Google.`,
        );
      }
    }
  }

  // Anche i componenti condivisi (es. MobileApplicationJsonLd): il file puo'
  // definire il tipo (resta utile come snapshot per altri guardrail, vedi il
  // suo stesso commento), ma NESSUN page.tsx deve importarlo/montarlo.
  const componentUsers = pageFiles.filter((f) => {
    const c = readFileSync(f, "utf8");
    // Import reale o uso JSX, non un commento che ne parla (es. "rimosso in P0.16-B").
    return /import\s*\{[^}]*MobileApplicationJsonLd/.test(c) || /<MobileApplicationJsonLd\b/.test(c);
  });
  if (componentUsers.length > 0) {
    errors.push(
      `<MobileApplicationJsonLd> montato in ${componentUsers.length} pagina/e (${componentUsers.join(", ")}) — ` +
        `rimosso da tutte le pagine in P0.16-B (nodo senza aggregateRating/review). Se lo reintroduci, deve rispettare la stessa regola del Check A.`,
    );
  }
}

// ── Check B — aggregateRating/review richiedono un marcatore RATING_SOURCE
// entro 300 caratteri PRIMA di se stessi, altrimenti sono un numero
// silenzioso destinato a diventare stale senza che nessuno se ne accorga.
function checkRatingHasDocumentedSource() {
  const tracked = trackedFiles("'app/**/*.tsx' 'components/**/*.tsx' 'lib/**/*.ts'");
  for (const file of tracked) {
    const content = readFileSync(file, "utf8");
    const re = /aggregateRating\s*:|"@type":\s*"Review"/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(content))) {
      const before = content.slice(Math.max(0, m.index - 300), m.index);
      if (!before.includes("RATING_SOURCE:")) {
        errors.push(
          `${file}: aggregateRating/Review senza un commento con il marcatore "RATING_SOURCE:" nei 300 caratteri precedenti — ` +
            `documentare dove il dato viene letto e con quale garanzia di aggiornamento, o rimuoverlo se non verificato.`,
        );
      }
    }
  }
}

// ── Check C — CollectionPage.hasPart di /integrations usa WebPage, mai ─────
// SoftwareApplication, e resta filtrato sull'indicizzabilita' reale (bug
// originale P0.16: prima del fix, su sv/da/no/fi le 17 entry puntavano
// TUTTE a pagine noindex).
function checkIntegrationsHasPartUsesWebPage() {
  const file = "app/(frontend)/[locale]/(marketing)/integrations/page.tsx";
  const content = readFileSync(file, "utf8");
  const hasPartMatch = content.match(/hasPart:\s*PROVIDERS([\s\S]{0,500})/);
  if (!hasPartMatch) {
    errors.push(`${file}: non trovo piu' il blocco hasPart: PROVIDERS... — se la struttura e' cambiata, aggiornare questo check.`);
    return;
  }
  const block = hasPartMatch[1];
  if (!block.includes('"@type": "WebPage"') && !block.includes('"@type":"WebPage"')) {
    errors.push(`${file}: hasPart non usa "@type": "WebPage" — vedi P0.16-B, non deve tornare SoftwareApplication.`);
  }
  if (!block.includes("isProviderVariantIndexable") && !block.includes("providerLinkHref")) {
    errors.push(
      `${file}: hasPart mappa PROVIDERS senza filtrare per isProviderVariantIndexable/providerLinkHref(p, lc) — ` +
        `emetterebbe WebPage.url verso pagine noindex per ogni provider non tradotto in quella locale.`,
    );
  }
}

// ── Check D — nessun ItemList "orfano" (senza url per voce) ────────────────
function checkNoOrphanItemList() {
  const tracked = trackedFiles("'app/**/page.tsx'");
  for (const file of tracked) {
    const content = readFileSync(file, "utf8");
    if (!content.includes('"@type": "ItemList"') && !content.includes('"@type":"ItemList"')) continue;
    const itemListElementIdx = content.indexOf("itemListElement:", content.indexOf('"@type": "ItemList"'));
    if (itemListElementIdx === -1) continue;
    const window = content.slice(itemListElementIdx, itemListElementIdx + 600);
    const mapEnd = window.search(/\}\)\),?\s*\n/);
    const mappingWindow = mapEnd === -1 ? window : window.slice(0, mapEnd);
    if (!mappingWindow.includes("url:") && !mappingWindow.includes("url ")) {
      errors.push(
        `${file}: ItemList senza \`url\` per voce nelle ListItem generate — non e' un candidato Carousel valido. ` +
          `O si aggiunge un url reale per voce, o si rimuove il markup ItemList.`,
      );
    }
  }
}

// ── Check E — /roadmap non dichiara inLanguage sull'ItemList (se mai tornasse)
function checkRoadmapItemListHasNoInLanguage() {
  const file = "app/(frontend)/[locale]/(marketing)/roadmap/page.tsx";
  const content = readFileSync(file, "utf8");
  const idx = content.indexOf('"@type": "ItemList"');
  if (idx === -1) return;
  const window = content.slice(idx, idx + 400);
  if (window.includes("inLanguage")) {
    errors.push(`${file}: l'ItemList dichiara inLanguage — non previsto per un ItemList generico.`);
  }
}

// ── Check F — nessun @id duplicato fra due nodi RADICE distinti nello stesso
// file (un `{"@id": ...}` bare, riferimento verso un nodo definito altrove,
// NON e' un duplicato — e' l'idioma corretto per collegare nodi in un
// grafo JSON-LD, usato ora anche da AboutPage.mainEntity -> #organization
// e da homeLd.about -> #organization).
function checkNoDuplicateJsonLdIds() {
  const tracked = trackedFiles("'app/**/*.tsx' 'components/**/*.tsx'");
  for (const file of tracked) {
    const content = readFileSync(file, "utf8");
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
function checkNoDuplicateOffersInSameArray() {
  const tracked = trackedFiles("'app/**/*.tsx'");
  for (const file of tracked) {
    const content = readFileSync(file, "utf8");
    if (/flatMap\(\s*\(plat\)\s*=>\s*appOffers\(plat\)\s*\)/.test(content) || /\.flatMap\(appOffers\)/.test(content)) {
      errors.push(
        `${file}: offers costruito con flatMap su piu' piattaforme chiamando appOffers() per ciascuna — ` +
          `appOffers() ignora il parametro piattaforma e ritorna sempre lo stesso Offer, quindi il flatMap duplica il nodo.`,
      );
    }
  }
}

// ── Check H — nessun Product usato come workaround per aggirare i required
// di SoftwareApplication (name/offers/rating) mantenendo pero' la stessa
// funzione di "vendi un'app").
function checkNoProductWorkaround() {
  const tracked = trackedFiles("'app/**/page.tsx'");
  for (const file of tracked) {
    const content = readFileSync(file, "utf8");
    if (content.includes('"@type": "Product"') || content.includes('"@type":"Product"')) {
      errors.push(
        `${file}: usa "@type": "Product" — non presente prima di P0.16-B. Se e' un workaround per rappresentare ` +
          `l'app aggirando i required di SoftwareApplication (name/offers.price/rating), non farlo: la risposta a ` +
          `"non abbiamo un rating reale" e' non pubblicare il rich result, non cambiare tipo per aggirare la regola.`,
      );
    }
  }
}

// ── Negative test reali, restore byte-identico ──────────────────────────────
async function runNegativeTests() {
  const { writeFileSync, readFileSync: rf } = await import("node:fs");

  // Negativo Check A: reintrodurre SoftwareApplication su una route dinamica
  // (sync/[provider]) deve essere rilevato.
  const providerFile = "app/(frontend)/[locale]/(marketing)/sync/[provider]/page.tsx";
  const providerOriginal = rf(providerFile, "utf8");
  const providerMutated = providerOriginal.replace(
    '"@type": "WebPage",\n    name: `FitMesh Sync — ${p.name}`,',
    '"@type": "SoftwareApplication",\n    name: `FitMesh Sync — ${p.name}`,\n    offers: { price: "0" },\n    aggregateRating: { "@type": "AggregateRating", ratingValue: "5" },',
  );
  if (providerMutated === providerOriginal) throw new Error("negative test A: la sostituzione non ha trovato nulla da mutare — pattern cambiato?");
  writeFileSync(providerFile, providerMutated);
  errors.length = 0;
  checkNoIncompleteAppSchema();
  const caughtA = errors.some((e) => e.includes("route dinamica"));
  writeFileSync(providerFile, providerOriginal);
  const restoredA = rf(providerFile, "utf8") === providerOriginal;
  if (!caughtA) throw new Error("negative test A FALLITO: il check non ha rilevato SoftwareApplication su route dinamica");
  if (!restoredA) throw new Error("negative test A: restore non byte-identico!");
  errors.length = 0;
  console.log("  ok     negative test Check A (SoftwareApplication su route dinamica): rilevato, ripristinato byte-identico");

  // Negativo Check C: rimuovo temporaneamente il fallback/filtro reale dal
  // blocco hasPart e verifico che il check lo rilevi.
  const integrationsFile = "app/(frontend)/[locale]/(marketing)/integrations/page.tsx";
  const integrationsOriginal = rf(integrationsFile, "utf8");
  const integrationsMutated = integrationsOriginal.replace(
    /hasPart:\s*PROVIDERS([\s\S]{0,500})/,
    (m) => m.replace(/providerLinkHref/g, "__disabled_for_negative_test__"),
  );
  if (integrationsMutated === integrationsOriginal) throw new Error("negative test C: la sostituzione non ha trovato nulla da mutare — pattern cambiato?");
  writeFileSync(integrationsFile, integrationsMutated);
  errors.length = 0;
  checkIntegrationsHasPartUsesWebPage();
  const caughtC = errors.some((e) => e.includes("hasPart mappa PROVIDERS senza filtrare"));
  writeFileSync(integrationsFile, integrationsOriginal);
  const restoredC = rf(integrationsFile, "utf8") === integrationsOriginal;
  if (!caughtC) throw new Error("negative test C FALLITO: il check non ha rilevato hasPart senza providerLinkHref/isProviderVariantIndexable");
  if (!restoredC) throw new Error("negative test C: restore non byte-identico!");
  errors.length = 0;
  console.log("  ok     negative test Check C (hasPart senza filtro indicizzabilita'): rilevato, ripristinato byte-identico");

  // Negativo Check B: aggiungo un aggregateRating senza marcatore RATING_SOURCE.
  const aboutFile = "app/(frontend)/[locale]/(marketing)/about/page.tsx";
  const aboutOriginal = rf(aboutFile, "utf8");
  const aboutMutated = aboutOriginal.replace(
    "mainEntity: { \"@id\": `${SITE_URL}#organization` },",
    'mainEntity: { "@id": `${SITE_URL}#organization`, aggregateRating: { ratingValue: "5" } },',
  );
  if (aboutMutated === aboutOriginal) throw new Error("negative test B: la sostituzione non ha trovato nulla da mutare — pattern cambiato?");
  writeFileSync(aboutFile, aboutMutated);
  errors.length = 0;
  checkRatingHasDocumentedSource();
  const caughtB = errors.some((e) => e.includes("RATING_SOURCE"));
  writeFileSync(aboutFile, aboutOriginal);
  const restoredB = rf(aboutFile, "utf8") === aboutOriginal;
  if (!caughtB) throw new Error("negative test B FALLITO: il check non ha rilevato aggregateRating senza RATING_SOURCE");
  if (!restoredB) throw new Error("negative test B: restore non byte-identico!");
  errors.length = 0;
  console.log("  ok     negative test Check B (aggregateRating senza RATING_SOURCE): rilevato, ripristinato byte-identico");
}

// ── Sezione live opzionale (gated da BASE_URL, stesso pattern di
// check-seo-redirect-integrity.ts): verifica che gli URL citati in hasPart
// siano davvero 200/indicizzabili/self-canonical.
async function runLiveChecks(baseUrl: string) {
  const { providerLinkHref } = await import("@/lib/providers/indexability");
  const allHrefs = new Set<string>();
  for (const lc of locales) {
    for (const p of PROVIDERS) {
      const href = providerLinkHref(p, lc);
      if (href) allHrefs.add(href);
    }
  }
  const hrefs = [...allHrefs];
  let i = 0;
  async function worker() {
    while (i < hrefs.length) {
      const href = hrefs[i++];
      const res = await fetch(`${baseUrl}${href}`, { redirect: "manual" });
      if (res.status !== 200) {
        errors.push(`live: ${href} -> status ${res.status} (atteso 200 diretto)`);
        continue;
      }
      const html = await res.text();
      if (/<meta name="robots"[^>]*noindex/i.test(html)) {
        errors.push(`live: ${href} -> noindex`);
        continue;
      }
      const canonicalMatch = html.match(/<link rel="canonical" href="([^"]+)"/);
      if (!canonicalMatch || canonicalMatch[1] !== `${baseUrl.replace(/:\d+$/, "")}${href}` && canonicalMatch[1] !== `https://www.fitmesh.fit${href}`) {
        errors.push(`live: ${href} -> canonical non self ("${canonicalMatch?.[1]}")`);
      }
    }
  }
  await Promise.all(Array.from({ length: 8 }, () => worker()));
  console.log(`  ok     live check hasPart (${hrefs.length} URL uniche verso ${baseUrl}): tutte 200/indicizzabili/self-canonical`);
}

async function main() {
  checkNoIncompleteAppSchema();
  checkRatingHasDocumentedSource();
  checkIntegrationsHasPartUsesWebPage();
  checkNoOrphanItemList();
  checkRoadmapItemListHasNoInLanguage();
  checkNoDuplicateJsonLdIds();
  checkNoDuplicateOffersInSameArray();
  checkNoProductWorkaround();

  if (errors.length > 0) {
    console.error(`❌ P0.16 dati strutturati guardrail: ${errors.length} problema/i`);
    for (const e of errors) console.error(`  - ${e}`);
    process.exit(1);
  }

  await runNegativeTests();

  const BASE_URL = process.env.BASE_URL;
  if (BASE_URL) {
    await runLiveChecks(BASE_URL);
    if (errors.length > 0) {
      console.error(`❌ P0.16 dati strutturati guardrail (live): ${errors.length} problema/i`);
      for (const e of errors) console.error(`  - ${e}`);
      process.exit(1);
    }
  }

  console.log(
    `✅ P0.16 dati strutturati guardrail: nessun SoftwareApplication/MobileApplication incompleto o su route dinamica, ` +
      `nessun aggregateRating/review senza RATING_SOURCE, hasPart /integrations su WebPage filtrato su indicizzabilita' reale, ` +
      `nessun ItemList orfano, nessun @id duplicato, nessun Offer duplicato, nessun Product-come-workaround.` +
      (BASE_URL ? ` Live contro ${BASE_URL}: OK.` : ` (BASE_URL non impostata: controlli live saltati, non dichiarati verdi.)`),
  );
}

main().catch((err) => {
  console.error("❌ P0.16 dati strutturati guardrail: errore inatteso", err);
  process.exit(1);
});
