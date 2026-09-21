/**
 * Guardrail P0.24-A: comportamento reale di Google Analytics prima e dopo il
 * consenso, in Chromium e WebKit, desktop e mobile, con profili temporanei
 * puliti.
 *
 * Rosso se:
 *  - al primo accesso parte qualunque richiesta verso Google Analytics o il
 *    Google tag, o compaiono cookie _ga, o esiste window.gtag;
 *  - dopo un rifiuto parte qualunque richiesta, anche dopo una navigazione
 *    client-side, un click su una CTA o una nuova visita;
 *  - dopo l'accettazione lo script GA viene caricato piu' di una volta, o una
 *    navigazione produce piu' di un page_view o un page_view con l'URL di
 *    un'altra pagina;
 *  - dopo la revoca dal pulsante del footer la pagina non si ricarica senza il
 *    tag, parte ancora una richiesta verso GA o il Google tag (anche con i
 *    diagnostici del tag forzati da gtm_latency=1), i cookie _ga restano, o la
 *    visita successiva carica GA;
 *  - una route con codici nell'URL (OAuth, reset, inviti, login) carica GA
 *    anche con consenso dato, o riceve un page_view dopo una navigazione
 *    client-side;
 *  - una route con codici nell'URL compare come referrer di un page_view
 *    dopo pagina esclusa -> link -> indietro -> avanti;
 *  - una pagina NON esclusa raggiunta con code, state, token o click id nella
 *    query li manda a Google in un page_view generato da gtag.js sulla history
 *    (navigazione client-side, indietro, avanti): flusso HL;
 *  - un ripristino dalla cache avanti/indietro (pageshow persistente) dopo una
 *    revoca fatta altrove lascia GA attivo o parte una richiesta: flusso PS;
 *  - un payload contiene un indirizzo email, dati utente hashati (em=), un
 *    UUID o un parametro code/state/token;
 *  - la console registra errori (esclusi gli avvisi della CSP report-only e
 *    del frame Cloudflare Turnstile).
 *
 * Su un server locale le hit di raccolta vengono registrate e ricevono una
 * risposta vuota (204), per non mandare dati di prova nella proprieta' GA di
 * produzione; lo script gtag.js viene scaricato davvero. Su un host pubblico
 * non intercetta nulla.
 *
 * Uso: BASE_URL=http://localhost:3924 npx tsx tools/check-analytics-consent-browser.ts
 * Solo alcuni flussi: GUARDRAIL_FLOWS=BF (nomi: A, B, C, D, D-stessa-pagina, P, BF, HL, PS).
 * Controllo di controllo: GUARDRAIL_FLOWS=BF GUARDRAIL_DROP_REFERRER=1 deve dare ROSSO.
 */
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { chromium, webkit, type BrowserContext, type BrowserType, type Page, type Request } from "playwright";

const BASE_URL = (process.env.BASE_URL ?? "http://localhost:3924").replace(/\/$/, "");
const LOCAL = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(BASE_URL);
const GOOGLE = /(^|\.)(google-analytics\.com|analytics\.google\.com|googletagmanager\.com|doubleclick\.net)$/i;
const COLLECT = /google-analytics\.com|analytics\.google\.com/i;
const NOISE = /Content Security Policy|report-only|challenges\.cloudflare\.com|Failed to fetch RSC payload|_rsc=|access control checks/i;
const UNSAFE = [
  /[^\s@=&]+@[^\s@=&]+\.[a-z]{2,}/i,
  /(^|[?&\n])em=/,
  /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i,
  /FAKE_P024A/,
  /[?&](code|state|token|token_hash)=/i,
];

// Una richiesta raggruppata ha i parametri comuni nell'URL e un evento per
// riga nel corpo: il `dl` di riga, se c'e', prevale su quello dell'URL.
// `blocked`: richiesta fermata dalla CSP prima di uscire (Chromium emette
// comunque l'evento request, poi requestfailed con motivo "csp").
type Hit = { host: string; path: string; events: string[]; pages: string[]; raw: string; blocked: boolean };
// Controllo di controllo: GUARDRAIL_DROP_REFERRER=1 toglie `page_referrer` dal
// `config` di GA prima che arrivi al dataLayer, cioe' riproduce il comportamento
// precedente alla correzione del referrer. Con questo interruttore il flusso BF
// deve diventare ROSSO: se resta verde, il flusso non vede la perdita.
const DROP_REFERRER = process.env.GUARDRAIL_DROP_REFERRER === "1";
// GUARDRAIL_FLOWS=BF,P esegue solo quei flussi (messa a punto); senza, li esegue tutti.
const ONLY_FLOWS = process.env.GUARDRAIL_FLOWS?.split(",").map((f) => f.trim()).filter(Boolean);
const failures: string[] = [];
let checks = 0;
function check(ok: boolean, label: string) {
  checks++;
  if (!ok) failures.push(label);
}

function watch(page: Page, hits: Hit[], errors: string[]) {
  const byRequest = new Map<Request, Hit>();
  page.on("requestfailed", (req) => {
    const hit = byRequest.get(req);
    if (hit && /csp/i.test(req.failure()?.errorText ?? "")) hit.blocked = true;
  });
  page.on("request", (req) => {
    let url: URL;
    try {
      url = new URL(req.url());
    } catch {
      return;
    }
    if (!GOOGLE.test(url.hostname)) return;
    const dl = url.searchParams.get("dl") ?? "";
    const lines = [url.search.slice(1), ...(req.postData() ?? "").split("\n")]
      .filter(Boolean)
      .map((l) => new URLSearchParams(l))
      .filter((q) => q.get("en"));
    const events = lines.map((q) => q.get("en")!);
    const pages = lines.map((q) => q.get("dl") ?? dl);
    const hit = { host: url.hostname, path: url.pathname, events, pages, raw: decodeURIComponent(`${url.search}\n${req.postData() ?? ""}`), blocked: false };
    hits.push(hit);
    byRequest.set(req, hit);
  });
  page.on("console", (m) => {
    if (m.type() === "error" && !NOISE.test(m.text())) errors.push(m.text().slice(0, 200));
  });
  page.on("pageerror", (e) => {
    if (!NOISE.test(String(e))) errors.push(`pageerror: ${String(e).slice(0, 200)}`);
  });
}

async function newContext(engine: BrowserType, dir: string, mobile: boolean): Promise<BrowserContext> {
  const ctx = await engine.launchPersistentContext(dir, {
    viewport: mobile ? { width: 390, height: 844 } : { width: 1280, height: 900 },
    isMobile: mobile && engine !== webkit ? true : undefined,
    hasTouch: mobile,
    locale: "it-IT",
  });
  if (DROP_REFERRER) {
    // Stringa e non funzione: tsx aggiunge helper (`__name`) alle funzioni
    // serializzate da Playwright, che nella pagina non esistono.
    await ctx.addInitScript(`(() => {
      let real;
      Object.defineProperty(window, "gtag", {
        configurable: true,
        get: () => real,
        set: (fn) => {
          real = function (...args) {
            if (args[0] === "config" && args[2] && typeof args[2] === "object") {
              const copy = { ...args[2] };
              delete copy.page_referrer;
              args[2] = copy;
            }
            return fn.apply(this, args);
          };
        },
      });
    })();`);
  }
  // 204 e non abort: un abort produce errori di console che non sono del sito.
  if (LOCAL) await ctx.route(COLLECT, (route) => route.fulfill({ status: 204 }));
  await ctx.route(/play\.google\.com|apps\.apple\.com/, (route) => route.fulfill({ status: 204, body: "" }));
  return ctx;
}

async function visit(ctx: BrowserContext, path: string, act?: (p: Page) => Promise<void>) {
  const page = await ctx.newPage();
  const hits: Hit[] = [];
  const errors: string[] = [];
  watch(page, hits, errors);
  await page.goto(`${BASE_URL}${path}`, { waitUntil: "load", timeout: 60_000 });
  await page.waitForTimeout(2500);
  if (act) await act(page);
  // gtag.js raggruppa gli eventi e li invia dopo alcuni secondi.
  await page.waitForTimeout(7000);
  const state = await page.evaluate(() => ({
    gtag: typeof (window as unknown as { gtag?: unknown }).gtag,
    banner: !!document.querySelector('[role="dialog"] button'),
  }));
  const cookies = (await ctx.cookies()).map((c) => c.name);
  await page.close({ runBeforeUnload: true });
  await new Promise((r) => setTimeout(r, 800));
  return { hits: hits.filter((h) => !h.blocked), errors, state, cookies };
}

const bannerButton = (p: Page, which: "accept" | "reject") =>
  p.locator('[role="dialog"] button').nth(which === "accept" ? 1 : 0).click();
const visible = (p: Page, selector: string) => p.locator(selector).filter({ visible: true }).first();
// Link del footer: su mobile quelli dell'header stanno nel menu chiuso, che
// ha dimensioni ma e' coperto dalla pagina e non riceve il click.
const footerLink = async (p: Page, suffix: string) => {
  const link = p.locator(`footer a[href$="${suffix}"]`).first();
  await link.scrollIntoViewIfNeeded();
  await link.click();
};

/** Click su una CTA della home, poi navigazione client-side verso /integrations. */
async function softNavAndCta(p: Page) {
  // dispatchEvent: su mobile l'unica CTA dell'header sta nel menu chiuso, e
  // /integrations non ha CTA nel contenuto. L'ascoltatore di OutboundTracker
  // e' lo stesso di un click reale.
  const cta = p.locator("main [data-cta-id]").first();
  if (await cta.count()) await cta.dispatchEvent("click");
  await footerLink(p, "/integrations");
  await p.waitForURL(/\/integrations$/, { timeout: 15_000 });
  await p.waitForTimeout(2500);
}

function pageViews(hits: Hit[]) {
  return hits.flatMap((h) =>
    h.events.flatMap((e, i) => (e === "page_view" ? [h.pages[i].replace(/[?#].*$/, "")] : [])),
  );
}

/** Due page_view consecutivi sullo stesso URL: la stessa navigazione contata due volte. */
function consecutiveDuplicates(pv: string[]) {
  return pv.filter((url, i) => i > 0 && pv[i - 1] === url);
}

async function run(engine: BrowserType, mobile: boolean) {
  const tag = `${engine.name()}/${mobile ? "mobile" : "desktop"}`;
  const flow = async (name: string, body: (ctx: BrowserContext, restart: () => Promise<BrowserContext>) => Promise<void>) => {
    if (ONLY_FLOWS && !ONLY_FLOWS.includes(name)) return;
    const dir = mkdtempSync(join(tmpdir(), "p024a-"));
    let ctx = await newContext(engine, dir, mobile);
    const restart = async () => {
      await ctx.close();
      ctx = await newContext(engine, dir, mobile);
      return ctx;
    };
    try {
      await body(ctx, restart);
    } catch (e) {
      failures.push(`${tag} ${name}: ${String(e).slice(0, 200)}`);
    } finally {
      await ctx.close();
      rmSync(dir, { recursive: true, force: true });
    }
  };
  const noGoogle = (label: string, r: Awaited<ReturnType<typeof visit>>) => {
    check(r.hits.length === 0, `${tag} ${label}: ${r.hits.length} richieste Google (${r.hits.map((h) => h.host + h.path).join(", ")})`);
    check(r.state.gtag === "undefined", `${tag} ${label}: window.gtag esiste`);
    check(!r.cookies.some((c) => c.startsWith("_ga")), `${tag} ${label}: cookie _ga presenti`);
    check(r.errors.length === 0, `${tag} ${label}: errori console ${r.errors.join(" | ")}`);
  };
  const safePayload = (label: string, hits: Hit[]) => {
    for (const h of hits) for (const re of UNSAFE) check(!re.test(h.raw), `${tag} ${label}: payload con ${re}`);
  };

  await flow("A", async (ctx, restart) => {
    const a = await visit(ctx, "/it");
    noGoogle("A primo accesso", a);
    check(a.state.banner, `${tag} A: banner assente`);
    const e = await visit(await restart(), "/it");
    noGoogle("A nuova visita senza scelta", e);
  });

  await flow("B", async (ctx, restart) => {
    const b = await visit(ctx, "/it", (p) => bannerButton(p, "reject"));
    noGoogle("B rifiuto", b);
    const e1 = await visit(await restart(), "/it", softNavAndCta);
    noGoogle("B nuova visita, navigazione e CTA", e1);
    check(!e1.state.banner, `${tag} B: il banner ricompare dopo il rifiuto`);
  });

  await flow("C", async (ctx, restart) => {
    const c = await visit(ctx, "/it", async (p) => {
      await bannerButton(p, "accept");
      await p.waitForTimeout(2500);
      await softNavAndCta(p);
      await footerLink(p, "/about");
      await p.waitForURL(/\/about$/, { timeout: 15_000 });
    });
    const scripts = c.hits.filter((h) => h.host.endsWith("googletagmanager.com") && h.path === "/gtag/js");
    check(scripts.length === 1, `${tag} C: gtag.js caricato ${scripts.length} volte`);
    const pv = pageViews(c.hits);
    check(pv.length >= 1, `${tag} C: nessun page_view dopo l'accettazione`);
    check(consecutiveDuplicates(pv).length === 0, `${tag} C: page_view duplicati ${pv.join(", ")}`);
    // Un page_view per pagina, ciascuno con il proprio URL.
    const expected = ["/it", "/it/integrations", "/it/about"].map((path) => `${BASE_URL}${path}`);
    check(pv.join() === expected.join(), `${tag} C: page_view ${pv.join(", ")} invece di ${expected.join(", ")}`);
    check(c.hits.some((h) => h.events.includes("cta_click")), `${tag} C: cta_click assente dopo il consenso`);
    check(c.cookies.some((n) => n === "_ga"), `${tag} C: cookie _ga assente dopo il consenso`);
    check(c.errors.length === 0, `${tag} C: errori console ${c.errors.join(" | ")}`);
    safePayload("C", c.hits);
    const e = await visit(await restart(), "/it");
    const s2 = e.hits.filter((h) => h.path === "/gtag/js");
    check(s2.length === 1, `${tag} C nuova visita: gtag.js caricato ${s2.length} volte`);
    check(pageViews(e.hits).length === 1, `${tag} C nuova visita: page_view ${pageViews(e.hits).length}`);
    safePayload("C nuova visita", e.hits);
  });

  await flow("D", async (ctx, restart) => {
    const d = await visit(ctx, "/it", async (p) => {
      await bannerButton(p, "accept");
      await p.waitForTimeout(3000);
      await visible(p, "[data-consent-revoke]").scrollIntoViewIfNeeded();
      await visible(p, "[data-consent-revoke]").click();
      await p.waitForTimeout(500);
      await Promise.all([p.waitForEvent("load"), bannerButton(p, "reject")]);
      await p.waitForTimeout(1500);
    });
    check(!d.cookies.some((c) => c.startsWith("_ga")), `${tag} D: cookie _ga ancora presenti dopo la revoca`);
    check(d.state.gtag === "undefined", `${tag} D: dopo la revoca la pagina non si e' ricaricata senza gtag`);
    // Dopo la revoca: navigazione e CTA in una nuova pagina dello stesso profilo.
    const after = await visit(ctx, "/it", softNavAndCta);
    check(after.hits.length === 0, `${tag} D: ${after.hits.length} richieste Google dopo la revoca`);
    check(!after.cookies.some((c) => c.startsWith("_ga")), `${tag} D: cookie _ga ricreati dopo la revoca`);
    const e = await visit(await restart(), "/it");
    noGoogle("D nuova visita dopo la revoca", e);
  });

  // gtm_latency=1 forza i diagnostici del Google tag, che altrimenti partono
  // solo su una piccola parte dei caricamenti: e' il caso peggiore per la revoca.
  await flow("D-stessa-pagina", async (ctx) => {
    const page = await ctx.newPage();
    const hits: Hit[] = [];
    const errors: string[] = [];
    watch(page, hits, errors);
    await page.goto(`${BASE_URL}/it?gtm_latency=1`, { waitUntil: "load" });
    await page.waitForTimeout(2000);
    await bannerButton(page, "accept");
    await page.waitForTimeout(3000);
    await page.mouse.wheel(0, 2500);
    await visible(page, "[data-consent-revoke]").scrollIntoViewIfNeeded();
    await visible(page, "[data-consent-revoke]").click();
    await page.waitForTimeout(500);
    // Da qui in poi nessuna richiesta verso GA o il Google tag, nemmeno la coda
    // formata prima del rifiuto o i diagnostici inviati alla chiusura.
    const before = hits.length;
    await Promise.all([page.waitForEvent("load"), bannerButton(page, "reject")]);
    const gtagAfter = await page.evaluate(() => typeof (window as unknown as { gtag?: unknown }).gtag);
    await softNavAndCta(page);
    await page.mouse.wheel(0, 2500);
    await page.waitForTimeout(9000);
    await page.close({ runBeforeUnload: true });
    await new Promise((r) => setTimeout(r, 800));
    const later = hits.slice(before).filter((h) => !h.blocked);
    check(later.length === 0, `${tag} D stessa pagina: ${later.length} richieste Google dopo la revoca (${later.map((h) => h.host + h.path).join(", ")})`);
    check(gtagAfter === "undefined", `${tag} D stessa pagina: gtag ancora definito dopo la ricarica`);
  });

  await flow("P", async (ctx) => {
    await visit(ctx, "/it", (p) => bannerButton(p, "accept"));
    for (const path of [
      "/oauth/fitbit/callback?code=FAKE_P024A&state=FAKE_P024A",
      "/it/auth/reset-password?code=FAKE_P024A",
      "/it/famiglia/join/FAKE_P024A",
      "/it/auth/login",
    ]) {
      const r = await visit(ctx, path);
      check(r.hits.length === 0, `${tag} P ${path}: ${r.hits.length} richieste Google con consenso dato`);
    }
    // Stesso percorso raggiunto senza ricaricare: il page_view automatico di
    // gtag.js sul cambio di history non deve partire.
    const soft = await visit(ctx, "/it", async (p) => {
      await p.waitForTimeout(3000);
      await Promise.all([
        p.waitForEvent("load"),
        p.evaluate(() => window.history.pushState({}, "", "/it/auth/reset-password?code=FAKE_P024A")),
      ]);
    });
    const leaked = soft.hits.filter((h) => /\/auth\/|FAKE_P024A/.test(h.raw));
    check(leaked.length === 0, `${tag} P navigazione client-side verso una route esclusa: ${leaked.length} hit`);
    check(soft.state.gtag === "undefined", `${tag} P navigazione client-side verso una route esclusa: gtag ancora in memoria`);
    safePayload("P navigazione client-side", soft.hits);
  });

  // Pagina esclusa -> link client-side -> indietro -> avanti. Con l'avanti il
  // documento si ricarica e il primo page_view puo' portare come referrer
  // l'URL escluso: non deve arrivare a Google.
  // Landing ostile: una pagina non esclusa raggiunta con parametri che non
  // devono arrivare a Google. Il primo page_view e' ripulito dal config; quelli
  // che gtag.js genera da solo sulla history (link, indietro, avanti) portano
  // URL e referrer del browser: la sanificazione all'uscita deve ripulirli.
  await flow("HL", async (ctx) => {
    await visit(ctx, "/it", (p) => bannerButton(p, "accept"));
    const page = await ctx.newPage();
    const hits: Hit[] = [];
    const errors: string[] = [];
    watch(page, hits, errors);
    const hostile = "?code=SECRETCODE1&state=SECRETSTATE1&token=TOK123&fbclid=FB1&utm_source=news&utm_content=3f2b8c1e-9a4d-4e6f-8b7a-1c2d3e4f5a6b";
    await page.goto(`${BASE_URL}/it/about${hostile}`, { waitUntil: "load" });
    await page.waitForTimeout(2500);
    await footerLink(page, "/integrations");
    await page.waitForURL(/\/integrations$/, { timeout: 15_000 });
    await page.waitForTimeout(2500);
    await page.goBack({ waitUntil: "load" });
    await page.waitForTimeout(2500);
    await page.goForward({ waitUntil: "load" });
    await page.waitForTimeout(9000);
    await page.close({ runBeforeUnload: true });
    await new Promise((r) => setTimeout(r, 800));
    const sent = hits.filter((h) => !h.blocked);
    const pv = pageViews(sent);
    check(pv.length >= 3, `${tag} HL: solo ${pv.length} page_view (il controllo non ha esercitato la history)`);
    const leaked = sent.filter((h) => /SECRETCODE1|SECRETSTATE1|TOK123|FB1\b|3f2b8c1e/.test(h.raw));
    check(leaked.length === 0, `${tag} HL: ${leaked.length} richieste Google con code, state, token, click id o UUID dell'URL di ingresso`);
    check(errors.length === 0, `${tag} HL: errori console ${errors.join(" | ")}`);
  });

  // Revoca fatta in un altro documento mentre questa pagina e' nella cache
  // avanti/indietro: al ripristino (pageshow persistente) il consenso si rilegge.
  await flow("PS", async (ctx) => {
    const page = await ctx.newPage();
    const hits: Hit[] = [];
    const errors: string[] = [];
    watch(page, hits, errors);
    await page.goto(`${BASE_URL}/it`, { waitUntil: "load" });
    await page.waitForTimeout(1500);
    await bannerButton(page, "accept");
    await page.waitForTimeout(3500);
    // La revoca avviene altrove: per questa pagina non c'e' nessun evento storage.
    await page.evaluate(() => localStorage.setItem("fitmesh_cookie_consent", JSON.stringify({ analytics: false, ts: Date.now() })));
    const before = hits.length;
    let reloaded = true;
    try {
      await Promise.all([
        page.waitForEvent("load", { timeout: 15_000 }),
        page.evaluate(() => window.dispatchEvent(new PageTransitionEvent("pageshow", { persisted: true }))),
      ]);
    } catch {
      reloaded = false;
    }
    await page.waitForTimeout(2000);
    const gtagAfter = await page.evaluate(() => typeof (window as unknown as { gtag?: unknown }).gtag).catch(() => "errore");
    await page.mouse.wheel(0, 2500);
    await page.waitForTimeout(9000);
    const cookies = (await ctx.cookies()).map((c) => c.name);
    await page.close({ runBeforeUnload: true });
    await new Promise((r) => setTimeout(r, 800));
    const later = hits.slice(before).filter((h) => !h.blocked);
    check(reloaded, `${tag} PS: dopo il ripristino la pagina non si e' ricaricata senza il tag`);
    check(gtagAfter === "undefined", `${tag} PS: gtag ancora definito dopo il ripristino`);
    check(later.length === 0, `${tag} PS: ${later.length} richieste Google dopo la revoca fatta altrove (${later.map((h) => h.host + h.path).join(", ")})`);
    check(!cookies.some((c) => c.startsWith("_ga")), `${tag} PS: cookie _ga ancora presenti dopo la revoca`);
  });

  await flow("BF", async (ctx) => {
    await visit(ctx, "/it", (p) => bannerButton(p, "accept"));
    const page = await ctx.newPage();
    const hits: Hit[] = [];
    const errors: string[] = [];
    watch(page, hits, errors);
    await page.goto(`${BASE_URL}/it/auth/forgot-password`, { waitUntil: "load" });
    await page.waitForTimeout(1500);
    await Promise.all([page.waitForURL((u) => u.pathname === "/it"), page.locator('a[href="/it"]').first().click()]);
    await page.waitForTimeout(3500);
    // L'indietro e' una navigazione nello stesso documento: il sito reagisce
    // ricaricando la pagina senza il tag. Si attende il `load` di quella
    // ricarica, altrimenti lo stato si legge a meta' (WebKit: gtag ancora
    // presente; Chromium: contesto distrutto dalla navigazione).
    let reloaded = true;
    try {
      await Promise.all([page.waitForEvent("load", { timeout: 15_000 }), page.goBack()]);
    } catch {
      reloaded = false;
    }
    await page.waitForTimeout(2000);
    const gtagOnExcluded = await page.evaluate(() => typeof (window as unknown as { gtag?: unknown }).gtag).catch(() => "errore");
    check(reloaded, `${tag} BF: la pagina non si e' ricaricata tornando alla route esclusa`);
    await page.waitForTimeout(9000);
    await page.goForward({ waitUntil: "load" });
    await page.waitForTimeout(12000);
    await page.close({ runBeforeUnload: true });
    await new Promise((r) => setTimeout(r, 800));
    const sent = hits.filter((h) => !h.blocked);
    check(gtagOnExcluded === "undefined", `${tag} BF: tornando alla pagina esclusa gtag e' ancora in memoria`);
    check(pageViews(sent).length >= 1, `${tag} BF: nessun page_view dopo l'avanti (il controllo non ha esercitato il percorso)`);
    const leaked = sent.filter((h) => /\/auth\//.test(h.raw));
    check(leaked.length === 0, `${tag} BF: ${leaked.length} richieste Google con l'URL della pagina esclusa (dr o dl)`);
    check(errors.length === 0, `${tag} BF: errori console ${errors.join(" | ")}`);
  });
}

(async () => {
  for (const engine of [chromium, webkit]) {
    for (const mobile of [false, true]) await run(engine, mobile);
  }
  console.log(`\n== guardrail consenso analytics (${BASE_URL}${LOCAL ? ", raccolta bloccata" : ""}) ==`);
  console.log(`  controlli: ${checks}`);
  if (failures.length) {
    for (const f of failures) console.log(`  ROSSO  ${f}`);
    console.log(`\nROSSO: ${failures.length} violazioni.`);
    process.exit(1);
  }
  console.log("\nVERDE: nessuna richiesta Google prima del consenso o dopo rifiuto e revoca.");
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
