/**
 * QA cross-browser P1.8B (one-off, modello check-p013-playwright-qa.ts).
 * Chromium + WebKit, 320/390/desktop, sulle pagine toccate da questo sprint.
 *
 *   docker run --rm --network container:<server> -v "$PWD":/app -w /app \
 *     mcr.microsoft.com/playwright:v1.60.0-noble npx tsx tools/check-p18b-playwright-qa.ts
 */
import { chromium, webkit } from "playwright";

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";
const VIEWPORTS = [
  { name: "320", width: 320, height: 800 },
  { name: "390", width: 390, height: 844 },
  { name: "desktop", width: 1440, height: 900 },
];
const URLS = [
  "/it/blog/google-health-google-fit",
  "/en/blog/google-health-replaces-google-fit",
  "/de/blog/google-health-ersetzt-google-fit",
  "/ja/blog/google-health-google-fit-daigae",
  "/ko/blog/google-health-google-fit-daechae",
  "/it/blog/google-fit-api-dismissione-2026",
  "/de/blog/google-fit-eingestellt-alternative",
];
const KNOWN_NOISE = [
  /DevTools/i,
  /Download the React DevTools/i,
  // Rumore noto ambiente Docker/dev: CSP report-only + analytics bloccati
  // (google-analytics.com/googletagmanager.com irraggiungibili dal sandbox
  // di test, e la CSP e' volutamente in modalita' report-only fuori da
  // produzione) — non correlato al contenuto di questo sprint, stesso
  // pattern gia' visto nei gate precedenti (check-p013/p18a-playwright-qa.ts).
  /Content Security Policy/i,
  /googletagmanager\.com/i,
  /google-analytics\.com/i,
];

async function main() {
  const errors: string[] = [];
  let checks = 0;
  for (const engineName of ["chromium", "webkit"] as const) {
    const browser = await (engineName === "chromium" ? chromium : webkit).launch();
    for (const url of URLS) {
      for (const vp of VIEWPORTS) {
        checks++;
        const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
        const consoleErrors: string[] = [];
        page.on("console", (msg) => {
          if (msg.type() === "error" && !KNOWN_NOISE.some((re) => re.test(msg.text()))) {
            consoleErrors.push(msg.text());
          }
        });
        const res = await page.goto(`${BASE_URL}${url}`, { waitUntil: "networkidle" });
        if (!res || res.status() !== 200) {
          errors.push(`[http] ${engineName}/${vp.name} ${url}: status ${res?.status()}`);
        }
        if (consoleErrors.length > 0) {
          errors.push(`[console] ${engineName}/${vp.name} ${url}: ${consoleErrors.join(" | ")}`);
        }
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
        if (overflow) {
          errors.push(`[overflow] ${engineName}/${vp.name} ${url}: scrollWidth > clientWidth`);
        }
        await page.close();
      }
    }
    await browser.close();
  }
  console.log(`Checked ${checks} combinations (2 engines x ${URLS.length} URL x ${VIEWPORTS.length} viewport).`);
  if (errors.length > 0) {
    console.error(`❌ P1.8B Playwright QA: ${errors.length} problemi.`);
    for (const e of errors) console.error("  " + e);
    process.exit(1);
  }
  console.log("✅ P1.8B Playwright QA: tutte le combinazioni verdi, zero errori console, zero overflow.");
}

main().catch((err) => {
  console.error("❌ errore inatteso", err);
  process.exit(1);
});
