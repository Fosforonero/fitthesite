/**
 * Hotfix P0.10R — guardrail browser reale per il flusso di recupero password.
 *
 * tools/check-founder-cutoff-render.ts (repo fitthesite gemello, sprint
 * P0.10E) ha gia' stabilito il pattern: nessuna asserzione automatica senza
 * un browser reale (Chromium + WebKit) contro un vero `next start`.
 *
 * Copre: passaggio forgot -> reset con precompilazione, banner vecchio link
 * (query e fragment) senza mai esporre il valore grezzo, pulizia della barra
 * indirizzi via history.replaceState senza reload/loop, viewport mobile
 * 320/390px, e redirect a singolo hop dalla root con segnali di recovery.
 */
import { chromium, webkit, type Browser, type Page } from "playwright";

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";
const failures: string[] = [];

function fail(label: string, detail: string) {
  failures.push(`[${label}] ${detail}`);
}

async function withPage(
  browser: Browser,
  viewport: { width: number; height: number } | null,
  fn: (page: Page) => Promise<void>,
) {
  const context = await browser.newContext(viewport ? { viewport } : {});
  const page = await context.newPage();
  try {
    await fn(page);
  } finally {
    await context.close();
  }
}

async function scenario1_forgotToReset(browser: Browser, label: string) {
  await withPage(browser, null, async (page) => {
    await page.goto(`${BASE_URL}/it/auth/forgot-password`, { waitUntil: "networkidle" });
    await page.fill("#email", "e2e-test@example.com");

    const [response] = await Promise.all([
      page.waitForResponse((r) => r.url().includes("/api/v1/auth/forgot-password")),
      page.click('button[type="submit"]'),
    ]);
    if (response.status() !== 200) fail(label, `forgot-password endpoint returned ${response.status()}`);

    const bodyText = await page.locator("body").innerText();
    if (!/codice|code/i.test(bodyText)) fail(label, "neutral response screen missing after submit");

    const storedBeforeNav = await page.evaluate(() => window.sessionStorage.getItem("fm.recovery.email"));
    if (storedBeforeNav !== "e2e-test@example.com") {
      fail(label, `sessionStorage was not written before navigation, got ${JSON.stringify(storedBeforeNav)}`);
    }

    await page.click(`a[href="/it/auth/reset-password"]`);
    await page.waitForURL("**/it/auth/reset-password");
    // "networkidle" e' un proxy inaffidabile per "il componente React ha
    // montato e il suo useEffect e' gia' girato" — su WebKit puo' risolversi
    // prima che l'effetto di mount consumi sessionStorage, dando un falso
    // negativo. Si attende invece il segnale REALE che ci interessa: il
    // campo email popolato (o comunque il form pronto).
    await page.locator("#email").waitFor({ state: "visible" });
    await page.waitForFunction(
      () => document.querySelector<HTMLInputElement>("#email")?.value !== "" ||
        window.sessionStorage.getItem("fm.recovery.email") === null,
    );

    const storedAfterNav = await page.evaluate(() => window.sessionStorage.getItem("fm.recovery.email"));
    if (storedAfterNav !== null) {
      fail(label, `sessionStorage was not consumed after navigation (still: ${JSON.stringify(storedAfterNav)}) — handoff is not single-use`);
    }

    const emailValue = await page.locator("#email").inputValue();
    if (emailValue !== "e2e-test@example.com") {
      fail(label, `email not prefilled on reset-password via sessionStorage, got "${emailValue}"`);
    }

    // Precompilazione monouso: un secondo giro a mano non deve ripopolarla.
    await page.reload({ waitUntil: "networkidle" });
    const secondValue = await page.locator("#email").inputValue();
    if (secondValue !== "") fail(label, "sessionStorage handoff was not single-use (survived reload)");
  });
}

async function scenario2_staleLinkQuery(browser: Browser, label: string) {
  await withPage(browser, null, async (page) => {
    await page.goto(`${BASE_URL}/it/auth/reset-password?error_code=otp_expired&error_description=Secret+should+never+show`, {
      waitUntil: "networkidle",
    });

    const bodyText = await page.locator("body").innerText();
    if (bodyText.includes("Secret should never show")) {
      fail(label, "raw error_description leaked into page text");
    }
    if (!/pi[uù].*utilizzabile|non è più valido|richiedi.*nuovo/i.test(bodyText)) {
      fail(label, "stale-link banner text not found");
    }

    // history.replaceState deve aver ripulito la barra indirizzi senza reload.
    const url = new URL(page.url());
    if (url.search.includes("error_code") || url.search.includes("error_description")) {
      fail(label, `URL still contains recovery params after mount: ${url.search}`);
    }

    // Nessun loop: la history deve avere UNA sola entry per questa navigazione
    // (nessuna entry aggiunta da replaceState).
    const historyLength = await page.evaluate(() => window.history.length);
    if (historyLength > 2) fail(label, `unexpected history growth (length=${historyLength}), possible loop`);
  });
}

async function scenario3_staleLinkFragment(browser: Browser, label: string) {
  await withPage(browser, null, async (page) => {
    await page.goto(`${BASE_URL}/it/auth/reset-password#error_code=otp_expired&error_description=FragmentSecret`, {
      waitUntil: "networkidle",
    });

    const bodyText = await page.locator("body").innerText();
    if (bodyText.includes("FragmentSecret")) fail(label, "raw fragment error leaked into page text");
    if (!/pi[uù].*utilizzabile|non è più valido/i.test(bodyText)) {
      fail(label, "stale-link banner not shown for fragment-based error");
    }
  });
}

async function scenario4_noCodeArrival(browser: Browser, label: string) {
  await withPage(browser, null, async (page) => {
    await page.goto(`${BASE_URL}/it/auth/reset-password`, { waitUntil: "networkidle" });
    const bodyText = await page.locator("body").innerText();
    if (!/non hai un codice/i.test(bodyText)) fail(label, "no-code CTA not visible on clean arrival");
    const link = page.locator('a[href="/it/auth/forgot-password"]');
    if ((await link.count()) === 0) fail(label, "no link to forgot-password on clean arrival");
  });
}

async function scenario5_homeRecoveryRedirect(browser: Browser, label: string) {
  await withPage(browser, null, async (page) => {
    const navigated: string[] = [];
    page.on("framenavigated", (frame) => {
      if (frame === page.mainFrame()) navigated.push(frame.url());
    });

    await page.goto(`${BASE_URL}/?error_code=otp_expired`, { waitUntil: "networkidle" });

    const finalUrl = new URL(page.url());
    if (!finalUrl.pathname.endsWith("/auth/forgot-password")) {
      fail(label, `expected redirect to forgot-password, landed on ${finalUrl.pathname}`);
    }
    if (finalUrl.search.includes("error_code")) {
      fail(label, "recovery params leaked into forgot-password URL after redirect");
    }
    // Un solo hop: home -> forgot-password, non una catena.
    if (navigated.length > 2) fail(label, `expected a single hop, saw ${navigated.length} navigations: ${navigated.join(" -> ")}`);
  });
}

async function scenario6_mobileViewport(browser: Browser, width: number, label: string) {
  await withPage(browser, { width, height: 780 }, async (page) => {
    await page.goto(`${BASE_URL}/it/auth/forgot-password`, { waitUntil: "networkidle" });
    const emailInput = page.locator("#email");
    const box = await emailInput.boundingBox();
    if (!box) {
      fail(label, `email input not visible at ${width}px`);
      return;
    }
    if (box.width > width) fail(label, `email input overflows viewport at ${width}px (width=${box.width})`);

    await page.goto(`${BASE_URL}/it/auth/reset-password`, { waitUntil: "networkidle" });
    const submitBtn = page.locator('button[type="submit"]');
    const btnBox = await submitBtn.boundingBox();
    if (!btnBox) fail(label, `submit button not visible at ${width}px on reset-password`);
  });
}

async function scenario7_doubleSubmitBlocked(browser: Browser, label: string) {
  await withPage(browser, null, async (page) => {
    await page.goto(`${BASE_URL}/it/auth/forgot-password`, { waitUntil: "networkidle" });
    await page.fill("#email", "double-submit@example.com");

    let requestCount = 0;
    page.on("request", (req) => {
      if (req.url().includes("/api/v1/auth/forgot-password")) requestCount++;
    });

    // Due click DOM nello stesso tick, non due `locator.click()` di
    // Playwright: quest'ultimo attende l'"actionability" (enabled/stable) a
    // ogni tentativo, e il secondo si blocca in retry per 30s non appena lo
    // stato React disabilita il bottone dopo il primo click — esattamente
    // il comportamento che questo test vuole VERIFICARE, non un ostacolo da
    // aggirare. `dispatchEvent` duplice replica un doppio click fisico
    // reale (mouse impreciso, tastiera) meglio di due chiamate API separate.
    await page.locator('button[type="submit"]').evaluate((btn: HTMLButtonElement) => {
      btn.click();
      btn.click();
    });
    await page.waitForTimeout(1500);

    if (requestCount > 1) fail(label, `double submit sent ${requestCount} requests, expected 1`);
  });
}

async function run(browserType: "chromium" | "webkit") {
  const browser = browserType === "chromium" ? await chromium.launch() : await webkit.launch();
  const tag = browserType === "chromium" ? "Chromium" : "WebKit";
  try {
    await scenario1_forgotToReset(browser, `${tag} 1. forgot->reset handoff`);
    await scenario2_staleLinkQuery(browser, `${tag} 2. stale link (query)`);
    await scenario3_staleLinkFragment(browser, `${tag} 3. stale link (fragment)`);
    await scenario4_noCodeArrival(browser, `${tag} 4. no-code arrival`);
    await scenario5_homeRecoveryRedirect(browser, `${tag} 5. home recovery redirect`);
    await scenario6_mobileViewport(browser, 320, `${tag} 6a. viewport 320px`);
    await scenario6_mobileViewport(browser, 390, `${tag} 6b. viewport 390px`);
    await scenario7_doubleSubmitBlocked(browser, `${tag} 7. double submit blocked`);
    console.log(`  - ${tag}: 8 scenari completati`);
  } finally {
    await browser.close();
  }
}

async function main() {
  console.log("== Password recovery E2E — Chromium + WebKit ==");
  await run("chromium");
  await run("webkit");

  if (failures.length > 0) {
    console.error(`\n❌ password-recovery-e2e: ${failures.length} problema/i\n`);
    for (const f of failures) console.error(`  - ${f}`);
    process.exit(1);
  } else {
    console.log("\n✅ password-recovery-e2e: forgot->reset, vecchi link (query+fragment), arrivo senza codice, redirect home, viewport mobile 320/390px, doppio submit — tutto verde su Chromium e WebKit.");
  }
}

main().catch((err) => {
  console.error("password-recovery-e2e: errore fatale", err);
  process.exit(1);
});
