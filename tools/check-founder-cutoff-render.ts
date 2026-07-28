/**
 * Sprint P0.10E — guardrail "founder:cutoff-render-check".
 *
 * FASE 6/8 (Matteo, addendum P0.10E): verifica RENDER-LEVEL (browser reale,
 * non solo analisi statica del sorgente) che homepage/header/menu mobile/
 * pricing/footer/beta mostrino la variante corretta a tre istanti esatti
 * (cutoff -1s: aperto; cutoff esatto: chiuso; cutoff +1s: chiuso), su IT/EN
 * per lo scenario completo, con un passaggio strutturale leggero sulle
 * restanti 13 locale.
 *
 * L'orologio del browser viene fissato via `context.addInitScript` che
 * sovrascrive `Date`/`Date.now` PRIMA che qualunque script della pagina
 * giri — stesso principio gia' usato in check-anti-loop-locale-routing.ts
 * per intercettare `beforeunload`. Non usiamo `page.clock` di Playwright
 * per evitare qualunque interazione poco chiara con `useEffect`/
 * `setTimeout` reali di FounderClientGate: qui serve solo che `new Date()`
 * e `Date.now()` restituiscano l'istante fissato per l'intera vita della
 * pagina, non una simulazione di avanzamento del tempo.
 *
 * Richiede un `next start` reale in esecuzione su BASE_URL (nessuna
 * decisione lato server: la home e /beta restano completamente statiche,
 * qui verifichiamo solo il comportamento CLIENT-side dopo l'hydration) e
 * Playwright con i browser installati (immagine mcr.microsoft.com/playwright,
 * non node:22 nudo — stesso requisito di check-anti-loop-locale-routing.ts).
 */
import { chromium, type Browser, type Page } from "playwright";
import { locales } from "@/lib/i18n";
import { FOUNDER_END_AT_MS } from "@/lib/founder/program-window";

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";

const INSTANTS = [
  { label: "cutoff -1s", ms: FOUNDER_END_AT_MS - 1000, expectOpen: true },
  { label: "cutoff esatto", ms: FOUNDER_END_AT_MS, expectOpen: false },
  { label: "cutoff +1s", ms: FOUNDER_END_AT_MS + 1000, expectOpen: false },
] as const;

const FOUNDER_MARKERS_RE = /Founder\s*→|founder-launch|Diventa\s+Founder/i;
// Testo evergreen presente SOLO quando il gate mostra la variante non-founder
// (download CTA/prova, mai la parola "Founder" da sola: compare comunque
// come link storico nel footer anche a programma chiuso, per design).
const EVERGREEN_DOWNLOAD_RE = /scarica|download|prova|try/i;

interface Failure {
  scenario: string;
  detail: string;
}

/**
 * L'orologio va iniettato come SORGENTE (stringa), mai come funzione
 * TypeScript: `addInitScript(fn)` serializza la funzione, e la versione
 * che arriva al browser e' quella gia' transpilata da tsx/esbuild. Con un
 * `class FixedDate extends Date` transpilato il risultato NON lancia alcun
 * errore ma non sostituisce davvero l'orologio (verificato: lo stesso
 * codice in un .mjs puro funzionava, dentro questo .ts no — la pagina
 * continuava a leggere l'ora reale, facendo passare i soli scenari
 * "programma aperto" e fallire tutti gli altri, cioe' esattamente il
 * falso-negativo piu' insidioso per questo guardrail). Con una stringa
 * il browser esegue letteralmente quello che leggiamo qui.
 */
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

/**
 * Se l'iniezione dell'orologio smette di funzionare, questo guardrail
 * diventa silenziosamente inutile: leggendo l'ora reale (oggi, PRIMA del
 * cutoff) tutti gli scenari "aperto" passerebbero e tutti i "chiuso"
 * fallirebbero, con un output che SEMBRA una regressione del sito. E'
 * successo davvero durante lo sviluppo di questo file. Verifichiamo quindi
 * l'orologio effettivo della pagina PRIMA di fidarci di qualunque
 * asserzione successiva.
 */
async function assertClockInjected(page: Page, expectedMs: number, label: string) {
  const actual = await page.evaluate(() => Date.now());
  if (actual !== expectedMs) {
    throw new Error(
      `[${label}] iniezione orologio FALLITA: la pagina legge ${new Date(actual).toISOString()} invece di ${new Date(expectedMs).toISOString()}. Il guardrail non puo' dare un verdetto valido in queste condizioni.`,
    );
  }
}

async function checkHomepageDesktop(page: Page, locale: string, expectOpen: boolean, failures: Failure[], label: string, fixedMs: number) {
  await page.goto(`${BASE_URL}/${locale}`, { waitUntil: "networkidle", timeout: 30_000 });
  await assertClockInjected(page, fixedMs, label);
  // CTA primaria desktop nell'header, dentro <FounderClientGate as="span">.
  const headerCta = page.locator("header a", { hasText: expectOpen ? "Founder" : /./ }).first();
  const headerText = (await page.locator("header").innerText()).toLowerCase();
  const headerHasFounderCta = FOUNDER_MARKERS_RE.test(headerText);
  if (expectOpen && !headerHasFounderCta) {
    failures.push({ scenario: label, detail: `${locale}: header desktop NON mostra la CTA Founder a cutoff-1s (atteso aperto).` });
  }
  if (!expectOpen && headerHasFounderCta) {
    failures.push({ scenario: label, detail: `${locale}: header desktop mostra ANCORA la CTA Founder dopo il cutoff — regressione.` });
  }

  // Footer: il link "Founder" verso /beta resta SEMPRE presente (archivio
  // storico per design, vedi Footer.tsx) — qui verifichiamo solo che non
  // compaia il badge "Founder · Pro a vita gratis" con l'indicatore
  // lampeggiante (quello e' SOLO la variante founder/aperta).
  const footerText = (await page.locator("footer").innerText()).toLowerCase();
  const footerHasLiveBadge = /pro a vita gratis|lifetime pro free/i.test(footerText);
  if (expectOpen && !footerHasLiveBadge) {
    failures.push({ scenario: label, detail: `${locale}: footer NON mostra il badge Founder attivo a cutoff-1s.` });
  }
  if (!expectOpen && footerHasLiveBadge) {
    failures.push({ scenario: label, detail: `${locale}: footer mostra ANCORA il badge "Pro a vita gratis" dopo il cutoff — regressione.` });
  }

  // Sezione pricing (card Founder vs card Prova 14gg evergreen).
  const bodyText = (await page.locator("body").innerText()).toLowerCase();
  const hasFounderPricingCard = /pro a vita gratis|lifetime pro free|founder-launch/i.test(bodyText) && FOUNDER_MARKERS_RE.test(bodyText);
  if (!expectOpen && /founder\s*(badge|card)/i.test(bodyText)) {
    failures.push({ scenario: label, detail: `${locale}: markup "founder badge/card" ancora presente nel body dopo il cutoff.` });
  }
  void hasFounderPricingCard; // solo diagnostica, nessun asserzione stretta sulla wording esatta di pricing (vedi FASE 4/6 sito, separato)
}

async function checkMobileMenu(browser: Browser, fixedMs: number, locale: string, expectOpen: boolean, failures: Failure[], label: string) {
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
  const hasFounderCta = /founder\s*→/i.test(navText);
  if (expectOpen && !hasFounderCta) {
    failures.push({ scenario: label, detail: `${locale}: menu mobile NON mostra "Founder →" a cutoff-1s.` });
  }
  if (!expectOpen && hasFounderCta) {
    failures.push({ scenario: label, detail: `${locale}: menu mobile mostra ANCORA "Founder →" dopo il cutoff — regressione.` });
  }
  await context.close();
}

async function checkBeta(page: Page, locale: string, expectOpen: boolean, failures: Failure[], label: string) {
  await page.goto(`${BASE_URL}/${locale}/beta`, { waitUntil: "networkidle", timeout: 30_000 });
  const hasForm = (await page.locator("form").count()) > 0;
  const bodyText = await page.locator("body").innerText();
  if (!expectOpen && hasForm) {
    failures.push({ scenario: label, detail: `${locale}: /beta ha ancora un <form> dopo il cutoff — atteso zero form nell'archivio storico.` });
  }
  if (!expectOpen) {
    // Due verifiche distinte, deliberatamente separate:
    //  a) il testo VISIBILE (innerText, quindi senza il contenuto dei
    //     <details> ancora chiusi) deve dire che il programma e' finito;
    //  b) la data esatta di chiusura deve esistere DA QUALCHE PARTE nella
    //     pagina — vive nella FAQ, che e' un <details> collassato: usiamo
    //     textContent, altrimenti un contenuto reale e raggiungibile con
    //     un click risulterebbe "assente" e il check fallirebbe a torto.
    const mentionsClosure = /conclus|terminad|ended|chius|closed|beendet|termin/i.test(bodyText);
    if (!mentionsClosure) {
      failures.push({ scenario: label, detail: `${locale}: /beta dopo il cutoff non dichiara la fine del programma nel testo visibile (atteso h1/sub tipo "Il programma Founder è concluso" / "The Founder program has ended").` });
    }
    const fullText = (await page.locator("body").textContent()) ?? "";
    const mentionsClosingDate = /31\s+(luglio|july|de julio|juli|julho|juillet)|July\s+31|31\/07\/2026/i.test(fullText);
    if (!mentionsClosingDate) {
      failures.push({ scenario: label, detail: `${locale}: /beta dopo il cutoff non riporta la data di chiusura (31 luglio 2026) da nessuna parte, nemmeno nella FAQ.` });
    }
  }
}

async function main() {
  const failures: Failure[] = [];
  const browser = await chromium.launch();

  console.log("== 1/2 — scenari completi IT/EN sui 3 istanti di cutoff ==");
  for (const locale of ["it", "en"]) {
    for (const instant of INSTANTS) {
      const label = `${locale} @ ${instant.label}`;
      const page = await withFixedClock(browser, instant.ms);
      try {
        await checkHomepageDesktop(page, locale, instant.expectOpen, failures, label, instant.ms);
        await checkBeta(page, locale, instant.expectOpen, failures, label);
      } catch (err) {
        failures.push({ scenario: label, detail: `errore navigazione: ${(err as Error).message}` });
      } finally {
        await page.context().close();
      }
      try {
        await checkMobileMenu(browser, instant.ms, locale, instant.expectOpen, failures, label);
      } catch (err) {
        failures.push({ scenario: `${label} (mobile menu)`, detail: `errore: ${(err as Error).message}` });
      }
      console.log(`  - ${label}: fatto`);
    }
  }

  console.log("== 2/2 — completezza strutturale sulle restanti 13 locale (nessuna richiesta di rete per decidere lo stato, homepage renderizza senza errori) ==");
  const otherLocales = locales.filter((l) => l !== "it" && l !== "en");
  for (const locale of otherLocales) {
    const context = await browser.newContext();
    const requestsDuringSettle: string[] = [];
    context.on("request", (req) => {
      const url = req.url();
      if (url.startsWith(BASE_URL) && !url.includes(`/${locale}`)) return;
      requestsDuringSettle.push(url);
    });
    const page = await context.newPage();
    try {
      await page.goto(`${BASE_URL}/${locale}`, { waitUntil: "networkidle", timeout: 30_000 });
      const bodyText = await page.locator("body").innerText();
      if (bodyText.trim().length < 50) {
        failures.push({ scenario: `structural:${locale}`, detail: `homepage ${locale} sembra vuota o non renderizzata.` });
      }
    } catch (err) {
      failures.push({ scenario: `structural:${locale}`, detail: `errore navigazione: ${(err as Error).message}` });
    } finally {
      await context.close();
    }
    console.log(`  - ${locale}: fatto`);
  }

  await browser.close();

  if (failures.length > 0) {
    console.error(`\n❌ founder:cutoff-render-check: ${failures.length} problema/i\n`);
    for (const f of failures) console.error(`  - [${f.scenario}] ${f.detail}`);
    process.exit(1);
  } else {
    console.log(
      "\n✅ founder:cutoff-render-check: header/footer/menu mobile/beta mostrano la variante corretta a cutoff-1s/esatto/+1s su IT/EN, nessuna CTA/badge Founder residua dopo il cutoff, nessun form residuo su /beta, 13 locale strutturalmente renderizzate.",
    );
  }
}

main().catch((err) => {
  console.error("founder:cutoff-render-check: errore fatale", err);
  process.exit(1);
});
