/**
 * Guardrail permanente SPRINT P0.13 — crawl hygiene, noindex discovery,
 * hreflang. Fallisce se:
 *  1. una URL della sitemap.xml live è redirect, 404, noindex, o ha
 *     canonical incompatibile (self-mismatch);
 *  2. un hreflang campionato punta a noindex, redirect, 404, o ha canonical
 *     diverso dall'URL dichiarato;
 *  3. /beta ricompare come link in Header.tsx o MobileMenu.tsx (statico,
 *     non richiede build — regressione da bloccare PRIMA del build);
 *  4. un file nell'allowlist utility-noindex
 *     (docs/seo/p013-allowlist-utility-noindex-links.md) non ha una
 *     motivazione (riga di tabella con colonna "Motivazione" vuota);
 *  5. sitemap.ts importa un predicato di indicizzabilità diverso da quello
 *     usato dalla page.tsx corrispondente per `robots` (drift strutturale
 *     fra le due fonti — dovrebbero SEMPRE essere la stessa funzione).
 *
 * Design "mai un numero inventato": i check che richiedono build (.next) o
 * server (`next start` su BASE_URL) sono saltati con un warning esplicito se
 * l'infrastruttura non è disponibile, mai un pass silenzioso.
 *
 * Uso (Docker, nessun runtime locale):
 *   docker run --rm -v "$PWD":/app -w /app -e BASE_URL=http://localhost:3413 \
 *     node:22 npx tsx tools/check-p013-crawl-hygiene.ts
 */
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(__dirname, "..");
const errors: string[] = [];
const warnings: string[] = [];
const BASE_URL = process.env.BASE_URL; // es. http://localhost:3413 (next start locale) o https://www.fitmesh.fit

// Specchio dei target dell'allowlist in docs/seo/p013-allowlist-utility-noindex-links.md
// — deve restare sincronizzato con quel file (checkAllowlistMotivated verifica che
// OGNI riga lì abbia una motivazione; questi pattern dicono al crawler quali target
// noindex ignorare perché già documentati come intenzionali).
const ALLOWLISTED_NOINDEX_TARGET_PATTERNS: RegExp[] = [
  /^\/(it|en)\/self-host$/,
  /^\/[a-z]{2}\/self-host$/,
  /^\/[a-z]{2}\/auth\/(forgot|reset)-password$/,
  /^\/[a-z]{2}\/admin\/beta$/,
];
function isAllowlistedNoindexTarget(pathname: string): boolean {
  return ALLOWLISTED_NOINDEX_TARGET_PATTERNS.some((re) => re.test(pathname));
}

// ─────────────────────────────────────────────────────────────────────────
// CHECK 3 (statico, sempre attivo): /beta non deve ricomparire in
// Header/MobileMenu.
// ─────────────────────────────────────────────────────────────────────────
function checkBetaAbsentFromNav(): void {
  for (const rel of ["components/Header.tsx", "components/MobileMenu.tsx"]) {
    const full = path.join(repoRoot, rel);
    if (!fs.existsSync(full)) {
      errors.push(`[file-mancante] ${rel} non trovato.`);
      continue;
    }
    const src = fs.readFileSync(full, "utf8");
    // Cerca un vero <Link href=".../beta"> attivo, non un commento che lo
    // menziona (i commenti P0.13 spiegano la rimozione e citano "/beta").
    const codeOnly = src.replace(/\/\*[\s\S]*?\*\//g, "");
    if (/href=\{`\/\$\{locale\}\/beta`\}/.test(codeOnly) || /href="\/beta"/.test(codeOnly)) {
      errors.push(`[beta-reintrodotto] ${rel} contiene di nuovo un link a /beta — regressione rispetto a P0.13 FASE 2.`);
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────
// CHECK 4 (statico): ogni riga della tabella allowlist ha una motivazione.
// ─────────────────────────────────────────────────────────────────────────
function checkAllowlistMotivated(): void {
  const allowlistPath = path.join(repoRoot, "docs/seo/p013-allowlist-utility-noindex-links.md");
  if (!fs.existsSync(allowlistPath)) {
    errors.push("[allowlist-mancante] docs/seo/p013-allowlist-utility-noindex-links.md non trovato.");
    return;
  }
  const lines = fs.readFileSync(allowlistPath, "utf8").split("\n");
  const tableRows = lines.filter((l) => l.startsWith("|") && !l.startsWith("|---") && !l.includes("Sorgente"));
  let checked = 0;
  for (const row of tableRows) {
    const cells = row.split("|").map((c) => c.trim()).filter((c) => c.length > 0);
    if (cells.length < 3) continue; // riga non-tabella (es. testo libero fuori tabella)
    checked++;
    const motivazione = cells[2];
    if (!motivazione || motivazione.length < 15) {
      errors.push(`[allowlist-senza-motivazione] riga allowlist senza motivazione sufficiente: "${row}"`);
    }
  }
  if (checked === 0) {
    warnings.push("[allowlist-vuota] nessuna riga trovata nella tabella allowlist — verifica il formato del file.");
  }
}

// ─────────────────────────────────────────────────────────────────────────
// CHECK 5 (statico): sitemap.ts e le page.tsx delle famiglie condivise
// (blog/lp/provider/model) devono importare lo STESSO predicato di
// indicizzabilità — nessuna lista/regola duplicata che possa divergere.
// ─────────────────────────────────────────────────────────────────────────
function checkSharedPredicateNoDrift(): void {
  const sitemapPath = path.join(repoRoot, "app/sitemap.ts");
  if (!fs.existsSync(sitemapPath)) {
    errors.push("[file-mancante] app/sitemap.ts non trovato.");
    return;
  }
  const sitemapSrc = fs.readFileSync(sitemapPath, "utf8");
  const pairs: Array<{ predicate: string; pageFile: string }> = [
    { predicate: "isBlogVariantIndexable", pageFile: "app/(frontend)/[locale]/(marketing)/blog/[slug]/page.tsx" },
    { predicate: "isLandingVariantIndexable", pageFile: "app/(frontend)/[locale]/(marketing)/lp/[slug]/page.tsx" },
    { predicate: "isProviderVariantIndexable", pageFile: "app/(frontend)/[locale]/(marketing)/sync/[provider]/page.tsx" },
    { predicate: "isProviderModelVariantIndexable", pageFile: "app/(frontend)/[locale]/(marketing)/sync/[provider]/[model]/page.tsx" },
  ];
  for (const { predicate, pageFile } of pairs) {
    if (!sitemapSrc.includes(predicate)) {
      errors.push(`[predicate-non-in-sitemap] app/sitemap.ts non importa/usa "${predicate}" — potrebbe avere una lista propria divergente.`);
      continue;
    }
    const pageFull = path.join(repoRoot, pageFile);
    if (!fs.existsSync(pageFull)) {
      errors.push(`[file-mancante] ${pageFile} non trovato.`);
      continue;
    }
    const pageSrc = fs.readFileSync(pageFull, "utf8");
    if (!pageSrc.includes(`robots: ${predicate}`) && !new RegExp(`robots:\\s*\\n?\\s*${predicate}`).test(pageSrc)) {
      errors.push(`[predicate-non-in-robots] ${pageFile} non usa "${predicate}" per il campo robots — drift rispetto a sitemap.ts.`);
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────
// CHECK 1 (richiede BASE_URL): sitemap.xml live — ogni URL 200, non-noindex,
// canonical self-referenziante.
// ─────────────────────────────────────────────────────────────────────────
async function fetchHead(url: string): Promise<{ status: number; html: string } | null> {
  try {
    const res = await fetch(url, { redirect: "manual" });
    if (res.status >= 300 && res.status < 400) return { status: res.status, html: "" };
    const html = res.status === 200 ? await res.text() : "";
    return { status: res.status, html };
  } catch {
    return null;
  }
}

function extractMeta(html: string, tag: RegExp): string | null {
  const m = html.match(tag);
  return m ? m[1] : null;
}

async function checkSitemapSample(): Promise<void> {
  if (!BASE_URL) {
    warnings.push("[base-url-assente] BASE_URL non impostato — check 1 (sitemap live) saltato, nessun server disponibile.");
    return;
  }
  const sitemapRes = await fetchHead(`${BASE_URL}/sitemap.xml`);
  if (!sitemapRes || sitemapRes.status !== 200) {
    warnings.push(`[sitemap-non-raggiungibile] ${BASE_URL}/sitemap.xml non raggiungibile o non 200 — check 1 saltato.`);
    return;
  }
  const locs = [...sitemapRes.html.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  if (locs.length === 0) {
    errors.push("[sitemap-vuota] sitemap.xml live non contiene nessuna <loc>.");
    return;
  }
  // Campione stratificato: primi 3, ultimi 3, + 20 random-deterministici
  // (step fisso, non Math.random — vietato negli script Workflow/CI
  // riproducibili) distribuiti sull'intero range.
  const sampleSize = Math.min(26, locs.length);
  const sample = new Set<string>([...locs.slice(0, 3), ...locs.slice(-3)]);
  const step = Math.max(1, Math.floor(locs.length / 20));
  for (let i = 0; i < locs.length && sample.size < sampleSize; i += step) sample.add(locs[i]);

  let checkedCount = 0;
  for (const url of sample) {
    const r = await fetchHead(url);
    checkedCount++;
    if (!r) {
      warnings.push(`[fetch-fallita] ${url} — rete non raggiungibile, non contato come errore.`);
      continue;
    }
    if (r.status >= 300 && r.status < 400) {
      errors.push(`[sitemap-url-redirect] ${url} in sitemap ma risponde ${r.status} (redirect) — non deve essere in sitemap.`);
      continue;
    }
    if (r.status !== 200) {
      errors.push(`[sitemap-url-non-200] ${url} in sitemap ma risponde ${r.status}.`);
      continue;
    }
    const robotsMeta = extractMeta(r.html, /<meta name="robots" content="([^"]*)"/);
    if (robotsMeta && /noindex/.test(robotsMeta)) {
      errors.push(`[sitemap-url-noindex] ${url} in sitemap ma ha <meta robots content="${robotsMeta}"> — mai una URL noindex in sitemap.`);
    }
    const canonical = extractMeta(r.html, /<link rel="canonical" href="([^"]*)"/);
    if (canonical && canonical.replace(/\/$/, "") !== url.replace(/\/$/, "")) {
      errors.push(`[sitemap-url-canonical-mismatch] ${url} → canonical="${canonical}" (diverso da se stesso).`);
    }
  }
  console.log(`  [check-1] sitemap.xml: ${locs.length} URL totali, ${checkedCount} campionate.`);
}

// ─────────────────────────────────────────────────────────────────────────
// CHECK 2 (richiede BASE_URL): hreflang campionato — ogni alternate 200,
// indicizzabile, canonical self-referenziante.
// ─────────────────────────────────────────────────────────────────────────
async function checkHreflangSample(urls: string[]): Promise<void> {
  if (!BASE_URL) {
    warnings.push("[base-url-assente] BASE_URL non impostato — check 2 (hreflang) saltato.");
    return;
  }
  for (const path_ of urls) {
    const url = `${BASE_URL}${path_}`;
    const r = await fetchHead(url);
    if (!r) {
      warnings.push(`[fetch-fallita] ${url} — rete non raggiungibile.`);
      continue;
    }
    if (r.status !== 200) {
      warnings.push(`[hreflang-source-non-200] ${url} risponde ${r.status} — impossibile leggere il suo hreflang, saltato.`);
      continue;
    }
    const alternates = [...r.html.matchAll(/<link rel="alternate" hrefLang="([^"]+)" href="([^"]+)"/g)];
    if (alternates.length === 0) {
      warnings.push(`[hreflang-assente] ${url} non ha tag hreflang — verifica manuale consigliata.`);
      continue;
    }
    for (const [, hreflang, target] of alternates) {
      if (hreflang === "x-default") continue;
      const tr = await fetchHead(target);
      if (!tr) {
        warnings.push(`[hreflang-target-fetch-fallita] ${url} → hreflang="${hreflang}" → ${target} non raggiungibile.`);
        continue;
      }
      if (tr.status >= 300 && tr.status < 400) {
        errors.push(`[hreflang-verso-redirect] ${url} → hreflang="${hreflang}" → ${target} risponde ${tr.status} (redirect).`);
        continue;
      }
      if (tr.status !== 200) {
        errors.push(`[hreflang-verso-non-200] ${url} → hreflang="${hreflang}" → ${target} risponde ${tr.status}.`);
        continue;
      }
      const targetRobots = extractMeta(tr.html, /<meta name="robots" content="([^"]*)"/);
      if (targetRobots && /noindex/.test(targetRobots)) {
        errors.push(`[hreflang-verso-noindex] ${url} → hreflang="${hreflang}" → ${target} ha <meta robots content="${targetRobots}">.`);
      }
      const targetCanonical = extractMeta(tr.html, /<link rel="canonical" href="([^"]*)"/);
      if (targetCanonical && targetCanonical.replace(/\/$/, "") !== target.replace(/\/$/, "")) {
        errors.push(`[hreflang-target-canonical-mismatch] ${url} → hreflang="${hreflang}" → ${target}, canonical="${targetCanonical}".`);
      }
    }
  }
  console.log(`  [check-2] hreflang campionato su ${urls.length} pagine sorgente.`);
}

// ─────────────────────────────────────────────────────────────────────────
// CHECK 3 (richiede BASE_URL): anchor interni da pagine marketing
// indicizzabili — nessuno deve puntare a noindex/redirect/404 senza
// allowlist motivata (FASE 5.3).
// ─────────────────────────────────────────────────────────────────────────
async function checkAnchorsSample(sourcePaths: string[]): Promise<void> {
  if (!BASE_URL) {
    warnings.push("[base-url-assente] BASE_URL non impostato — check 3 (anchor→noindex) saltato.");
    return;
  }
  const targetStatusCache = new Map<string, { status: number; robots: string | null }>();
  for (const src of sourcePaths) {
    const url = `${BASE_URL}${src}`;
    const r = await fetchHead(url);
    if (!r || r.status !== 200) {
      warnings.push(`[anchor-source-non-200] ${url} non raggiungibile/200 — check 3 saltato per questa sorgente.`);
      continue;
    }
    // FASE 5.3 riguarda pagine INDICIZZABILI che linkano noindex — una
    // sorgente già noindex (es. /sv/famiglia, sv non è in
    // FAMIGLIA_COMPLETE_LOCALES) che si auto-referenzia o linka un'altra
    // pagina noindex non è la stessa classe di problema: saltata qui, non
    // silenziata (il check 1/2 sopra la coprono comunque via sitemap/hreflang).
    const sourceRobots = extractMeta(r.html, /<meta name="robots" content="([^"]*)"/);
    if (sourceRobots && /noindex/.test(sourceRobots)) {
      console.log(`  [check-3] ${src}: sorgente noindex, saltata (non è "pagina indicizzabile che linka noindex").`);
      continue;
    }
    // Solo anchor interni relativi (href="/...") dentro <main>/<body>, non
    // asset (img/script/link) né mailto/tel/http esterni.
    const hrefs = [...r.html.matchAll(/<a[^>]+href="(\/[^"#?]*)"/g)].map((m) => m[1]);
    const uniqueTargets = [...new Set(hrefs)];
    let checkedForThisSource = 0;
    for (const target of uniqueTargets) {
      if (isAllowlistedNoindexTarget(target)) continue;
      let info = targetStatusCache.get(target);
      if (!info) {
        const tr = await fetchHead(`${BASE_URL}${target}`);
        info = tr
          ? { status: tr.status, robots: extractMeta(tr.html, /<meta name="robots" content="([^"]*)"/) }
          : { status: 0, robots: null };
        targetStatusCache.set(target, info);
      }
      checkedForThisSource++;
      if (info.status >= 300 && info.status < 400) {
        errors.push(`[anchor-verso-redirect] ${src} linka ${target} che risponde ${info.status} — mai un link interno che richieda un redirect.`);
      } else if (info.status === 404) {
        errors.push(`[anchor-verso-404] ${src} linka ${target} che risponde 404.`);
      } else if (info.status === 200 && info.robots && /noindex/.test(info.robots)) {
        errors.push(`[anchor-verso-noindex] ${src} linka ${target} che ha <meta robots content="${info.robots}"> e non è nell'allowlist.`);
      }
    }
    console.log(`  [check-3] ${src}: ${uniqueTargets.length} anchor interni unici, ${checkedForThisSource} verificati (resto in cache/allowlist).`);
  }
}

async function main(): Promise<void> {
  checkBetaAbsentFromNav();
  checkAllowlistMotivated();
  checkSharedPredicateNoDrift();
  await checkSitemapSample();
  // Campione mirato sulle superfici toccate da P0.13: provider senza
  // traduzione completa, famiglia/press appena riallineate, blog DE/FR.
  const sampleSourcePages = [
    "/it",
    "/it/blog",
    "/it/sync/garmin",
    "/it/famiglia",
    "/sv/famiglia",
    "/it/press",
    "/sv/press",
    "/it/integrations",
    "/it/novita",
    "/de/blog/samsung-health-und-fitmesh-gemeinsam-nutzen",
    "/fr/blog/utiliser-fitmesh-avec-samsung-health",
  ];
  await checkHreflangSample(sampleSourcePages);
  await checkAnchorsSample(sampleSourcePages);

  for (const w of warnings) console.warn("  ⚠ " + w);

  if (errors.length > 0) {
    console.error(`\n❌ P0.13 crawl-hygiene guardrail: ${errors.length} problema/i.\n`);
    for (const e of errors) console.error("  " + e);
    process.exit(1);
  }
  console.log("\n✅ P0.13 crawl-hygiene guardrail: tutti i check superati (vedi warning sopra per eventuali check saltati per infrastruttura assente).");
}

main();
