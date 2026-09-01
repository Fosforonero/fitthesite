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
 *
 * Eseguito con: npx tsx tools/check-p19a-funnel-module.ts
 */
import fs from "node:fs";
import path from "node:path";

import { BLOG_POSTS } from "../lib/blog/data";
import { CONTENT_CLUSTERS } from "../lib/analytics/cta";
import type { BlogSection } from "../lib/blog/types";

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
// Debito NOTO, già trovato e segnalato durante lo sprint P1.9 (2026-09-01),
// proposto come P0 separato — NON corretto qui per istruzione esplicita
// ("non correggerlo silenziosamente dentro P1.9"). Questo allowlist
// documenta ESATTAMENTE dove vive oggi, cosi' una regressione nuova altrove
// fa fallire il gate invece di sparire nel rumore.
const STRAVA_LIVE_KNOWN_DEBT: Array<{ file: string; note: string }> = [
  { file: "lib/providers/data.ts", note: "status: \"live\" per Strava (provider entry + badge pubblico su /sync/strava e /integrations)" },
  { file: "lib/content/fitness-data-sync-copy.ts", note: "IntegrationStatus \"live\" nella matrice di compatibilità" },
  { file: "lib/content/about-copy.ts", note: "Strava elencato in \"Supportati nativamente\"" },
  { file: "lib/llms-txt.ts", note: "\"Strava read is live via OAuth\" su /llms.txt" },
  { file: "lib/blog/posts/alternative-app-sync-wearable-2026.ts", note: "\"OAuth già attivo\"/\"live OAuth ... already active\" per Strava" },
  { file: "lib/blog/posts/google-health-google-fit.ts", note: "sezione 'Quando FitMesh può aggiungere valore': lettura Strava 'già attiva via OAuth' + flusso di scrittura descritto come funzionante — errore fattuale grave, proposto come P0 separato" },
];
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
  const allowlistRel = new Set(STRAVA_LIVE_KNOWN_DEBT.map((d) => d.file));
  const scanDirs = ["app", "components", "lib"];
  for (const dir of scanDirs) {
    const dirPath = path.join(ROOT, dir);
    if (!fs.existsSync(dirPath)) continue;
    for (const file of walkSourceFiles(dirPath)) {
      const rel = path.relative(ROOT, file).split(path.sep).join("/");
      const content = fs.readFileSync(file, "utf8");
      if (STRAVA_NUMERIC_LIMIT.test(content)) {
        errors.push(`[strava-numeric-limit] ${rel}: limite numerico Strava pubblicato — VIETATO in ogni caso, nessun allowlist`);
      }
      if (STRAVA_GENERAL_AVAILABILITY.test(content) && !allowlistRel.has(rel)) {
        errors.push(`[strava-general-availability-NEW] ${rel}: nuova occorrenza di Strava presentata come disponibile in generale, fuori dall'allowlist del debito noto`);
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

if (errors.length > 0) {
  console.error(`❌ P1.9 funnel module guardrail: ${errors.length} problema/i su ${checks} controlli\n`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}
console.log(
  `✅ P1.9 funnel module guardrail OK: ${checks} controlli — struttura CTA (no duplicati, no CTA-prima-risposta, ≤3 benefici, content_cluster valido), CTA sempre store-aware/tracciata, payload GA4 chiuso, zero overclaim/denigrazione nel modulo, Strava debito noto invariato (nessuna nuova occorrenza), icona Reddit presente con testo sempre visibile e URL/target/rel invariati.`,
);
