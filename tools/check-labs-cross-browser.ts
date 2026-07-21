/**
 * Guardrail cross-browser/viewport/reduced-motion FitMesh Labs (P1.1 Fase 12,
 * esteso in P1.1B Fase 4). Il sito ha un solo tema (scuro fisso, nessun
 * toggle light/dark - verificato con grep, nessun prefers-color-scheme/
 * ThemeToggle nel codice), quindi non c'è un "dark mode" da alternare: qui si
 * verifica invece che il tema fisso regga su motori diversi (Chromium,
 * WebKit) e viewport stretti, e che prefers-reduced-motion sia rispettato.
 *
 * P1.1B Fase 4: il controllo reduced-motion originale (Fase 12) aveva
 * trovato correttamente 3 animazioni infinite (Header badge "Beta", Footer
 * status pill, sync/[provider] pulse) - lo script era già corretto e
 * FALLIVA (exit 1) su quel run. L'incoerenza era nel report di consegna
 * P1.1, che aveva etichettato la riga "labs:cross-browser-check" come ✅
 * pur descrivendo un finding reale accanto: un reader del solo elenco a
 * colpo d'occhio avrebbe letto "verde" invece di "trovato un problema, non
 * bloccante per Labs". Qui le 3 animazioni sono corrette con
 * motion-reduce:animate-none (Header.tsx, Footer.tsx ×2, sync/[provider]/
 * page.tsx) e il controllo ora gira su tutte e 4 le pagine Labs (prima solo
 * 2 pagine campione), dimostrando zero animazioni infinite effettive nel DOM
 * renderizzato con prefers-reduced-motion: reduce attivo.
 */
import { chromium, webkit, type Browser, type BrowserType } from "playwright";

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";
const PAGES = [
  "/it/labs/calcolatore-hrv-rmssd",
  "/en/labs/hrv-rmssd-calculator",
  "/it/labs/calcolatore-efficienza-sonno",
  "/en/labs/sleep-efficiency-calculator",
];

async function checkEngine(engineName: string, engine: BrowserType, problems: string[]) {
  const browser: Browser = await engine.launch();

  for (const path of PAGES) {
    for (const viewport of [
      { width: 1280, height: 800, label: "desktop" },
      { width: 390, height: 844, label: "mobile-390" },
      { width: 320, height: 568, label: "mobile-320" },
    ]) {
      const context = await browser.newContext({ viewport });
      const page = await context.newPage();
      const consoleErrors: string[] = [];
      page.on("console", (msg) => {
        if (msg.type() === "error") consoleErrors.push(msg.text());
      });
      page.on("pageerror", (err) => consoleErrors.push(String(err)));

      await page.goto(`${BASE_URL}${path}`, { waitUntil: "networkidle" });

      const hasHorizontalOverflow = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      );
      if (hasHorizontalOverflow) {
        problems.push(`[${engineName}/${viewport.label}] ${path}: overflow orizzontale rilevato.`);
      }

      const knownNoise = /Content Security Policy|report-only|was preloaded using link preload but not used/i;
      const realErrors = consoleErrors.filter((e) => !knownNoise.test(e));
      if (realErrors.length > 0) {
        problems.push(`[${engineName}/${viewport.label}] ${path}: errori console: ${realErrors.join(" | ")}`);
      }

      await context.close();
    }
  }

  await browser.close();
}

async function checkReducedMotion(problems: string[]) {
  const browser = await chromium.launch();
  for (const path of PAGES) {
    const context = await browser.newContext({ reducedMotion: "reduce" });
    const page = await context.newPage();
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });
    await page.goto(`${BASE_URL}${path}`, { waitUntil: "networkidle" });

    const stillAnimating = await page.evaluate(() => {
      const els = Array.from(document.querySelectorAll("*"));
      return els.some((el) => {
        const style = window.getComputedStyle(el);
        const duration = parseFloat(style.animationDuration || "0");
        return duration > 0 && style.animationIterationCount === "infinite";
      });
    });
    if (stillAnimating) {
      problems.push(`[reduced-motion] ${path}: trovata un'animazione infinita nonostante prefers-reduced-motion: reduce.`);
    }
    const knownNoise = /Content Security Policy|report-only/i;
    if (consoleErrors.filter((e) => !knownNoise.test(e)).length > 0) {
      problems.push(`[reduced-motion] ${path}: errori console con reducedMotion attivo.`);
    }
    await context.close();
  }
  await browser.close();
}

async function main() {
  const problems: string[] = [];

  await checkEngine("chromium", chromium, problems);
  await checkEngine("webkit", webkit, problems);
  await checkReducedMotion(problems);

  if (problems.length > 0) {
    console.error(`\n❌ Labs cross-browser guardrail: ${problems.length} problema/i\n`);
    for (const p of problems) console.error(`  - ${p}`);
    process.exit(1);
  }

  console.log(
    `\n✅ Labs cross-browser guardrail: ${PAGES.length} pagine su Chromium+WebKit × desktop/390px/320px senza overflow orizzontale ne' errori console, prefers-reduced-motion rispettato (nessuna animazione infinita).`,
  );
}

main().catch((err) => {
  console.error("❌ Labs cross-browser guardrail: errore inatteso", err);
  process.exit(1);
});
