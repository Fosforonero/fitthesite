/**
 * Guardrail privacy FitMesh Labs (Sprint P1.0, esteso in P1.1 Fase 8 al
 * secondo tool + locale EN, esteso in P1.1B Fase 7 alla modalità avanzata di
 * Sleep Efficiency, esteso in P1.1C Fase 2 alla verifica del CONTENUTO reale
 * del CSV scaricato).
 *
 * Verifica via network inspection reale (Playwright, non lettura statica
 * del codice) che digitare dati, calcolare, copiare i risultati e scaricare
 * il CSV non generino MAI una richiesta di rete contenente quei dati, che
 * l'URL della pagina non cambi mai, e che nessun valore inserito finisca in
 * un evento analytics. Richiede un server reale in esecuzione (BASE_URL,
 * default http://localhost:3000).
 *
 * Copre 8 combinazioni tool×locale×modalità: HRV it/en, Sleep Efficiency
 * semplice it/en, Sleep Efficiency avanzata it/en, Heart Rate Zones it/en -
 * i 3 tool live, le uniche 2 locale Labs, ed entrambe le modalità di Sleep
 * Efficiency (vedi lib/labs/registry.ts).
 *
 * P1.1C Fase 2: il vecchio controllo si fermava a "il download usa un
 * blob: URL" - non leggeva mai il contenuto reale del file. Ora, per ogni
 * combinazione: cattura il Download Playwright, legge il contenuto REALE
 * via download.createReadStream(), verifica nome file/estensione,
 * intestazione CSV esatta, numero e struttura delle righe (ogni riga deve
 * avere il numero di colonne atteso: un valore numerico con una virgola
 * non gestita spezzerebbe silenziosamente la struttura), e confronta il
 * valore del risultato primario nel CSV con quello mostrato nella UI
 * (stesso calcolo, stessa sessione: devono coincidere entro un margine di
 * arrotondamento, non essere identici carattere per carattere - UI e CSV
 * usano precisioni decimali diverse per lo stesso numero). Un CSV vuoto,
 * con intestazione sbagliata, un numero di righe sbagliato, o un valore che
 * diverge da quanto mostrato in UI: il test fallisce.
 *
 * P1.1C Fase 3: "il risultato è comparso" non si verifica più con un
 * pattern testuale generico (`resultProbe`, es. /RMSSD/ o /Efficienza del
 * sonno/, che può comparire in copy editoriale indipendente dal calcolo) ma
 * con il selettore stabile e circoscritto al calcolatore
 * `data-testid="labs-calculation-results"` / `"labs-result-value"` (stesso
 * introdotto in tools/check-labs-accessibility.ts).
 *
 * Nota sui marker in modalità avanzata: i campi ora/minuti (0-23, 1-12,
 * 0-59) hanno un limite dichiarato dal P1.1B Fase 3 (errore bloccante se
 * violato), quindi NON possono contenere un marker lungo/distintivo senza
 * far fallire la validazione - solo i campi di durata pura senza limite
 * superiore dichiarato (latenza/WASO/veglia finale, purché la somma non
 * superi il tempo a letto) possono. `markers` elenca quindi solo i valori
 * usati per la scansione di rete, mai i valori brevi vincolati (minuti,
 * ore): un vero leak esporrebbe comunque l'intero payload del form insieme,
 * quindi trovare il marker lungo è prova sufficiente.
 */
import { chromium, type Browser, type Page, type Request, type Download } from "playwright";
import { text as streamToText } from "node:stream/consumers";

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";

interface CsvExpectation {
  /** Nome file atteso (esatto, incluso .csv). */
  filename: string;
  /** Riga di intestazione CSV attesa, esatta. */
  header: string;
  /** Etichette (prima colonna) di ogni riga dati attesa, in ordine esatto. */
  rowLabels: string[];
  /** Etichetta della riga il cui valore va confrontato col risultato numerico primario mostrato in UI. */
  primaryRowLabel: string;
}

const HRV_CSV: CsvExpectation = {
  filename: "fitmesh-labs-hrv-rmssd.csv",
  header: "metric,value,unit",
  rowLabels: [
    "valid_interval_count",
    "total_duration",
    "mean_rr",
    "derived_heart_rate",
    "rmssd",
    "ln_rmssd",
    "stddev_intervals_n_minus_1",
  ],
  primaryRowLabel: "rmssd",
};

const SLEEP_CSV: CsvExpectation = {
  filename: "sleep-efficiency.csv",
  header: "metric,value_minutes",
  rowLabels: ["timeInBedMinutes", "totalSleepTimeMinutes", "totalTimeAwakeMinutes", "sleepEfficiencyPercent"],
  primaryRowLabel: "sleepEfficiencyPercent",
};

const HR_ZONES_CSV: CsvExpectation = {
  filename: "heart-rate-zones.csv",
  header: "metric,value_bpm_or_range",
  rowLabels: [
    "maxHr",
    "restingHr",
    "heartRateReserve",
    "percentMaxHr_z1",
    "percentMaxHr_z2",
    "percentMaxHr_z3",
    "percentMaxHr_z4",
    "percentMaxHr_z5",
    "karvonenHrr_z1",
    "karvonenHrr_z2",
    "karvonenHrr_z3",
    "karvonenHrr_z4",
    "karvonenHrr_z5",
  ],
  primaryRowLabel: "maxHr",
};

interface Target {
  label: string;
  path: string;
  /** Valore-marcatore fisiologicamente impossibile, univoco per target - solo i valori usati per la scansione di rete (vedi nota sopra sui campi vincolati). */
  markers: string[];
  /** Interagisce con la UI specifica del tool/modalità, inserendo i valori (marker dove possibile, valori validi altrove). */
  fillInputs: (page: Page) => Promise<void>;
  csv: CsvExpectation;
}

const TARGETS: Target[] = [
  {
    label: "HRV - it",
    path: "/it/labs/calcolatore-hrv-rmssd",
    markers: ["813371", "824682", "795913", "801247"],
    csv: HRV_CSV,
    fillInputs: async (page) => {
      const textarea = page.locator("textarea");
      await textarea.click();
      await textarea.fill(["813371", "824682", "795913", "801247"].join(", "));
    },
  },
  {
    label: "HRV - en",
    path: "/en/labs/hrv-rmssd-calculator",
    markers: ["716253", "728149", "739582", "744917"],
    csv: HRV_CSV,
    fillInputs: async (page) => {
      const textarea = page.locator("textarea");
      await textarea.click();
      await textarea.fill(["716253", "728149", "739582", "744917"].join(", "));
    },
  },
  {
    label: "Sleep Efficiency semplice - it",
    path: "/it/labs/calcolatore-efficienza-sonno",
    // Ore: nessun limite superiore dichiarato (durata pura) -> marker lungo.
    // Minuti: limite dichiarato 0-59 (P1.1B Fase 3, MINUTES_OUT_OF_RANGE) ->
    // valore piccolo valido, non usato come marker di scansione.
    markers: ["81337", "79591"],
    csv: SLEEP_CSV,
    fillInputs: async (page) => {
      const numberInputs = page.locator('input[type="number"]');
      await numberInputs.nth(0).fill("81337"); // ore tempo a letto (marker)
      await numberInputs.nth(1).fill("37"); // minuti tempo a letto (0-59)
      await numberInputs.nth(2).fill("79591"); // ore tempo dormito (marker)
      await numberInputs.nth(3).fill("52"); // minuti tempo dormito (0-59)
    },
  },
  {
    label: "Sleep Efficiency semplice - en",
    path: "/en/labs/sleep-efficiency-calculator",
    // TIB (nth 0) deve restare maggiore di TST (nth 2): dal P1.1B Fase 3,
    // TST > TIB e' un errore bloccante (fisiologicamente impossibile), non
    // piu' un warning - un ordine sbagliato qui blocca il calcolo e il test
    // scambia "nessun risultato" per "CSV non catturato", non un vero bug.
    markers: ["73958", "71625"],
    csv: SLEEP_CSV,
    fillInputs: async (page) => {
      const numberInputs = page.locator('input[type="number"]');
      await numberInputs.nth(0).fill("73958"); // ore tempo a letto (marker, maggiore)
      await numberInputs.nth(1).fill("44"); // minuti tempo a letto (0-59)
      await numberInputs.nth(2).fill("71625"); // ore tempo dormito (marker, minore)
      await numberInputs.nth(3).fill("19"); // minuti tempo dormito (0-59)
    },
  },
  {
    label: "Sleep Efficiency avanzata - it",
    path: "/it/labs/calcolatore-efficienza-sonno",
    // Solo la latenza (durata pura, nessun limite superiore dichiarato oltre
    // "non deve superare il tempo a letto") può portare un marker lungo:
    // bed 00:01 -> out 23:58 (stesso giorno, niente attraversamento
    // mezzanotte) = TIB 1437min, latenza marker 1183 < 1437.
    markers: ["1183"],
    csv: SLEEP_CSV,
    fillInputs: async (page) => {
      const modeRadio = page.locator('[data-testid="sleep-efficiency-calculator"] input[type="radio"][value="advanced"]');
      // L'input e' sr-only (nascosto visivamente, stile radio-as-pill): il click
      // reale dell'utente avviene sulla <label> visibile che lo avvolge, non
      // sull'input stesso (force:true su un input clippato non e' affidabile).
      await modeRadio.locator("xpath=ancestor::label").click();
      await page.waitForFunction(
        (el) => (el as HTMLInputElement).checked === true,
        await modeRadio.elementHandle(),
        { timeout: 5000 },
      );
      const numberInputs = page.locator('input[type="number"]');
      await numberInputs.nth(0).fill("0"); // bed: ora
      await numberInputs.nth(1).fill("1"); // bed: minuti
      await numberInputs.nth(2).fill("23"); // uscita: ora
      await numberInputs.nth(3).fill("58"); // uscita: minuti
      await numberInputs.nth(4).fill("1183"); // latenza (marker)
      await numberInputs.nth(5).fill("0"); // WASO
      await numberInputs.nth(6).fill("0"); // veglia finale
    },
  },
  {
    label: "Sleep Efficiency avanzata - en",
    path: "/en/labs/sleep-efficiency-calculator",
    // bed 00:02 -> out 23:57 = TIB 1435min, latenza marker 1091 < 1435.
    markers: ["1091"],
    csv: SLEEP_CSV,
    fillInputs: async (page) => {
      const modeRadio = page.locator('[data-testid="sleep-efficiency-calculator"] input[type="radio"][value="advanced"]');
      // L'input e' sr-only (nascosto visivamente, stile radio-as-pill): il click
      // reale dell'utente avviene sulla <label> visibile che lo avvolge, non
      // sull'input stesso (force:true su un input clippato non e' affidabile).
      await modeRadio.locator("xpath=ancestor::label").click();
      await page.waitForFunction(
        (el) => (el as HTMLInputElement).checked === true,
        await modeRadio.elementHandle(),
        { timeout: 5000 },
      );
      const numberInputs = page.locator('input[type="number"]');
      await numberInputs.nth(0).fill("0");
      await numberInputs.nth(1).fill("2");
      await numberInputs.nth(2).fill("23");
      await numberInputs.nth(3).fill("57");
      await numberInputs.nth(4).fill("1091");
      await numberInputs.nth(5).fill("0");
      await numberInputs.nth(6).fill("0");
    },
  },
  {
    label: "Heart Rate Zones - it",
    path: "/it/labs/calcolatore-zone-frequenza-cardiaca",
    // Età e FC riposo sono ENTRAMBE fisiologicamente vincolate (5-100 / 25-150,
    // vedi lib/labs/heart-rate-zones/math.ts): a differenza di HRV (ms senza
    // limite superiore dichiarato) o delle ore di Sleep Efficiency, qui non
    // esiste un campo naturalmente "lungo" per un marker univoco - stesso
    // limite già accettato per i minuti di Sleep Efficiency sopra (0-59, mai
    // usati come marker). Uso la FC a riposo (range più ampio, 3 cifre
    // possibili) come marker via confine di parola; l'età resta un valore
    // realistico, non usata per la scansione.
    markers: ["130"],
    csv: HR_ZONES_CSV,
    fillInputs: async (page) => {
      const numberInputs = page.locator('input[type="number"]');
      await numberInputs.nth(0).fill("44"); // età (non marker)
      await numberInputs.nth(1).fill("130"); // FC a riposo (marker)
    },
  },
  {
    label: "Heart Rate Zones - en",
    path: "/en/labs/heart-rate-zones-calculator",
    markers: ["142"],
    csv: HR_ZONES_CSV,
    fillInputs: async (page) => {
      const numberInputs = page.locator('input[type="number"]');
      await numberInputs.nth(0).fill("51"); // age (not a marker)
      await numberInputs.nth(1).fill("142"); // resting HR (marker)
    },
  },
];

async function readDownloadText(download: Download): Promise<string> {
  const stream = await download.createReadStream();
  if (!stream) return "";
  return streamToText(stream);
}

/** Estrae il primo numero (con eventuale separatore delle migliaia) da un blob di testo, spogliato delle virgole. */
function firstNumberIn(raw: string): number | null {
  const match = raw.replace(/,/g, "").match(/-?\d+(\.\d+)?/);
  return match ? Number.parseFloat(match[0]) : null;
}

/**
 * Verifica intestazione, numero di righe, struttura (colonne per riga - una
 * virgola non gestita dentro un valore numerico spezzerebbe silenziosamente
 * questo conteggio) ed etichette del CSV. Ritorna il valore numerico della
 * riga primaria, se trovata e leggibile.
 */
function parseAndValidateCsv(
  content: string,
  expected: CsvExpectation,
): { problems: string[]; primaryValue: number | null } {
  const problems: string[] = [];
  const expectedColumns = expected.header.split(",").length;
  const trimmed = content.replace(/\r\n/g, "\n").trim();

  if (!trimmed) {
    problems.push("CSV vuoto o non leggibile.");
    return { problems, primaryValue: null };
  }

  const lines = trimmed.split("\n");
  if (lines[0] !== expected.header) {
    problems.push(`intestazione attesa "${expected.header}", trovata "${lines[0]}".`);
  }

  const dataLines = lines.slice(1);
  if (dataLines.length !== expected.rowLabels.length) {
    problems.push(`attese ${expected.rowLabels.length} righe dati, trovate ${dataLines.length}.`);
  }

  let primaryValue: number | null = null;
  dataLines.forEach((line, i) => {
    const cols = line.split(",");
    if (cols.length !== expectedColumns) {
      problems.push(
        `riga ${i} ("${line}") ha ${cols.length} colonne, attese ${expectedColumns} - possibile valore numerico con virgola (migliaia) non gestita, struttura corrotta.`,
      );
    }
    const expectedLabel = expected.rowLabels[i];
    if (expectedLabel !== undefined && cols[0] !== expectedLabel) {
      problems.push(`riga ${i}: etichetta attesa "${expectedLabel}", trovata "${cols[0] ?? ""}".`);
    }
    if (cols[0] === expected.primaryRowLabel) {
      const n = Number.parseFloat((cols[1] ?? "").replace(/,/g, ""));
      primaryValue = Number.isFinite(n) ? n : null;
    }
  });

  if (primaryValue === null) {
    problems.push(`riga "${expected.primaryRowLabel}" non trovata o valore non numerico - impossibile confrontarla con la UI.`);
  }

  return { problems, primaryValue };
}

async function runTarget(browser: Browser, target: Target): Promise<string[]> {
  const problems: string[] = [];
  const context = await browser.newContext({ permissions: ["clipboard-read", "clipboard-write"] });
  const page = await context.newPage();

  const requestsAfterLoad: Request[] = [];
  let loadFinished = false;
  page.on("request", (req) => {
    if (loadFinished) requestsAfterLoad.push(req);
  });

  const consoleErrors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });
  page.on("pageerror", (err) => consoleErrors.push(String(err)));

  await page.goto(`${BASE_URL}${target.path}`, { waitUntil: "networkidle" });
  loadFinished = true;

  const initialUrl = page.url();

  await target.fillInputs(page);
  await page.waitForTimeout(500);

  // P1.1C Fase 3: selettore stabile circoscritto al calcolatore, mai testo
  // editoriale/hero come prova che il calcolo sia avvenuto.
  const resultsRegion = page.locator('[data-testid="labs-calculation-results"]').first();
  const resultValueEl = page.locator('[data-testid="labs-result-value"]').first();
  const resultVisible = await resultsRegion.isVisible().catch(() => false);
  if (!resultVisible) {
    problems.push(`[${target.label}] Regione risultati [data-testid=labs-calculation-results] non visibile dopo l'inserimento - impossibile verificare copia/CSV.`);
  }
  const resultValueText = (await resultValueEl.textContent().catch(() => "")) ?? "";
  const uiPrimaryValue = firstNumberIn(resultValueText);

  const copyButton = page.getByRole("button", { name: /copia|copy/i }).first();
  if (await copyButton.isVisible().catch(() => false)) {
    await copyButton.click();
    const clipboardText = await page.evaluate(() => navigator.clipboard.readText()).catch(() => "");
    if (!clipboardText.trim()) {
      problems.push(`[${target.label}] Il clipboard è vuoto dopo il click su "Copia".`);
    } else if (uiPrimaryValue !== null && !clipboardText.replace(/,/g, "").includes(String(uiPrimaryValue))) {
      // Il clipboard puo' arrotondare diversamente dalla UI (stessa fonte,
      // precisione diversa): confronto tollerante, non stringa esatta.
      const clipboardValue = firstNumberIn(clipboardText);
      if (clipboardValue === null || Math.abs(clipboardValue - uiPrimaryValue) > Math.max(0.5, Math.abs(uiPrimaryValue) * 0.005)) {
        problems.push(`[${target.label}] Il clipboard non contiene il risultato numerico mostrato in UI (atteso ~${uiPrimaryValue}, clipboard: "${clipboardText.slice(0, 120)}").`);
      }
    }
  }

  const downloadButton = page.getByRole("button", { name: /scarica csv|download csv/i }).first();
  let downloadCaptured = false;
  if (await downloadButton.isVisible().catch(() => false)) {
    const [download] = await Promise.all([
      page.waitForEvent("download", { timeout: 5000 }).catch(() => null),
      downloadButton.click(),
    ]);
    downloadCaptured = download !== null;
    if (download) {
      const url = download.url();
      if (!url.startsWith("blob:")) {
        problems.push(`[${target.label}] Il download CSV non usa un blob: URL locale (trovato: ${url}).`);
      }

      const filename = download.suggestedFilename();
      if (filename !== target.csv.filename) {
        problems.push(`[${target.label}] Nome file CSV atteso "${target.csv.filename}", trovato "${filename}".`);
      }
      if (!/\.csv$/i.test(filename)) {
        problems.push(`[${target.label}] Estensione file CSV inattesa: "${filename}".`);
      }

      const content = await readDownloadText(download);
      const { problems: csvProblems, primaryValue } = parseAndValidateCsv(content, target.csv);
      problems.push(...csvProblems.map((p) => `[${target.label}] CSV: ${p}`));

      if (primaryValue !== null && uiPrimaryValue !== null) {
        const tolerance = Math.max(0.5, Math.abs(uiPrimaryValue) * 0.005);
        if (Math.abs(primaryValue - uiPrimaryValue) > tolerance) {
          problems.push(
            `[${target.label}] CSV: valore "${target.csv.primaryRowLabel}"=${primaryValue} diverge dal risultato mostrato in UI (${uiPrimaryValue}), oltre la tolleranza di arrotondamento (±${tolerance.toFixed(3)}).`,
          );
        }
      }
    }
  }
  if (!downloadCaptured) {
    problems.push(`[${target.label}] Download CSV non catturato - verificare manualmente.`);
  }

  await page.waitForTimeout(500);

  const finalUrl = page.url();
  if (finalUrl !== initialUrl) {
    problems.push(`[${target.label}] URL della pagina è cambiato durante l'interazione: ${initialUrl} -> ${finalUrl}`);
  }

  // Confine di parola (\b), non semplice substring: i marker della modalità
  // avanzata sono vincolati a < 1440 (minuti in un giorno), quindi al
  // massimo 4 cifre - un marker come "1183" può comparire per puro caso
  // dentro un ID numerico più lungo generato da GA4 (es. "118395334" in
  // tag_exp), che non è affatto un leak dei dati dell'utente. \b garantisce
  // che il marker debba comparire come token numerico completo, non
  // incorporato in un numero più grande.
  const markerRe = new RegExp(target.markers.map((m) => `\\b${m}\\b`).join("|"));
  for (const req of requestsAfterLoad) {
    const url = req.url();
    let postData = "";
    try {
      postData = req.postData() ?? "";
    } catch {
      // ignore
    }
    const haystack = `${url} ${postData}`;
    if (markerRe.test(haystack)) {
      problems.push(`[${target.label}] Richiesta di rete contiene un valore marcatore inserito dall'utente: ${req.method()} ${url}`);
    }
  }

  const knownNoise = /Content Security Policy|report-only|was preloaded using link preload but not used/i;
  const realConsoleErrors = consoleErrors.filter((e) => !knownNoise.test(e));
  if (realConsoleErrors.length > 0) {
    problems.push(`[${target.label}] Errori console non attesi: ${realConsoleErrors.join(" | ")}`);
  }

  await context.close();

  console.log(
    `  ${problems.length === 0 ? "✅" : "❌"} ${target.label}: ${requestsAfterLoad.length} richieste post-load osservate.`,
  );

  return problems;
}

async function main() {
  const browser = await chromium.launch();
  const allProblems: string[] = [];

  for (const target of TARGETS) {
    const problems = await runTarget(browser, target);
    allProblems.push(...problems);
  }

  await browser.close();

  if (allProblems.length > 0) {
    console.error(`\n❌ Labs privacy guardrail: ${allProblems.length} problema/i su ${TARGETS.length} combinazioni tool×locale×modalità\n`);
    for (const p of allProblems) console.error(`  - ${p}`);
    process.exit(1);
  }

  console.log(
    `\n✅ Labs privacy guardrail: ${TARGETS.length} combinazioni tool×locale×modalità verificate (HRV it/en, Sleep Efficiency semplice it/en, Sleep Efficiency avanzata it/en, Heart Rate Zones it/en), zero esfiltrazione di valori marcatore, URL invariato, clipboard verificato, CSV letto e verificato realmente (nome file, intestazione, righe, struttura, valore primario coerente con la UI), zero errori console.`,
  );
}

main().catch((err) => {
  console.error("❌ Labs privacy guardrail: errore inatteso", err);
  process.exit(1);
});
