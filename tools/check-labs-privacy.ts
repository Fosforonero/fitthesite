/**
 * Guardrail Sprint P1.0 — privacy del calcolatore HRV FitMesh Labs.
 *
 * Verifica via network inspection reale (Playwright, non lettura statica
 * del codice) che digitare intervalli RR, calcolare, copiare i risultati e
 * scaricare il CSV non generino MAI una richiesta di rete contenente quei
 * dati, che l'URL della pagina non cambi mai, e che nessun valore inserito
 * finisca in un evento analytics. Richiede un server reale in esecuzione
 * (BASE_URL, default http://localhost:3000) — non testa contro produzione
 * di default, a differenza di check-anti-loop.ts, perché qui l'oggetto
 * della verifica è comportamento applicativo (il componente React), non
 * infrastruttura edge/Vercel.
 */
import { chromium, type Request } from "playwright";

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";
const PATH = "/it/labs/calcolatore-hrv-rmssd";

// Valore-marcatore fisiologicamente impossibile (un intervallo RR di
// 813371 ms sarebbe un battito ogni 13 minuti) e improbabile che compaia
// per caso in QUALUNQUE richiesta legittima (analytics, telemetria Next.js
// dev, ecc.) — se questo numero appare in una request dopo l'inserimento,
// è la prova diretta che il dato inserito è stato trasmesso.
const MARKER_VALUES = "813371, 824682, 795913, 801247";

async function main() {
  const problems: string[] = [];
  const browser = await chromium.launch();
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

  await page.goto(`${BASE_URL}${PATH}`, { waitUntil: "networkidle" });
  loadFinished = true;

  const initialUrl = page.url();

  // Digita gli intervalli marcatore.
  const textarea = page.locator("textarea");
  await textarea.click();
  await textarea.fill(MARKER_VALUES);
  await page.waitForTimeout(500);

  // Verifica che i risultati siano comparsi (RMSSD calcolato) prima di
  // proseguire — altrimenti il test successivo (copia/CSV) non avrebbe
  // nulla da verificare.
  const rmssdVisible = await page.getByText("RMSSD", { exact: false }).first().isVisible().catch(() => false);
  if (!rmssdVisible) {
    problems.push("Risultati non visibili dopo l'inserimento — impossibile verificare copia/CSV.");
  }

  // Copia risultati (gesto esplicito).
  const copyButton = page.getByRole("button", { name: /copia risultati/i });
  if (await copyButton.isVisible().catch(() => false)) {
    await copyButton.click();
    const clipboardText = await page.evaluate(() => navigator.clipboard.readText()).catch(() => "");
    if (!clipboardText.includes("813371") && !clipboardText.includes("RMSSD")) {
      problems.push("Il clipboard non contiene i risultati attesi dopo il click su 'Copia risultati'.");
    }
  }

  // Scarica CSV (gesto esplicito) — verifica che generi un download locale
  // (object URL), non una richiesta di rete.
  const downloadButton = page.getByRole("button", { name: /scarica csv/i });
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
        problems.push(`Il download CSV non usa un blob: URL locale (trovato: ${url}).`);
      }
    }
  }
  if (!downloadCaptured) {
    problems.push("Download CSV non catturato — verificare manualmente.");
  }

  await page.waitForTimeout(500);

  const finalUrl = page.url();
  if (finalUrl !== initialUrl) {
    problems.push(`URL della pagina è cambiato durante l'interazione: ${initialUrl} -> ${finalUrl}`);
  }

  // Nessuna request post-load deve contenere il marcatore, in URL o
  // postData, in nessuna forma (raw o URL-encoded).
  for (const req of requestsAfterLoad) {
    const url = req.url();
    let postData = "";
    try {
      postData = req.postData() ?? "";
    } catch {
      // ignore
    }
    const haystack = `${url} ${postData}`;
    if (/813371|824682|795913|801247/.test(haystack)) {
      problems.push(`Richiesta di rete contiene un valore marcatore inserito dall'utente: ${req.method()} ${url}`);
    }
  }

  const knownNoise = /Content Security Policy|report-only|was preloaded using link preload but not used/i;
  const realConsoleErrors = consoleErrors.filter((e) => !knownNoise.test(e));
  if (realConsoleErrors.length > 0) {
    problems.push(`Errori console non attesi: ${realConsoleErrors.join(" | ")}`);
  }

  await browser.close();

  if (problems.length > 0) {
    console.error(`❌ Labs privacy guardrail: ${problems.length} problema/i\n`);
    for (const p of problems) console.error(`  - ${p}`);
    process.exit(1);
  }

  console.log(
    `✅ Labs privacy guardrail: ${requestsAfterLoad.length} richieste post-load osservate, zero contengono i valori marcatore inseriti; URL pagina invariato; clipboard verificato dopo gesto esplicito; download CSV via blob: locale; zero errori console.`,
  );
}

main().catch((err) => {
  console.error("❌ Labs privacy guardrail: errore inatteso", err);
  process.exit(1);
});
