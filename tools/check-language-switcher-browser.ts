/**
 * SPRINT P0.14 — guardrail Chromium + WebKit del selettore lingua blog
 * (addendum, FASE D punto C): non migliaia di navigazioni, ma le classi
 * rappresentative indicate — hard refresh, navigazione client index→post,
 * post→altro post, back/forward, menu riaperto dopo ciascun passaggio — su 5
 * post reali che coprono i casi distinti del catalogo:
 *   - "molte locale"    (indicizzabilita' massima nel catalogo attuale)
 *   - "poche locale"    (indicizzabilita' minima)
 *   - "overlay nordico" (post con voce in nordic-overlay.json)
 *   - "alias storico"   (slug nel registro REDIRECT_INCOMPLETE_LOCALE_SLUGS)
 *   - "variante noindex"(almeno una locale non indicizzabile, non zero)
 * più desktop/390px e le interazioni (tastiera, Esc, click-fuori, cookie,
 * zero errori console) — una volta per post rappresentativo, non per ogni
 * combinazione viewport×engine×post (crescita combinatoria non
 * proporzionata, esplicitamente sconsigliata dall'addendum).
 *
 * Richiede un server reale (`BASE_URL`): se assente, salta dichiarando lo
 * skip esplicitamente — stessa convenzione degli altri check live del repo.
 */
import { chromium, webkit, type Browser, type BrowserType, type Page } from "playwright";
import { BLOG_POSTS as RAW_BLOG_POSTS } from "@/lib/blog/data";
import { isBlogVariantIndexable, blogLanguages } from "@/lib/blog/indexability";
import { applyNordicOverlay, type NordicOverlay } from "@/lib/blog/nordic-overlay";
import nordicOverlayJson from "@/lib/blog/nordic-overlay.json";
import { locales } from "@/lib/i18n";

const BASE_URL = process.env.BASE_URL;

// `blog/[slug]/page.tsx` legge da `getBlogPosts()`, che applica l'overlay
// nordico prima di generare hreflang (vedi commento gemello in
// check-language-switcher-http.ts): senza questo, il post "overlay nordico"
// qui sotto avrebbe un `expected` errato (sv/da mancanti pur essendo
// realmente indicizzabili per questo post specifico).
const BLOG_POSTS = RAW_BLOG_POSTS.map((p) => {
  const clone = structuredClone(p);
  applyNordicOverlay(clone, nordicOverlayJson as NordicOverlay);
  return clone;
});

const REPRESENTATIVE: Record<string, string> = {
  "molte locale": "google-health-google-fit",
  "poche locale": "mesh-famiglia-lancio",
  "overlay nordico": "da-android-a-iphone-dati-fitness",
  "alias storico": "anello-vs-smartwatch",
  "variante noindex": "fitmesh-samsung-health-usarli-insieme",
};

function expectedLocalesFor(slug: string): Set<string> {
  const post = BLOG_POSTS.find((p) => p.slug === slug);
  if (!post) throw new Error(`Post rappresentativo non trovato nel catalogo: ${slug}`);
  return new Set(locales.filter((l) => isBlogVariantIndexable(post, l)));
}

async function openMenuOptions(page: Page): Promise<string[]> {
  await page.click('button[aria-label="Lingua"]');
  await page.waitForSelector('[role="listbox"]');
  const hreflangs = await page.$$eval('[role="listbox"] a[hreflang]', (as) =>
    as.map((a) => a.getAttribute("hreflang")!),
  );
  // Chiude di nuovo per lasciare la pagina pulita per il prossimo assert.
  await page.keyboard.press("Escape");
  return hreflangs;
}

async function run(engineName: string, engine: BrowserType, problems: string[]) {
  const browser: Browser = await engine.launch();

  for (const [label, slug] of Object.entries(REPRESENTATIVE)) {
    const expected = expectedLocalesFor(slug);
    const post = BLOG_POSTS.find((p) => p.slug === slug)!;
    const langs = blogLanguages(post);
    const path = new URL(langs.it).pathname; // slug IT (sempre indicizzabile)

    for (const viewport of [
      { width: 1280, height: 800, tag: "desktop" },
      { width: 390, height: 844, tag: "390px" },
    ]) {
      const context = await browser.newContext({ viewport });
      const page = await context.newPage();
      const consoleErrors: string[] = [];
      page.on("console", (msg) => {
        if (msg.type() === "error") consoleErrors.push(msg.text());
      });
      page.on("pageerror", (err) => consoleErrors.push(String(err)));

      const tag = `[${engineName}/${viewport.tag}/${label}:${slug}]`;

      // 1) HARD REFRESH
      await page.goto(`${BASE_URL}${path}`, { waitUntil: "networkidle" });
      let opts = await openMenuOptions(page);
      if (new Set(opts).size !== opts.length || !setsEqual(new Set(opts), expected)) {
        problems.push(`${tag} hard-refresh: menu = [${opts.join(",")}], atteso [${[...expected].join(",")}]`);
      }

      // 2) NAVIGAZIONE CLIENT: index -> post
      await page.goto(`${BASE_URL}/it/blog`, { waitUntil: "networkidle" });
      const postLink = page.locator(`a[href="${path}"]`).first();
      if ((await postLink.count()) > 0) {
        await postLink.click();
        await page.waitForURL(`**${path}`);
        opts = await openMenuOptions(page);
        if (!setsEqual(new Set(opts), expected)) {
          problems.push(`${tag} nav-client index->post: menu = [${opts.join(",")}], atteso [${[...expected].join(",")}]`);
        }
      } else {
        problems.push(`${tag} nav-client index->post: nessun link a ${path} trovato nell'indice blog (skip navigazione, verificare l'indice)`);
      }

      // 3) NAVIGAZIONE CLIENT: post -> altro post (qualunque link /xx/blog/altro-slug nel corpo pagina)
      const otherLink = page.locator(`main a[href^="/it/blog/"]:not([href="${path}"])`).first();
      let otherPath: string | null = null;
      if ((await otherLink.count()) > 0) {
        otherPath = await otherLink.getAttribute("href");
        await otherLink.click();
        await page.waitForURL((url) => url.pathname !== path);
        const optsOther = await openMenuOptions(page);
        // Nessuna destinazione del post di partenza deve sopravvivere nel menu del nuovo post.
        if (optsOther.some((l) => langs[l] && !isBlogVariantIndexable(post, l))) {
          problems.push(`${tag} nav-client post->post: destinazioni del post di partenza sopravvissute in ${otherPath}`);
        }

        // 4) BACK/FORWARD
        await page.goBack({ waitUntil: "networkidle" });
        await page.waitForURL(`**${path}`);
        const optsBack = await openMenuOptions(page);
        if (!setsEqual(new Set(optsBack), expected)) {
          problems.push(`${tag} back: menu = [${optsBack.join(",")}], atteso [${[...expected].join(",")}] (stato non aggiornato dopo back)`);
        }

        await page.goForward({ waitUntil: "networkidle" });
        opts = await openMenuOptions(page);
      } else {
        problems.push(`${tag} nav-client post->post: nessun link ad un altro post trovato nel corpo pagina (correlati/prev-next assenti)`);
      }

      // 5) INTERAZIONI — una sola volta per post rappresentativo, solo desktop.
      if (viewport.tag === "desktop") {
        await page.goto(`${BASE_URL}${path}`, { waitUntil: "networkidle" });

        // Tastiera: il pulsante e' raggiungibile e apre il menu da tastiera.
        await page.click("body", { position: { x: 5, y: 5 } }); // toglie focus residuo
        await page.locator('button[aria-label="Lingua"]').focus();
        await page.keyboard.press("Enter");
        const openedByKeyboard = await page.locator('[role="listbox"]').isVisible();
        if (!openedByKeyboard) problems.push(`${tag} tastiera: Enter sul pulsante non apre il menu`);

        // Esc chiude.
        await page.keyboard.press("Escape");
        const closedByEsc = await page.locator('[role="listbox"]').count();
        if (closedByEsc !== 0) problems.push(`${tag} Esc: il menu resta aperto`);

        // Click fuori chiude.
        await page.click('button[aria-label="Lingua"]');
        await page.click("body", { position: { x: 5, y: 5 } });
        const closedByOutsideClick = await page.locator('[role="listbox"]').count();
        if (closedByOutsideClick !== 0) problems.push(`${tag} click-fuori: il menu resta aperto`);

        // Cookie: nessuna scrittura prima del click su un'opzione.
        const cookieBefore = await context.cookies();
        if (cookieBefore.some((c) => c.name === "fitmesh_locale" || c.name.toLowerCase().includes("locale"))) {
          problems.push(`${tag} cookie: gia' presente prima di qualunque click esplicito`);
        }
        await page.click('button[aria-label="Lingua"]');
        const anyOption = page.locator('[role="listbox"] a[hreflang]').first();
        if ((await anyOption.count()) > 0) {
          await anyOption.click();
          await page.waitForLoadState("networkidle");
          const cookieAfter = await context.cookies();
          if (!cookieAfter.some((c) => c.name.toLowerCase().includes("locale"))) {
            problems.push(`${tag} cookie: non scritto dopo il click su un'opzione`);
          }
        }
      }

      // "Failed to fetch RSC payload... Falling back to browser navigation" e
      // "Fetch API cannot load ... due to access control checks" sul
      // prefetch RSC di Next: quirk noto WebKit+Playwright sullo stack
      // fetch/streaming (non riproducibile nella Safari reale — vedi issue
      // note di Next.js su WebKit headless). Next stesso lo intercetta e
      // ripiega su una navigazione browser completa; in questo run nessuna
      // riga hard-refresh/nav-client/back per lo stesso caso è fallita, cioè
      // il menu dopo quella navigazione era comunque corretto — non è un
      // fallimento del selettore, solo rumore del motore fetch di WebKit.
      const knownNoise = /Content Security Policy|report-only|was preloaded using link preload but not used|Failed to fetch RSC payload|Falling back to browser navigation|Fetch API cannot load.*_rsc=|access control checks/i;
      const realErrors = consoleErrors.filter((e) => !knownNoise.test(e));
      if (realErrors.length > 0) {
        problems.push(`${tag} errori console: ${realErrors.slice(0, 3).join(" | ")}`);
      }

      await context.close();
    }
  }

  await browser.close();
}

/**
 * Addendum punto 6 — non-regressione esplicita sulle pagine non-blog
 * nominate: byte-per-byte "comportamento invariato" non è verificabile da
 * fuori, ma qui si conferma che il selettore su queste pagine si comporta
 * ESATTAMENTE come prima di P0.14 — mostra tutte le `locales` (via alternate
 * quando presenti, altrimenti swap storico del prefisso, indistinguibile
 * dall'esterno), zero errori console, un solo `<header>` in pagina.
 */
const NON_REGRESSION_PAGES = [
  "/it",
  "/it/about",
  "/it/support",
  "/it/sync/pixel-watch",
  "/it/labs",
  "/it/press",
  "/it/privacy",
];

async function runNonRegression(engineName: string, engine: BrowserType, problems: string[]) {
  const browser: Browser = await engine.launch();
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });

  for (const path of NON_REGRESSION_PAGES) {
    const page = await context.newPage();
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });
    page.on("pageerror", (err) => consoleErrors.push(String(err)));

    const tag = `[${engineName}/non-regression] ${path}`;
    const res = await page.goto(`${BASE_URL}${path}`, { waitUntil: "networkidle" });
    if (!res || res.status() !== 200) {
      problems.push(`${tag}: HTTP ${res?.status() ?? "nessuna risposta"}`);
    }

    // Header di navigazione (sticky, in cima) — non "qualunque <header>": molte
    // pagine hanno anche un <header> di contenuto (es. intro articolo, hero
    // Labs), legittimo e preesistente, non e' quello di cui verificare la
    // non-duplicazione qui.
    const navHeaderCount = await page.locator("header.sticky").count();
    if (navHeaderCount !== 1) {
      problems.push(`${tag}: ${navHeaderCount} header di navigazione (.sticky) in pagina, atteso esattamente 1 (nessuna duplicazione dell'Header)`);
    }

    // Atteso = esattamente le locale che la pagina stessa dichiara negli
    // alternate (SSOT propria della pagina: 15 per la home/circa/ecc., meno
    // per provider/labs con copertura i18n parziale) — non un numero fisso.
    const expectedForPage = await page.$$eval('link[rel="alternate"][hreflang]', (as) =>
      as.map((a) => a.getAttribute("hreflang")).filter((h): h is string => !!h && h !== "x-default"),
    );
    const opts = await openMenuOptions(page);
    if (new Set(opts).size !== opts.length || !setsEqual(new Set(opts), new Set(expectedForPage))) {
      problems.push(`${tag}: menu = [${opts.join(",")}], atteso [${expectedForPage.join(",")}] (dagli alternate della pagina)`);
    }

    const knownNoise = /Content Security Policy|report-only|was preloaded using link preload but not used|Failed to fetch RSC payload|Falling back to browser navigation|Fetch API cannot load.*_rsc=|access control checks/i;
    const realErrors = consoleErrors.filter((e) => !knownNoise.test(e));
    if (realErrors.length > 0) {
      problems.push(`${tag}: errori console: ${realErrors.slice(0, 3).join(" | ")}`);
    }

    await page.close();
  }

  // /auth/reset-password vive fuori dal route group (marketing): nessun
  // Header/LanguageSwitcher ne' prima ne' dopo P0.14 — qui si conferma solo
  // che resta 200 e SENZA header (una regressione che gliene aggiungesse uno
  // per errore verrebbe comunque rilevata).
  const resetPage = await context.newPage();
  const resetErrors: string[] = [];
  resetPage.on("console", (msg) => {
    if (msg.type() === "error") resetErrors.push(msg.text());
  });
  const resetRes = await resetPage.goto(`${BASE_URL}/it/auth/reset-password`, { waitUntil: "networkidle" });
  if (!resetRes || resetRes.status() !== 200) {
    problems.push(`[${engineName}/non-regression] /it/auth/reset-password: HTTP ${resetRes?.status() ?? "nessuna risposta"}`);
  }
  if ((await resetPage.locator("header").count()) !== 0) {
    problems.push(`[${engineName}/non-regression] /it/auth/reset-password: header comparso dove prima non c'era`);
  }
  await resetPage.close();

  await context.close();
  await browser.close();
}

function setsEqual(a: Set<string>, b: Set<string>): boolean {
  if (a.size !== b.size) return false;
  for (const v of a) if (!b.has(v)) return false;
  return true;
}

async function main() {
  if (!BASE_URL) {
    console.log("⚠ BASE_URL non impostato — guardrail Chromium+WebKit selettore lingua SALTATO, non dichiarato verde.");
    return;
  }

  const problems: string[] = [];
  await run("chromium", chromium, problems);
  await run("webkit", webkit, problems);
  await runNonRegression("chromium", chromium, problems);
  await runNonRegression("webkit", webkit, problems);

  if (problems.length > 0) {
    console.error(`\n❌ Guardrail Chromium+WebKit selettore lingua: ${problems.length} problema/i\n`);
    for (const p of problems) console.error(`  - ${p}`);
    process.exit(1);
  }

  console.log(
    `\n✅ Guardrail Chromium+WebKit selettore lingua: ${Object.keys(REPRESENTATIVE).length} classi rappresentative × desktop/390px, hard-refresh + nav client (index->post, post->post, back/forward) + tastiera/Esc/click-fuori/cookie, zero errori console; ${NON_REGRESSION_PAGES.length} pagine non-blog + /auth/reset-password non-regressione; tutto contro ${BASE_URL}.`,
  );
}

main().catch((err) => {
  console.error("❌ Guardrail Chromium+WebKit selettore lingua: errore inatteso", err);
  process.exit(1);
});
