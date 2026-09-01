/**
 * Guardrail permanente SPRINT P1.9 FASE 8 — modulo editoriale FitMesh
 * (`fitmesh-editorial-cta`, lib/blog/types.ts) e igiene del funnel
 * SEO->installazione introdotto in questo sprint.
 *
 * Copre, con negative test reali documentati in
 * docs/seo/p19a-funnel-guardrail-negative-tests.md:
 *  1. una sola CTA per placement per post (no duplicazione);
 *  2. nessun blocco fitmesh-editorial-cta prima del primo heading
 *     dell'articolo (euristica strutturale per "non prima della risposta" —
 *     non puo' verificare la semantica, ma impedisce il caso ovvio: zero
 *     sezioni di contenuto prima della CTA);
 *  3. al massimo 3 benefici (it/en, i soli campi obbligatori);
 *  4. contentCluster nel vocabolario chiuso CONTENT_CLUSTERS;
 *  5. ogni CTA store-aware ha SEMPRE tracking (per costruzione: usa sempre
 *     StoreButtonsRow, che emette sempre data-cta-id/data-cta-placement/
 *     data-cta-target-type — controllato qui a livello di renderer, non
 *     solo di tipo, rileggendo il sorgente di BlogRenderer.tsx);
 *  6. payload vietati: nessuna chiave GA4 fuori dal vocabolario dichiarato
 *     (dato sanitario, email, UUID/user_id/device_id, token, testo libero,
 *     query) — scansione statica delle chiamate gtag() in OutboundTracker.tsx;
 *  7. overclaim FitMesh: nessuna formula di certezza assoluta dentro un
 *     blocco fitmesh-editorial-cta (IT/EN, i campi obbligatori);
 *  8. comparazioni denigratorie: nessuna formula "peggio di/inferiore a" +
 *     nome di un brand concorrente dentro un blocco fitmesh-editorial-cta;
 *  9. Strava presentata come disponibile in generale o con limite numerico
 *     pubblicato — scan repo-wide (app/, components/, lib/, esclude tools/)
 *     con un allowlist esplicito e documentato del debito NOTO e GIA'
 *     segnalato (proposto come P0 separato, non corretto in questo sprint:
 *     vedi il report P1.9). Qualunque nuova occorrenza fuori
 *     dall'allowlist fa fallire il gate;
 * 10. icona/link Reddit: icona ufficiale presente E testo visibile sempre
 *     accompagnante (mai icon-only), URL identico tra footer/support/
 *     JSON-LD sameAs (nessuna divergenza), stesso data-cta-placement/rel/
 *     target di sempre (nessuna regressione di tracking o comportamento).
 * 11. parità locale del modulo: nessuna locale in cui l'articolo è
 *     indicizzabile (overlay nordico incluso) può lasciare il blocco
 *     fitmesh-editorial-cta privo di traduzione — fallback EN altrimenti
 *     silenzioso, mai dichiarato da un marcatore (quello esiste solo per
 *     `secondaryHref`, non per title/body/benefits/secondaryLabel).
 * 12. unicità intra-pagina di `data-cta-id`: nessuna pagina-post può
 *     renderizzare due elementi con lo stesso `data-cta-id` calcolato — la
 *     dedup di OutboundTracker (`cta_view`, chiave `data-cta-id` scoperta
 *     per page-view) collasserebbe due CTA semanticamente diverse in una
 *     sola impression se mai accadesse. Verificato sull'unione dei due tipi
 *     che possono emettere `data-cta-id` nel corpo di un post ("cta" legacy
 *     + "fitmesh-editorial-cta"), con la STESSA derivazione usata a runtime
 *     (`storeButtonsCtaId`/BlogRenderer.tsx) — non una reimplementazione.
 *
 * Eseguito con: npx tsx tools/check-p19a-funnel-module.ts
 */
import fs from "node:fs";
import path from "node:path";

import { BLOG_POSTS } from "../lib/blog/data";
import { CONTENT_CLUSTERS, CTA_PLACEMENTS, storeButtonsCtaId } from "../lib/analytics/cta";
import type { BlogSection } from "../lib/blog/types";
import { applyNordicOverlay, type NordicOverlay } from "../lib/blog/nordic-overlay";
import { isBlogVariantIndexable } from "../lib/blog/indexability";
import { locales } from "../lib/i18n";
import nordicOverlayJson from "../lib/blog/nordic-overlay.json";

const ROOT = path.resolve(__dirname, "..");
let errors: string[] = [];
let checks = 0;

function read(relPath: string): string {
  return fs.readFileSync(path.join(ROOT, relPath), "utf8");
}

// ── 1-4: struttura dei blocchi fitmesh-editorial-cta nei post ────────────
for (const post of BLOG_POSTS) {
  const withIndex = post.body.map((s, i) => ({ s, i }));
  const ctaBlocks = withIndex.filter(
    (x): x is { s: Extract<BlogSection, { type: "fitmesh-editorial-cta" }>; i: number } =>
      x.s.type === "fitmesh-editorial-cta",
  );
  if (ctaBlocks.length === 0) continue;
  checks++;

  const firstHeadingIndex = post.body.findIndex((s) => s.type === "heading");
  const seenPlacements = new Set<string>();

  for (const { s, i } of ctaBlocks) {
    if (seenPlacements.has(s.placement)) {
      errors.push(
        `[duplicate-placement] ${post.slug}: più di un blocco fitmesh-editorial-cta con placement="${s.placement}"`,
      );
    }
    seenPlacements.add(s.placement);

    if (firstHeadingIndex !== -1 && i < firstHeadingIndex) {
      errors.push(
        `[cta-before-answer] ${post.slug}: fitmesh-editorial-cta all'indice ${i} del body, prima del primo heading (indice ${firstHeadingIndex}) — sembra precedere qualunque contenuto`,
      );
    }

    for (const lc of ["it", "en"] as const) {
      const list = s.benefits?.[lc];
      if (list && list.length > 3) {
        errors.push(`[benefits-max-3] ${post.slug} (${lc}): ${list.length} benefici dichiarati, il mandato ne consente al massimo 3`);
      }
    }

    if (!(Object.values(CONTENT_CLUSTERS) as string[]).includes(s.contentCluster)) {
      errors.push(`[unknown-content-cluster] ${post.slug}: contentCluster "${s.contentCluster}" non è nel vocabolario CONTENT_CLUSTERS`);
    }
  }
}

// ── 5: CTA primaria sempre store-aware e tracciata per costruzione ───────
checks++;
{
  const renderer = read("components/blog/BlogRenderer.tsx");
  const caseBlock = renderer.split('case "fitmesh-editorial-cta"')[1]?.split('case "flow-diagram"')[0] ?? "";
  if (!caseBlock.includes("<StoreButtonsRow")) {
    errors.push(`[no-store-cta] il case "fitmesh-editorial-cta" in BlogRenderer.tsx non usa più <StoreButtonsRow> come CTA primaria`);
  }
  if (!caseBlock.includes("data-cta-content-cluster")) {
    errors.push(`[no-content-cluster-attr] il case "fitmesh-editorial-cta" non dichiara data-cta-content-cluster sul wrapper`);
  }
}

// ── 6: payload GA4 — nessuna chiave fuori dal vocabolario dichiarato ─────
checks++;
{
  const ALLOWED_GTAG_KEYS = new Set([
    "cta_id",
    "cta_placement",
    "cta_location",
    "placement",
    "path",
    "page_path",
    "locale",
    "store_destination",
    "store_platform",
    "link_url",
    "campaign",
    "content_cluster",
    "target_type",
    "platform",
    "mode",
  ]);
  const tracker = read("components/OutboundTracker.tsx");
  const gtagCalls = [...tracker.matchAll(/gtag\("event",\s*"[a-z_]+",\s*\{([^}]*)\}/gs)];
  for (const call of gtagCalls) {
    const body = call[1];
    const keys = [...body.matchAll(/^\s*([a-zA-Z_]+):/gm)].map((m) => m[1]);
    for (const key of keys) {
      if (!ALLOWED_GTAG_KEYS.has(key)) {
        errors.push(`[forbidden-payload-key] OutboundTracker.tsx emette la chiave "${key}", non nel vocabolario dichiarato FASE 6`);
      }
    }
  }
}

// ── 7-8: overclaim / denigrazione dentro i blocchi fitmesh-editorial-cta ─
const OVERCLAIM_PATTERNS =
  /\b(sempre funziona|garantiamo|garantito al 100%|zero problemi|mai un errore|perfetto|infallibile|always works|we guarantee|100% reliable|never fails|flawless|foolproof)\b/i;
const DENIGRATION_PATTERNS =
  /\b(peggio di|inferiore a|non funziona come|scadente rispetto a|worse than|inferior to|doesn'?t work as well as|subpar compared to)\b.{0,30}\b(samsung|google|apple|garmin)\b/i;

for (const post of BLOG_POSTS) {
  for (const s of post.body) {
    if (s.type !== "fitmesh-editorial-cta") continue;
    checks++;
    for (const lc of ["it", "en"] as const) {
      const text = `${s.title[lc]} ${s.body[lc]} ${(s.benefits?.[lc] ?? []).join(" ")}`;
      if (OVERCLAIM_PATTERNS.test(text)) {
        errors.push(`[overclaim] ${post.slug} (${lc}): formula di certezza assoluta nel modulo editoriale`);
      }
      if (DENIGRATION_PATTERNS.test(text)) {
        errors.push(`[denigration] ${post.slug} (${lc}): comparazione denigratoria verso un concorrente nel modulo editoriale`);
      }
    }
  }
}

// ── 9: Strava — disponibilità generale / limite numerico pubblicato ─────
// MICRO-GATE P1.9-A FASE 2 (2026-09-01) — il debito sotto era stato trovato
// e deliberatamente NON corretto in P1.9 ("proposto come P0 separato"): quel
// P0 è stato risolto in questa stessa fase (status Strava → "limited-beta"
// in lib/providers/data.ts e lib/content/fitness-data-sync-copy.ts, testo
// riscritto in lib/llms-txt.ts, lib/blog/posts/alternative-app-sync-
// wearable-2026.ts, lib/blog/posts/google-health-google-fit.ts). Verificato
// con questo stesso pattern che tutti e 6 i file ex-allowlist sono ora puliti
// (zero match), quindi l'allowlist è stata rimossa: il controllo è ora a
// tolleranza zero su tutto il repo, nessuna eccezione. Il guardrail
// sitewide più ampio (numeric-limit / approval-timeline / general-
// availability, con guardia di negazione) vive in
// tools/check-llms-consistency.ts; questo resta un secondo strato più
// stretto e mirato allo stesso rischio.
const STRAVA_GENERAL_AVAILABILITY = /strava[^.]{0,80}(già attiva|already active|is live|live via oauth|disponibile ora|available now)/i;
const STRAVA_NUMERIC_LIMIT = /\b10\s*(atlet[ei]|athletes?)\b/i;

function walkSourceFiles(dir: string, out: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "tools" || entry.name === "node_modules" || entry.name.startsWith(".")) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkSourceFiles(full, out);
    else if (/\.(ts|tsx)$/.test(entry.name)) out.push(full);
  }
  return out;
}

checks++;
{
  const scanDirs = ["app", "components", "lib"];
  for (const dir of scanDirs) {
    const dirPath = path.join(ROOT, dir);
    if (!fs.existsSync(dirPath)) continue;
    for (const file of walkSourceFiles(dirPath)) {
      const rel = path.relative(ROOT, file).split(path.sep).join("/");
      const content = fs.readFileSync(file, "utf8");
      if (STRAVA_NUMERIC_LIMIT.test(content)) {
        errors.push(`[strava-numeric-limit] ${rel}: limite numerico Strava pubblicato — VIETATO in ogni caso, nessuna eccezione`);
      }
      if (STRAVA_GENERAL_AVAILABILITY.test(content)) {
        errors.push(`[strava-general-availability] ${rel}: Strava presentata come disponibile in generale — VIETATO in ogni caso, nessuna eccezione (stato reale: limited-beta)`);
      }
    }
  }
}

// ── 10: Reddit — icona presente, testo sempre visibile, coerenza URL/sameAs ─
checks++;
{
  const productFacts = read("lib/product-facts.ts");
  const redditUrlMatch = productFacts.match(/REDDIT_URL\s*=\s*"([^"]+)"/);
  const redditUrl = redditUrlMatch?.[1];
  if (!redditUrl) {
    errors.push(`[reddit-url-missing] REDDIT_URL non trovata in lib/product-facts.ts`);
  } else {
    const orgJsonLd = read("components/seo/OrganizationJsonLd.tsx");
    if (!orgJsonLd.includes("REDDIT_URL")) {
      errors.push(`[reddit-sameas-divergence] OrganizationJsonLd.tsx non referenzia più la stessa costante REDDIT_URL — rischio di divergenza fra sameAs e URL visibile`);
    }
    const footer = read("components/Footer.tsx");
    const support = read('app/(frontend)/[locale]/(marketing)/support/page.tsx');
    for (const [label, src] of [["Footer.tsx", footer], ["support/page.tsx", support]] as const) {
      if (!/community|r\/FitMesh/i.test(src)) {
        errors.push(`[reddit-icon-only] ${label}: nessun testo visibile trovato vicino al link Reddit — l'icona non deve mai essere l'unico indicatore del link`);
      }
      if (!src.includes("RedditIcon")) {
        errors.push(`[reddit-icon-missing] ${label}: RedditIcon non importato/usato — il mandato richiede l'icona ufficiale, non solo testo`);
      }
      if (!src.includes(`href={REDDIT_URL}`)) {
        errors.push(`[reddit-url-changed] ${label}: il link non usa più la costante REDDIT_URL condivisa — rischio di URL diverso da quello canonico`);
      }
      if (!/target="_blank"/.test(src) || !/rel="noopener noreferrer"/.test(src)) {
        errors.push(`[reddit-target-rel-changed] ${label}: target/rel del link Reddit non sono più quelli attesi (target="_blank" rel="noopener noreferrer")`);
      }
    }
  }
  const iconFile = path.join(ROOT, "components/RedditIcon.tsx");
  if (!fs.existsSync(iconFile)) {
    errors.push(`[reddit-icon-component-missing] components/RedditIcon.tsx non esiste`);
  } else {
    const iconSrc = fs.readFileSync(iconFile, "utf8");
    if (!iconSrc.includes('aria-hidden="true"')) {
      errors.push(`[reddit-icon-not-decorative] RedditIcon.tsx non è aria-hidden — il nome accessibile del link deve venire dal testo, non dall'icona`);
    }
    if (!/viewBox="0 0 24 24"/.test(iconSrc)) {
      errors.push(`[reddit-icon-viewbox] RedditIcon.tsx: viewBox alterato rispetto all'originale 1:1 — rischio di distorsione della forma`);
    }
  }
}

// ── 11: parità locale del modulo — nessun fallback EN silenzioso ────────
// ADDENDUM P1.9 (2026-09-01): `walkPost`/`walkSection` (nordic-overlay.ts)
// non hanno un case per "fitmesh-editorial-cta" — il modulo NON è coperto
// dall'overlay nordico, quindi la sua indicizzabilità nel `switch` di
// `isPostLocaleComplete` è indipendente dalle proprie traduzioni. Trovato
// perché health-connect-not-syncing e garmin-samsung-health-sync-guide
// erano già indicizzabili in sv/da (overlay applicato su hero/body/faq)
// mentre il blocco CTA aggiunto in questo sprint aveva solo it/en/es/de/
// pt/fr/pl/tr/nl/ja/ko: sv/da mostravano il modulo in inglese dentro una
// pagina altrimenti completamente tradotta — nessun marcatore "(EN)" lo
// segnalava (quel marcatore copre solo `secondaryHref`, non title/body/
// benefits/secondaryLabel). Confrontare sempre con l'articolo DOPO overlay
// (mai BLOG_POSTS grezzo): un audit ad-hoc che lo saltò produsse un
// conteggio artificialmente basso (7/11 invece di 9/13) letto come
// possibile regressione — non lo era, ma l'indagine ha scoperto questo
// problema reale e distinto, ora corretto e guardato qui in permanenza.
checks++;
{
  const overlaidPosts = BLOG_POSTS.map((p) => {
    const clone = structuredClone(p);
    applyNordicOverlay(clone, nordicOverlayJson as NordicOverlay);
    return clone;
  });

  for (const post of overlaidPosts) {
    for (const s of post.body) {
      if (s.type !== "fitmesh-editorial-cta") continue;
      const indexableLocales = locales.filter((lc) => isBlogVariantIndexable(post, lc));
      const ctaLocales = new Set(
        (Object.keys(s.title) as (keyof typeof s.title)[]).filter((lc) => s.title[lc]),
      );
      for (const lc of indexableLocales) {
        if (!ctaLocales.has(lc)) {
          errors.push(
            `[cta-locale-gap] ${post.slug} (${lc}): l'articolo è indicizzabile in questa locale ma il modulo fitmesh-editorial-cta non ha una traduzione — cadrebbe in fallback EN silenzioso senza marcatore`,
          );
        }
      }
    }
  }
}

// ── 12: unicità intra-pagina di data-cta-id (no doppia semantica sotto lo stesso id) ─
checks++;
{
  type IdSource = { id: string; from: string };
  for (const post of BLOG_POSTS) {
    const ids: IdSource[] = [];
    for (const s of post.body) {
      if (s.type === "cta") {
        // ctaId/ctaPlacement sono opzionali (P1.4B): quando assenti React
        // omette del tutto l'attributo, quindi l'elemento non compare mai
        // sotto il selettore `[data-cta-id]` di OutboundTracker — includerlo
        // qui produrrebbe un falso positivo ("undefined" contro "undefined").
        if (s.ctaId != null) ids.push({ id: s.ctaId, from: `cta legacy (placement="${s.ctaPlacement}")` });
      }
      if (s.type === "fitmesh-editorial-cta") {
        const placementValue =
          s.placement === "after_solution"
            ? CTA_PLACEMENTS.blogEditorialAfterSolution
            : CTA_PLACEMENTS.blogEditorialArticleEnd;
        ids.push({
          id: storeButtonsCtaId(placementValue),
          from: `fitmesh-editorial-cta primaria (placement="${s.placement}", cluster="${s.contentCluster}")`,
        });
        if (s.secondaryHref && s.secondaryLabel) {
          ids.push({
            id: `${placementValue}__secondary__${s.contentCluster}`,
            from: `fitmesh-editorial-cta secondaria (placement="${s.placement}", cluster="${s.contentCluster}")`,
          });
        }
      }
    }
    const seen = new Map<string, string>();
    for (const { id, from } of ids) {
      const prior = seen.get(id);
      if (prior) {
        errors.push(
          `[cta-id-collision] ${post.slug}: data-cta-id="${id}" condiviso da [${prior}] e [${from}] — OutboundTracker li tratterebbe come la stessa CTA`,
        );
      } else {
        seen.set(id, from);
      }
    }
  }
}

if (errors.length > 0) {
  console.error(`❌ P1.9 funnel module guardrail: ${errors.length} problema/i su ${checks} controlli\n`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}
console.log(
  `✅ P1.9 funnel module guardrail OK: ${checks} controlli — struttura CTA (no duplicati, no CTA-prima-risposta, ≤3 benefici, content_cluster valido), CTA sempre store-aware/tracciata, payload GA4 chiuso, zero overclaim/denigrazione nel modulo, Strava a tolleranza zero su disponibilità generale/limite numerico (debito P0 risolto in MICRO-GATE P1.9-A FASE 2, nessuna eccezione residua), icona Reddit presente con testo sempre visibile e URL/target/rel invariati, zero locale indicizzabili (overlay nordico incluso) prive di traduzione del modulo editoriale, zero collisioni intra-pagina di data-cta-id.`,
);
