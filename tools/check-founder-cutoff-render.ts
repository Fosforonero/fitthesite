/**
 * Sprint P0.10E — guardrail "founder:cutoff-render-check".
 *
 * Sprint P0.10K (2026-07-31) — RISCRITTO: chiusura commerciale del sito
 * ANTICIPATA rispetto al cutoff tecnico backend (FOUNDER_END_AT,
 * 2026-07-31T22:00:00Z), decisione di prodotto di Matteo. Fino a P0.10H/J
 * questo guardrail verificava che homepage/header/menu mobile/pricing/
 * footer/beta MOSTRASSERO la variante Founder a cutoff-1s e la
 * nascondessero a cutoff/cutoff+1s (comportamento CORRETTO quando la
 * chiusura coincide col cutoff reale). Da oggi il sito smette di proporre
 * nuove adesioni ORE PRIMA di quell'istante: quell'aspettativa e' ora
 * ESATTAMENTE SBAGLIATA — un test che si aspettasse ancora "aperto a
 * cutoff-1s" fallirebbe la build per il motivo giusto (il gate non c'e'
 * piu') scambiandolo per una regressione.
 *
 * Il nuovo invariante e' piu' semplice e piu' forte: queste superfici sono
 * ora STATICHE e PERMANENTI (nessun gate, nessuna decisione temporale ne'
 * server ne' client) — devono mostrare SEMPRE lo stesso contenuto
 * evergreen/archivio, IMMUNI a qualunque orologio iniettato (prima del
 * cutoff, esattamente al cutoff, dopo il cutoff). Se una futura modifica
 * reintroducesse un gate o una decisione temporale, questo test lo
 * scoprirebbe mostrando la CTA Founder quando l'orologio simula "prima del
 * cutoff" — esattamente cio' che oggi vogliamo che NON accada mai piu'.
 *
 * Eseguito su DUE motori — Chromium e WebKit — stesso motivo di prima
 * (WebKit ha un parsing Date/fuso diverso da V8, quota reale di utenti
 * iOS). Stessa tecnica di iniezione orologio (context.addInitScript con
 * SORGENTE stringa, mai una funzione TS transpilata — vedi commento
 * originale in fixedClockSource sotto per il perche').
 *
 * Richiede un `next start` reale su BASE_URL e Playwright con i browser
 * installati (immagine mcr.microsoft.com/playwright, non node:22 nudo).
 */
import { chromium, webkit, type Browser, type BrowserContext, type BrowserType, type Page } from "playwright";
import { locales } from "@/lib/i18n";
import { FOUNDER_END_AT_MS } from "@/lib/founder/program-window";
import { founderSiteClosedNote } from "@/lib/founder/historical-note";

const ENGINES: Array<{ name: string; launcher: BrowserType }> = [
  { name: "chromium", launcher: chromium },
  { name: "webkit", launcher: webkit },
];

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";

// Tre istanti di confine: se una regressione reintroduce una decisione
// temporale, e' proprio a cutoff-1s ("il programma sarebbe ancora aperto
// secondo il vecchio orologio") che la CTA Founder ricomparirebbe.
const INSTANTS = [
  { label: "cutoff -1s", ms: FOUNDER_END_AT_MS - 1000 },
  { label: "cutoff esatto", ms: FOUNDER_END_AT_MS },
  { label: "cutoff +1s", ms: FOUNDER_END_AT_MS + 1000 },
] as const;

// Marker azionabili di acquisizione Founder: se compaiono su una di queste
// superfici, QUALUNQUE sia l'orologio, e' una regressione.
const FOUNDER_ACQUISITION_RE = /Founder\s*→|founder-launch|Diventa\s+Founder|Become\s+a\s+Founder/i;

interface Failure {
  scenario: string;
  detail: string;
}

function fixedClockSource(fixedMs: number): string {
  return `(() => {
    const FIXED = ${fixedMs};
    const OriginalDate = Date;
    function FixedDate(...args) {
      if (args.length === 0) return new OriginalDate(FIXED);
      return new OriginalDate(...args);
    }
    FixedDate.now = () => FIXED;
    FixedDate.parse = OriginalDate.parse;
    FixedDate.UTC = OriginalDate.UTC;
    FixedDate.prototype = OriginalDate.prototype;
    window.Date = FixedDate;
  })();`;
}

async function withFixedClock(browser: Browser, fixedMs: number): Promise<Page> {
  const context = await browser.newContext();
  await context.addInitScript({ content: fixedClockSource(fixedMs) });
  const page = await context.newPage();
  return page;
}

async function assertClockInjected(page: Page, expectedMs: number, label: string) {
  const actual = await page.evaluate(() => Date.now());
  if (actual !== expectedMs) {
    throw new Error(
      `[${label}] iniezione orologio FALLITA: la pagina legge ${new Date(actual).toISOString()} invece di ${new Date(expectedMs).toISOString()}. Il guardrail non puo' dare un verdetto valido in queste condizioni.`,
    );
  }
}

async function checkHomepageImmuneToClock(page: Page, locale: string, failures: Failure[], label: string, fixedMs: number) {
  await page.goto(`${BASE_URL}/${locale}`, { waitUntil: "networkidle", timeout: 30_000 });
  await assertClockInjected(page, fixedMs, label);

  const headerText = (await page.locator("header").innerText()).toLowerCase();
  if (FOUNDER_ACQUISITION_RE.test(headerText)) {
    failures.push({ scenario: label, detail: `${locale}: header desktop mostra una CTA Founder di acquisizione — atteso zero, indipendentemente dall'orologio (P0.10K, chiusura commerciale del sito).` });
  }

  const footerText = (await page.locator("footer").innerText()).toLowerCase();
  const footerHasLiveBadge = /pro a vita gratis|lifetime pro free/i.test(footerText);
  if (footerHasLiveBadge) {
    failures.push({ scenario: label, detail: `${locale}: footer mostra ancora il badge "Pro a vita gratis" — atteso solo il link neutro "Founder" verso l'archivio, mai la promo.` });
  }

  const bodyText = (await page.locator("body").innerText()).toLowerCase();
  if (/founder\s*(badge|card)/i.test(bodyText)) {
    failures.push({ scenario: label, detail: `${locale}: markup "founder badge/card" presente nel body — atteso assente sempre.` });
  }
  if (FOUNDER_ACQUISITION_RE.test(bodyText)) {
    failures.push({ scenario: label, detail: `${locale}: homepage contiene una CTA Founder di acquisizione azionabile da qualche parte nel body — atteso zero.` });
  }
}

async function checkMobileMenuImmuneToClock(browser: Browser, fixedMs: number, locale: string, failures: Failure[], label: string) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  await context.addInitScript({ content: fixedClockSource(fixedMs) });
  const page = await context.newPage();
  await page.goto(`${BASE_URL}/${locale}`, { waitUntil: "networkidle", timeout: 30_000 });
  await assertClockInjected(page, fixedMs, `${label} (mobile)`);
  const toggle = page.locator('button[aria-label="Apri menu"]');
  await toggle.click({ timeout: 10_000 });
  const nav = page.locator("#mobile-nav");
  await nav.waitFor({ state: "visible", timeout: 10_000 });
  const navText = (await nav.innerText()).toLowerCase();
  if (/founder\s*→/i.test(navText)) {
    failures.push({ scenario: label, detail: `${locale}: menu mobile mostra "Founder →" — atteso zero, indipendentemente dall'orologio.` });
  }
  await context.close();
}

async function checkBetaImmuneToClock(page: Page, locale: string, failures: Failure[], label: string) {
  await page.goto(`${BASE_URL}/${locale}/beta`, { waitUntil: "networkidle", timeout: 30_000 });
  const hasForm = (await page.locator("form").count()) > 0;
  if (hasForm) {
    failures.push({ scenario: label, detail: `${locale}: /beta ha un <form> — atteso zero, e' un archivio informativo permanente.` });
  }
  const bodyText = await page.locator("body").innerText();
  if (FOUNDER_ACQUISITION_RE.test(bodyText)) {
    failures.push({ scenario: label, detail: `${locale}: /beta contiene una CTA Founder di acquisizione azionabile — atteso zero.` });
  }
}

/**
 * Verifica l'HTML grezzo (pre-hydration) di homepage e /beta per TUTTE le
 * 15 locale, via richiesta HTTP pura (`context.request.get`, zero motore
 * JS — l'equivalente di `curl`). Da P0.10K queste pagine sono
 * completamente statiche: il DOM VISIBILE grezzo e quello post-hydration
 * devono essere lo stesso identico contenuto evergreen, sempre.
 */
function stripScriptTags(html: string): string {
  return html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "");
}

function decodeHtmlEntities(html: string): string {
  return html
    .replace(/&#x27;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&amp;/gi, "&");
}

async function checkRawFallback(context: BrowserContext, engineName: string, locale: string, path: string, failures: Failure[]) {
  const label = `${engineName}:raw-html:${path}:${locale}`;
  const res = await context.request.get(`${BASE_URL}/${locale}${path}`);
  if (res.status() !== 200) {
    failures.push({ scenario: label, detail: `${path} ha risposto HTTP ${res.status()} invece di 200.` });
    return;
  }
  const html = await res.text();
  const visible = decodeHtmlEntities(stripScriptTags(html));

  if (FOUNDER_ACQUISITION_RE.test(visible)) {
    failures.push({
      scenario: label,
      detail: `Il DOM VISIBILE dell'HTML grezzo (pre-hydration) di ${path} contiene una CTA Founder di acquisizione azionabile — atteso zero, sempre (P0.10K).`,
    });
  }
  if (/<form[\s>]/i.test(visible) && path === "/beta") {
    failures.push({ scenario: label, detail: `Il DOM VISIBILE dell'HTML grezzo di /beta contiene un <form> — atteso zero.` });
  }
  if (path === "/beta") {
    const expectedFragment = founderSiteClosedNote(locale).slice(0, 30);
    if (!visible.includes(expectedFragment)) {
      failures.push({
        scenario: label,
        detail: `Il DOM VISIBILE dell'HTML grezzo di /beta non contiene il testo invariante atteso (founderSiteClosedNote) — inizio atteso: "${expectedFragment}...". L'archivio statico potrebbe essere silenziosamente cambiato.`,
      });
    }
  }
}

async function runForEngine(engineName: string, launcher: BrowserType, failures: Failure[]) {
  const browser = await launcher.launch();

  console.log(`== [${engineName}] 0/2 — HTML grezzo (pre-hydration) di homepage e /beta su tutte e 15 le locale ==`);
  {
    const context = await browser.newContext();
    for (const locale of locales) {
      await checkRawFallback(context, engineName, locale, "", failures);
      await checkRawFallback(context, engineName, locale, "/beta", failures);
      console.log(`  - raw-html:${locale}: fatto`);
    }
    await context.close();
  }

  console.log(`== [${engineName}] 1/2 — immunita' all'orologio, IT/EN, 3 istanti di confine ==`);
  for (const locale of ["it", "en"]) {
    for (const instant of INSTANTS) {
      const label = `${engineName}:${locale} @ ${instant.label}`;
      const page = await withFixedClock(browser, instant.ms);
      try {
        await checkHomepageImmuneToClock(page, locale, failures, label, instant.ms);
        await checkBetaImmuneToClock(page, locale, failures, label);
      } catch (err) {
        failures.push({ scenario: label, detail: `errore navigazione: ${(err as Error).message}` });
      } finally {
        await page.context().close();
      }
      try {
        await checkMobileMenuImmuneToClock(browser, instant.ms, locale, failures, label);
      } catch (err) {
        failures.push({ scenario: `${label} (mobile menu)`, detail: `errore: ${(err as Error).message}` });
      }
      console.log(`  - ${label}: fatto`);
    }
  }

  console.log(`== [${engineName}] 2/2 — completezza strutturale sulle restanti 13 locale ==`);
  const otherLocales = locales.filter((l) => l !== "it" && l !== "en");
  for (const locale of otherLocales) {
    const context = await browser.newContext();
    const page = await context.newPage();
    try {
      await page.goto(`${BASE_URL}/${locale}`, { waitUntil: "networkidle", timeout: 30_000 });
      const bodyText = await page.locator("body").innerText();
      if (bodyText.trim().length < 50) {
        failures.push({ scenario: `${engineName}:structural:${locale}`, detail: `homepage ${locale} sembra vuota o non renderizzata.` });
      }
    } catch (err) {
      failures.push({ scenario: `${engineName}:structural:${locale}`, detail: `errore navigazione: ${(err as Error).message}` });
    } finally {
      await context.close();
    }
    console.log(`  - ${locale}: fatto`);
  }

  await browser.close();
}

async function main() {
  const failures: Failure[] = [];

  for (const { name, launcher } of ENGINES) {
    await runForEngine(name, launcher, failures);
  }

  if (failures.length > 0) {
    console.error(`\n❌ founder:cutoff-render-check: ${failures.length} problema/i\n`);
    for (const f of failures) console.error(`  - [${f.scenario}] ${f.detail}`);
    process.exit(1);
  } else {
    console.log(
      `\n✅ founder:cutoff-render-check: homepage/header/footer/menu mobile/beta sono immuni a qualunque orologio iniettato (cutoff-1s/esatto/+1s) su IT/EN, HTML grezzo pre-hydration neutro su tutte e 15 le locale (zero CTA Founder, zero form su /beta), 13 locale strutturalmente renderizzate — su ${ENGINES.map((e) => e.name).join(" e ")}.`,
    );
  }
}

main().catch((err) => {
  console.error("founder:cutoff-render-check: errore fatale", err);
  process.exit(1);
});
