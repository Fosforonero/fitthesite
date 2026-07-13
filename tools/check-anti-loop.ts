/**
 * Guardrail P0.4C — anti-loop reale (incidente reload iOS Safari/Reddit).
 *
 * Diverso dai guardrail precedenti (`check-refresh-loop.ts` P0.4A,
 * `diagnose-cold-hop.ts` P0.4B) per due motivi:
 *  1. Verifica ESPLICITAMENTE l'assenza degli header che hanno causato
 *     l'incidente (`Critical-CH`/`Refresh`), non solo il conteggio delle
 *     richieste di navigazione.
 *  2. Tiene la pagina aperta 60s (non 15/30s) e conta anche gli eventi
 *     `beforeunload` nella pagina stessa — un reload che Playwright non
 *     intercetta come nuova `request` di navigazione (raro, ma e' la classe
 *     di bug di questo incidente) farebbe comunque scattare `beforeunload`.
 *
 * Gira di default contro PRODUZIONE (`https://` reale, non `next start`
 * locale): gli header Critical-CH/Refresh sono iniettati da un livello
 * (Vercel edge / next.config.mjs redirects, vedi middleware.ts) che un
 * server Next.js locale non riproduce — testare in locale darebbe un falso
 * verde. Override con BASE_URL/APEX_URL se serve puntare altrove.
 *
 * Richiede Playwright con i browser installati (immagine Docker
 * mcr.microsoft.com/playwright).
 */
import { chromium, webkit, type Browser, type Page, type Response } from "playwright";

const WWW_BASE = process.env.BASE_URL ?? "https://www.fitmesh.fit";
const APEX_BASE = process.env.APEX_URL ?? "https://fitmesh.fit";
const HOLD_MS = 60_000;
const REDDIT_REFERER = "https://www.reddit.com/";

const KNOWN_NOISE_RE =
  /Content Security Policy|frame-ancestors' is ignored|report-only|was preloaded using link preload but not used/i;

interface ScenarioOpts {
  label: string;
  browserType: "chromium" | "webkit";
  url: string;
  referer?: string;
  isMobile?: boolean;
}

interface ScenarioResult {
  label: string;
  failed: string[];
}

async function runScenario(opts: ScenarioOpts): Promise<ScenarioResult> {
  const failed: string[] = [];
  const browser: Browser = opts.browserType === "chromium" ? await chromium.launch() : await webkit.launch();
  const context = await browser.newContext(
    opts.isMobile ? { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } : {},
  );

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

  const navigationRequestUrls: string[] = [];
  const consoleErrors: string[] = [];
  const headerViolations: string[] = [];

  const page: Page = await context.newPage();

  page.on("request", (req) => {
    if (req.isNavigationRequest() && req.frame() === page.mainFrame()) {
      navigationRequestUrls.push(req.url());
    }
  });
  page.on("response", (res: Response) => {
    if (res.request().frame() !== page.mainFrame()) return;
    const headers = res.headers();
    if (headers["critical-ch"]) {
      headerViolations.push(`Critical-CH presente su ${res.url()}: "${headers["critical-ch"]}"`);
    }
    if (headers["refresh"]) {
      headerViolations.push(`Refresh presente su ${res.url()}: "${headers["refresh"]}"`);
    }
  });
  page.on("console", (msg) => {
    if (msg.type() !== "error") return;
    if (KNOWN_NOISE_RE.test(msg.text())) return;
    consoleErrors.push(msg.text());
  });
  page.on("pageerror", (err) => consoleErrors.push(`pageerror: ${err.message}`));

  const urlBefore = opts.url;
  try {
    await page.goto(opts.url, { waitUntil: "networkidle", referer: opts.referer });
  } catch (err) {
    failed.push(`navigazione iniziale fallita: ${(err as Error).message}`);
    await browser.close();
    return { label: opts.label, failed };
  }

  const urlAfterLoad = page.url();
  const bodyTextAfterLoad = (await page.locator("body").innerText().catch(() => "")).trim();

  await page.waitForTimeout(HOLD_MS);

  const urlAfterHold = page.url();
  const bodyTextAfterHold = (await page.locator("body").innerText().catch(() => "")).trim();

  await browser.close();

  // ── Acceptance criteria ────────────────────────────────────────────────
  const requestCounts = new Map<string, number>();
  for (const u of navigationRequestUrls) requestCounts.set(u, (requestCounts.get(u) ?? 0) + 1);
  for (const [u, n] of requestCounts) {
    if (n > 1) failed.push(`stessa URL richiesta ${n}x (richiesta di navigazione ripetuta): ${u}`);
  }

  if (urlAfterLoad !== urlAfterHold) {
    failed.push(`URL non stabile: dopo il load="${urlAfterLoad}", dopo ${HOLD_MS / 1000}s="${urlAfterHold}"`);
  }

  if (beforeUnloadCount > 0) {
    failed.push(`${beforeUnloadCount} evento/i beforeunload rilevato/i (reload reale dopo il load iniziale)`);
  }

  if (bodyTextAfterLoad.length === 0) {
    failed.push("contenuto vuoto subito dopo il load (pagina bianca)");
  }
  if (bodyTextAfterHold.length === 0) {
    failed.push(`contenuto vuoto dopo ${HOLD_MS / 1000}s di attesa (pagina svuotata da un reload)`);
  }

  if (headerViolations.length > 0) failed.push(...headerViolations);

  const hydrationErrors = consoleErrors.filter((e) => /hydration/i.test(e));
  if (hydrationErrors.length > 0) failed.push(`errori di hydration: ${hydrationErrors.join(" | ")}`);
  if (consoleErrors.length > 0 && hydrationErrors.length === 0) {
    failed.push(`errori console inattesi (non rumore CSP report-only): ${consoleErrors.join(" | ")}`);
  }

  void urlBefore;
  return { label: opts.label, failed };
}

/** CTA App Store + Play Store: verifica separata via HTML statico (piu' robusta di un click reale su un link esterno). */
async function checkStoreCtasClickable(): Promise<string[]> {
  const failed: string[] = [];
  const res = await fetch(`${WWW_BASE}/en`);
  const html = await res.text();

  if (/aria-disabled="true"[^>]*(App Store|Google Play)|(App Store|Google Play)[^<]*aria-disabled="true"/i.test(html)) {
    failed.push("CTA store: trovato aria-disabled=\"true\" vicino a un bottone store");
  }
  if (!/href="https:\/\/apps\.apple\.com\/app\/fitmesh-sync\/id\d+"/.test(html)) {
    failed.push("CTA App Store: nessun href assoluto verso apps.apple.com trovato su /en");
  }
  if (!/href="https:\/\/play\.google\.com\/store\/apps\/details\?id=[\w.]+"/.test(html)) {
    failed.push("CTA Play Store: nessun href assoluto verso play.google.com trovato su /en");
  }
  return failed;
}

async function main() {
  const scenarios: ScenarioOpts[] = [
    { label: "1. apex, referrer Reddit-like, Chromium", browserType: "chromium", url: `${APEX_BASE}/`, referer: REDDIT_REFERER },
    { label: "2. apex, contesto browser pulito (nessun referrer), Chromium", browserType: "chromium", url: `${APEX_BASE}/` },
    { label: "3. www root, Chromium", browserType: "chromium", url: `${WWW_BASE}/` },
    { label: "4. www/de diretta, Chromium", browserType: "chromium", url: `${WWW_BASE}/de` },
    { label: "5a. www/it diretta, Chromium", browserType: "chromium", url: `${WWW_BASE}/it` },
    { label: "5b. www/en diretta, Chromium", browserType: "chromium", url: `${WWW_BASE}/en` },
    { label: "6. apex, referrer Reddit-like, WebKit mobile (Safari)", browserType: "webkit", url: `${APEX_BASE}/`, referer: REDDIT_REFERER, isMobile: true },
  ];

  const results = await Promise.all(scenarios.map(runScenario));

  const errors: string[] = [];
  for (const result of results) {
    console.log(`\n— ${result.label} —`);
    if (result.failed.length === 0) {
      console.log(`  OK (nessuna richiesta ripetuta, URL stabile, 0 beforeunload, 0 Critical-CH/Refresh, tenuto ${HOLD_MS / 1000}s)`);
    } else {
      for (const f of result.failed) {
        console.log(`  FAIL: ${f}`);
        errors.push(`[${result.label}] ${f}`);
      }
    }
  }

  console.log(`\n— 7. CTA App Store + Play Store cliccabili (${WWW_BASE}/en) —`);
  const ctaFailed = await checkStoreCtasClickable();
  if (ctaFailed.length === 0) {
    console.log("  OK");
  } else {
    for (const f of ctaFailed) {
      console.log(`  FAIL: ${f}`);
      errors.push(`[CTA store] ${f}`);
    }
  }

  if (errors.length > 0) {
    console.error(`\n❌ Anti-loop guardrail: ${errors.length} problema/i`);
    process.exit(1);
  }

  console.log(
    `\n✅ Anti-loop guardrail: ${results.length} scenari (apex/www/de/it/en, Chromium + WebKit mobile, referrer Reddit-like incluso) tenuti aperti ${HOLD_MS / 1000}s ciascuno — zero richieste di navigazione ripetute, zero beforeunload dopo il load, URL stabile, contenuto sempre presente, zero Critical-CH/Refresh su ogni risposta osservata, CTA store live e cliccabili, zero errori console oltre al rumore CSP report-only pre-esistente.`,
  );
}

main().catch((err) => {
  console.error("❌ Anti-loop guardrail: errore inatteso", err);
  process.exit(1);
});
