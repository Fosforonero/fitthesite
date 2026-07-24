/**
 * P0.8A — guardrail anti-loop a livello BROWSER (Playwright reale, non solo
 * fetch HTTP) specifico per la canonicalizzazione nb/nn -> no introdotta in
 * questo branch (vedi middleware.ts, lib/locale-negotiation.ts).
 *
 * `tools/check-locale-routing.ts` verifica gia' status/Location via fetch
 * manuale; questo script verifica che, in un browser reale che SEGUE i
 * redirect, non si generi nessun loop di navigazione, nessun secondo hop,
 * nessun evento `beforeunload` dopo l'assestamento, e che la pagina di
 * destinazione resti popolata e stabile per una permanenza reale (non solo
 * al primo istante) — stesso standard del guardrail P0.4C
 * (`check-anti-loop.ts`), applicato al bug specifico di questa PR.
 *
 * A differenza di `check-anti-loop.ts` (che gira di default contro
 * PRODUZIONE perche' verifica header Critical-CH/Refresh iniettati da un
 * livello che un `next start` locale non riproduce), questo script gira
 * SEMPRE contro BASE_URL locale: il fix nb/nn vive solo su questo branch,
 * non ancora in produzione — testare contro produzione darebbe un falso
 * verde (il bug originale, se ancora presente, non verrebbe rilevato).
 *
 * Richiede Playwright con i browser gia' installati (immagine Docker
 * mcr.microsoft.com/playwright, non il node:22 nudo).
 */
import { chromium, webkit, type Browser, type Page } from "playwright";

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";
const HOLD_MS_DEFAULT = 20_000;
const HOLD_MS_CRITICAL = 45_000; // scenari WebKit "critici" — richiesta esplicita 30-60s
const REDDIT_REFERER = "https://www.reddit.com/";

const KNOWN_NOISE_RE =
  /Content Security Policy|frame-ancestors' is ignored|report-only|was preloaded using link preload but not used/i;

// Bug originale: un prefisso nb/nn non riconosciuto come locale finiva
// "dietro" la lingua negoziata prepend, es. /it/nb/blog/... Qualunque hop
// osservato che matcha questo pattern e' una regressione, a prescindere
// dallo scenario in corso.
const DOUBLE_LOCALE_BUG_RE = /^\/[a-z]{2}\/(?:nb|nn)\b/;

interface ScenarioOpts {
  label: string;
  browserType: "chromium" | "webkit";
  path: string;
  extraHTTPHeaders?: Record<string, string>;
  referer?: string;
  isMobile?: boolean;
  holdMs?: number;
  expectedNavigationCount: number; // 1 = nessun redirect, 2 = un hop
  expectedFinalPath: string; // pathname + search atteso dopo l'assestamento
}

interface ScenarioResult {
  label: string;
  navigationRequests: string[];
  finalUrl: string;
  failed: string[];
}

async function runScenario(opts: ScenarioOpts): Promise<ScenarioResult> {
  const failed: string[] = [];
  const holdMs = opts.holdMs ?? HOLD_MS_DEFAULT;
  const browser: Browser = opts.browserType === "chromium" ? await chromium.launch() : await webkit.launch();
  const context = await browser.newContext({
    extraHTTPHeaders: opts.extraHTTPHeaders,
    ...(opts.isMobile ? { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } : {}),
  });

  let beforeUnloadCount = 0;
  await context.exposeFunction("__reportBeforeUnload", () => {
    beforeUnloadCount++;
  });
  await context.addInitScript(() => {
    window.addEventListener("beforeunload", () => {
      // @ts-expect-error — esposta da context.exposeFunction, non tipizzata su window.
      window.__reportBeforeUnload();
    });
  });

  const navigationRequests: string[] = [];
  const consoleErrors: string[] = [];
  const page: Page = await context.newPage();

  page.on("request", (req) => {
    if (req.isNavigationRequest() && req.frame() === page.mainFrame()) {
      navigationRequests.push(req.url());
    }
  });
  page.on("console", (msg) => {
    if (msg.type() !== "error") return;
    if (KNOWN_NOISE_RE.test(msg.text())) return;
    consoleErrors.push(msg.text());
  });
  page.on("pageerror", (err) => consoleErrors.push(`pageerror: ${err.message}`));

  try {
    // "load" (non "networkidle"): verificato empiricamente contro questo
    // stesso `next start` locale che GA4 (region1.google-analytics.com) e
    // le richieste _rsc di prefetch dei Link viewport si risolvono (anche
    // con esito ERR_ABORTED) entro ~1.5s — "networkidle" avrebbe dovuto
    // stabilizzarsi comunque, ma con 16 scenari lanciati in batch limitato
    // resta un segnale piu' lento e meno deterministico di "load" sotto
    // pressione CPU. Le assert reali (richieste ripetute, beforeunload,
    // contenuto, URL finale) restano identiche e vengono verificate DOPO
    // l'hold, non al momento del goto — "load" e' solo il gate di partenza.
    await page.goto(`${BASE_URL}${opts.path}`, { waitUntil: "load", referer: opts.referer, timeout: 45_000 });
  } catch (err) {
    failed.push(`navigazione iniziale fallita: ${(err as Error).message}`);
    await browser.close();
    return { label: opts.label, navigationRequests, finalUrl: "", failed };
  }

  // Reset: la navigazione about:blank -> URL bersaglio spara sempre un
  // beforeunload sul documento about:blank uscente (comportamento universale
  // Chromium/WebKit, non applicativo) — si conta solo cio' che avviene DOPO
  // che la pagina bersaglio e' realmente caricata. Vedi stessa nota in
  // check-anti-loop.ts.
  beforeUnloadCount = 0;

  const bodyTextAfterLoad = (await page.locator("body").innerText().catch(() => "")).trim();
  await page.waitForTimeout(holdMs);
  const bodyTextAfterHold = (await page.locator("body").innerText().catch(() => "")).trim();
  const finalUrl = page.url();

  await browser.close();

  // ── Acceptance criteria ──────────────────────────────────────────────
  const requestCounts = new Map<string, number>();
  for (const u of navigationRequests) requestCounts.set(u, (requestCounts.get(u) ?? 0) + 1);
  for (const [u, n] of requestCounts) {
    if (n > 1) failed.push(`stessa URL richiesta ${n}x (richiesta di navigazione ripetuta): ${u}`);
  }

  if (navigationRequests.length !== opts.expectedNavigationCount) {
    failed.push(
      `${navigationRequests.length} richieste di navigazione (attese ${opts.expectedNavigationCount}): ${navigationRequests.join(" -> ")}`,
    );
  }

  for (const url of navigationRequests) {
    const pathname = new URL(url).pathname;
    if (DOUBLE_LOCALE_BUG_RE.test(pathname)) {
      failed.push(`hop "${url}" riproduce il bug originale (doppio prefisso locale davanti a nb/nn)`);
    }
  }

  const finalUrlObj = new URL(finalUrl);
  const actualFinalPath = finalUrlObj.pathname + finalUrlObj.search;
  if (actualFinalPath !== opts.expectedFinalPath) {
    failed.push(`URL finale = "${actualFinalPath}" (atteso "${opts.expectedFinalPath}")`);
  }

  if (beforeUnloadCount > 0) {
    failed.push(`${beforeUnloadCount} evento/i beforeunload rilevato/i dopo il load iniziale (reload reale)`);
  }

  if (bodyTextAfterLoad.length === 0) failed.push("contenuto vuoto subito dopo il load (pagina bianca)");
  if (bodyTextAfterHold.length === 0) failed.push(`contenuto vuoto dopo ${holdMs / 1000}s di attesa (pagina svuotata da un reload)`);

  const hydrationErrors = consoleErrors.filter((e) => /hydration/i.test(e));
  if (hydrationErrors.length > 0) failed.push(`errori di hydration: ${hydrationErrors.join(" | ")}`);
  if (consoleErrors.length > 0 && hydrationErrors.length === 0) {
    failed.push(`errori console inattesi (non rumore CSP report-only): ${consoleErrors.join(" | ")}`);
  }

  return { label: opts.label, navigationRequests, finalUrl, failed };
}

async function main() {
  const scenarios: ScenarioOpts[] = [
    // "/" negozia SEMPRE un redirect verso una locale di default (307) —
    // comportamento pre-esistente, non correlato al fix nb/nn (vedi
    // check-refresh-loop.ts: "/ -> 307 -> /<locale>" e' la baseline nota).
    // Con Accept-Language di default del container questo browser risolve
    // a /en: 2 richieste di navigazione (non 1), atteso.
    { label: "1. / (root, header default) -> /en, Chromium", browserType: "chromium", path: "/", expectedNavigationCount: 2, expectedFinalPath: "/en" },
    { label: "2. /it esplicita, Chromium", browserType: "chromium", path: "/it", expectedNavigationCount: 1, expectedFinalPath: "/it" },
    { label: "3. /en esplicita, Chromium", browserType: "chromium", path: "/en", expectedNavigationCount: 1, expectedFinalPath: "/en" },
    { label: "4. /no esplicita (stabilita', nessun redirect), Chromium", browserType: "chromium", path: "/no", expectedNavigationCount: 1, expectedFinalPath: "/no" },
    { label: "5. /nb -> /no (single hop), Chromium", browserType: "chromium", path: "/nb", expectedNavigationCount: 2, expectedFinalPath: "/no" },
    { label: "6. /nn -> /no (single hop), Chromium", browserType: "chromium", path: "/nn", expectedNavigationCount: 2, expectedFinalPath: "/no" },
    { label: "7. /nb/blog?utm_source=x -> /no/blog?utm_source=x (query preservata), Chromium", browserType: "chromium", path: "/nb/blog?utm_source=x", expectedNavigationCount: 2, expectedFinalPath: "/no/blog?utm_source=x" },
    { label: "8. /nn/blog?utm_source=x -> /no/blog?utm_source=x (query preservata), Chromium", browserType: "chromium", path: "/nn/blog?utm_source=x", expectedNavigationCount: 2, expectedFinalPath: "/no/blog?utm_source=x" },
    { label: "9. Accept-Language nb-NO su / -> /no, Chromium", browserType: "chromium", path: "/", extraHTTPHeaders: { "accept-language": "nb-NO" }, expectedNavigationCount: 2, expectedFinalPath: "/no" },
    { label: "10. Accept-Language nn-NO su / -> /no, Chromium", browserType: "chromium", path: "/", extraHTTPHeaders: { "accept-language": "nn-NO" }, expectedNavigationCount: 2, expectedFinalPath: "/no" },
    { label: "11. Accept-Language no-NO su / -> /no, Chromium", browserType: "chromium", path: "/", extraHTTPHeaders: { "accept-language": "no-NO" }, expectedNavigationCount: 2, expectedFinalPath: "/no" },
    { label: "12. Accept-Language it-IT in conflitto con /no esplicita (deve restare su /no), Chromium", browserType: "chromium", path: "/no", extraHTTPHeaders: { "accept-language": "it-IT" }, expectedNavigationCount: 1, expectedFinalPath: "/no" },
    { label: "13. Referrer Reddit su /nb -> /no, Chromium", browserType: "chromium", path: "/nb", referer: REDDIT_REFERER, expectedNavigationCount: 2, expectedFinalPath: "/no" },
    { label: "14. [WebKit mobile critico] /nb/blog?utm_source=x -> /no/blog?utm_source=x", browserType: "webkit", path: "/nb/blog?utm_source=x", isMobile: true, holdMs: HOLD_MS_CRITICAL, expectedNavigationCount: 2, expectedFinalPath: "/no/blog?utm_source=x" },
    { label: "15. [WebKit mobile critico] Accept-Language nb-NO su / -> /no", browserType: "webkit", path: "/", extraHTTPHeaders: { "accept-language": "nb-NO" }, isMobile: true, holdMs: HOLD_MS_CRITICAL, expectedNavigationCount: 2, expectedFinalPath: "/no" },
    { label: "16. [WebKit mobile critico] /no con Accept-Language it-IT in conflitto (stabilita')", browserType: "webkit", path: "/no", extraHTTPHeaders: { "accept-language": "it-IT" }, isMobile: true, holdMs: HOLD_MS_CRITICAL, expectedNavigationCount: 1, expectedFinalPath: "/no" },
  ];

  // Concorrenza limitata: 16 browser Chromium/WebKit lanciati tutti insieme
  // saturano una macchina di sviluppo (6 core) e rendono "load" stesso
  // lento/instabile per motivi di contesa CPU, non per un vero problema
  // applicativo. 4 alla volta e' un compromesso empiricamente stabile.
  const CONCURRENCY = 4;
  const results: ScenarioResult[] = new Array(scenarios.length);
  let nextIdx = 0;
  async function worker() {
    while (nextIdx < scenarios.length) {
      const idx = nextIdx++;
      results[idx] = await runScenario(scenarios[idx]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, scenarios.length) }, worker));

  const errors: string[] = [];
  for (const result of results) {
    console.log(`\n— ${result.label} —`);
    console.log(`  navigazioni: ${result.navigationRequests.join(" -> ")}`);
    console.log(`  URL finale: ${result.finalUrl}`);
    if (result.failed.length === 0) {
      console.log("  OK");
    } else {
      for (const f of result.failed) {
        console.log(`  FAIL: ${f}`);
        errors.push(`[${result.label}] ${f}`);
      }
    }
  }

  if (errors.length > 0) {
    console.error(`\n❌ Anti-loop locale routing guardrail (nb/nn/no): ${errors.length} problema/i`);
    process.exit(1);
  }

  console.log(
    `\n✅ Anti-loop locale routing guardrail: ${results.length} scenari (Chromium desktop + WebKit mobile, Accept-Language nb-NO/nn-NO/no-NO, referrer Reddit, conflitto Accept-Language vs /no esplicita, query string) verificati contro ${BASE_URL} — zero richieste ripetute, zero beforeunload dopo l'assestamento, un solo hop dove atteso, nessun /it/nb o doppio prefisso, contenuto sempre presente.`,
  );
}

main().catch((err) => {
  console.error("❌ Anti-loop locale routing guardrail: errore inatteso", err);
  process.exit(1);
});
