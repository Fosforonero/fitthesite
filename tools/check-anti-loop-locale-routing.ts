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
 * Scenari 1-16 girano contro BASE_URL locale: verificano la canonicalizzazione
 * nb/nn -> no, che va provata PRIMA del deploy (testarla in produzione prima
 * che il fix sia live darebbe un falso verde, il bug originale non verrebbe
 * rilevato). Scenari 17-19 girano deliberatamente contro PRODUZIONE, come
 * `check-anti-loop.ts`: verificano la negoziazione reale Accept-Language/
 * country, che dipende da x-vercel-ip-country — header iniettato solo
 * dall'edge Vercel vero, mai riproducibile da un `next start` locale.
 *
 * Richiede Playwright con i browser gia' installati (immagine Docker
 * mcr.microsoft.com/playwright, non il node:22 nudo).
 *
 * Scenari 17-19 (produzione): la negoziazione reale (lib/locale-negotiation.ts)
 * e' cookie -> Accept-Language -> x-vercel-ip-country -> 'en' finale. Un
 * ambiente di test SENZA alcun segnale non e' "nessun segnale" in produzione:
 * Vercel inietta comunque x-vercel-ip-country in base all'IP del chiamante,
 * quindi da un IP italiano '/' -> '/it' e' il comportamento CORRETTO, non un
 * bug. 'en' e' il fallback finale solo quando mancano cookie, Accept-Language
 * E country. Locale (nessun header Vercel possibile) resta l'unico posto
 * dove "nessun segnale -> /en" e' un'asserzione deterministica valida.
 */
import { chromium, webkit, type Browser, type Page } from "playwright";
import { locales } from "@/lib/i18n";

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";
const PRODUCTION_BASE_URL = "https://www.fitmesh.fit";
const SUPPORTED_LOCALE_ROOT_PATHS = locales.map((l) => `/${l}`);
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
  baseUrl?: string; // default BASE_URL; scenari produzione lo sovrascrivono con PRODUCTION_BASE_URL
  path: string;
  extraHTTPHeaders?: Record<string, string>;
  referer?: string;
  isMobile?: boolean;
  holdMs?: number;
  expectedNavigationCount: number; // 1 = nessun redirect, 2 = un hop
  // pathname + search atteso dopo l'assestamento. Una stringa esatta per gli
  // scenari deterministici; { oneOf } quando l'esito dipende da un segnale
  // runtime non riproducibile in ambiente di test (GeoIP dell'IP chiamante).
  expectedFinalPath: string | { oneOf: readonly string[] };
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
    await page.goto(`${opts.baseUrl ?? BASE_URL}${opts.path}`, { waitUntil: "load", referer: opts.referer, timeout: 45_000 });
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
  if (typeof opts.expectedFinalPath === "string") {
    if (actualFinalPath !== opts.expectedFinalPath) {
      failed.push(`URL finale = "${actualFinalPath}" (atteso "${opts.expectedFinalPath}")`);
    }
  } else if (!opts.expectedFinalPath.oneOf.includes(actualFinalPath)) {
    failed.push(
      `URL finale = "${actualFinalPath}" non e' una locale supportata tra quelle attese (${opts.expectedFinalPath.oneOf.join(", ")})`,
    );
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
    // Questo scenario gira SEMPRE contro BASE_URL locale (mai produzione):
    // e' l'unico posto dove "nessun segnale" e' davvero vero, perche' un
    // `next start` locale non riceve mai x-vercel-ip-country (header
    // iniettato solo dall'edge Vercel) — cookie assente, Accept-Language
    // assente/non risolvibile, country assente -> 'en' e' l'unico esito
    // deterministico possibile (vedi resolveNegotiatedLocale in
    // lib/locale-negotiation.ts). In produzione questa stessa richiesta
    // risolverebbe secondo il country dell'IP chiamante — vedi scenario 19.
    { label: "1. / locale, nessun segnale (niente cookie/Accept-Language/country) -> /en, Chromium", browserType: "chromium", path: "/", expectedNavigationCount: 2, expectedFinalPath: "/en" },
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

    // 17-19. [PRODUZIONE] negoziazione reale cookie/Accept-Language/country.
    // A differenza di 1-16 (sempre locali), questi puntano deliberatamente a
    // PRODUCTION_BASE_URL: x-vercel-ip-country esiste solo dietro l'edge
    // Vercel vero, non riproducibile da un `next start` locale.
    { label: "17. [PRODUZIONE] Accept-Language en-US esplicito -> /en, Chromium", browserType: "chromium", baseUrl: PRODUCTION_BASE_URL, path: "/", extraHTTPHeaders: { "accept-language": "en-US,en;q=0.9" }, expectedNavigationCount: 2, expectedFinalPath: "/en" },
    { label: "18. [PRODUZIONE] Accept-Language de-DE esplicito -> /de, Chromium", browserType: "chromium", baseUrl: PRODUCTION_BASE_URL, path: "/", extraHTTPHeaders: { "accept-language": "de-DE,de;q=0.9" }, expectedNavigationCount: 2, expectedFinalPath: "/de" },
    // Nessun Accept-Language esplicito: l'esito dipende dal country dell'IP
    // di chi esegue il test (non deterministico tra ambienti/CI), quindi
    // verifichiamo solo che sia una delle 15 locale supportate, stabile e
    // senza loop — MAI un'asserzione rigida su quale locale specifica.
    { label: "19. [PRODUZIONE] nessun Accept-Language esplicito -> locale determinata dal country Vercel (qualunque locale supportata, stabile), Chromium", browserType: "chromium", baseUrl: PRODUCTION_BASE_URL, path: "/", expectedNavigationCount: 2, expectedFinalPath: { oneOf: SUPPORTED_LOCALE_ROOT_PATHS } },
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
    `\n✅ Anti-loop locale routing guardrail: ${results.length} scenari (1-16 contro ${BASE_URL}: Chromium desktop + WebKit mobile, Accept-Language nb-NO/nn-NO/no-NO, referrer Reddit, conflitto Accept-Language vs /no esplicita, query string; 17-19 contro ${PRODUCTION_BASE_URL}: Accept-Language esplicito -> locale corrispondente, nessun Accept-Language -> qualunque locale supportata via country Vercel) — zero richieste ripetute, zero beforeunload dopo l'assestamento, un solo hop dove atteso, nessun /it/nb o doppio prefisso, contenuto sempre presente.`,
  );
}

main().catch((err) => {
  console.error("❌ Anti-loop locale routing guardrail: errore inatteso", err);
  process.exit(1);
});
