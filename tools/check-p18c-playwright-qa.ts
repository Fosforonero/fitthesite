/**
 * QA cross-browser P1.8C-A (micro-gate pre-merge PR #58). Chromium + WebKit
 * reale, stesso pattern di check-p18b-playwright-qa.ts / check-p013-playwright-qa.ts.
 *
 * Copre: landing Pixel Watch, landing Wear OS, articolo Pixel Watch,
 * articolo API, x IT/EN/DE/JA, x 320/390/desktop.
 *
 * Verifica per ogni combinazione:
 *  - HTTP 200, zero errori console (esclude rumore noto CSP/analytics/DevTools);
 *  - zero overflow orizzontale di pagina;
 *  - ogni <table> ha un antenato con overflow-x auto/scroll (scrollabile nel
 *    proprio contenitore, non nella pagina);
 *  - sulle landing provider: conteggio Play Store vs App Store — 3 Play / 2
 *    App Store atteso (hero+finale mostrano entrambi, il blocco dopo la
 *    matrice e' Android-only quindi solo Play);
 *  - cover image: naturalWidth/naturalHeight > 0 (non rotta), alt non vuoto;
 *  - DE: nessuna parola tedesca nota mancante dal contenuto (body clonato,
 *    script/style rimossi, MA i <details> chiusi restano — FAQ e
 *    troubleshooting partono collassati e non contano come "assenti");
 *  - JA: nessun escape Unicode letterale ("\\uXXXX") o replacement
 *    character (U+FFFD) nel contenuto (stesso body ripulito da script/style,
 *    altrimenti il JSON-LD e gli inline script contengono "\\uXXXX" legittimi
 *    e producono un falso positivo);
 *  - proxy di layout shift: bounding box dell'H1 stabile fra il load e
 *    +300ms (nessun reflow tardivo misurabile).
 *
 * Uso (Docker, se il browser locale non e' disponibile):
 *   docker run --rm --network container:<server> -v "$PWD":/app -w /app \
 *     mcr.microsoft.com/playwright:v1.60.0-noble npx tsx tools/check-p18c-playwright-qa.ts
 */
import { chromium, webkit } from "playwright";

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3417";
const VIEWPORTS = [
  { name: "320", width: 320, height: 800 },
  { name: "390", width: 390, height: 844 },
  { name: "desktop", width: 1440, height: 900 },
];

type PageSpec = {
  url: string;
  kind: "provider" | "article";
  locale: "it" | "en" | "de" | "ja";
  germanWords?: string[];
  japaneseStrings?: string[];
};

const PAGES: PageSpec[] = [
  { url: "/it/sync/pixel-watch", kind: "provider", locale: "it" },
  { url: "/en/sync/pixel-watch", kind: "provider", locale: "en" },
  { url: "/de/sync/pixel-watch", kind: "provider", locale: "de", germanWords: ["Gesundheitsdaten"] },
  { url: "/ja/sync/pixel-watch", kind: "provider", locale: "ja", japaneseStrings: ["ダッシュボード"] },
  { url: "/it/sync/wear-os", kind: "provider", locale: "it" },
  { url: "/en/sync/wear-os", kind: "provider", locale: "en" },
  { url: "/de/sync/wear-os", kind: "provider", locale: "de", germanWords: ["Synchronisierung"] },
  { url: "/ja/sync/wear-os", kind: "provider", locale: "ja", japaneseStrings: ["ダッシュボード"] },
  { url: "/it/blog/dati-pixel-watch-dashboard", kind: "article", locale: "it" },
  { url: "/en/blog/pixel-watch-data-personal-dashboard", kind: "article", locale: "en" },
  {
    url: "/de/blog/pixel-watch-daten-persoenliches-dashboard",
    kind: "article",
    locale: "de",
    germanWords: ["Herzfrequenzvariabilität"],
  },
  { url: "/ja/blog/pixel-watch-data-dashboard", kind: "article", locale: "ja", japaneseStrings: ["ダッシュボード"] },
  { url: "/it/blog/google-fit-api-dismissione-2026", kind: "article", locale: "it" },
  { url: "/en/blog/google-fit-shutting-down-alternative", kind: "article", locale: "en" },
  {
    url: "/de/blog/google-fit-eingestellt-alternative",
    kind: "article",
    locale: "de",
    germanWords: ["Gesundheitsdaten"],
  },
  {
    url: "/ja/blog/google-fit-shuuryou-health-connect-daian",
    kind: "article",
    locale: "ja",
    // "Health Connect" resta SEMPRE in caratteri latini anche in giapponese
    // (nome di prodotto, mai transliterato in katakana) — prima stesura di
    // questo script si aspettava erroneamente "ヘルスコネクト", che non e'
    // mai stato l'uso reale del sito: falso positivo, corretto qui.
    japaneseStrings: ["Health Connect"],
  },
];

const KNOWN_NOISE = [
  /DevTools/i,
  /Download the React DevTools/i,
  /Content Security Policy/i,
  /googletagmanager\.com/i,
  /google-analytics\.com/i,
  // Next.js dev-only preload warning, gia' osservato in QA precedente
  // (check-p18c-fase5, sessione precedente): non un errore funzionale.
  /was preloaded using link preload/i,
];

async function main() {
  const errors: string[] = [];
  const notes: string[] = [];
  let checks = 0;

  for (const engineName of ["chromium", "webkit"] as const) {
    const browser = await (engineName === "chromium" ? chromium : webkit).launch();
    for (const spec of PAGES) {
      for (const vp of VIEWPORTS) {
        checks++;
        const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
        const consoleErrors: string[] = [];
        page.on("console", (msg) => {
          if (msg.type() === "error" && !KNOWN_NOISE.some((re) => re.test(msg.text()))) {
            consoleErrors.push(msg.text());
          }
        });
        page.on("pageerror", (err) => consoleErrors.push(`pageerror: ${err.message}`));

        const tag = `${engineName}/${vp.name} ${spec.url}`;
        let res;
        try {
          res = await page.goto(`${BASE_URL}${spec.url}`, { waitUntil: "networkidle", timeout: 30000 });
        } catch (e) {
          errors.push(`[nav-fallita] ${tag}: ${(e as Error).message}`);
          await page.close();
          continue;
        }
        if (!res || res.status() !== 200) {
          errors.push(`[http] ${tag}: status ${res?.status()}`);
        }

        // overflow orizzontale
        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
        );
        if (overflow) errors.push(`[overflow] ${tag}: scrollWidth > clientWidth`);

        // tabelle scrollabili nel proprio contenitore
        const badTables = await page.evaluate(() => {
          const bad: number[] = [];
          document.querySelectorAll("table").forEach((t, i) => {
            let p: HTMLElement | null = t.parentElement;
            let wrapped = false;
            for (let d = 0; d < 3 && p; d++) {
              const cs = getComputedStyle(p);
              if (cs.overflowX === "auto" || cs.overflowX === "scroll") {
                wrapped = true;
                break;
              }
              p = p.parentElement;
            }
            if (!wrapped && t.scrollWidth > (document.documentElement.clientWidth || 9999)) bad.push(i);
          });
          return bad;
        });
        if (badTables.length > 0) errors.push(`[tabella-non-scrollabile] ${tag}: ${badTables.length} tabelle senza wrapper`);

        // CTA platform-aware sulle landing provider
        if (spec.kind === "provider") {
          const { play, apple } = await page.evaluate(() => ({
            play: document.querySelectorAll('a[href^="https://play.google.com"]').length,
            apple: document.querySelectorAll('a[href^="https://apps.apple.com"]').length,
          }));
          if (play !== 3 || apple !== 2) {
            errors.push(`[cta-platform] ${tag}: Play=${play} (atteso 3), Apple=${apple} (atteso 2)`);
          }
        }

        // cover image: non rotta, alt non vuoto
        const coverCheck = await page.evaluate(() => {
          const img = document.querySelector("figure img") as HTMLImageElement | null;
          if (!img) return { present: false };
          return {
            present: true,
            broken: img.naturalWidth === 0,
            alt: img.getAttribute("alt") ?? "",
          };
        });
        if (spec.kind === "article") {
          if (!coverCheck.present) errors.push(`[cover-assente] ${tag}: nessun <figure><img> trovato`);
          else if (coverCheck.broken) errors.push(`[cover-rotta] ${tag}: naturalWidth 0`);
          else if (!coverCheck.alt || coverCheck.alt.trim().length === 0) errors.push(`[cover-alt-vuoto] ${tag}`);
        }

        // Estrae il testo "reale" del contenuto: NON document.body.innerText
        // (esclude anche i <details> chiusi — FAQ/troubleshooting partono
        // collassati, falso positivo trovato nella prima stesura di questo
        // script) e NON document.body.textContent puro (include lo script
        // JSON-LD e gli inline script di analytics/SVG, che contengono
        // legittimamente sequenze "\uXXXX" JS — secondo falso positivo
        // trovato). Clona il body, rimuove <script>/<style>, poi textContent:
        // cosi' i <details> chiusi restano dentro ma il codice sorgente no.
        const bodyText = await page.evaluate(() => {
          const clone = document.body.cloneNode(true) as HTMLElement;
          clone.querySelectorAll("script, style").forEach((el) => el.remove());
          return clone.textContent ?? "";
        });

        // integrita' parole tedesche
        if (spec.germanWords) {
          for (const w of spec.germanWords) {
            if (!bodyText.includes(w)) errors.push(`[parola-tedesca-mancante] ${tag}: "${w}" non trovata intatta nel contenuto`);
          }
        }

        // integrita' stringhe giapponesi + assenza mojibake/escape letterali
        if (spec.locale === "ja") {
          if (/\\u[0-9a-fA-F]{4}/.test(bodyText)) errors.push(`[escape-unicode-letterale] ${tag}: trovato "\\uXXXX" letterale nel contenuto`);
          if (bodyText.includes("�")) errors.push(`[mojibake] ${tag}: replacement character U+FFFD nel contenuto`);
          for (const s of spec.japaneseStrings ?? []) {
            if (!bodyText.includes(s)) errors.push(`[stringa-giapponese-mancante] ${tag}: "${s}" non trovata intatta`);
          }
        }

        // proxy layout shift: bounding box H1 stabile dopo networkidle+300ms
        const h1Before = await page.evaluate(() => {
          const h1 = document.querySelector("h1");
          const r = h1?.getBoundingClientRect();
          return r ? { x: r.x, y: r.y } : null;
        });
        await page.waitForTimeout(300);
        const h1After = await page.evaluate(() => {
          const h1 = document.querySelector("h1");
          const r = h1?.getBoundingClientRect();
          return r ? { x: r.x, y: r.y } : null;
        });
        if (h1Before && h1After) {
          const dx = Math.abs(h1Before.x - h1After.x);
          const dy = Math.abs(h1Before.y - h1After.y);
          if (dx > 2 || dy > 2) {
            errors.push(`[layout-shift] ${tag}: H1 spostato di (${dx.toFixed(1)}, ${dy.toFixed(1)}px) dopo il load`);
          }
        }

        if (consoleErrors.length > 0) {
          errors.push(`[console] ${tag}: ${consoleErrors.join(" | ")}`);
        }

        await page.close();
      }
    }
    await browser.close();
    notes.push(`${engineName}: ${PAGES.length * VIEWPORTS.length} combinazioni eseguite`);
  }

  console.log(`Checked ${checks} combinazioni totali (2 engine x ${PAGES.length} pagine x ${VIEWPORTS.length} viewport).`);
  notes.forEach((n) => console.log("  " + n));
  if (errors.length > 0) {
    console.error(`❌ P1.8C-A Playwright QA (Chromium+WebKit): ${errors.length} problemi.`);
    for (const e of errors) console.error("  " + e);
    process.exit(1);
  }
  console.log(
    "✅ P1.8C-A Playwright QA: tutte le combinazioni Chromium+WebKit verdi (zero overflow, tabelle scrollabili nel proprio contenitore, CTA platform-aware corrette, cover integre con alt, parole tedesche/stringhe giapponesi intatte, zero layout shift misurabile, zero errori console).",
  );
}

main().catch((err) => {
  console.error("❌ errore inatteso", err);
  process.exit(1);
});
