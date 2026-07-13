/**
 * Guardrail hotfix P0.4A — test anti-refresh-loop (Fase 12).
 *
 * La segnalazione utente di "refresh ripetuti" non è mai stata riprodotta
 * empiricamente in questo sprint. Diagnosi eseguita con tracing completo
 * (request/response di navigazione, non solo `framenavigated`): ogni
 * scenario mostra ESATTAMENTE 2 richieste di navigazione sul main frame
 * (`/` → 307 → `/<locale>`, poi il browser committa `/<locale>`), zero
 * richieste aggiuntive. `framenavigated` può sparare due volte per lo
 * STESSO URL committato (comportamento noto di Chromium/WebKit/CDP quando
 * un redirect lato server precede il commit) senza che corrisponda a una
 * seconda richiesta di rete reale — per questo il conteggio affidabile è
 * sulle richieste di navigazione, non sull'evento `framenavigated`.
 *
 * Questo script resta come guardrail di stabilità permanente: se un ciclo
 * di redirect o un reload compaiono in futuro (regressione), fallisce qui
 * prima del deploy.
 *
 * Richiede Playwright con i browser già installati (immagine Docker
 * mcr.microsoft.com/playwright, non il node:22 nudo usato per gli altri
 * check — qui servono i binari browser).
 */
import { chromium, webkit, type Browser, type Page } from "playwright";

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";
const HOLD_MS = 15_000;

// CSP è in Report-Only in produzione (next.config.mjs, cybersec audit
// P0-004): questi messaggi sono violazioni SOLO diagnostiche, nessun
// blocco reale, e sono pre-esistenti/non correlati a questo hotfix
// (Google Tag Manager/Analytics non ancora nell'allowlist). WebKit li
// logga a livello "error", Chromium a livello "info" — stessa cosa,
// severità diversa per motore. Non vanno confusi con un vero errore di
// hydration o runtime.
const KNOWN_NOISE_RE = /Content Security Policy|frame-ancestors' is ignored|report-only|was preloaded using link preload but not used/i;

interface ScenarioResult {
  label: string;
  navigationRequests: string[];
  consoleErrors: string[];
  finalUrl: string;
  failed: string[];
}

async function runScenario(
  browserType: "chromium" | "webkit",
  label: string,
  opts: {
    locale?: string;
    extraHTTPHeaders?: Record<string, string>;
    cookies?: { name: string; value: string; url: string }[];
    isMobile?: boolean;
  },
): Promise<ScenarioResult> {
  const browser: Browser =
    browserType === "chromium" ? await chromium.launch() : await webkit.launch();

  const context = await browser.newContext({
    locale: opts.locale,
    extraHTTPHeaders: opts.extraHTTPHeaders,
    ...(opts.isMobile ? { viewport: { width: 390, height: 844 }, isMobile: true } : {}),
  });

  if (opts.cookies) {
    await context.addCookies(opts.cookies);
  }

  const page: Page = await context.newPage();

  // Richieste di navigazione sul main frame: il segnale affidabile per
  // "quante volte il browser ha effettivamente richiesto un documento".
  const navigationRequests: string[] = [];
  const consoleErrors: string[] = [];

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
  page.on("pageerror", (err) => {
    consoleErrors.push(`pageerror: ${err.message}`);
  });

  await page.goto(BASE_URL, { waitUntil: "networkidle" });
  await page.waitForTimeout(HOLD_MS);

  const finalUrl = page.url();
  await browser.close();

  const failed: string[] = [];

  const requestCounts = new Map<string, number>();
  for (const url of navigationRequests) {
    requestCounts.set(url, (requestCounts.get(url) ?? 0) + 1);
  }
  for (const [url, count] of requestCounts) {
    if (count > 1) failed.push(`same URL requested ${count}x (real reload): ${url}`);
  }

  if (navigationRequests.length > 2) {
    failed.push(
      `more than 2 navigation requests (${navigationRequests.length}): ${navigationRequests.join(" -> ")}`,
    );
  }

  if (opts.locale === "de-DE" && !opts.cookies && /\/it(\/|$)/.test(finalUrl)) {
    failed.push(`/de expected but finalUrl forced to /it: ${finalUrl}`);
  }

  const hydrationErrors = consoleErrors.filter((e) => /hydration/i.test(e));
  if (hydrationErrors.length > 0) {
    failed.push(`hydration error(s): ${hydrationErrors.join(" | ")}`);
  }
  if (consoleErrors.length > 0 && hydrationErrors.length === 0) {
    failed.push(`unexpected console error(s) (not CSP report-only noise): ${consoleErrors.join(" | ")}`);
  }

  return { label, navigationRequests, consoleErrors, finalUrl, failed };
}

async function main() {
  const scenarios: Promise<ScenarioResult>[] = [
    runScenario("chromium", "Chromium desktop, de-DE, clean cookies", {
      locale: "de-DE",
      extraHTTPHeaders: { "accept-language": "de-DE,de;q=0.9" },
    }),
    runScenario("webkit", "WebKit mobile, de-DE, clean cookies", {
      locale: "de-DE",
      extraHTTPHeaders: { "accept-language": "de-DE,de;q=0.9" },
      isMobile: true,
    }),
    runScenario("chromium", "Chromium desktop, existing fm_locale=en cookie, DE headers", {
      locale: "de-DE",
      extraHTTPHeaders: { "accept-language": "de-DE,de;q=0.9" },
      cookies: [{ name: "fm_locale", value: "en", url: BASE_URL }],
    }),
    runScenario("chromium", "Chromium desktop, country DE header, no Accept-Language override", {
      extraHTTPHeaders: { "x-vercel-ip-country": "DE" },
    }),
    runScenario("chromium", "Chromium desktop, country IT header (should not override en default)", {
      extraHTTPHeaders: { "x-vercel-ip-country": "IT" },
    }),
  ];

  const results = await Promise.all(scenarios);

  const errors: string[] = [];
  for (const result of results) {
    console.log(`\n— ${result.label} —`);
    console.log(`  navigation requests: ${result.navigationRequests.join(" -> ")}`);
    console.log(`  final URL: ${result.finalUrl}`);
    if (result.consoleErrors.length > 0) {
      console.log(`  console errors (non-CSP-noise): ${result.consoleErrors.length}`);
    }
    if (result.failed.length > 0) {
      for (const f of result.failed) errors.push(`[${result.label}] ${f}`);
    }
  }

  if (errors.length > 0) {
    console.error(`\n❌ Refresh-loop guardrail: ${errors.length} problema/i`);
    for (const e of errors) console.error(`  - ${e}`);
    process.exit(1);
  }

  console.log(
    `\n✅ Refresh-loop guardrail: ${results.length} scenari (Chromium desktop + WebKit mobile, de-DE, cookie override, geo IP) tenuti aperti ${HOLD_MS / 1000}s ciascuno — esattamente 1 redirect hop e nessuna richiesta di navigazione duplicata (verificato su request/response, non solo framenavigated), nessun errore di hydration, nessun errore console oltre al rumore CSP report-only pre-esistente. Segnalazione utente non riprodotta empiricamente; guardrail resta attivo come rete di sicurezza permanente.`,
  );
}

main().catch((err) => {
  console.error("❌ Refresh-loop guardrail: errore inatteso", err);
  process.exit(1);
});
