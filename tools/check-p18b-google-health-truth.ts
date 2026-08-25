/**
 * Guardrail P1.8B — `lib/blog/posts/google-health-google-fit.ts` +
 * `lib/blog/posts/google-fit-api-dismissione-2026.ts`.
 *
 * Fallisce (exit 1) se uno dei due file contiene:
 *  1. Google Health descritto come limitato/solo a Fitbit e Pixel Watch
 *     (framing assoluto "solo"/"only"/"soprattutto...e basta") senza la
 *     distinzione Samsung-via-Health-Connect-con-consenso vs Garmin-senza-
 *     collegamento-diretto — la generalizzazione piatta e' quella corretta
 *     dal ledger (verdict "incompleto", vedi B4).
 *  2. Google Health descritto come incapace di ricevere dati di terze parti
 *     in generale (contraddice B1/B4: riceve via Health Connect/Apple Health).
 *  3. Negazione del collegamento diretto Google Health->Strava (contraddice
 *     B1/B2: il collegamento diretto esiste, forward-only).
 *  4. Strava descritta come sincronizzazione STORICA lato Google Health
 *     (contraddice la fonte: "Historical activities will not sync").
 *  5. Sleep Score o Cardio Load descritti come alimentati da dati di terze
 *     parti (contraddice B5: oggi solo first-party Fitbit/Pixel).
 *  6. Confusione fra Google Health API e Google Fit APIs: la data settembre
 *     2026 (Fitbit Web API/Google Health API) applicata alle Google Fit
 *     APIs, o viceversa "fine 2026" applicata alla Fitbit Web API.
 *  7. Migrazione Google Fit dichiarata iniziata o completata come fatto
 *     compiuto, senza hedge (contraddice A3/E4: solo annunciata).
 *  8. Claim di integrazione diretta Google Health<->FitMesh (contraddice
 *     l'audit release pubblica: assente, solo label da package-name).
 *  9. Riferimenti a build/branch interni, numeri di Release, o TrainingPeaks
 *     presentato come disponibile/in sviluppo (vietato pubblicare roadmap
 *     interna; TrainingPeaks va omesso dal confronto in questo articolo).
 * 10. Claim medici (diagnosi, cura, patologie).
 * 11. Frasi assolute di efficacia nel blocco seoTitle (stesso pattern del
 *     check 18 di check-p17-health-connect-truth.ts).
 * 12. Un URL in `sources` non citato come stringa letterale nel corpo
 *     (fonte fantasma).
 *
 * Uso (Docker, nessun runtime locale):
 *   docker run --rm -v "$PWD":/app -w /app node:22 npx tsx tools/check-p18b-google-health-truth.ts
 */
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(__dirname, "..");
const TARGETS = [
  "lib/blog/posts/google-health-google-fit.ts",
  "lib/blog/posts/google-fit-api-dismissione-2026.ts",
];
const errors: string[] = [];

for (const TARGET of TARGETS) {
  const full = path.join(repoRoot, TARGET);
  if (!fs.existsSync(full)) {
    errors.push(`[file-assente] ${TARGET} non trovato.`);
    continue;
  }
  const content = fs.readFileSync(full, "utf8");
  const lines = content.split("\n");

  // ── 1/2. Google Health "solo/only" Fitbit+Pixel senza distinzione ───────
  // Richiede un verbo di copertura/integrazione VICINO a "solo/only" (il
  // pattern bandito e' "copre/integra SOLO Fitbit e Pixel" riferito a Google
  // Health) — NON deve scattare su "Sleep Score usa SOLO dati first-party
  // Fitbit/Pixel" (claim corretto, B5 del ledger) ne' su "se usi SOLO
  // dispositivi Fitbit/Pixel" (scenario utente in "Non ti serve FitMesh
  // se..."), che non hanno un verbo di copertura/integrazione riferito a
  // Google Health.
  const ONLY_FITBIT_PIXEL = /\b(copre|coprono|covers?|integra(?:no)?|integrates?|deckt|couvre)\b[^.。]{0,25}\b(solo|only|nur|sólo|apenas|seulement|tylko|sadece|alleen|のみ|만)\b[^.。]{0,30}\bFitbit\b[^.。]{0,20}\bPixel\b/i;
  const NO_THIRDPARTY_ABSOLUTE = /(non (riceve|accetta|supporta)|does\s*not\s*receive|kann\s*keine|no\s*recibe|ne\s*reçoit\s*pas)[^.。]{0,60}\b(terze\s*parti|third[\s-]?party|Drittanbieter|terceros|tiers)\b/i;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim().startsWith("//")) continue;
    if (ONLY_FITBIT_PIXEL.test(line)) {
      errors.push(`[solo-fitbit-pixel] ${TARGET}:${i + 1}: Google Health descritto come limitato a "solo Fitbit e Pixel" senza distinzione Samsung/Garmin.`);
    }
    if (NO_THIRDPARTY_ABSOLUTE.test(line)) {
      errors.push(`[terze-parti-negate] ${TARGET}:${i + 1}: nega che Google Health riceva dati di terze parti in generale (falso: li riceve via Health Connect/Apple Health).`);
    }
  }

  // ── 3/4. Strava: negazione del collegamento diretto, o descritta come storica ──
  // Finestra STRETTA (15 caratteri, non 80): deve essere "Strava non si
  // collega direttamente" grammaticalmente vicino, non un'altra frase dove
  // Strava e' solo la destinazione menzionata prima e la negazione riguarda
  // un soggetto diverso — es. "mandare allenamenti a Strava... fonti che
  // Google Health non collega direttamente (come Garmin)" NON e' un claim
  // su Strava, e' un claim su Garmin, falso positivo trovato in produzione.
  const STRAVA_NO_DIRECT = /\bStrava\b[^.。]{0,15}(non\s*(si\s*)?collega\s*direttamente|does\s*not\s*connect\s*directly|kein\s*direkt|no\s*se\s*conecta\s*directamente)/i;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim().startsWith("//")) continue;
    if (STRAVA_NO_DIRECT.test(line)) {
      errors.push(`[strava-no-direct-falso] ${TARGET}:${i + 1}: nega il collegamento diretto Google Health->Strava, che invece esiste (forward-only).`);
    }
  }
  // Finestra locale (non tutta la riga, che qui e' un intero paragrafo):
  // storico+sync vicini a "Strava" SENZA una negazione altrettanto vicina —
  // il testo corretto dice esplicitamente "mai lo storico"/"never your
  // history", quindi la negazione deve essere cercata nella STESSA finestra,
  // non assente dall'intera riga (che conterrebbe comunque "mai" altrove).
  const STRAVA_WORD = /\bStrava\b/gi;
  const SYNC_WORD = /sincroniz|sync|synchronis/i;
  const HISTORICAL_WORD = /storic[oa]|historical|Verlauf|histórico|historique|geschiedenis/i;
  const NEG_WORD_STRAVA = /\b(mai|never|non|not|nicht|nunca|jamais)\b/i;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim().startsWith("//")) continue;
    let sm: RegExpExecArray | null;
    STRAVA_WORD.lastIndex = 0;
    while ((sm = STRAVA_WORD.exec(line))) {
      const windowStart = Math.max(0, sm.index - 60);
      const windowEnd = Math.min(line.length, sm.index + 100);
      const window = line.slice(windowStart, windowEnd);
      if (SYNC_WORD.test(window) && HISTORICAL_WORD.test(window) && !NEG_WORD_STRAVA.test(window)) {
        errors.push(`[strava-storico-falso] ${TARGET}:${i + 1}: descrive Strava come sincronizzazione storica senza negazione vicina — la fonte dice esplicitamente "Historical activities will not sync".`);
        break;
      }
    }
  }

  // ── 5. Sleep Score/Cardio Load da fonti terze ────────────────────────────
  // Finestra locale (non l'intera riga, che qui e' un intero paragrafo con
  // molte frasi, alcune contenenti "non"/"solo" per motivi non correlati).
  const SLEEP_CARDIO_WORD = /Sleep\s*Score|Cardio\s*Load/gi;
  const THIRDPARTY_WORD = /terze\s*parti|third[\s-]?party|Garmin|Samsung|Drittanbieter|terceros/i;
  const NEG_OR_FIRSTPARTY = /\bnon\b|\bnot\b|\bkein\b|\bno\b|\bpas\b|first-party|first\s*party/i;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim().startsWith("//")) continue;
    let sm: RegExpExecArray | null;
    SLEEP_CARDIO_WORD.lastIndex = 0;
    while ((sm = SLEEP_CARDIO_WORD.exec(line))) {
      const windowEnd = Math.min(line.length, sm.index + sm[0].length + 80);
      const window = line.slice(sm.index, windowEnd);
      if (THIRDPARTY_WORD.test(window) && !NEG_OR_FIRSTPARTY.test(window)) {
        errors.push(`[sleep-cardio-terze-parti] ${TARGET}:${i + 1}: Sleep Score/Cardio Load associati a fonti terze senza negazione vicina — oggi sono solo dati first-party Fitbit/Pixel.`);
        break;
      }
    }
  }

  // ── 6. Confusione fra le due dismissioni API ────────────────────────────
  // Per FRASE (split su '.'), non per finestra di caratteri: due frasi
  // adiacenti che parlano separatamente delle due API (Fitbit Web API con
  // la sua data, poi "Le Google Fit APIs... SEPARATO" in una nuova frase)
  // sono corrette e vicine nel testo, ma non vanno confuse — una finestra
  // di caratteri le fondeva erroneamente. Qui basta che "settembre 2026" e
  // "Google Fit APIs" compaiano nella STESSA frase senza "Fitbit Web API"
  // nella stessa frase perche' scatti l'errore.
  const SEPT_2026 = /settembre\s*2026|September\s*2026|septiembre\s*de\s*2026|septembre\s*2026|września\s*2026|Eylül\s*2026|september\s*2026|9月|9월/i;
  const GOOGLE_FIT_APIS_WORD = /\bGoogle\s*Fit\s*APIs?\b/i;
  const FITBIT_WEB_API_WORD = /\bFitbit\s*Web\s*API\b/i;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim().startsWith("//")) continue;
    const sentences = line.split(/(?<=[.。])\s+/);
    for (const sentence of sentences) {
      if (SEPT_2026.test(sentence) && GOOGLE_FIT_APIS_WORD.test(sentence) && !FITBIT_WEB_API_WORD.test(sentence)) {
        errors.push(`[data-settembre-su-google-fit-apis] ${TARGET}:${i + 1}: la data di settembre 2026 (Fitbit Web API) appare nella stessa frase di "Google Fit APIs" senza menzionare la Fitbit Web API — rischio di aver trasferito la data alla dismissione sbagliata.`);
        break;
      }
    }
  }

  // ── 7. Migrazione Google Fit dichiarata gia' completa/iniziata ─────────
  const FIT_MIGRATION_DONE = /(Google\s*Fit|dati\s*Google\s*Fit)[^.。]{0,60}\b(e'\s*gia'\s*migrat|has\s*already\s*migrated|migrazione\s*(e'\s*)?completat|migration\s*is\s*complete|gia'\s*trasferit)/i;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim().startsWith("//")) continue;
    if (FIT_MIGRATION_DONE.test(line)) {
      errors.push(`[migrazione-gia-completa] ${TARGET}:${i + 1}: dichiara la migrazione Google Fit -> Google Health gia' iniziata/completata, non confermato da nessuna fonte ufficiale verificata.`);
    }
  }

  // ── 8. Integrazione diretta Google Health <-> FitMesh ────────────────────
  // Richiede negazione ASSENTE in una finestra stretta intorno al match: la
  // frase corretta e attesa e' proprio "FitMesh NON si integra con Google
  // Health" (sezione 9) — senza il controllo di negazione questo check
  // scattava su ogni riga che spiega correttamente l'assenza di
  // integrazione, il contrario di quello che doveva bandire.
  // Cattura il "gap" (0-20 caratteri) fra "FitMesh" e il verbo separatamente
  // dal resto del match: controllare la negazione sull'intero m[0] e'
  // sbagliato quando l'alternanza si estende su piu' clausole della stessa
  // riga (qui un intero paragrafo) — un "non" di una clausola SUCCESSIVA
  // finiva dentro la finestra e mascherava l'assenza di negazione sulla
  // clausola che il check doveva davvero controllare (bug trovato dal
  // negative test: "FitMesh si integra... e non usa la Google Health API"
  // veniva letto come negato per via del "non" della seconda clausola).
  const DIRECT_GH_FITMESH = /FitMesh\b([^.。]{0,20})(legge\s*direttamente\s*(da\s*)?Google\s*Health|reads\s*directly\s*from\s*Google\s*Health|si\s*integra\s*(direttamente\s*)?con\s*(l'app\s*|the\s*)?Google\s*Health(\s*API)?|integrates\s*(directly\s*)?with\s*(the\s*)?Google\s*Health(\s*API)?|usa\s*la\s*Google\s*Health\s*API|uses\s*the\s*Google\s*Health\s*API)/i;
  const NEGATION_NEARBY_GH = /\b(non|not|doesn't|does\s*not|isn't|no|nicht|ne\s*\.\.\.\s*pas|n['’]|kein|nie|değil)\b/i;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim().startsWith("//")) continue;
    const m = DIRECT_GH_FITMESH.exec(line);
    if (m && !NEGATION_NEARBY_GH.test(m[1])) {
      errors.push(`[fitmesh-google-health-diretto] ${TARGET}:${i + 1}: claim di integrazione diretta FitMesh<->Google Health/Google Health API senza negazione vicina, assente nella release pubblica verificata.`);
    }
  }

  // ── 9. Riferimenti a build interni o TrainingPeaks presentato come vivo ──
  const INTERNAL_BUILD_REF = /\bRelease\s*188\b|kWiredExportDestinationIds|\bbranch\s*(non\s*)?pubblicat|integra\/190/i;
  const TRAININGPEAKS_ALIVE = /TrainingPeaks[^.。]{0,60}(in\s*sviluppo|in\s*development|disponibile|available|coming\s*soon)/i;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim().startsWith("//")) continue;
    if (INTERNAL_BUILD_REF.test(line)) {
      errors.push(`[riferimento-build-interna] ${TARGET}:${i + 1}: riferimento a codice/branch/release interni in testo pubblico.`);
    }
    if (TRAININGPEAKS_ALIVE.test(line)) {
      errors.push(`[trainingpeaks-vivo] ${TARGET}:${i + 1}: TrainingPeaks presentato come "in sviluppo"/disponibile — va omesso dal confronto, non annunciato come roadmap.`);
    }
  }

  // ── 10. Claim medici ──────────────────────────────────────────────────
  const MEDICAL_CLAIM = /\b(diagnosi|diagnos[ei]|cura[re]?\s*(una\s*)?(patologia|malattia)|treat[s]?\s*a\s*(disease|condition)|heilt|cura\s*enfermedad)\b/i;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim().startsWith("//")) continue;
    if (MEDICAL_CLAIM.test(line)) {
      errors.push(`[claim-medico] ${TARGET}:${i + 1}: possibile claim medico (diagnosi/cura) — verificare manualmente.`);
    }
  }

  // ── 11. Efficacia assoluta nel blocco seoTitle ──────────────────────────
  const seoTitleMatch = content.match(/seoTitle:\s*\{([\s\S]*?)\n\s*\},/);
  if (seoTitleMatch) {
    const ABSOLUTE_TITLE = /\bthe\s*(replacement|fix|solution)\s*that\s*(actually\s*)?works?\b|works?\s*every\s*time\b|guaranteed/i;
    const seoTitleLines = seoTitleMatch[0].split("\n");
    const offset = content.slice(0, seoTitleMatch.index).split("\n").length - 1;
    for (let j = 0; j < seoTitleLines.length; j++) {
      if (seoTitleLines[j].trim().startsWith("//")) continue;
      if (ABSOLUTE_TITLE.test(seoTitleLines[j])) {
        errors.push(`[title-assoluto] ${TARGET}:${offset + j + 1}: seoTitle contiene una promessa assoluta di efficacia.`);
      }
    }
  }

  // ── 12. Fonti fantasma ────────────────────────────────────────────────
  const sourcesMatch = content.match(/sources:\s*\[([\s\S]*?)\]/);
  if (sourcesMatch) {
    const urls = Array.from(sourcesMatch[1].matchAll(/"(https?:\/\/[^"]+)"/g)).map((m) => m[1]);
    for (const url of urls) {
      const occurrences = content.split(url).length - 1;
      if (occurrences < 2) {
        errors.push(`[fonte-non-visibile] ${TARGET}: "${url}" e' in "sources" ma non compare come citazione nel corpo del testo.`);
      }
    }
  }
}

// ── 13. Nessuno sblocco accidentale di locale (verificato a parte con
// isBlogVariantIndexable(), qui solo un controllo statico sul commento se
// esiste un pin numerico dichiarato — non sostituisce la verifica diretta).

if (errors.length > 0) {
  console.error(`❌ P1.8B guardrail (google-health-google-fit + google-fit-api-dismissione-2026): ${errors.length} problemi.\n`);
  for (const e of errors) console.error("  " + e);
  process.exit(1);
}
console.log(
  "✅ P1.8B guardrail: nessuna regressione su solo-Fitbit-Pixel/terze-parti-negate/Strava-diretto/Strava-storico/Sleep-Cardio-terze/confusione-API/migrazione-completa-falsa/FitMesh-Google-Health-diretto/build-interna/TrainingPeaks-vivo/claim-medici/title-assoluto/fonti-fantasma.",
);
