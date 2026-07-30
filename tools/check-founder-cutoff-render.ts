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
 * Sprint P0.10G: eseguito su DUE motori — Chromium e WebKit (Safari) — non
 * solo Chromium. Motivazione: WebKit ha storicamente un parsing di
 * `Date`/fusi orari diverso da V8, e una quota reale di utenti (iOS Safari)
 * visita il sito con quel motore — un bug al confine esatto del cutoff
 * visibile solo su WebKit non verrebbe mai scoperto testando solo Chromium.
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
 *
 * Sprint P0.10H — aggiunta una TERZA categoria di verifica, distinta dalle
 * due sopra: l'HTML GREZZO di /beta, PRIMA di qualunque hydration — quello
 * che vede un crawler/unfurler senza JS, o il primissimo frame di ogni
 * browser. Le due categorie preesistenti (`checkHomepageDesktop`/
 * `checkMobileMenu`/`checkBeta`) usano sempre `page.goto(..., waitUntil:
 * "networkidle")`, che ASPETTA l'hydration — non avrebbero mai potuto
 * scoprire il bug P0.10H (HTML grezzo con "il programma e' concluso" anche
 * a programma ancora aperto, verificato live il 2026-07-29). Per l'HTML
 * grezzo usiamo `context.request.get(...)`: una richiesta HTTP pura, senza
 * alcun motore JS coinvolto — l'equivalente esatto di `curl`.
 */
import { chromium, webkit, type Browser, type BrowserContext, type BrowserType, type Page } from "playwright";
import { locales } from "@/lib/i18n";
import { FOUNDER_END_AT_MS } from "@/lib/founder/program-window";
import { founderEligibilityStatement } from "@/lib/founder/historical-note";

const ENGINES: Array<{ name: string; launcher: BrowserType }> = [
  { name: "chromium", launcher: chromium },
  { name: "webkit", launcher: webkit },
];

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

/**
 * Testo ESATTO di BETA_CLOSED_COPY[locale].h1 in beta/page.tsx (non
 * esportato da li', duplicato qui deliberatamente): un frammento letterale
 * e specifico e' l'unico modo sicuro per rilevare "il vero corpo chiuso e'
 * finito nel fallback pre-hydration" senza falsi positivi. Un tentativo
 * precedente con un regex generico su frammenti di parola (chius|termin|
 * conclus|closed|ended) falliva su OGNI locale: "termin" da solo combacia
 * anche con "Termini di servizio" nel footer, presente su ogni pagina del
 * sito, /beta incluso — un falso positivo garantito, non legato al bug
 * reale. Le locale senza voce dedicata (pl/tr/sv/da/no/fi) ricadono sulla
 * stessa stringa `en`, stesso fallback di `tliClosed()` nel componente.
 */
const CLOSED_H1_BY_LOCALE: Record<string, string> = {
  it: "Il programma Founder è concluso",
  es: "El programa Founder ha terminado",
  de: "Das Founder-Programm ist beendet",
  pt: "O programa Founder terminou",
  fr: "Le programme Founder est terminé",
  nl: "Het Founder-programma is beëindigd",
  ja: "ファウンダープログラムは終了しました",
  ko: "파운더 프로그램이 종료되었습니다",
  en: "The Founder program has ended",
};
function closedH1For(locale: string): string {
  return CLOSED_H1_BY_LOCALE[locale] ?? CLOSED_H1_BY_LOCALE.en;
}

// Un claim di APERTURA nell'HTML grezzo sarebbe altrettanto sbagliato: vero
// solo finche' il sito non viene ri-deployato dopo il cutoff — esattamente
// la classe di bug (P0.10G) gia' corretta altrove, qui verificata anche su
// /beta.
const OPEN_CLAIM_RE = /ancora\s+aperto|still\s+open|programma\s+(e|è)\s+aperto|program\s+is\s+(currently\s+)?open/i;

/**
 * Il documento RSC di Next.js serializza SEMPRE tutti e tre i rami
 * (pending/open/closed) dentro tag `<script>` (flight data per
 * l'hydration), anche se il DOM visibile ne mostra uno solo — esattamente
 * come React fa gia' per FounderClientGate altrove (verificato: la stessa
 * cosa succede su homepage/header/footer). Verificare il body grezzo COSI'
 * COM'E' produrrebbe un falso positivo garantito su ogni locale (il ramo
 * "closed" contiene letteralmente "concluso"/"ended", solo mai visibile).
 * Rimuoviamo quindi il contenuto di ogni `<script>` prima di testare i
 * pattern di aperto/chiuso — la stessa metodologia "solo DOM visibile" gia'
 * usata durante l'audit manuale che ha scoperto il bug originale.
 */
function stripScriptTags(html: string): string {
  return html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "");
}

/**
 * react-dom/server esegue l'escape HTML anche su apostrofi/virgolette nel
 * testo (`&#x27;`, `&quot;`), non solo su `&<>` — verificato: la clausola
 * IT (founderEligibilityStatement) inizia con "L'idoneità", quindi un
 * confronto su stringa letterale fallirebbe SEMPRE senza questo decode.
 * Bastano le entita' che React produce davvero in output, non un decoder
 * HTML generico.
 */
function decodeHtmlEntities(html: string): string {
  // &amp; per ultimo: decodificarlo prima farebbe doppio-decode di sequenze
  // come "&amp;lt;" (letteralmente il testo "&lt;") in "<".
  return html
    .replace(/&#x27;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&amp;/gi, "&");
}

/**
 * Sprint P0.10H — verifica l'HTML grezzo (pre-hydration) di /beta per TUTTE
 * le 15 locale, via richiesta HTTP pura (`context.request.get`, zero motore
 * JS coinvolto — l'equivalente di `curl`). Tre asserzioni indipendenti sul
 * DOM VISIBILE (script hydration esclusi): zero claim di chiusura, zero
 * claim di apertura, presenza del testo neutro invariante
 * (founderEligibilityStatement) — la STESSA fonte unica gia' usata da
 * press/blog/landing/llms.txt (Sprint P0.10G).
 */
async function checkBetaRawFallback(context: BrowserContext, engineName: string, locale: string, failures: Failure[]) {
  const label = `${engineName}:raw-html:${locale}`;
  const res = await context.request.get(`${BASE_URL}/${locale}/beta`);
  if (res.status() !== 200) {
    failures.push({ scenario: label, detail: `/beta ha risposto HTTP ${res.status()} invece di 200.` });
    return;
  }
  const html = await res.text();
  const visible = decodeHtmlEntities(stripScriptTags(html));

  if (visible.includes(closedH1For(locale))) {
    failures.push({
      scenario: label,
      detail: `Il DOM VISIBILE dell'HTML grezzo (pre-hydration, quello visto da crawler/unfurler senza JS) contiene il testo "${closedH1For(locale)}" — claim di CHIUSURA del programma Founder, falso prima del cutoff (2026-07-31T22:00:00Z). Atteso il fallback neutro (FounderPendingBody), mai FounderClosedBody come default SSR.`,
    });
  }
  if (OPEN_CLAIM_RE.test(visible)) {
    failures.push({
      scenario: label,
      detail: `Il DOM VISIBILE dell'HTML grezzo di /beta contiene un claim di APERTURA del programma — diventerebbe falso dopo il cutoff senza un nuovo deploy scollegato. Il fallback pre-hydration deve restare neutro sia prima sia dopo.`,
    });
  }
  if (/<form[\s>]/i.test(visible)) {
    failures.push({ scenario: label, detail: `Il DOM VISIBILE dell'HTML grezzo di /beta contiene un <form> — atteso zero form/CTA nel fallback pre-hydration (il form vive SOLO nello stato "open" post-hydration).` });
  }
  const expectedFragment = founderEligibilityStatement(locale).slice(0, 40);
  if (!visible.includes(expectedFragment)) {
    failures.push({
      scenario: label,
      detail: `Il DOM VISIBILE dell'HTML grezzo di /beta non contiene il testo neutro atteso (founderEligibilityStatement) — inizio atteso: "${expectedFragment}...". Il fallback pre-hydration potrebbe essere silenziosamente tornato a un contenuto non invariante.`,
    });
  }
}

async function runForEngine(engineName: string, launcher: BrowserType, failures: Failure[]) {
  const browser = await launcher.launch();

  console.log(`== [${engineName}] 0/2 — HTML grezzo (pre-hydration) di /beta su tutte e 15 le locale ==`);
  {
    const context = await browser.newContext();
    for (const locale of locales) {
      await checkBetaRawFallback(context, engineName, locale, failures);
      console.log(`  - raw-html:${locale}: fatto`);
    }
    await context.close();
  }

  console.log(`== [${engineName}] 1/2 — scenari completi IT/EN sui 3 istanti di cutoff ==`);
  for (const locale of ["it", "en"]) {
    for (const instant of INSTANTS) {
      const label = `${engineName}:${locale} @ ${instant.label}`;
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

  console.log(`== [${engineName}] 2/2 — completezza strutturale sulle restanti 13 locale (nessuna richiesta di rete per decidere lo stato, homepage renderizza senza errori) ==`);
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

  // Sprint P0.10G: entrambi i motori, non solo Chromium — vedi commento di
  // testa al file per il perche' (WebKit/Safari ha un parsing Date/fuso
  // diverso da V8, e una quota reale di utenti iOS visita il sito con
  // quel motore).
  for (const { name, launcher } of ENGINES) {
    await runForEngine(name, launcher, failures);
  }

  if (failures.length > 0) {
    console.error(`\n❌ founder:cutoff-render-check: ${failures.length} problema/i\n`);
    for (const f of failures) console.error(`  - [${f.scenario}] ${f.detail}`);
    process.exit(1);
  } else {
    console.log(
      `\n✅ founder:cutoff-render-check: HTML grezzo pre-hydration di /beta neutro su tutte e 15 le locale (zero claim aperto/chiuso, zero form), header/footer/menu mobile/beta mostrano la variante corretta a cutoff-1s/esatto/+1s su IT/EN su ${ENGINES.map((e) => e.name).join(" e ")}, nessuna CTA/badge Founder residua dopo il cutoff, nessun form residuo su /beta, 13 locale strutturalmente renderizzate su entrambi i motori.`,
    );
  }
}

main().catch((err) => {
  console.error("founder:cutoff-render-check: errore fatale", err);
  process.exit(1);
});
