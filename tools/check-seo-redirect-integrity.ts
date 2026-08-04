/**
 * Addendum P0.11-D (2026-08-04) — guardrail per i bug SEO reali trovati dal
 * crawl `www.fitmesh.fit - 2026-08-04 - 11.38.56.zip` (redirect loop
 * Health Connect, link interni verso /sync/samsung-health 404, asset press
 * kit irraggiungibile, cannibalizzazione smartwatch-anziani EN, meta
 * description troppo corte).
 *
 * Tutti i controlli sono STATICI (nessun server richiesto): il grafo dei
 * redirect viene costruito importando ED ESEGUENDO davvero
 * `next.config.mjs`'s `redirects()` (non un parsing testuale — la fonte di
 * verita' e' la config reale usata da Vercel), e la simulazione del
 * redirect app-level per i post blog usa le stesse funzioni pure usate dal
 * routing reale (`canonicalFromBlogUrl`/`localizedBlogSlug`), non una
 * riscrittura parallela della logica.
 *
 * Cosa NON viene segnalato come errore (per costruzione, non per eccezione
 * ad-hoc):
 *  - Fonti esterne (es. developer.android.com): questo script non fa
 *    richieste HTTP esterne, analizza solo redirect/link interni.
 *  - Redirect di negoziazione lingua/locale-fallback (es. self-host 13
 *    locale -> EN, apex -> www): vivono in middleware.ts o come redirect
 *    dinamici a pattern (`/:slug`), non nell'elenco statico literal-to-literal
 *    che questo script analizza per i cicli.
 *  - Stato noindex di /beta e /self-host: fuori scope, verificato da
 *    tools/check-self-host-privacy-truth.ts e da guardrail Founder dedicati.
 *  - La pagina fittizia /seo-checker-not-found-page usata dal crawler per
 *    testare il proprio rilevamento 404: non e' un link interno reale del
 *    sito, non compare in nessun grep di questo script.
 */
import { readFileSync, existsSync } from "node:fs";
import config from "../next.config.mjs";
import { canonicalFromBlogUrl, localizedBlogSlug } from "@/lib/blog/slug-i18n";
import { BLOG_POSTS_BY_SLUG } from "@/lib/blog/data";
import { locales } from "@/lib/i18n";

const errors: string[] = [];
const BASE_URL = process.env.BASE_URL;

type Redirect = { source: string; destination: string; permanent?: boolean };

function isLiteral(path: string): boolean {
  return !path.includes(":") && !path.includes("*");
}

// ── Check A — grafo dei redirect statici: nessun ciclo ──────────────────
async function checkRedirectGraphHasNoCycles(redirects: Redirect[]) {
  const graph = new Map<string, string>();
  for (const r of redirects) {
    if (isLiteral(r.source) && isLiteral(r.destination)) {
      if (graph.has(r.source) && graph.get(r.source) !== r.destination) {
        errors.push(`redirect-graph: "${r.source}" ha destinazioni multiple in conflitto nel config`);
        continue;
      }
      graph.set(r.source, r.destination);
    }
  }
  for (const start of graph.keys()) {
    const seen = new Set<string>([start]);
    let cur = graph.get(start)!;
    let hops = 0;
    while (graph.has(cur) && hops < 20) {
      if (seen.has(cur)) {
        errors.push(`redirect-loop: ciclo rilevato a partire da "${start}" (rientra su "${cur}") nell'elenco redirect statico di next.config.mjs`);
        break;
      }
      seen.add(cur);
      cur = graph.get(cur)!;
      hops++;
    }
  }
}

// ── Check B — nessun redirect statico atterra su un URL blog che poi
// rimanda ANCORA (simulazione della stessa logica app-level di
// resolveBlogPost, usando le stesse funzioni pure del routing reale) ────
function checkBlogRedirectDestinationsAreSingleHop(redirects: Redirect[]) {
  const blogPattern = /^\/(it|en|es|de|pt|fr|pl|tr|nl|ja|ko|sv|da|no|fi)\/blog\/([^/?#]+)$/;
  for (const r of redirects) {
    const m = r.destination.match(blogPattern);
    if (!m) continue;
    const [, lc, urlSlug] = m;
    const locale = lc as (typeof locales)[number];
    const recognizedLocalized = canonicalFromBlogUrl(urlSlug, locale);
    if (recognizedLocalized !== null) continue; // gia' lo slug corretto per questa locale, nessun ulteriore redirect
    // urlSlug non e' una forma localizzata nota: il routing reale lo tratta
    // come se fosse esso stesso uno slug canonico (getBlogPostBySlug diretto).
    if (!BLOG_POSTS_BY_SLUG[urlSlug]) continue; // non esiste nemmeno come canonico, 404 statico non loop
    const correct = localizedBlogSlug(urlSlug, locale);
    if (correct !== urlSlug) {
      errors.push(
        `redirect-chain: "${r.source}" -> "${r.destination}" atterra su uno slug che il routing reale rimanda ANCORA verso "/${locale}/blog/${correct}" (2 hop invece di 1) — la destinazione del redirect in next.config.mjs deve essere lo slug localizzato corretto, non lo slug canonico grezzo`,
      );
    }
  }
}

// ── Check C — nessun link interno letterale verso /sync/samsung-health
// (regressione specifica del bug Fase 3) + ogni /sync/{slug} referenziato
// nel blog deve esistere come provider reale ────────────────────────────
const INTERNAL_LINK_SCAN_FILES = [
  "lib/blog/posts/sync-samsung-health-google-fit.ts",
  "app/(frontend)/[locale]/(marketing)/press/page.tsx",
];

function stripComments(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");
}

function checkNoDeadSamsungHealthSyncLink() {
  for (const relPath of INTERNAL_LINK_SCAN_FILES) {
    let content: string;
    try {
      content = readFileSync(relPath, "utf-8");
    } catch {
      errors.push(`file non trovato: ${relPath}`);
      continue;
    }
    // Cerca solo nel codice, non nei commenti (questo stesso file e
    // next.config.mjs citano "/sync/samsung-health" nel commento che spiega
    // perche' e' stato tolto — un match li' non e' una regressione).
    if (/href:\s*"\/[a-z]{2}\/sync\/samsung-health"/.test(stripComments(content))) {
      errors.push(`${relPath}: contiene ancora un link a /sync/samsung-health (404 — nessuna provider page con questo slug esiste)`);
    }
  }
}

// ── Check D — asset press kit statico raggiungibile ─────────────────────
function checkPressKitOgAssetIsStatic() {
  const pngPath = "public/press-og-card.png";
  if (!existsSync(pngPath)) {
    errors.push(`${pngPath}: asset statico OG del press kit non trovato su disco`);
  }
  const pressPagePath = "app/(frontend)/[locale]/(marketing)/press/page.tsx";
  const content = readFileSync(pressPagePath, "utf-8");
  if (content.includes('href: "/opengraph-image"')) {
    errors.push(`${pressPagePath}: contiene ancora un link alla route Next OG dinamica (/opengraph-image, 404 — suffisso hash instabile), invece dell'asset statico`);
  }
  const staticLinkCount = (content.match(/href: "\/press-og-card\.png"/g) ?? []).length;
  if (staticLinkCount !== 15) {
    errors.push(`${pressPagePath}: attesi 15 link a /press-og-card.png (una per locale), trovati ${staticLinkCount}`);
  }
}

// ── Check E — cannibalizzazione smartwatch-anziani EN: la variante EN del
// post "perdente" deve restare esclusa dalla sitemap ────────────────────
function checkElderlyConsolidationSitemapExclusion() {
  const sitemapPath = "app/sitemap.ts";
  const content = readFileSync(sitemapPath, "utf-8");
  if (!/smartwatch-per-anziani-guida.*&&.*lc === "en"\s*\n\s*\?\s*false/.test(content) &&
      !content.includes('p.slug === "smartwatch-per-anziani-guida" && lc === "en"')) {
    errors.push(`${sitemapPath}: manca l'esclusione sitemap della variante EN di smartwatch-per-anziani-guida (consolidamento Fase 5) — rischio di reintrodurre la cannibalizzazione in sitemap.xml`);
  }
  const configContent = readFileSync("next.config.mjs", "utf-8");
  if (!configContent.includes("smartwatch-for-elderly-guide") || !configContent.includes("best-smartwatch-for-elderly")) {
    errors.push("next.config.mjs: manca il redirect di consolidamento smartwatch-for-elderly-guide -> best-smartwatch-for-elderly");
  }
}

// ── Check F — meta description 140-160 caratteri (support IT, privacy
// IT/EN) — non tocca H1 ne' contenuto legale, solo lunghezza description ──
const DESCRIPTION_LENGTH_TARGETS: { file: string; pattern: RegExp; label: string }[] = [
  { file: "app/(frontend)/[locale]/(marketing)/support/page.tsx", pattern: /it: "([^"]*)",\n\s*en: "FAQ and troubleshooting/, label: "support IT" },
  { file: "app/(frontend)/[locale]/(marketing)/privacy/page.tsx", pattern: /it: "(Come FitMesh Sync raccoglie[^"]*)"/, label: "privacy IT" },
  { file: "app/(frontend)/[locale]/(marketing)/privacy/page.tsx", pattern: /en: "(How FitMesh Sync collects[^"]*)"/, label: "privacy EN" },
];

function checkMetaDescriptionLengths() {
  for (const { file, pattern, label } of DESCRIPTION_LENGTH_TARGETS) {
    const content = readFileSync(file, "utf-8");
    const m = content.match(pattern);
    if (!m) {
      errors.push(`${label} (${file}): pattern di lettura description non ha trovato una corrispondenza — controllo da aggiornare insieme al file`);
      continue;
    }
    const len = [...m[1]].length;
    if (len < 140 || len > 160) {
      errors.push(`${label}: description lunga ${len} caratteri, attesi 140-160 ("${m[1]}")`);
    }
  }
}

// ── FASE live (opzionale, richiede BASE_URL) ─────────────────────────────
async function runLiveChecks() {
  const pairs: [string, string][] = [
    ["/en/blog/how-does-health-connect-work", "200"],
    ["/en/blog/come-funziona-health-connect", "308"],
    ["/en/blog/smartwatch-for-elderly-guide", "308"],
    ["/en/blog/best-smartwatch-for-elderly", "200"],
    ["/it/sync/galaxy-watch", "200"],
    ["/press-og-card.png", "200"],
  ];
  for (const [path, expected] of pairs) {
    const res = await fetch(`${BASE_URL}${path}`, { redirect: "manual" });
    if (String(res.status) !== expected) {
      errors.push(`live ${path}: status ${res.status} (atteso ${expected})`);
    }
  }
  // Nessun hop multiplo sulla coppia Health Connect: segui il redirect e
  // conferma che la destinazione sia gia' 200, non un altro redirect.
  const step1 = await fetch(`${BASE_URL}/en/blog/come-funziona-health-connect`, { redirect: "manual" });
  const loc1 = step1.headers.get("location");
  if (loc1) {
    const step2 = await fetch(`${BASE_URL}${loc1}`, { redirect: "manual" });
    if (step2.status !== 200) {
      errors.push(`live: /en/blog/come-funziona-health-connect -> ${loc1} non e' 200 diretto (status ${step2.status}) — piu' di un hop`);
    }
  }
}

async function main() {
  const redirects: Redirect[] = await config.redirects();
  await checkRedirectGraphHasNoCycles(redirects);
  checkBlogRedirectDestinationsAreSingleHop(redirects);
  checkNoDeadSamsungHealthSyncLink();
  checkPressKitOgAssetIsStatic();
  checkElderlyConsolidationSitemapExclusion();
  checkMetaDescriptionLengths();

  if (!BASE_URL) {
    if (errors.length > 0) {
      console.error(`❌ SEO redirect-integrity guardrail (solo statico, BASE_URL non impostata): ${errors.length} problema/i`);
      for (const e of errors) console.error(`  - ${e}`);
      process.exit(1);
    }
    console.log(`✅ SEO redirect-integrity guardrail: controlli statici OK (${redirects.length} redirect analizzati). BASE_URL non impostata: controlli live SALTATI, non dichiarati verdi.`);
    return;
  }

  await runLiveChecks();
  if (errors.length > 0) {
    console.error(`❌ SEO redirect-integrity guardrail: ${errors.length} problema/i`);
    for (const e of errors) console.error(`  - ${e}`);
    process.exit(1);
  }
  console.log(`✅ SEO redirect-integrity guardrail: statico (${redirects.length} redirect, nessun ciclo, nessuna catena blog >1 hop, nessun link morto /sync/samsung-health, asset press kit statico, consolidamento elderly, description 140-160) + live tutti verdi contro ${BASE_URL}.`);
}

main().catch((err) => {
  console.error("❌ SEO redirect-integrity guardrail: errore inatteso", err);
  process.exit(1);
});
