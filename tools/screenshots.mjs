/**
 * Genera i 6 asset Play Store via Playwright headless.
 *
 * Pre-req: dev server in esecuzione su localhost:3000
 *   (npm run dev — eseguito separatamente prima)
 *
 * Output:
 *   ~/Desktop/fitmesh-play-store-assets/      ← per upload Play Console
 *   public/mockups/                            ← per uso nel sito
 *
 * Eseguire:
 *   node tools/screenshots.mjs
 */
import { chromium } from "playwright";
import { mkdir, copyFile } from "node:fs/promises";
import { join } from "node:path";
import { homedir } from "node:os";

const BASE = process.env.MOCKUP_BASE_URL ?? "http://localhost:3000";

// Output paths
const DESKTOP_DIR = join(homedir(), "Desktop", "fitmesh-play-store-assets");
const PUBLIC_DIR = join(process.cwd(), "public", "mockups");

// Screens da catturare
const SHOTS = [
  // Phone screenshots 1080×1920 (ratio 9:16 Play Store)
  { url: "/mockups/onboarding",   file: "01-onboarding.png",   w: 1080, h: 1920 },
  { url: "/mockups/dashboard",    file: "02-dashboard.png",    w: 1080, h: 1920 },
  { url: "/mockups/sync",         file: "03-sync.png",         w: 1080, h: 1920 },
  { url: "/mockups/integrations", file: "04-integrations.png", w: 1080, h: 1920 },
  { url: "/mockups/settings",     file: "05-settings.png",     w: 1080, h: 1920 },
  // Feature graphic 1024×500 (Play Store hero banner)
  { url: "/mockups/feature-graphic", file: "00-feature-graphic.png", w: 1024, h: 500 },
];

async function main() {
  await mkdir(DESKTOP_DIR, { recursive: true });
  await mkdir(PUBLIC_DIR, { recursive: true });

  console.log(`Output dir Play Store: ${DESKTOP_DIR}`);
  console.log(`Output dir sito:       ${PUBLIC_DIR}\n`);

  const browser = await chromium.launch({ headless: true });

  for (const shot of SHOTS) {
    const fullUrl = `${BASE}${shot.url}`;
    console.log(`📸 ${shot.file} ← ${fullUrl} (${shot.w}×${shot.h})`);

    const context = await browser.newContext({
      viewport: { width: shot.w, height: shot.h },
      deviceScaleFactor: 1,
    });
    const page = await context.newPage();
    await page.goto(fullUrl, { waitUntil: "networkidle", timeout: 30_000 });

    // Aspetta che il root sia montato
    await page.waitForSelector("#mockup-root", { timeout: 10_000 });

    // Cattura SOLO il container #mockup-root (esatto W×H)
    const root = await page.$("#mockup-root");
    if (!root) {
      console.error(`  ✗ #mockup-root non trovato su ${fullUrl}`);
      await context.close();
      continue;
    }

    const desktopPath = join(DESKTOP_DIR, shot.file);
    await root.screenshot({ path: desktopPath, omitBackground: false });

    // Copia in public/mockups
    const publicPath = join(PUBLIC_DIR, shot.file);
    await copyFile(desktopPath, publicPath);

    console.log(`   ✓ ${desktopPath}`);
    await context.close();
  }

  await browser.close();
  console.log(`\n✅ ${SHOTS.length} asset generati.`);
}

main().catch((err) => {
  console.error("FAIL:", err);
  process.exit(1);
});
