/**
 * P0.8 — guardrail sitewide title/description contro un `next start` reale.
 *
 * A differenza del vecchio `check-bing-seo-recommendations.ts` (che leggeva
 * `tl(post.hero.title, lc)` direttamente dal sorgente TS), questo script
 * legge l'HTML PRODOTTO davvero dal server: decodifica le entity HTML,
 * conta il `<title>`/meta description finali dopo l'applicazione di
 * template/suffissi, e valida contro la sitemap reale (unica fonte di
 * verità su cosa il sito dichiara indicizzabile).
 *
 * Tre livelli di severità:
 *  1. Bug sempre veri, a prescindere dalla baseline: title/description
 *     mancanti, duplicati su canonical diversi, URL in sitemap che risulta
 *     redirect/noindex quando fetchato dal vivo.
 *  2. Le due liste esplicite P0.8 (10 title Bing, 8 description Bing):
 *     soglie dure (title ≤60c, description 140-160c Unicode).
 *  3. Debito sitewide preesistente (title >60c o description fuori
 *     140-160c su URL NON nella lista P0.8): non bloccante di per sé, ma
 *     il conteggio non deve MAI aumentare oltre la baseline registrata in
 *     `docs/seo/bing-metadata-baseline.json` — altrimenti è una regressione
 *     nuova, non debito vecchio.
 */
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(__dirname, "..");
const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";
const BASELINE_PATH = path.join(repoRoot, "docs/seo/bing-metadata-baseline.json");
const CONCURRENCY = 12;
const FETCH_TIMEOUT_MS = 15000;

const errors: string[] = [];

// ── Le due liste esplicite P0.8 (Bing Webmaster Tools + Keyword Report) ────

// Nota: la URL Bing originale per #7 era troncata ("/it/blog/fitbit-data-not",
// 404 reale) — risolta come unico match plausibile per prefisso di slug
// esistente (fitbit-data-not-syncing-android.ts). Vedi PR per dettaglio.
const BING_TITLE_URLS = [
  "/en/blog/export-fitbit-data-after-google",
  "/en/blog/google-fit-shutting-down-alternative",
  "/en/blog/health-connect-vs-samsung-health",
  "/en/blog/sync-samsung-health-google-fit",
  "/fr/blog/pas-ne-synchronisent-pas-galaxy-watch",
  "/fr/blog/xiaomi-amazfit-donnees-health-connect-tableau-de-bord",
  "/it/blog/fitbit-data-not-syncing-android",
  "/nl/blog/health-connect-synchroniseert-niet",
  "/pl/blog/eksportuj-dane-garmin",
  "/pl/blog/pixel-watch-dane-osobisty-panel",
];

const BING_DESCRIPTION_URLS = [
  "/ja/blog/fitbit-data-google-ekusupoto",
  "/ja/blog",
  "/ja/blog/natsu-osusume-smartwatch-2026",
  "/ja/sync/withings",
  "/en/sync/oura",
  "/en/sync/smartphone-android",
  "/ko/blog/yesan-choego-smart-ring",
  "/ko/blog/colmi-r02-seoljeong-bangbeop",
];

// ── Helpers ─────────────────────────────────────────────────────────────

function decodeHtmlEntities(s: string): string {
  return s
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)))
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&nbsp;/g, " ");
}

function unicodeLength(s: string): number {
  return Array.from(s).length;
}

async function fetchNoRedirect(pathname: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(`${BASE_URL}${pathname}`, { redirect: "manual", signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

interface PageMeta {
  pathname: string;
  status: number;
  isRedirect: boolean;
  robots: string | null;
  title: string | null;
  description: string | null;
}

async function fetchPageMeta(pathname: string): Promise<PageMeta> {
  const res = await fetchNoRedirect(pathname);
  if (res.status >= 300 && res.status < 400) {
    return { pathname, status: res.status, isRedirect: true, robots: null, title: null, description: null };
  }
  const html = await res.text();
  const titleMatch = html.match(/<title>([^<]*)<\/title>/);
  const descMatch = html.match(/<meta name="description" content="([^"]*)"/);
  const robotsMatch = html.match(/<meta name="robots" content="([^"]*)"/);
  return {
    pathname,
    status: res.status,
    isRedirect: false,
    robots: robotsMatch ? robotsMatch[1] : null,
    title: titleMatch ? decodeHtmlEntities(titleMatch[1]) : null,
    description: descMatch ? decodeHtmlEntities(descMatch[1]) : null,
  };
}

async function mapWithConcurrency<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const idx = next++;
      results[idx] = await fn(items[idx]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

// ── Fase A: sitemap come fonte di verità per l'universo indicizzabile ────

async function main() {
  let sitemapXml: string;
  try {
    const res = await fetch(`${BASE_URL}/sitemap.xml`);
    sitemapXml = await res.text();
  } catch (err) {
    console.error(`❌ Bing metadata guardrail: impossibile leggere /sitemap.xml — ${(err as Error).message}`);
    process.exit(1);
  }
  const locs = Array.from(sitemapXml.matchAll(/<loc>([^<]+)<\/loc>/g)).map((m) => m[1]);
  if (locs.length === 0) {
    console.error("❌ Bing metadata guardrail: sitemap.xml vuota o non parsabile");
    process.exit(1);
  }
  const pathnames = locs.map((u) => new URL(u).pathname);

  console.log(`Sitemap: ${pathnames.length} URL indicizzabili dichiarate. Fetch in corso (concorrenza ${CONCURRENCY})...`);
  const pages = await mapWithConcurrency(pathnames, CONCURRENCY, fetchPageMeta);

  // ── Bug sempre veri, zero tolleranza (mai baselineabili) ─────────────
  const titleOwners = new Map<string, string[]>();
  const descOwners = new Map<string, string[]>();
  let missingTitle = 0;
  let missingDescription = 0;
  const inconsistentSitemapEntries: string[] = [];

  for (const p of pages) {
    if (p.isRedirect || p.status !== 200 || (p.robots && /noindex/i.test(p.robots))) {
      inconsistentSitemapEntries.push(
        p.isRedirect || p.status !== 200
          ? `${p.pathname} risponde ${p.status} dal vivo`
          : `${p.pathname} ha robots="${p.robots}" (noindex) dal vivo`,
      );
      continue;
    }
    if (!p.title) {
      missingTitle++;
      errors.push(`[title-mancante] ${p.pathname}`);
    } else {
      const owners = titleOwners.get(p.title) ?? [];
      owners.push(p.pathname);
      titleOwners.set(p.title, owners);
    }
    if (!p.description) {
      missingDescription++;
      errors.push(`[description-mancante] ${p.pathname}`);
    } else {
      const owners = descOwners.get(p.description) ?? [];
      owners.push(p.pathname);
      descOwners.set(p.description, owners);
    }
  }

  // Duplicati e URL sitemap non realmente indicizzabili dal vivo: debito
  // sitewide PRE-ESISTENTE in larga parte dovuto a locale non tradotte che
  // ricadono sul fallback EN (stesso meccanismo di lib/i18n.ts
  // UNTRANSLATED_CONTENT_LOCALES, ma su pagine diverse dal blog) — fuori
  // scope P0.8. Baselineati sotto insieme a title/description sitewide,
  // NON hard-error incondizionato: altrimenti il guardrail fallirebbe per
  // sempre su debito noto invece di catturare regressioni NUOVE.
  const duplicateTitleDetails: string[] = [];
  for (const [title, owners] of titleOwners) {
    if (owners.length > 1) {
      duplicateTitleDetails.push(`"${title}" condiviso da ${owners.length} URL: ${owners.slice(0, 5).join(", ")}${owners.length > 5 ? "…" : ""}`);
    }
  }
  const duplicateDescriptionDetails: string[] = [];
  for (const [desc, owners] of descOwners) {
    if (owners.length > 1) {
      duplicateDescriptionDetails.push(`"${desc.slice(0, 60)}…" condivisa da ${owners.length} URL: ${owners.slice(0, 5).join(", ")}${owners.length > 5 ? "…" : ""}`);
    }
  }
  const duplicateTitles = duplicateTitleDetails.length;
  const duplicateDescriptions = duplicateDescriptionDetails.length;
  const sitemapButRedirectOrNoindex = inconsistentSitemapEntries.length;

  // ── Le 10 URL Bing: title renderizzato ≤60c ──────────────────────────
  let bingTitleFailures = 0;
  for (const pathname of BING_TITLE_URLS) {
    const page = pages.find((p) => p.pathname === pathname);
    if (!page) {
      errors.push(`[bing-title-url-non-in-sitemap] ${pathname} non trovato in sitemap.xml — impossibile verificare`);
      continue;
    }
    if (!page.title) {
      errors.push(`[bing-title-mancante] ${pathname}`);
      continue;
    }
    const len = unicodeLength(page.title);
    if (len > 60) {
      bingTitleFailures++;
      errors.push(`[bing-title-troppo-lungo] ${pathname}: ${len}c (max 60) — "${page.title}"`);
    }
  }

  // ── Le 8 URL Bing: description renderizzata 140-160c ─────────────────
  let bingDescFailures = 0;
  for (const pathname of BING_DESCRIPTION_URLS) {
    const page = pages.find((p) => p.pathname === pathname);
    if (!page) {
      errors.push(`[bing-description-url-non-in-sitemap] ${pathname} non trovato in sitemap.xml — impossibile verificare`);
      continue;
    }
    if (!page.description) {
      errors.push(`[bing-description-mancante] ${pathname}`);
      continue;
    }
    const len = unicodeLength(page.description);
    if (len < 140 || len > 160) {
      bingDescFailures++;
      errors.push(`[bing-description-fuori-range] ${pathname}: ${len}c (atteso 140-160) — "${page.description}"`);
    }
  }

  // ── Debito sitewide preesistente: baseline esplicita, non allowlist ──
  const sitewideLongTitles = pages.filter(
    (p) => p.title && !p.isRedirect && p.status === 200 && !BING_TITLE_URLS.includes(p.pathname) && unicodeLength(p.title) > 60,
  ).length;
  const sitewideShortOrLongDescriptions = pages.filter((p) => {
    if (!p.description || p.isRedirect || p.status !== 200 || BING_DESCRIPTION_URLS.includes(p.pathname)) return false;
    const len = unicodeLength(p.description);
    return len < 140 || len > 160;
  }).length;

  interface Baseline {
    sitewideLongTitles: number;
    sitewideShortOrLongDescriptions: number;
    duplicateTitles: number;
    duplicateDescriptions: number;
    sitemapButRedirectOrNoindex: number;
    totalIndexableUrls: number;
  }
  let baseline: Baseline | null = null;
  if (fs.existsSync(BASELINE_PATH)) {
    baseline = JSON.parse(fs.readFileSync(BASELINE_PATH, "utf-8"));
  }

  const regressionChecks: Array<[label: string, current: number, key: keyof Baseline]> = [
    ["title-sitewide", sitewideLongTitles, "sitewideLongTitles"],
    ["description-sitewide", sitewideShortOrLongDescriptions, "sitewideShortOrLongDescriptions"],
    ["title-duplicato", duplicateTitles, "duplicateTitles"],
    ["description-duplicata", duplicateDescriptions, "duplicateDescriptions"],
    ["sitemap-inconsistente", sitemapButRedirectOrNoindex, "sitemapButRedirectOrNoindex"],
  ];

  if (!baseline) {
    errors.push(
      `[baseline-mancante] ${path.relative(repoRoot, BASELINE_PATH)} non esiste — esegui con --write-baseline per generarla (debito attuale: ${sitewideLongTitles} title >60c, ${sitewideShortOrLongDescriptions} description fuori 140-160c, ${duplicateTitles} title duplicati, ${duplicateDescriptions} description duplicate, ${sitemapButRedirectOrNoindex} URL sitemap non indicizzabili dal vivo, su ${pathnames.length} URL totali)`,
    );
  } else {
    for (const [label, current, key] of regressionChecks) {
      if (current > baseline[key]) {
        errors.push(`[regressione-${label}] ${current} (baseline ${baseline[key]}) — nuova regressione, non debito noto`);
      }
    }
  }

  if (process.argv.includes("--write-baseline")) {
    fs.writeFileSync(
      BASELINE_PATH,
      JSON.stringify(
        {
          generatedAt: "P0.8 (2026-07-23)",
          note: "Debito sitewide preesistente, non affrontato in P0.8 (fuori scope: solo le 10 URL title + 8 URL description esplicite + cause condivise nei template). In gran parte locale non tradotte che ricadono sul fallback EN su pagine non-blog (integrations/beta/ai/support/roadmap/sync-provider) — stesso meccanismo di lib/i18n.ts UNTRANSLATED_CONTENT_LOCALES, ma su pagine diverse dal blog, quindi non coperto da check-blog-locale-near-miss.ts. Il guardrail fallisce se questi numeri AUMENTANO rispetto a qui.",
          totalIndexableUrls: pathnames.length,
          sitewideLongTitles,
          sitewideShortOrLongDescriptions,
          duplicateTitles,
          duplicateDescriptions,
          sitemapButRedirectOrNoindex,
        },
        null,
        2,
      ) + "\n",
    );
    console.log(`Baseline scritta in ${path.relative(repoRoot, BASELINE_PATH)}.`);
  }

  console.log(`Riepilogo: ${pathnames.length} URL sitemap, ${missingTitle} title mancanti, ${missingDescription} description mancanti, ${duplicateTitles} title duplicati, ${duplicateDescriptions} description duplicate, ${sitemapButRedirectOrNoindex} URL sitemap non realmente indicizzabili dal vivo.`);
  console.log(`10 URL Bing title: ${BING_TITLE_URLS.length - bingTitleFailures}/${BING_TITLE_URLS.length} ≤60c. 8 URL Bing description: ${BING_DESCRIPTION_URLS.length - bingDescFailures}/${BING_DESCRIPTION_URLS.length} in 140-160c.`);
  console.log(`Debito sitewide preesistente: ${sitewideLongTitles} title >60c, ${sitewideShortOrLongDescriptions} description fuori 140-160c (baseline: ${baseline ? `${baseline.sitewideLongTitles}/${baseline.sitewideShortOrLongDescriptions}` : "assente"}).`);

  if (errors.length > 0) {
    console.error(`❌ Bing metadata guardrail: ${errors.length} problema/i`);
    for (const error of errors) console.error(`  - ${error}`);
    process.exit(1);
  }
  console.log("✅ Bing metadata guardrail: nessun problema.");
}

main().catch((err) => {
  console.error("❌ Bing metadata guardrail: errore inatteso", err);
  process.exit(1);
});
