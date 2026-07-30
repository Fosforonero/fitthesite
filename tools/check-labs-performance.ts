/**
 * Guardrail performance FitMesh Labs (P1.1 Fase 11) - misura reale via
 * Playwright (Chromium) contro un server locale, non stime statiche.
 *
 * Copre le 4 combinazioni tool×locale live (HRV it/en, Sleep Efficiency
 * it/en) con target: LCP < 2000ms, CLS < 0.05, tempo di interazione
 * click->aggiornamento DOM (proxy INP, non l'INP reale che richiede RUM
 * su utenti reali) < 150ms.
 */
import { chromium, type Page } from "playwright";

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";

const PAGES = [
  "/it/labs/calcolatore-hrv-rmssd",
  "/en/labs/hrv-rmssd-calculator",
  "/it/labs/calcolatore-efficienza-sonno",
  "/en/labs/sleep-efficiency-calculator",
  // P1.4B: terzo tool live.
  "/it/labs/calcolatore-zone-frequenza-cardiaca",
  "/en/labs/heart-rate-zones-calculator",
];

const LCP_BUDGET_MS = 2000;
const CLS_BUDGET = 0.05;
const INTERACTION_BUDGET_MS = 150;

async function measureLcpAndCls(page: Page, path: string): Promise<string[]> {
  const problems: string[] = [];

  await page.addInitScript(() => {
    (window as unknown as { __lcp: number }).__lcp = 0;
    (window as unknown as { __cls: number }).__cls = 0;
    try {
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const last = entries[entries.length - 1] as PerformanceEntry & { startTime: number };
        if (last) (window as unknown as { __lcp: number }).__lcp = last.startTime;
      }).observe({ type: "largest-contentful-paint", buffered: true });

      new PerformanceObserver((list) => {
        for (const entry of list.getEntries() as (PerformanceEntry & {
          value: number;
          hadRecentInput: boolean;
        })[]) {
          if (!entry.hadRecentInput) {
            (window as unknown as { __cls: number }).__cls += entry.value;
          }
        }
      }).observe({ type: "layout-shift", buffered: true });
    } catch {
      // browser senza supporto (non dovrebbe capitare su Chromium recente)
    }
  });

  await page.goto(`${BASE_URL}${path}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(500); // margine per l'ultimo layout-shift/LCP candidate

  const { lcp, cls } = await page.evaluate(() => ({
    lcp: (window as unknown as { __lcp: number }).__lcp,
    cls: (window as unknown as { __cls: number }).__cls,
  }));

  if (lcp === 0) {
    problems.push(`[${path}] LCP non rilevato (0ms) - controllare manualmente.`);
  } else if (lcp > LCP_BUDGET_MS) {
    problems.push(`[${path}] LCP ${lcp.toFixed(0)}ms sopra il budget di ${LCP_BUDGET_MS}ms.`);
  }
  if (cls > CLS_BUDGET) {
    problems.push(`[${path}] CLS ${cls.toFixed(3)} sopra il budget di ${CLS_BUDGET}.`);
  }

  console.log(`  ℹ️  ${path}: LCP=${lcp.toFixed(0)}ms, CLS=${cls.toFixed(3)}`);
  return problems;
}

async function measureInteraction(page: Page, path: string): Promise<string[]> {
  const problems: string[] = [];
  const sampleButton = page.getByRole("button", { name: /dati di esempio|sample data/i }).first();
  if (!(await sampleButton.isVisible().catch(() => false))) {
    return problems;
  }

  const durationMs = await page.evaluate(async () => {
    const btn = Array.from(document.querySelectorAll("button")).find((b) =>
      /dati di esempio|sample data/i.test(b.textContent ?? ""),
    ) as HTMLButtonElement | undefined;
    if (!btn) return -1;
    const start = performance.now();
    btn.click();
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    return performance.now() - start;
  });

  if (durationMs < 0) {
    problems.push(`[${path}] bottone dati di esempio non trovato per la misura di interazione.`);
  } else {
    console.log(`  ℹ️  ${path}: click->2 frame = ${durationMs.toFixed(1)}ms`);
    if (durationMs > INTERACTION_BUDGET_MS) {
      problems.push(
        `[${path}] interazione (click dati di esempio -> repaint) ${durationMs.toFixed(1)}ms sopra il budget di ${INTERACTION_BUDGET_MS}ms.`,
      );
    }
  }
  return problems;
}

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const allProblems: string[] = [];

  for (const path of PAGES) {
    const pageProblems = [...(await measureLcpAndCls(page, path)), ...(await measureInteraction(page, path))];
    allProblems.push(...pageProblems);
    console.log(`  ${pageProblems.length === 0 ? "✅" : "❌"} ${path}: ${pageProblems.length} problema/i`);
  }

  await browser.close();

  if (allProblems.length > 0) {
    console.error(`\n❌ Labs performance guardrail: ${allProblems.length} problema/i\n`);
    for (const p of allProblems) console.error(`  - ${p}`);
    process.exit(1);
  }

  console.log(
    `\n✅ Labs performance guardrail: ${PAGES.length} pagine verificate - LCP<${LCP_BUDGET_MS}ms, CLS<${CLS_BUDGET}, interazione<${INTERACTION_BUDGET_MS}ms su tutte.`,
  );
}

main().catch((err) => {
  console.error("❌ Labs performance guardrail: errore inatteso", err);
  process.exit(1);
});
