/**
 * P0.8/P0.8A — guardrail sitewide title/description contro un `next start` reale.
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
 *     mancanti su URL indicizzabili (mai baselineabili).
 *  2. Le due liste esplicite Bing (10 title, 28 description — URL esatte
 *     dagli export ufficiali Bing Webmaster Tools "Download all",
 *     `fitmesh.fit_FailingUrls_7_23_2026.csv` e
 *     `fitmesh.fit_FailingUrls_7_23_2026 (1).csv`, verificate 1:1 contro
 *     `fitmesh.fit_SEOAnalysisSummary_2026_07_23.csv`: 10+28 righe, 38 URL
 *     uniche, zero sovrapposizioni): soglie dure (title <=60c, description
 *     140-160c Unicode).
 *  3. Debito sitewide preesistente (title >60c, description fuori
 *     140-160c, URL in sitemap non realmente indicizzabile dal vivo,
 *     title/description duplicati) su URL NON nella lista P0.8: non
 *     bloccante di per se', ma tracciato con IDENTITA' STABILE (lista di
 *     URL esatte, non un conteggio aggregato) in
 *     `docs/seo/bing-metadata-baseline.json`.
 *
 *     P0.8A: il conteggio aggregato nascondeva regressioni — una URL
 *     vecchia poteva essere corretta mentre una URL nuova entrava nello
 *     stesso debito, lasciando il totale invariato e il guardrail verde
 *     per errore. Ora ogni categoria e' un insieme di URL: un problema
 *     baseline puo' scomparire senza intervento, ma qualunque URL NON
 *     presente nell'insieme baseline corrispondente fa fallire il
 *     guardrail — non puo' essere assorbita da un conteggio che resta
 *     sotto soglia. Per i gruppi duplicati la chiave e' il testo esatto
 *     (title o description) mappato all'insieme di URL che lo condividono:
 *     una nuova URL che si aggiunge a un gruppo duplicato gia' noto viene
 *     rilevata anche se il gruppo esisteva gia'. Aggiornare la baseline
 *     richiede sempre `--write-baseline` esplicito e un diff revisionabile
 *     in git — non viene mai rigenerata automaticamente in build/CI.
 */
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(__dirname, "..");
const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";
const BASELINE_PATH = path.join(repoRoot, "docs/seo/bing-metadata-baseline.json");
const CONCURRENCY = 12;
const FETCH_TIMEOUT_MS = 15000;

const errors: string[] = [];

// ── Le due liste esplicite Bing (export ufficiali "Download all") ─────────
//
// Fonte: fitmesh.fit_FailingUrls_7_23_2026.csv (10 righe, title) e
// fitmesh.fit_FailingUrls_7_23_2026 (1).csv (28 righe, description),
// scaricati da Bing Webmaster Tools -> Recommendations -> [singolo
// recommendation] -> Download all. Conteggio incrociato con
// fitmesh.fit_SEOAnalysisSummary_2026_07_23.csv (il riepilogo aggregato,
// che riporta "Title too long": 10 e "Meta descriptions... too short": 28
// ma NESSUNA URL — da solo insufficiente, per questo servivano i due export
// di dettaglio). Verificate: 10 righe/10 URL uniche, 28 righe/28 URL
// uniche, zero sovrapposizioni tra le due liste.
//
// Nota su #7: la URL Bing per il title era gia' completa in questo export
// ("/it/blog/fitbit-data-not-syncing-android") — un incollaggio precedente
// in una fase di lavoro l'aveva troncata a "/it/blog/fitbit-data-not"
// (404 reale), risolta all'epoca come unico match plausibile per prefisso
// di slug; l'export ufficiale conferma che il match era corretto.
const BING_TITLE_URLS = [
  "/en/blog/export-fitbit-data-after-google",
  "/en/blog/sync-samsung-health-google-fit",
  "/en/blog/google-fit-shutting-down-alternative",
  "/pl/blog/eksportuj-dane-garmin",
  "/pl/blog/pixel-watch-dane-osobisty-panel",
  "/fr/blog/pas-ne-synchronisent-pas-galaxy-watch",
  "/en/blog/health-connect-vs-samsung-health",
  "/it/blog/fitbit-data-not-syncing-android",
  "/fr/blog/xiaomi-amazfit-donnees-health-connect-tableau-de-bord",
  "/nl/blog/health-connect-synchroniseert-niet",
];

// Le 28 URL description ufficiali. Una di queste (vedi
// KNOWN_DESCRIPTION_REDIRECTS sotto) e' un vecchio slug che oggi risponde
// con un redirect singolo verso lo slug locale corrente dello stesso post
// — non e' un URL indicizzabile con una description da correggere
// (classificazione D), quindi e' verificata separatamente, non tramite la
// sitemap.
const BING_DESCRIPTION_URLS = [
  "/ja/blog/fitbit-data-google-ekusupoto",
  "/ja/blog",
  "/ja/blog/natsu-osusume-smartwatch-2026",
  "/ja/sync/withings",
  "/en/sync/suunto",
  "/en/sync/oura",
  "/en/sync/smartphone-android",
  "/ko/blog/yesan-choego-smart-ring",
  "/ko/blog/colmi-r02-seoljeong-bangbeop",
  "/en/sync/galaxy-watch",
  "/en/sync/fitbit",
  "/ko/blog/sleep-tracker-comparison-2026",
  "/ko/blog/yeoreum-choego-smartwatch-2026",
  "/ja/blog/galaxy-ring-android-health-connect",
  "/ko/blog/fitbit-deiteo-google-naebonae",
  "/ja/blog/wearable-douki-apuri-daian-2026",
  "/de/sync/strava",
  "/ja/blog/osusume-kosu-smart-ring",
  "/ja/blog/suimin-tracker-hikaku-2026",
  "/ko/blog/smartwatch-seontaek-deiteo-2026",
  "/ko/blog/smart-ring-wanbyeok-gaidu",
  "/ja/blog/smart-ring-kanzen-gaido",
  "/en/sync/amazfit-zepp",
  "/pt/imprint",
  "/en/support",
  "/ja/sync/smartphone-android",
  "/ja/blog/colmi-r02-settei-houhou",
  "/ja/lp/fitbit-google-ekusupoto",
];

// Classificazione D (Task 1): "/ko/blog/sleep-tracker-comparison-2026" usa
// letteralmente lo slug canonico/EN come path sotto /ko/ — non e' mai stato
// lo slug ko corrente (lib/blog/slugs.ts mappa "ko: sumyeon-tracker-bigyo-2026"
// per questo canonical). resolveBlogPost() lo riconosce via reverse-lookup
// cross-locale e fa un 308 singolo verso lo slug ko corretto: comportamento
// SEMPRE ESISTITO (canonicalizzazione cross-locale, non un redirect "legacy"
// aggiunto ora), verificato NON in loop e con destinazione 200 diretta.
// Non e' una description da correggere: non ha una pagina propria.
const KNOWN_DESCRIPTION_REDIRECTS: Record<string, string> = {
  "/ko/blog/sleep-tracker-comparison-2026": "/ko/blog/sumyeon-tracker-bigyo-2026",
};

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

// ── Baseline identity-based (P0.8A) ─────────────────────────────────────

interface DuplicateGroupEntry {
  value: string;
  urls: string[];
}

interface Baseline {
  generatedAt: string;
  note: string;
  totalIndexableUrls: number;
  longTitleUrls: string[];
  outOfRangeDescriptionUrls: string[];
  sitemapInconsistentUrls: string[];
  duplicateTitleGroups: DuplicateGroupEntry[];
  duplicateDescriptionGroups: DuplicateGroupEntry[];
}

function groupsToMap(groups: DuplicateGroupEntry[]): Map<string, Set<string>> {
  const m = new Map<string, Set<string>>();
  for (const g of groups) m.set(g.value, new Set(g.urls));
  return m;
}

function diffUrlSet(label: string, current: string[], baselineList: string[] | undefined): string[] {
  const baselineSet = new Set(baselineList ?? []);
  return current
    .filter((u) => !baselineSet.has(u))
    .map((u) => `[regressione-${label}] ${u} — nuovo, non presente in baseline`);
}

function diffDuplicateGroups(label: string, current: DuplicateGroupEntry[], baseline: DuplicateGroupEntry[] | undefined): string[] {
  const baselineMap = groupsToMap(baseline ?? []);
  const out: string[] = [];
  for (const group of current) {
    const baselineUrls = baselineMap.get(group.value);
    for (const url of group.urls) {
      if (!baselineUrls || !baselineUrls.has(url)) {
        out.push(
          `[regressione-${label}] ${url} — nuovo in un gruppo duplicato (valore: "${group.value.slice(0, 60)}${group.value.length > 60 ? "…" : ""}")`,
        );
      }
    }
  }
  return out;
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
  const sitemapInconsistentUrls: string[] = [];
  const sitemapInconsistentDetails: string[] = [];

  for (const p of pages) {
    if (p.isRedirect || p.status !== 200 || (p.robots && /noindex/i.test(p.robots))) {
      sitemapInconsistentUrls.push(p.pathname);
      sitemapInconsistentDetails.push(
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
  sitemapInconsistentUrls.sort();

  // Duplicati: debito sitewide PRE-ESISTENTE in larga parte dovuto a locale
  // non tradotte che ricadono sul fallback EN (stesso meccanismo di
  // lib/i18n.ts UNTRANSLATED_CONTENT_LOCALES, ma su pagine diverse dal
  // blog) — fuori scope P0.8. Tracciato per identita' (value -> URL), non
  // per conteggio aggregato: vedi commento di testa del file.
  const currentDuplicateTitleGroups: DuplicateGroupEntry[] = [...titleOwners.entries()]
    .filter(([, owners]) => owners.length > 1)
    .map(([value, owners]) => ({ value, urls: [...owners].sort() }))
    .sort((a, b) => a.value.localeCompare(b.value));
  const currentDuplicateDescriptionGroups: DuplicateGroupEntry[] = [...descOwners.entries()]
    .filter(([, owners]) => owners.length > 1)
    .map(([value, owners]) => ({ value, urls: [...owners].sort() }))
    .sort((a, b) => a.value.localeCompare(b.value));

  // Metrica informativa (non usata per l'enforcement, solo per il riepilogo):
  // sum(max(0, owners.length - 1)) per categoria.
  const duplicateTitleUrlCount = currentDuplicateTitleGroups.reduce((sum, g) => sum + Math.max(0, g.urls.length - 1), 0);
  const duplicateDescriptionUrlCount = currentDuplicateDescriptionGroups.reduce((sum, g) => sum + Math.max(0, g.urls.length - 1), 0);

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

  // ── Le 28 URL Bing description: 140-160c, fetch diretto (non dipende
  // dalla sitemap: una di queste e' un redirect classificato D, mai
  // presente in sitemap per design) ───────────────────────────────────
  let bingDescFailures = 0;
  let bingDescClassifiedD = 0;
  for (const pathname of BING_DESCRIPTION_URLS) {
    const knownRedirectTarget = KNOWN_DESCRIPTION_REDIRECTS[pathname];
    const page = await fetchPageMeta(pathname);
    if (page.isRedirect) {
      if (knownRedirectTarget) {
        bingDescClassifiedD++;
        // Verifica che il redirect noto sia ancora un singolo hop verso una
        // pagina 200 reale, non un loop o una rottura silenziosa.
        const target = await fetchPageMeta(knownRedirectTarget);
        if (target.status !== 200) {
          errors.push(
            `[bing-description-redirect-rotto] ${pathname} (classificazione D) -> ${knownRedirectTarget} risponde ${target.status} invece di 200`,
          );
        }
        continue;
      }
      errors.push(`[bing-description-redirect-non-documentato] ${pathname} risponde ${page.status} verso "${page.robots ?? "?"}" ma non e' nella lista dei redirect noti — classificare (D) prima di ignorare`);
      continue;
    }
    if (page.status !== 200) {
      errors.push(`[bing-description-status-inatteso] ${pathname}: HTTP ${page.status} (atteso 200 o un redirect documentato)`);
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

  // ── Debito sitewide preesistente: identita' stabile per URL ──────────
  const currentLongTitleUrls = pages
    .filter((p) => p.title && !p.isRedirect && p.status === 200 && !BING_TITLE_URLS.includes(p.pathname) && unicodeLength(p.title) > 60)
    .map((p) => p.pathname)
    .sort();
  const currentOutOfRangeDescriptionUrls = pages
    .filter((p) => {
      if (!p.description || p.isRedirect || p.status !== 200 || BING_DESCRIPTION_URLS.includes(p.pathname)) return false;
      const len = unicodeLength(p.description);
      return len < 140 || len > 160;
    })
    .map((p) => p.pathname)
    .sort();

  let baseline: Baseline | null = null;
  if (fs.existsSync(BASELINE_PATH)) {
    baseline = JSON.parse(fs.readFileSync(BASELINE_PATH, "utf-8"));
  }

  if (!baseline) {
    errors.push(
      `[baseline-mancante] ${path.relative(repoRoot, BASELINE_PATH)} non esiste — esegui con --write-baseline per generarla (debito attuale: ${currentLongTitleUrls.length} title >60c, ${currentOutOfRangeDescriptionUrls.length} description fuori 140-160c, ${currentDuplicateTitleGroups.length} gruppi title duplicati, ${currentDuplicateDescriptionGroups.length} gruppi description duplicate, ${sitemapInconsistentUrls.length} URL sitemap non indicizzabili dal vivo, su ${pathnames.length} URL totali)`,
    );
  } else {
    errors.push(...diffUrlSet("title-sitewide", currentLongTitleUrls, baseline.longTitleUrls));
    errors.push(...diffUrlSet("description-sitewide", currentOutOfRangeDescriptionUrls, baseline.outOfRangeDescriptionUrls));
    errors.push(...diffUrlSet("sitemap-inconsistente", sitemapInconsistentUrls, baseline.sitemapInconsistentUrls));
    errors.push(...diffDuplicateGroups("title-duplicato", currentDuplicateTitleGroups, baseline.duplicateTitleGroups));
    errors.push(...diffDuplicateGroups("description-duplicata", currentDuplicateDescriptionGroups, baseline.duplicateDescriptionGroups));
  }

  if (process.argv.includes("--write-baseline")) {
    const newBaseline: Baseline = {
      generatedAt: "P0.8A (2026-07-23)",
      note:
        "Debito sitewide preesistente, non affrontato in P0.8/P0.8A (fuori scope: solo le URL title/description esplicite di Bing + cause condivise nei template). In gran parte locale non tradotte che ricadono sul fallback EN su pagine non-blog (integrations/beta/ai/support/roadmap/sync-provider) — stesso meccanismo di lib/i18n.ts UNTRANSLATED_CONTENT_LOCALES, ma su pagine diverse dal blog, quindi non coperto da check-blog-locale-near-miss.ts. Formato identity-based (P0.8A): ogni categoria e' un insieme esplicito di URL (o di gruppi URL per i duplicati), non un conteggio. Il guardrail fallisce se una URL non presente nell'insieme baseline corrispondente compare nel debito corrente. Rigenerare SOLO con --write-baseline esplicito e revisionare il diff in git.",
      totalIndexableUrls: pathnames.length,
      longTitleUrls: currentLongTitleUrls,
      outOfRangeDescriptionUrls: currentOutOfRangeDescriptionUrls,
      sitemapInconsistentUrls,
      duplicateTitleGroups: currentDuplicateTitleGroups,
      duplicateDescriptionGroups: currentDuplicateDescriptionGroups,
    };
    fs.writeFileSync(BASELINE_PATH, JSON.stringify(newBaseline, null, 2) + "\n");
    console.log(`Baseline identity-based scritta in ${path.relative(repoRoot, BASELINE_PATH)}.`);
  }

  console.log(
    `Riepilogo: ${pathnames.length} URL sitemap, ${missingTitle} title mancanti, ${missingDescription} description mancanti, ${duplicateTitleUrlCount} URL in title duplicati (${currentDuplicateTitleGroups.length} gruppi), ${duplicateDescriptionUrlCount} URL in description duplicate (${currentDuplicateDescriptionGroups.length} gruppi), ${sitemapInconsistentUrls.length} URL sitemap non realmente indicizzabili dal vivo.`,
  );
  const bingDescCompliant = BING_DESCRIPTION_URLS.length - bingDescFailures - bingDescClassifiedD;
  const bingDescCheckable = BING_DESCRIPTION_URLS.length - bingDescClassifiedD;
  console.log(
    `10 URL Bing title: ${BING_TITLE_URLS.length - bingTitleFailures}/${BING_TITLE_URLS.length} ≤60c. 28 URL Bing description: ${bingDescCompliant}/${bingDescCheckable} in 140-160c (${bingDescClassifiedD} classificata/e D — redirect noto verso pagina viva, non una description da correggere).`,
  );
  console.log(
    `Debito sitewide preesistente: ${currentLongTitleUrls.length} title >60c, ${currentOutOfRangeDescriptionUrls.length} description fuori 140-160c (baseline: ${baseline?.longTitleUrls ? `${baseline.longTitleUrls.length}/${baseline.outOfRangeDescriptionUrls.length}` : "assente o formato precedente"}).`,
  );

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
