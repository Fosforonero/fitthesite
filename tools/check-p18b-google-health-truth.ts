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
 * Estensione micro-gate P1.8B-A (25/08/2026), verifica indipendente:
 * 14. Google Health descritto come SCRIVE/esporta dati verso Apple Health
 *     (falso: al momento della verifica legge solo, non scrive ancora).
 * 15. Apple Health descritta come bidirezionale/"entrambe le direzioni"
 *     (solo Health Connect lo e' davvero; Apple Health e' oggi lettura sola).
 * 16. La scadenza delle Google Fit APIs (fine 2026) applicata all'app
 *     consumer Google Fit invece che alle sole API per sviluppatori.
 * 17. Migrazione/chiusura dell'app consumer Google Fit dichiarata
 *     "completata"/"conclusa" entro una data, invece che solo annunciata.
 * 18. Rollout Fitbit->Google Health dichiarato su "tutti gli account" (la
 *     fonte dice "per la maggior parte degli utenti" tra il 19 e il 26/05).
 * 19. Prova gratuita Google Health Premium presentata come garantita a
 *     tutti, senza menzione di idoneita'/variabilita' per paese o account.
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

  // ── 14/15. Apple Health: scrittura o bidirezionalita' false ─────────────
  // Check 14 e' ANCORATO al soggetto "Google Health"/"Google Saúde": richiede
  // Google Health ... verbo-di-scrittura ... Apple Health nella stessa
  // porzione di frase (gap stretti), non un generico verbo di scrittura
  // ovunque vicino ad "Apple Health" — la prima versione (finestra libera
  // di 120 caratteri intorno ad "Apple Health") falso-positivava su "Garmin
  // Connect ha permesso di SCRITTURA verso Health Connect/Apple Health"
  // (soggetto Garmin, non Google Health: e' vero e va bene) e su "esporta
  // la cronologia con Google Takeout" (nessun collegamento con Apple
  // Health). Negazione cercata sull'intero span del match (m[0]), perche'
  // in tedesco/altre lingue la negazione puo' cadere fra il verbo e "Apple
  // Health" ("schreibt aber noch keine Daten zurück nach Apple Health"),
  // non subito prima del verbo.
  // Gap fra "Google Health" e il verbo, e fra il verbo e "Apple Health":
  // escluso ; e ；(oltre a . e 。) per non attraversare un confine di
  // clausola — "Google Health legge...via HC; su iPhone legge da AH, ma non
  // scrive..." NON deve essere letto come un unico span (falso positivo
  // trovato: NL "...lezen én schrijven via Health Connect op Android; op
  // iPhone leest het uit Apple Health" senza negazione nello stesso span
  // perche' il "maar schrijft nog niet terug" era DOPO il punto successivo).
  const WRITE_VERB_SRC = "scrive|scrivere|writes?|writing|schreibt|escribe|escribir|grava|gravar|écrit|écrire|zapisuje|zapisywać|yazar|yazıyor|schrijft|schrijven|esporta|export(?:s|ing|a)?|書き込|쓰기|쓰다";
  // Soggetto concorrente che puo' comparire fra "Google Health/Saúde" e il
  // verbo (es. "...ao Google Saúde se o Garmin Connect gravar..."): se
  // presente, il vero soggetto del verbo e' quello, non Google Health —
  // falso positivo trovato nella FAQ "Perche' Garmin non appare".
  const COMPETING_WRITER_SUBJECT = /Garmin(?:\s*Connect)?|Polar(?:\s*Flow)?|Samsung\s*Health|third[\s-]?party\s*app|terze\s*parti|app\s*sorgente|source\s*app|app\s*terze/i;
  const GH_WRITES_TO_AH = new RegExp(`(Google\\s*Health|Google\\s*Saúde)([^.。;；]{0,100})\\b(?:${WRITE_VERB_SRC})\\b([^.。;；]{0,120})Apple\\s*Health`, "gi");
  const BIDIRECTIONAL_WORD = /entrambe\s*le\s*direzioni|both\s*directions|bidirectional|bidirezionale|beide\s*Richtungen|ambas\s*direcciones|nas\s*duas\s*direções|deux\s*sens|obu\s*kierunkach|her\s*iki\s*yönde|beide\s*richtingen|双方向|양방향/i;
  const NEG_WORD_AH = /\b(non|not|noch\s*nicht|todavía\s*no|ainda\s*não|ne\s*.{0,3}pas|pas\s*encore|jeszcze\s*nie|henüz|nog\s*(niet|geen)|doesn't|does\s*not|n['’]|kein|keine)\b|まだ|아직/i;
  const APPLE_HEALTH_WORD = /Apple\s*Health/g;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim().startsWith("//")) continue;
    let gm: RegExpExecArray | null;
    GH_WRITES_TO_AH.lastIndex = 0;
    while ((gm = GH_WRITES_TO_AH.exec(line))) {
      const gapBeforeVerb = gm[2] ?? "";
      if (COMPETING_WRITER_SUBJECT.test(gapBeforeVerb)) continue;
      if (!NEG_WORD_AH.test(gm[0])) {
        errors.push(`[apple-health-scrive-falso] ${TARGET}:${i + 1}: Google Health descritto come scrive/esporta verso Apple Health senza negazione nello stesso passaggio — al momento della verifica legge solo, non scrive ancora indietro.`);
        break;
      }
    }
    let am: RegExpExecArray | null;
    APPLE_HEALTH_WORD.lastIndex = 0;
    while ((am = APPLE_HEALTH_WORD.exec(line))) {
      const windowStart = Math.max(0, am.index - 120);
      const windowEnd = Math.min(line.length, am.index + am[0].length + 120);
      const window = line.slice(windowStart, windowEnd);
      if (BIDIRECTIONAL_WORD.test(window) && !NEG_WORD_AH.test(window)) {
        errors.push(`[apple-health-bidirezionale-falso] ${TARGET}:${i + 1}: Apple Health descritta come bidirezionale/"entrambe le direzioni" senza negazione vicina — solo Health Connect lo e', Apple Health e' oggi lettura sola.`);
        break;
      }
    }
  }

  // ── 16. Scadenza Google Fit APIs applicata all'app consumer ─────────────
  // Per FRASE (come il check 6): una frase che nomina "Google Fit" con una
  // data di fine-2026 E un verbo di sostituzione/chiusura, ma SENZA la
  // parola "API"/"APIs" nella stessa frase, ha quasi certamente trasferito
  // la scadenza delle API allo shutdown dell'app consumer (vietato: nessuna
  // data di chiusura per l'app consumer e' stata pubblicata da Google).
  const END_2026_WORD = /fine\s*del\s*2026|fine\s*2026|end\s*of\s*2026|antes\s*de\s*que\s*termine\s*2026|fin\s*de\s*2026|Ende\s*2026|até\s*o\s*fim\s*de\s*2026|d'ici\s*fin\s*2026|końca\s*2026\s*r\.|2026\s*sonuna\s*kadar|tegen\s*eind\s*2026|2026年末|2026년\s*말/i;
  const GOOGLE_FIT_APP_WORD = /\bGoogle\s*Fit\b(?!\s*APIs?)/i;
  const REPLACE_CLOSE_VERB = /sostitui|replac|reemplaz|ersetz|remplac|zastąp|değiştir|vervang|置き換え|대체|chius|shut\s*down|shutdown|cierra|schließ|ferme|zamkn|kapan|sluit|閉鎖|폐쇄/i;
  const API_WORD_BOUND = /\bAPIs?\b/i;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim().startsWith("//")) continue;
    const sentences = line.split(/(?<=[.。])\s+/);
    for (const sentence of sentences) {
      if (
        END_2026_WORD.test(sentence) &&
        GOOGLE_FIT_APP_WORD.test(sentence) &&
        REPLACE_CLOSE_VERB.test(sentence) &&
        !API_WORD_BOUND.test(sentence)
      ) {
        errors.push(`[google-fit-api-scadenza-su-consumer] ${TARGET}:${i + 1}: la scadenza "fine 2026" delle Google Fit APIs applicata all'app consumer Google Fit — nessuna data di chiusura per l'app consumer e' stata pubblicata.`);
        break;
      }
    }
  }

  // ── 17. Migrazione/chiusura app consumer dichiarata completata ──────────
  const MIGRATION_COMPLETE_WORD = /completat|completed|concluí|conclu|terminée|terminada|abgeschlossen|zakończon|tamamlandı|voltooid|完了|완료/i;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim().startsWith("//")) continue;
    const sentences = line.split(/(?<=[.。])\s+/);
    for (const sentence of sentences) {
      if (GOOGLE_FIT_APP_WORD.test(sentence) && END_2026_WORD.test(sentence) && MIGRATION_COMPLETE_WORD.test(sentence)) {
        errors.push(`[migrazione-consumer-completata-falso] ${TARGET}:${i + 1}: migrazione/chiusura dell'app consumer Google Fit dichiarata completata entro una data — nessuna fonte ufficiale lo conferma.`);
        break;
      }
    }
  }

  // ── 18. Rollout dichiarato su "tutti gli account" ────────────────────────
  const ALL_ACCOUNTS_WORD = /tutti\s*gli\s*account|all\s*accounts|todas\s*las\s*cuentas|alle\s*Konten|todas\s*as\s*contas|tous\s*les\s*comptes|wszystkie\s*konta|tüm\s*hesap|alle\s*accounts|全アカウント|모든\s*계정/i;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim().startsWith("//")) continue;
    if (ALL_ACCOUNTS_WORD.test(line)) {
      errors.push(`[rollout-tutti-account-falso] ${TARGET}:${i + 1}: rollout Fitbit->Google Health dichiarato su "tutti gli account" — la fonte dice "per la maggior parte degli utenti".`);
    }
  }

  // ── 19. Prova Premium presentata come universale ─────────────────────────
  // Finestra ampia (±250 caratteri) intorno a ogni menzione della durata
  // della prova gratuita: deve comparire una parola di idoneita'/
  // variabilita' nella stessa finestra, altrimenti la prova e' presentata
  // come garanzia universale (falso: e' per account nuovi/di ritorno
  // risultati idonei, varia per paese e account).
  const TRIAL_DURATION_WORD = /3\s*mesi|3-month|3\s*meses|dreimonatige|drei\s*Monate|3\s*mois|3-miesięczny|3\s*aylık|3\s*maanden|3か月|3개월/g;
  const ELIGIBILITY_WORD = /idone|eligib|elegib|berechtigt|kwalifik|uygun|aanmerking|対象|자격|garantit|garanti|gwarant|guarante|varia|varies|variiert|değişir|verschilt|zależy|異なり|다릅|varía|zależ/i;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim().startsWith("//")) continue;
    let tm: RegExpExecArray | null;
    TRIAL_DURATION_WORD.lastIndex = 0;
    while ((tm = TRIAL_DURATION_WORD.exec(line))) {
      const windowStart = Math.max(0, tm.index - 250);
      const windowEnd = Math.min(line.length, tm.index + tm[0].length + 250);
      const window = line.slice(windowStart, windowEnd);
      if (!ELIGIBILITY_WORD.test(window)) {
        errors.push(`[premium-prova-universale] ${TARGET}:${i + 1}: prova gratuita Google Health Premium menzionata senza idoneita'/variabilita' vicina — rischio di presentarla come garantita a tutti.`);
        break;
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
  "✅ P1.8B guardrail: nessuna regressione su solo-Fitbit-Pixel/terze-parti-negate/Strava-diretto/Strava-storico/Sleep-Cardio-terze/confusione-API/migrazione-completa-falsa/FitMesh-Google-Health-diretto/build-interna/TrainingPeaks-vivo/claim-medici/title-assoluto/fonti-fantasma/Apple-Health-scrive/Apple-Health-bidirezionale/Google-Fit-API-scadenza-su-consumer/migrazione-consumer-completata/rollout-tutti-account/premium-prova-universale.",
);
