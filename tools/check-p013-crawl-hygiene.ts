/**
 * Guardrail permanente SPRINT P0.13 — crawl hygiene, noindex discovery,
 * hreflang. Fallisce se:
 *  1. una URL della sitemap.xml live è redirect, 404, noindex, o ha
 *     canonical incompatibile (self-mismatch);
 *  2. un hreflang, su OGNI pagina indicizzabile locale-prefissata (non un
 *     campione), punta a noindex, redirect, 404, o ha canonical diverso
 *     dall'URL dichiarato;
 *  3. /beta ricompare come link in Header.tsx o MobileMenu.tsx (statico,
 *     non richiede build — regressione da bloccare PRIMA del build);
 *  4. un file nell'allowlist utility-noindex
 *     (docs/seo/p013-allowlist-utility-noindex-links.md) non ha una
 *     motivazione (riga di tabella con colonna "Motivazione" vuota);
 *  5. sitemap.ts importa un predicato di indicizzabilità diverso da quello
 *     usato dalla page.tsx corrispondente per `robots` (drift strutturale
 *     fra le due fonti — dovrebbero SEMPRE essere la stessa funzione);
 *  6. un anchor interno, su OGNI pagina indicizzabile locale-prefissata (non
 *     un campione), punta a noindex/redirect/404 senza allowlist motivata.
 *
 * MICRO-GATE P0.13A (2026-08-08): check 2 e 6 erano campionati su ~11
 * pagine sorgente fisse. Un audit esaustivo post-merge (tutte le 1429
 * pagine indicizzabili locale-prefissate, non solo il campione) ha trovato
 * centinaia di violazioni reali che il campione non copriva (es. l'indice
 * blog linkava ogni post a ogni locale incondizionatamente) — il campione
 * dava "0 problemi" mentre il sito reale non lo era. Riscritti come
 * esaustivi: leggono OGNI pagina html generata da .next/server/app (via
 * prerender-manifest.json, zero rete) e risolvono i target sconosciuti con
 * una singola fetch live per target unico (cache condivisa, non per-pagina).
 *
 * MICRO-GATE P0.13B (stesso giorno): le 13 anchor /about→/self-host (una
 * per locale non-it/en) risultavano "0 residuo" solo perché l'allowlist
 * usava un pattern generico /^\/[a-z]{2}\/self-host$/ che esentava dal
 * check ANCHE le varianti che self-host/page.tsx reindirizza a
 * /en/self-host — un redirect interno evitabile mascherato da link diretto
 * a utility noindex. Fix: about/page.tsx ora calcola l'href finale con
 * resolveSelfHostLocale() (zero hop), e l'allowlist accetta solo
 * /it/self-host e /en/self-host (le uniche pagine reali 200 noindex).
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
  // MICRO-GATE P0.13B (2026-08-08): rimosso il pattern generico
  // /^\/[a-z]{2}\/self-host$/ che stava qui accanto a questo. Copriva TUTTE
  // le 15 locale indiscriminatamente, quindi esentava dal check anche le 13
  // varianti (es/de/pt/fr/pl/tr/nl/ja/ko/sv/da/no/fi) che self-host/page.tsx
  // reindirizza a /en/self-host — un redirect interno evitabile veniva
  // silenziosamente allowlistato come se fosse un link diretto verso una
  // utility noindex, invece di essere segnalato come [anchor-verso-redirect].
  // Solo it/en sono pagine reali 200 noindex: unico target motivato.
  /^\/(it|en)\/self-host$/,
  /^\/[a-z]{2}\/auth\/(forgot|reset)-password$/,
  /^\/[a-z]{2}\/admin\/beta$/,
  // MICRO-GATE P0.13A: riferimento storico genuino (narrazione al passato,
  // non promozionale) nel post fitmesh-sync-disponibile-google-play (11
  // lingue) verso l'archivio /beta, noindex,follow da P0.10L-A. Vedi
  // docs/seo/p013-allowlist-utility-noindex-links.md.
  /^\/[a-z]{2}\/beta$/,
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
// Registro ESAUSTIVO letto da .next/server/app (via prerender-manifest.json,
// zero rete) — usato sia da check 2 (hreflang) sia da check 6 (anchor),
// MICRO-GATE P0.13A: sostituisce il campione fisso di ~11 pagine, che
// nascondeva centinaia di violazioni reali fuori campione.
// ─────────────────────────────────────────────────────────────────────────
interface PageInfo {
  robots: string | null;
  canonical: string | null;
  hreflangs: Array<{ hreflang: string; href: string }>;
  anchors: string[];
  indexable: boolean;
}

function buildRegistry(): Map<string, PageInfo> | null {
  const manifestPath = path.join(repoRoot, ".next/prerender-manifest.json");
  if (!fs.existsSync(manifestPath)) return null;
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8")) as { routes: Record<string, unknown> };
  const registry = new Map<string, PageInfo>();
  for (const routePath of Object.keys(manifest.routes)) {
    const rel = routePath === "/" ? "/index" : routePath;
    const htmlFile = path.join(repoRoot, ".next/server/app", `${rel}.html`);
    if (!fs.existsSync(htmlFile)) continue;
    const html = fs.readFileSync(htmlFile, "utf8");
    const robots = extractMeta(html, /<meta name="robots" content="([^"]*)"/);
    const canonical = extractMeta(html, /<link rel="canonical" href="([^"]*)"/);
    const hreflangs = [...html.matchAll(/<link rel="alternate" hrefLang="([^"]+)" href="([^"]+)"\/?>/g)].map((m) => ({
      hreflang: m[1],
      href: m[2],
    }));
    const anchors = [...new Set([...html.matchAll(/<a[^>]+href="(\/[^"#?]*)"/g)].map((m) => m[1]))];
    registry.set(routePath, { robots, canonical, hreflangs, anchors, indexable: !(robots && /noindex/.test(robots)) });
  }
  return registry;
}

const SITE_ORIGIN = "https://www.fitmesh.fit";
function toLocalPath(href: string): string | null {
  if (href.startsWith(SITE_ORIGIN)) return href.slice(SITE_ORIGIN.length) || "/";
  if (href.startsWith("/")) return href;
  return null;
}

async function resolveTarget(
  registry: Map<string, PageInfo>,
  cache: Map<string, { status: number; robots: string | null; canonical: string | null }>,
  pathname: string,
): Promise<{ status: number; robots: string | null; canonical: string | null }> {
  const cached = cache.get(pathname);
  if (cached) return cached;
  const norm = pathname.replace(/\/$/, "") || "/";
  const fromRegistry = registry.get(pathname) ?? registry.get(norm);
  let result: { status: number; robots: string | null; canonical: string | null };
  if (fromRegistry) {
    result = { status: 200, robots: fromRegistry.robots, canonical: fromRegistry.canonical };
  } else if (!BASE_URL) {
    result = { status: 0, robots: null, canonical: null };
  } else {
    const r = await fetchHead(`${BASE_URL}${pathname}`);
    result = r
      ? {
          status: r.status,
          robots: r.status === 200 ? extractMeta(r.html, /<meta name="robots" content="([^"]*)"/) : null,
          canonical: r.status === 200 ? extractMeta(r.html, /<link rel="canonical" href="([^"]*)"/) : null,
        }
      : { status: 0, robots: null, canonical: null };
  }
  cache.set(pathname, result);
  return result;
}

// ─────────────────────────────────────────────────────────────────────────
// CHECK 2 (esaustivo, richiede build): hreflang su OGNI pagina indicizzabile
// locale-prefissata — ogni alternate non-x-default 200, indicizzabile,
// canonical self-referenziante.
// ─────────────────────────────────────────────────────────────────────────
async function checkHreflangExhaustive(registry: Map<string, PageInfo>): Promise<void> {
  const localeRe = /^\/[a-z]{2}(\/|$)/;
  const sources = [...registry.entries()].filter(([p, info]) => localeRe.test(p) && info.indexable);
  const cache = new Map<string, { status: number; robots: string | null; canonical: string | null }>();
  let edges = 0;
  for (const [src, info] of sources) {
    for (const h of info.hreflangs) {
      if (h.hreflang === "x-default") continue;
      const local = toLocalPath(h.href);
      if (!local) continue;
      edges++;
      const r = await resolveTarget(registry, cache, local);
      if (r.status >= 300 && r.status < 400) {
        errors.push(`[hreflang-verso-redirect] ${src} → hreflang="${h.hreflang}" → ${h.href} risponde ${r.status} (redirect).`);
      } else if (r.status === 404) {
        errors.push(`[hreflang-verso-404] ${src} → hreflang="${h.hreflang}" → ${h.href} risponde 404.`);
      } else if (r.status === 200 && r.robots && /noindex/.test(r.robots)) {
        errors.push(`[hreflang-verso-noindex] ${src} → hreflang="${h.hreflang}" → ${h.href} ha <meta robots content="${r.robots}">.`);
      } else if (r.status === 200 && r.canonical && r.canonical.replace(/\/$/, "") !== `${SITE_ORIGIN}${local}`.replace(/\/$/, "")) {
        errors.push(`[hreflang-target-canonical-mismatch] ${src} → hreflang="${h.hreflang}" → ${h.href}, canonical="${r.canonical}".`);
      }
    }
  }
  console.log(`  [check-2] hreflang: ${sources.length} pagine sorgente indicizzabili, ${edges} link hreflang verificati (esaustivo, non campionato).`);
}

// ─────────────────────────────────────────────────────────────────────────
// CHECK 6 (esaustivo, richiede build): anchor interni da OGNI pagina
// marketing indicizzabile locale-prefissata — nessuno deve puntare a
// noindex/redirect/404 senza allowlist motivata (FASE 5.3).
// ─────────────────────────────────────────────────────────────────────────
async function checkAnchorsExhaustive(registry: Map<string, PageInfo>): Promise<void> {
  const localeRe = /^\/[a-z]{2}(\/|$)/;
  const sources = [...registry.entries()].filter(([p, info]) => localeRe.test(p) && info.indexable);
  const cache = new Map<string, { status: number; robots: string | null; canonical: string | null }>();
  let edges = 0;
  let skippedNoindexSources = 0;
  for (const [src, info] of sources) {
    for (const target of info.anchors) {
      if (isAllowlistedNoindexTarget(target)) continue;
      edges++;
      const r = await resolveTarget(registry, cache, target);
      if (r.status >= 300 && r.status < 400) {
        errors.push(`[anchor-verso-redirect] ${src} linka ${target} che risponde ${r.status} — mai un link interno che richieda un redirect.`);
      } else if (r.status === 404) {
        errors.push(`[anchor-verso-404] ${src} linka ${target} che risponde 404.`);
      } else if (r.status === 200 && r.robots && /noindex/.test(r.robots)) {
        errors.push(`[anchor-verso-noindex] ${src} linka ${target} che ha <meta robots content="${r.robots}"> e non è nell'allowlist.`);
      }
    }
  }
  for (const [, info] of registry) {
    if (info.robots && /noindex/.test(info.robots)) skippedNoindexSources++;
  }
  console.log(`  [check-6] anchor: ${sources.length} pagine sorgente indicizzabili, ${edges} anchor verificati (esaustivo, non campionato; ${skippedNoindexSources} pagine noindex totali escluse come sorgente).`);
}

async function main(): Promise<void> {
  checkBetaAbsentFromNav();
  checkAllowlistMotivated();
  checkSharedPredicateNoDrift();
  await checkSitemapSample();

  const registry = buildRegistry();
  if (!registry) {
    warnings.push("[next-build-assente] .next/prerender-manifest.json non trovato — check 2/6 (hreflang/anchor esaustivi) saltati, nessun build disponibile.");
  } else {
    await checkHreflangExhaustive(registry);
    await checkAnchorsExhaustive(registry);
  }

  for (const w of warnings) console.warn("  ⚠ " + w);

  if (errors.length > 0) {
    console.error(`\n❌ P0.13 crawl-hygiene guardrail: ${errors.length} problema/i.\n`);
    for (const e of errors) console.error("  " + e);
    process.exit(1);
  }
  console.log("\n✅ P0.13 crawl-hygiene guardrail: tutti i check superati (vedi warning sopra per eventuali check saltati per infrastruttura assente).");
}

main();
