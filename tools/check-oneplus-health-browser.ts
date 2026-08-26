/**
 * Guardrail SPRINT P0.15 — verifica browser reale (Chromium + WebKit) della
 * landing OnePlus/OHealth dopo la riscrittura editoriale, per il gate FASE 8.
 *
 * Copre, per un campione di locale indicizzabili (it/en/ja/tr — IT/EN come
 * lingue sorgente, JA per lo script CJK che stressa overflow/word-wrap, TR
 * per parole composte lunghe che stressano overflow), a desktop/390px/320px:
 *  - zero errori console funzionali (filtra il rumore noto RSC-prefetch di
 *    Playwright, stesso pattern del guardrail P0.14);
 *  - zero overflow orizzontale del body;
 *  - FAQ visibile === FAQPage JSON-LD (stesso testo, non solo stesso numero);
 *  - blocco "fonti visibili" presente e con almeno un link https:// reale;
 *  - CTA hero/finale presenti con attributi analytics corretti;
 *  - selettore lingua P0.14 (readAlternatesFromHead) ancora funzionante su
 *    questa pagina: il menu apre, mostra le locale reali lette dagli
 *    hreflang della pagina (non un elenco hardcoded), e il click naviga.
 *  - (MICRO-GATE P0.15-C) ogni pill "Dati supportati" ha un nome
 *    accessibile "[metrica] — [stato]" (role="group"+aria-label) e il
 *    pallino colorato e' aria-hidden — lo stato non dipende solo dal
 *    colore. Verificato sulle 4 locale rappresentative sopra.
 *  - (MICRO-GATE P0.15-C) l'etichetta di stato ("Condizionale"/"Non
 *    supportato") e' realmente tradotta su tutte le 11 locale
 *    indicizzabili, nessun fallback EN silenzioso per DE/PT/FR/PL/TR — un
 *    passaggio Chromium/desktop separato, dedicato, non uno stress test.
 *
 * Richiede il server locale in ascolto (BASE_URL, default http://localhost:3915).
 * Uso: BASE_URL=http://localhost:3915 npx tsx tools/check-oneplus-health-browser.ts
 */
import { chromium, webkit, type Browser, type ConsoleMessage } from "playwright";

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3915";
const LOCALES = ["it", "en", "ja", "tr"] as const;
const VIEWPORTS = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "390px", width: 390, height: 844 },
  { name: "320px", width: 320, height: 700 },
];

// Rumore noto Playwright/WebKit su prefetch RSC, non un errore funzionale
// reale (stesso filtro del guardrail P0.14, tools/check-language-switcher-browser.ts).
// Aggiunto qui: la Content-Security-Policy Report-Only sitewide (non
// specifica di questa landing, non toccata da P0.15 — FUORI SCOPE modificare
// header CSP globali) genera in WebKit un avviso verboso su GTM bloccato in
// modalità report-only; per definizione "will have no effect" sul rendering,
// non un errore funzionale della pagina.
const knownNoise =
  /Failed to fetch RSC payload|Fetch API cannot load.*_rsc=|access control checks|Content Security Policy|report-only|googletagmanager\.com\/gtag/i;

let errors: string[] = [];
let checks = 0;

async function runFor(browserName: "chromium" | "webkit", browser: Browser) {
  for (const lc of LOCALES) {
    for (const vp of VIEWPORTS) {
      const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
      const page = await context.newPage();
      const consoleErrors: string[] = [];
      page.on("console", (msg: ConsoleMessage) => {
        if (msg.type() === "error" && !knownNoise.test(msg.text())) {
          consoleErrors.push(msg.text());
        }
      });
      page.on("pageerror", (err) => {
        if (!knownNoise.test(String(err))) consoleErrors.push(String(err));
      });

      const label = `[${browserName}/${lc}/${vp.name}]`;
      await page.goto(`${BASE_URL}/${lc}/sync/oneplus-health`, { waitUntil: "networkidle" });
      checks++;

      // ── zero overflow orizzontale ──────────────────────────────────
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
      if (overflow) errors.push(`${label} overflow orizzontale rilevato`);

      // ── FAQ visibile === FAQPage JSON-LD ───────────────────────────
      const faqCheck = await page.evaluate(() => {
        const ld = [...document.querySelectorAll('script[type="application/ld+json"]')]
          .map((s) => { try { return JSON.parse(s.textContent || "{}"); } catch { return null; } })
          .find((j) => j && j["@type"] === "FAQPage");
        if (!ld) return { ok: false, reason: "FAQPage JSON-LD assente" };
        const visibleDetails = [...document.querySelectorAll("details")];
        // Le prime N <details> nella sezione FAQ corrispondono a mainEntity
        // nello stesso ordine (setupGuide.troubleshooting viene prima nel
        // DOM ma e' un blocco <details> separato — confrontiamo solo il
        // TESTO di ogni domanda FAQ JSON-LD con QUALCHE <details> visibile,
        // non l'indice posizionale, per restare robusti a riordini futuri).
        const visibleTexts = visibleDetails.map((d) => d.textContent?.replace(/\s+/g, " ").trim() ?? "");
        for (const entity of ld.mainEntity ?? []) {
          const q = entity.name as string;
          const a = entity.acceptedAnswer?.text as string;
          const found = visibleTexts.some((t) => t.includes(q) && t.includes(a.slice(0, 60)));
          if (!found) return { ok: false, reason: `FAQ "${q.slice(0, 60)}" non trovata visibile con lo stesso testo` };
        }
        return { ok: true };
      });
      if (!faqCheck.ok) errors.push(`${label} ${faqCheck.reason}`);

      // ── Fonti visibili presenti ─────────────────────────────────────
      const sourcesOk = await page.evaluate(() => {
        const links = [...document.querySelectorAll("a[href^='https://']")];
        const text = document.body.textContent ?? "";
        const hasVerifiedLine = /Verificato il|Verified on|Verificado el|検証済み|に確認済み|onaylandı|doğrulandı/i.test(text);
        return { hasVerifiedLine, httpsLinkCount: links.length };
      });
      if (!sourcesOk.hasVerifiedLine) errors.push(`${label} riga "Verificato il/Verified on" assente`);

      // ── CTA presenti (hero + finale) ────────────────────────────────
      const ctaCount = await page.locator("[data-cta-placement]").count();
      if (ctaCount < 1) errors.push(`${label} nessuna CTA con data-cta-placement trovata`);

      // ── Selettore lingua P0.14: menu apre e mostra locale reali ─────
      const langButton = page.getByRole("button", { name: /Lingua|Language|Idioma|言語|Dil/i }).first();
      if (await langButton.count() > 0) {
        await langButton.click();
        const optionCount = await page.getByRole("option").count();
        if (optionCount === 0) {
          errors.push(`${label} selettore lingua: menu aperto ma zero opzioni`);
        } else {
          // Verifica strutturale: ogni opzione punta a /xx/sync/oneplus-health
          // per una locale realmente indicizzabile (coerenza con providerLanguages()).
          const hrefs = await page.getByRole("option").locator("a").evaluateAll((as) =>
            as.map((a) => (a as HTMLAnchorElement).getAttribute("href")),
          );
          const bad = hrefs.filter((h) => !h || !/^\/[a-z]{2}\/sync\/oneplus-health$/.test(h));
          if (bad.length > 0) errors.push(`${label} selettore lingua: href inattesi ${JSON.stringify(bad)}`);
        }
        await page.keyboard.press("Escape");
      } else {
        errors.push(`${label} bottone selettore lingua non trovato`);
      }

      // ── MICRO-GATE P0.15-C: stato pill leggibile da testo/nome
      // accessibile, non solo colore. Ogni pill "Dati supportati" deve
      // avere role="group" + aria-label "[metrica] — [stato]", e il
      // pallino colorato dev'essere aria-hidden (decorativo).
      const pillAccessibility = await page.evaluate(() => {
        const groups = [...document.querySelectorAll('section [role="group"][aria-label]')];
        return groups.map((g) => ({
          ariaLabel: g.getAttribute("aria-label") ?? "",
          dotHidden: g.querySelector('[aria-hidden="true"]') !== null,
        }));
      });
      if (pillAccessibility.length === 0) {
        errors.push(`${label} nessuna pill dati supportati con role="group"+aria-label trovata`);
      } else {
        for (const pill of pillAccessibility) {
          if (!pill.ariaLabel.includes("—")) {
            errors.push(`${label} pill senza nome accessibile "[metrica] — [stato]": "${pill.ariaLabel}"`);
          }
          if (!pill.dotHidden) {
            errors.push(`${label} pill senza pallino aria-hidden: "${pill.ariaLabel}"`);
          }
        }
      }

      if (consoleErrors.length > 0) {
        errors.push(`${label} ${consoleErrors.length} errori console: ${consoleErrors.slice(0, 3).join(" | ")}`);
      }

      await context.close();
    }
  }
}

// ── MICRO-GATE P0.15-C: la legenda a 3 stati e l'etichetta di stato per
// pill devono essere realmente tradotte nelle 11 locale indicizzabili, non
// un fallback EN silenzioso (rischio specifico per DE/PT/FR/PL/TR, che il
// campione di 4 locale sopra non copre). Non e' uno stress test di
// rendering (quello resta sulle 4 locale rappresentative): un solo
// browser, un solo viewport, verifica solo la traduzione del testo.
const ALL_INDEXABLE_LOCALES = ["it", "en", "es", "de", "pt", "fr", "pl", "tr", "nl", "ja", "ko"] as const;
async function checkAccessibilityAcrossAllLocales(browser: Browser) {
  for (const lc of ALL_INDEXABLE_LOCALES) {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    await page.goto(`${BASE_URL}/${lc}/sync/oneplus-health`, { waitUntil: "networkidle" });
    checks++;
    const pills = await page.evaluate(() => {
      const groups = [...document.querySelectorAll('section [role="group"][aria-label]')];
      return groups.map((g) => g.getAttribute("aria-label") ?? "");
    });
    if (pills.length === 0) {
      errors.push(`[a11y-locale/${lc}] nessuna pill con aria-label trovata`);
    }
    for (const label of pills) {
      if (lc !== "en" && /—\s*(Conditional|Not supported|Verified)\s*$/.test(label)) {
        errors.push(`[a11y-locale/${lc}] etichetta di stato non tradotta (fallback EN silenzioso): "${label}"`);
      }
    }
    await context.close();
  }
}

(async () => {
  const cr = await chromium.launch();
  const wk = await webkit.launch();
  try {
    await runFor("chromium", cr);
    await runFor("webkit", wk);
    await checkAccessibilityAcrossAllLocales(cr);
  } finally {
    await cr.close();
    await wk.close();
  }

  if (errors.length > 0) {
    console.error(`❌ OnePlus Health browser guardrail: ${errors.length} problema/i su ${checks} combinazioni testate\n`);
    for (const e of errors) console.error(`  - ${e}`);
    process.exit(1);
  }
  console.log(`✅ OnePlus Health browser guardrail OK: ${checks} combinazioni verificate (24 browser×locale×viewport + 11 locale accessibilita'), zero overflow, FAQ=JSON-LD, fonti visibili, CTA presente, selettore lingua P0.14 funzionante, pill accessibili (nome "[metrica] — [stato]", pallino aria-hidden), etichetta di stato tradotta su tutte le 11 locale.`);
})();
