/**
 * Guardrail accessibilità FitMesh Labs (P1.1 + P1.1B Fase 2 + P1.1C Fase 3) -
 * verifica via browser reale (Playwright, Chromium E WebKit), non lettura
 * statica del codice, contro le 6 combinazioni tool×locale live (HRV it/en,
 * Sleep Efficiency it/en, Heart Rate Zones it/en - P1.4B).
 *
 * P1.1B Fase 2 riscrive la parte precedentemente debole: il guardrail
 * originale simulava 8 Tab da un punto imprecisato della pagina (poteva
 * finire nella navigazione globale, mai nel calcolatore) e controllava solo
 * la modalità semplice di Sleep Efficiency. Ora:
 *  - localizza i controlli DIRETTAMENTE dentro il contenitore del
 *    calcolatore (data-testid), mai un Tab-walk alla cieca dalla cima
 *    della pagina;
 *  - percorre TUTTI i controlli visibili del calcolatore, non solo i primi 8;
 *  - verifica sia la modalità semplice sia quella avanzata di Sleep
 *    Efficiency, per entrambe le lingue;
 *  - verifica che ogni nome accessibile sia non vuoto E non duplicato
 *    all'interno dello stesso gruppo di controlli (non basta "non vuoto":
 *    due controlli diversi con lo stesso nome "ore"/"hours" sono comunque
 *    un problema per chi usa uno screen reader);
 *  - verifica la semantica nativa radio del selettore modalità;
 *  - verifica il percorso di errore bloccante (input impossibile ->
 *    risultato mai mostrato, messaggio presente);
 *  - gira su Chromium E WebKit, non solo Chromium.
 *
 * P1.1C Fase 3 elimina l'ultimo controllo non deterministico rimasto: la
 * prova che un calcolo fosse avvenuto si basava su un `text=/%/` generico
 * dentro il container, un match testuale che può accidentalmente colpire
 * testo editoriale non legato al risultato. Sostituito con un selettore
 * stabile e dedicato (`data-testid="labs-calculation-results"` per la
 * regione, `"labs-result-value"` per il valore numerico primario), mai
 * l'hero title o copy editoriale come prova del calcolo - vedi
 * checkResultsRegionPositive/checkResultsRegionBlocked sotto.
 */
import { chromium, webkit, type Browser, type BrowserType, type Page } from "playwright";

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";

const PAGES = [
  { path: "/it/labs/calcolatore-hrv-rmssd", lc: "it" as const, tool: "hrv" as const },
  { path: "/en/labs/hrv-rmssd-calculator", lc: "en" as const, tool: "hrv" as const },
  { path: "/it/labs/calcolatore-efficienza-sonno", lc: "it" as const, tool: "sleep" as const },
  { path: "/en/labs/sleep-efficiency-calculator", lc: "en" as const, tool: "sleep" as const },
  { path: "/it/labs/calcolatore-zone-frequenza-cardiaca", lc: "it" as const, tool: "heart-rate-zones" as const },
  { path: "/en/labs/heart-rate-zones-calculator", lc: "en" as const, tool: "heart-rate-zones" as const },
];

const ENGINES: { name: string; launcher: BrowserType }[] = [
  { name: "chromium", launcher: chromium },
  { name: "webkit", launcher: webkit },
];

// ── 7. Contrasto colore: calcolato dai design token reali (design-tokens.css) ──
function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.replace("#", ""), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function relLuminance([r, g, b]: [number, number, number]): number {
  const f = (c: number) => {
    c /= 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  const [R, G, B] = [f(r), f(g), f(b)];
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}
function contrastRatio(hex1: string, hex2: string): number {
  const L1 = relLuminance(hexToRgb(hex1));
  const L2 = relLuminance(hexToRgb(hex2));
  const [lighter, darker] = L1 > L2 ? [L1, L2] : [L2, L1];
  return (lighter + 0.05) / (darker + 0.05);
}

const CONTRAST_PAIRS: { label: string; fg: string; bg: string; minRatio: number }[] = [
  { label: "text-primary su bg-card", fg: "#FFFFFF", bg: "#12182B", minRatio: 4.5 },
  { label: "text-secondary su bg-card", fg: "#B7C2D8", bg: "#12182B", minRatio: 4.5 },
  { label: "text-muted su bg-card", fg: "#7F8AA3", bg: "#12182B", minRatio: 4.5 },
  { label: "brand-aqua (valore RMSSD evidenziato) su bg-card", fg: "#21E6C1", bg: "#12182B", minRatio: 4.5 },
  { label: "warning su bg-card", fg: "#FFB547", bg: "#12182B", minRatio: 4.5 },
];

function checkContrast(): string[] {
  const problems: string[] = [];
  for (const { label, fg, bg, minRatio } of CONTRAST_PAIRS) {
    const ratio = contrastRatio(fg, bg);
    if (ratio < minRatio) {
      problems.push(`[contrasto] ${label}: ${ratio.toFixed(2)}:1, sotto la soglia WCAG AA ${minRatio}:1.`);
    }
  }
  return problems;
}

// ── Nome accessibile: approssima l'algoritmo del browser (aria-label >
// aria-labelledby > label associata > testo del bottone), MAI il
// placeholder da solo (un placeholder non è un nome accessibile). ─────────
async function accessibleNameOf(page: Page, el: ReturnType<Page["locator"]>): Promise<string | null> {
  return el.evaluate((node) => {
    const n = node as HTMLElement;
    const ariaLabel = n.getAttribute("aria-label");
    if (ariaLabel && ariaLabel.trim()) return ariaLabel.trim();
    const labelledBy = n.getAttribute("aria-labelledby");
    if (labelledBy) {
      const text = labelledBy
        .split(/\s+/)
        .map((id) => document.getElementById(id)?.textContent?.trim() ?? "")
        .filter(Boolean)
        .join(" ");
      if (text) return text;
    }
    const id = n.id;
    if (id) {
      const label = document.querySelector(`label[for="${CSS.escape(id)}"]`);
      if (label?.textContent?.trim()) return label.textContent.trim();
    }
    const parentLabel = n.closest("label");
    if (parentLabel?.textContent?.trim()) return parentLabel.textContent.trim();
    if (n.tagName === "BUTTON" && n.textContent?.trim()) return n.textContent.trim();
    if (n.tagName === "SELECT") {
      // già coperto da label[for]/aria-label sopra: se arriviamo qui non ne ha uno reale.
      return null;
    }
    return null;
  });
}

/** Elementi form-control visibili dentro un contenitore, in ordine DOM (deterministico). */
async function focusableControlsIn(page: Page, containerTestId: string) {
  return page.locator(
    `[data-testid="${containerTestId}"] :is(input, select, textarea, button):visible`,
  );
}

/**
 * Come focusableControlsIn, ma per il conteggio REALE dei tab-stop: un
 * gruppo di input[type=radio] con lo stesso `name` è UN SOLO tab-stop nella
 * tastiera nativa del browser (Tab entra/esce dal gruppo, le frecce si
 * muovono fra i radio dello stesso gruppo) - sottovalutare questo produce
 * falsi positivi ("uscito dal calcolatore") su markup radio corretto.
 */
async function keyboardTabStopCountIn(page: Page, containerTestId: string): Promise<number> {
  return page.evaluate((testId) => {
    const container = document.querySelector(`[data-testid="${testId}"]`);
    if (!container) return 0;
    const all = Array.from(container.querySelectorAll("input, select, textarea, button")) as HTMLElement[];
    const visible = all.filter((el) => el.offsetParent !== null || el.getClientRects().length > 0);
    const seenRadioGroups = new Set<string>();
    let stops = 0;
    for (const el of visible) {
      if (el instanceof HTMLInputElement && el.type === "radio" && el.name) {
        if (seenRadioGroups.has(el.name)) continue;
        seenRadioGroups.add(el.name);
      }
      stops++;
    }
    return stops;
  }, containerTestId);
}

async function checkCalculatorControls(
  page: Page,
  path: string,
  engine: string,
  containerTestId: string,
  groupLabel: string,
): Promise<string[]> {
  const problems: string[] = [];
  const controls = await focusableControlsIn(page, containerTestId);
  const count = await controls.count();

  if (count === 0) {
    problems.push(`[${engine}] [${path}/${groupLabel}] nessun controllo focalizzabile trovato nel calcolatore.`);
    return problems;
  }

  const namesSeen = new Map<string, number>();
  for (let i = 0; i < count; i++) {
    const el = controls.nth(i);
    const tag = await el.evaluate((n) => n.tagName);
    const type = await el.getAttribute("type");
    const name = await accessibleNameOf(page, el);

    if (!name || !name.trim()) {
      const outerHtml = await el.evaluate((n) => (n as HTMLElement).outerHTML.slice(0, 140));
      problems.push(`[${engine}] [${path}/${groupLabel}] controllo #${i} (${tag}${type ? `[type=${type}]` : ""}) senza nome accessibile: ${outerHtml}`);
      continue;
    }
    // Solo per input/select (non i bottoni, il cui "nome duplicato" è spesso
    // legittimo - es. due bottoni "Copia" in punti diversi non ambigui):
    // rileva nomi duplicati AMBIGUI nello stesso gruppo di controlli.
    if (tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA") {
      const key = name.trim().toLowerCase();
      namesSeen.set(key, (namesSeen.get(key) ?? 0) + 1);
    }
  }

  for (const [name, n] of namesSeen) {
    if (n > 1) {
      problems.push(`[${engine}] [${path}/${groupLabel}] nome accessibile duplicato/ambiguo "${name}" usato da ${n} controlli diversi nello stesso calcolatore.`);
    }
  }

  return problems;
}

/**
 * Percorso da tastiera REALE, ancorato al primo controllo del calcolatore
 * (mai un Tab-walk dalla cima della pagina, che rischia di percorrere la
 * navigazione globale invece del calcolatore). Percorre esattamente il
 * numero di controlli scoperti dalla query DOM, deterministico.
 */
async function checkKeyboardWalk(
  page: Page,
  path: string,
  engine: string,
  containerTestId: string,
  groupLabel: string,
): Promise<string[]> {
  const problems: string[] = [];
  const controls = await focusableControlsIn(page, containerTestId);
  const domCount = await controls.count();
  if (domCount === 0) return problems;
  const count = await keyboardTabStopCountIn(page, containerTestId);

  await controls.first().focus();

  for (let i = 0; i < count; i++) {
    const focusInfo = await page.evaluate((testId) => {
      const el = document.activeElement as HTMLElement | null;
      const container = document.querySelector(`[data-testid="${testId}"]`);
      if (!el || !container || !container.contains(el)) return { insideContainer: false };
      const style = window.getComputedStyle(el);
      const hasOutline = style.outlineStyle !== "none" && style.outlineWidth !== "0px";
      const hasBoxShadow = style.boxShadow !== "none" && style.boxShadow !== "";
      // Alcuni pattern (radio-as-pill) spostano l'anello di focus visivo sul
      // <label> genitore via :focus-within, non sull'input sr-only stesso.
      const parentLabel = el.closest("label");
      let parentHasVisibleFocus = false;
      if (parentLabel) {
        const ps = window.getComputedStyle(parentLabel);
        parentHasVisibleFocus =
          (ps.outlineStyle !== "none" && ps.outlineWidth !== "0px") || (ps.boxShadow !== "none" && ps.boxShadow !== "");
      }
      return {
        insideContainer: true,
        tag: el.tagName,
        text: (el.textContent || "").slice(0, 40),
        hasVisibleFocus: hasOutline || hasBoxShadow || parentHasVisibleFocus,
      };
    }, containerTestId);

    if (!focusInfo.insideContainer) {
      problems.push(`[${engine}] [${path}/${groupLabel}] Tab #${i} è uscito dal calcolatore prima di aver percorso tutti i ${count} controlli attesi.`);
      break;
    }
    if (!focusInfo.hasVisibleFocus) {
      problems.push(`[${engine}] [${path}/${groupLabel}] controllo <${focusInfo.tag}> "${focusInfo.text}" (Tab #${i}) senza indicatore di focus visibile.`);
    }
    if (i < count - 1) await page.keyboard.press("Tab");
  }

  return problems;
}

/** Il selettore modalità deve usare radio input nativi con lo stesso `name` (semantica nativa, no ARIA reinventata). */
async function checkNativeRadioSemantics(
  page: Page,
  path: string,
  engine: string,
  containerTestId: string = "sleep-efficiency-calculator",
): Promise<string[]> {
  const problems: string[] = [];
  const radios = page.locator(`[data-testid="${containerTestId}"] input[type="radio"]`);
  const count = await radios.count();
  if (count < 2) {
    problems.push(`[${engine}] [${path}] atteso un fieldset con almeno 2 input[type=radio] per la modalità, trovati ${count}.`);
    return problems;
  }
  const names = new Set<string>();
  for (let i = 0; i < count; i++) {
    names.add((await radios.nth(i).getAttribute("name")) ?? "");
  }
  if (names.size !== 1 || names.has("")) {
    problems.push(`[${engine}] [${path}] i radio della modalità non condividono tutti lo stesso attributo name (trovati: ${[...names].join(", ")}).`);
  }
  const fieldset = page.locator(`[data-testid="${containerTestId}"] fieldset`).first();
  if ((await fieldset.count()) === 0) {
    problems.push(`[${engine}] [${path}] il selettore modalità non è dentro un <fieldset>.`);
  } else {
    const legend = fieldset.locator("legend").first();
    if ((await legend.count()) === 0) {
      problems.push(`[${engine}] [${path}] il <fieldset> del selettore modalità non ha una <legend>.`);
    }
  }
  return problems;
}

/**
 * P1.1C Fase 3: la regione risultati usa un selettore stabile e circoscritto
 * al calcolatore (data-testid="labs-calculation-results"/"labs-result-value"),
 * mai testo editoriale/hero (es. il precedente `text=/%/` generico, che può
 * comparire per motivi indipendenti dal calcolo) come prova che un calcolo
 * sia avvenuto. Percorso VALIDO: dopo dati di esempio, la regione deve
 * esistere, essere visibile, contenere un valore numerico, e i bottoni
 * copia/CSV devono essere visibili. Usa page.locator (non scoped a un
 * container specifico): ogni pagina Labs monta un solo calcolatore, quindi
 * il selettore resta univoco e "circoscritto al calcolatore" di fatto.
 */
async function checkResultsRegionPositive(page: Page, path: string, engine: string): Promise<string[]> {
  const problems: string[] = [];
  const resultsRegion = page.locator('[data-testid="labs-calculation-results"]');
  const resultValue = page.locator('[data-testid="labs-result-value"]');
  const copyButton = page.getByRole("button", { name: /copia risultati|copy results/i });
  const downloadButton = page.getByRole("button", { name: /scarica csv|download csv/i });

  if ((await resultsRegion.count()) < 1) {
    problems.push(`[${engine}] [${path}] con dati validi, attesa la regione [data-testid=labs-calculation-results] - non trovata.`);
    return problems;
  }
  if (!(await resultsRegion.first().isVisible().catch(() => false))) {
    problems.push(`[${engine}] [${path}] la regione risultati esiste nel DOM ma non è visibile con dati validi.`);
  }
  const valueText = (await resultValue.first().textContent().catch(() => "")) ?? "";
  if (!/\d/.test(valueText)) {
    problems.push(`[${engine}] [${path}] la regione risultati non contiene un risultato numerico riconoscibile (trovato: "${valueText}").`);
  }
  if (!(await copyButton.first().isVisible().catch(() => false))) {
    problems.push(`[${engine}] [${path}] il bottone "copia risultati" non è visibile con un risultato valido.`);
  }
  if (!(await downloadButton.first().isVisible().catch(() => false))) {
    problems.push(`[${engine}] [${path}] il bottone "scarica CSV" non è visibile con un risultato valido.`);
  }

  return problems;
}

/**
 * Percorso BLOCCANTE (Sleep Efficiency, input dormito > a letto): la regione
 * risultati non deve comparire affatto - non solo "senza percentuale" (il
 * vecchio controllo testuale `text=/%/` non avrebbe rilevato un risultato
 * parziale privo del segno %), e i bottoni copia/CSV non devono comparire.
 */
async function checkResultsRegionBlocked(
  page: Page,
  path: string,
  engine: string,
  containerTestId: string = "sleep-efficiency-calculator",
  fillImpossible?: (container: ReturnType<Page["locator"]>) => Promise<string | null>,
): Promise<string[]> {
  const problems: string[] = [];
  const container = page.locator(`[data-testid="${containerTestId}"]`);
  const resultsRegion = container.locator('[data-testid="labs-calculation-results"]');
  const copyButton = container.getByRole("button", { name: /copia risultati|copy results/i });
  const downloadButton = container.getByRole("button", { name: /scarica csv|download csv/i });

  if (fillImpossible) {
    const err = await fillImpossible(container);
    if (err) {
      problems.push(`[${engine}] [${path}] ${err}`);
      return problems;
    }
  } else {
    const hourInputs = container.locator('input[type="number"]');
    const count = await hourInputs.count();
    if (count < 4) {
      problems.push(`[${engine}] [${path}] attesi almeno 4 input numerici in modalità semplice, trovati ${count}.`);
      return problems;
    }
    await hourInputs.nth(0).fill("1"); // 1h a letto
    await hourInputs.nth(1).fill("0");
    await hourInputs.nth(2).fill("5"); // 5h dormite > 1h a letto: impossibile
    await hourInputs.nth(3).fill("0");
  }
  await page.waitForTimeout(200);

  const alert = container.locator('[role="alert"]');
  const alertText = (await alert.count()) > 0 ? await alert.first().textContent() : "";
  if (!alertText || !alertText.trim()) {
    problems.push(`[${engine}] [${path}] input impossibile (dormito > a letto) non ha prodotto un messaggio d'errore visibile.`);
  }

  if ((await resultsRegion.count()) > 0) {
    problems.push(`[${engine}] [${path}] input impossibile ha comunque mostrato la regione risultati [data-testid=labs-calculation-results] (deve essere assente, non calcolato).`);
  }
  if ((await copyButton.count()) > 0) {
    problems.push(`[${engine}] [${path}] il bottone "copia risultati" è visibile anche con input impossibile (deve comparire solo con un risultato valido).`);
  }
  if ((await downloadButton.count()) > 0) {
    problems.push(`[${engine}] [${path}] il bottone "scarica CSV" è visibile anche con input impossibile (deve comparire solo con un risultato valido).`);
  }

  return problems;
}

async function checkAriaLive(page: Page, path: string, engine: string): Promise<string[]> {
  const problems: string[] = [];
  const liveRegions = await page.locator("[aria-live]").count();
  if (liveRegions === 0) {
    problems.push(`[${engine}] [${path}] nessuna regione con aria-live trovata - i risultati non verrebbero annunciati agli screen reader.`);
  }
  return problems;
}

async function checkChartsAccessible(page: Page, path: string, engine: string): Promise<string[]> {
  const problems: string[] = [];
  const charts = page.locator('svg[role="img"]');
  const chartCount = await charts.count();
  for (let i = 0; i < chartCount; i++) {
    const chart = charts.nth(i);
    const ariaLabel = await chart.getAttribute("aria-label");
    if (!ariaLabel || !ariaLabel.trim()) {
      problems.push(`[${engine}] [${path}] grafico (indice ${i}) senza aria-label.`);
    }
  }
  if (chartCount > 0) {
    const detailsCount = await page.locator("details").count();
    if (detailsCount < chartCount) {
      problems.push(`[${engine}] [${path}] trovati ${chartCount} grafici ma solo ${detailsCount} fallback tabellari <details>.`);
    }
  }
  return problems;
}

async function checkMathML(page: Page, path: string, engine: string): Promise<string[]> {
  const problems: string[] = [];
  const mathCount = await page.locator("math").count();
  if (mathCount === 0) {
    problems.push(`[${engine}] [${path}] nessun elemento <math> (MathML) trovato - le formule KaTeX non espongono l'albero accessibile.`);
  }
  return problems;
}

async function loadSampleData(page: Page) {
  const sampleButton = page.getByRole("button", { name: /dati di esempio|sample data/i }).first();
  if (await sampleButton.isVisible().catch(() => false)) {
    await sampleButton.click();
    await page.waitForTimeout(300);
  }
}

async function runForEngine(engineName: string, launcher: BrowserType): Promise<string[]> {
  const problems: string[] = [];
  const browser: Browser = await launcher.launch();
  const page = await browser.newPage();

  for (const { path, tool } of PAGES) {
    await page.goto(`${BASE_URL}${path}`, { waitUntil: "networkidle" });
    await loadSampleData(page);

    problems.push(
      ...(await checkAriaLive(page, path, engineName)),
      ...(await checkChartsAccessible(page, path, engineName)),
      ...(await checkMathML(page, path, engineName)),
    );

    if (tool === "hrv") {
      problems.push(
        ...(await checkCalculatorControls(page, path, engineName, "hrv-calculator", "hrv")),
        ...(await checkKeyboardWalk(page, path, engineName, "hrv-calculator", "hrv")),
        ...(await checkResultsRegionPositive(page, path, engineName)),
      );
      continue;
    }

    if (tool === "heart-rate-zones") {
      const testId = "heart-rate-zones-calculator";
      problems.push(...(await checkNativeRadioSemantics(page, path, engineName, testId)));

      for (const mode of ["tanaka", "age220", "measured"] as const) {
        await page.goto(`${BASE_URL}${path}`, { waitUntil: "networkidle" });
        const modeRadio = page.locator(`[data-testid="${testId}"] input[type="radio"][value="${mode}"]`);
        const modeSwitched = await modeRadio
          .click({ force: true, timeout: 5000 })
          .then(() => true)
          .catch(() => false);
        if (!modeSwitched) {
          problems.push(
            `[${engineName}] [${path}/${mode}] impossibile selezionare la modalità via input[type=radio][value=${mode}] - semantica radio nativa assente o rotta, salto la verifica dei controlli per questa modalità.`,
          );
          continue;
        }
        await page.waitForTimeout(150);
        await loadSampleData(page);

        problems.push(
          ...(await checkCalculatorControls(page, path, engineName, testId, mode)),
          ...(await checkKeyboardWalk(page, path, engineName, testId, mode)),
          ...(await checkResultsRegionPositive(page, path, engineName)),
        );
      }

      // Percorso bloccante: età 95 (valida, 5-100) -> FC max stimata ~141.5,
      // FC riposo 145 (valida, 25-150) ma >= FC max stimata: impossibile.
      await page.goto(`${BASE_URL}${path}`, { waitUntil: "networkidle" });
      problems.push(
        ...(await checkResultsRegionBlocked(page, path, engineName, testId, async (container) => {
          const numberInputs = container.locator('input[type="number"]');
          const count = await numberInputs.count();
          if (count < 2) return `attesi almeno 2 input numerici (età/FC max, FC a riposo), trovati ${count}.`;
          await numberInputs.nth(0).fill("95");
          await numberInputs.nth(1).fill("145");
          return null;
        })),
      );
      continue;
    }

    // Sleep Efficiency: entrambe le modalità, esplicitamente (P1.1B Fase 2).
    problems.push(...(await checkNativeRadioSemantics(page, path, engineName)));

    for (const mode of ["simple", "advanced"] as const) {
      // Riparti pulito per ogni modalità: reset azzera il form, poi seleziona la modalità.
      await page.goto(`${BASE_URL}${path}`, { waitUntil: "networkidle" });
      const modeRadio = page.locator(`[data-testid="sleep-efficiency-calculator"] input[type="radio"][value="${mode}"]`);
      const modeSwitched = await modeRadio
        .click({ force: true, timeout: 5000 })
        .then(() => true)
        .catch(() => false);
      if (!modeSwitched) {
        problems.push(
          `[${engineName}] [${path}/${mode}] impossibile selezionare la modalità via input[type=radio][value=${mode}] - semantica radio nativa assente o rotta, salto la verifica dei controlli per questa modalità.`,
        );
        continue;
      }
      await page.waitForTimeout(150);
      await loadSampleData(page);

      problems.push(
        ...(await checkCalculatorControls(page, path, engineName, "sleep-efficiency-calculator", mode)),
        ...(await checkKeyboardWalk(page, path, engineName, "sleep-efficiency-calculator", mode)),
        ...(await checkResultsRegionPositive(page, path, engineName)),
      );
    }

    // Percorso d'errore bloccante: solo modalità semplice (più diretto da forzare).
    await page.goto(`${BASE_URL}${path}`, { waitUntil: "networkidle" });
    problems.push(...(await checkResultsRegionBlocked(page, path, engineName)));
  }

  await browser.close();
  return problems;
}

async function main() {
  const allProblems: string[] = [...checkContrast()];

  for (const { name, launcher } of ENGINES) {
    console.log(`  ▸ motore: ${name}`);
    try {
      const engineProblems = await runForEngine(name, launcher);
      allProblems.push(...engineProblems);
      console.log(`    ${engineProblems.length === 0 ? "✅" : "❌"} ${engineProblems.length} problema/i`);
    } catch (err) {
      // Un crash inatteso su un motore non deve azzerare il report degli
      // altri controlli già raccolti - viene comunque riportato come un
      // problema esplicito, mai inghiottito silenziosamente.
      allProblems.push(`[${name}] errore inatteso durante l'esecuzione: ${String(err)}`);
      console.log(`    ❌ errore inatteso: ${String(err)}`);
    }
  }

  if (allProblems.length > 0) {
    console.error(`\n❌ Labs accessibility guardrail: ${allProblems.length} problema/i\n`);
    for (const p of allProblems) console.error(`  - ${p}`);
    process.exit(1);
  }

  console.log(
    `\n✅ Labs accessibility guardrail: ${PAGES.length} pagine × ${ENGINES.length} motori verificati - nomi accessibili contestuali e non duplicati su tutti i controlli (Sleep Efficiency: modalità semplice E avanzata), semantica radio nativa, percorso di errore bloccante verificato, aria-live presente, grafici con aria-label + fallback tabellare, MathML presente, focus da tastiera sempre visibile percorrendo deterministicamente ogni controllo del calcolatore, contrasto colore WCAG AA rispettato sui token usati.`,
  );
}

main().catch((err) => {
  console.error("❌ Labs accessibility guardrail: errore inatteso", err);
  process.exit(1);
});
