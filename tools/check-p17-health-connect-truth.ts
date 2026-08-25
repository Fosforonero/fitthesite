/**
 * Guardrail P0 hotfix — `lib/blog/posts/health-connect-not-syncing.ts`.
 *
 * Scritto per l'ADDENDUM PRIORITÀ P0 truth-fix (2026-08-05). Blocca la
 * regressione delle bugie/imprecisioni corrette in questo hotfix, non solo
 * lo stato presente. Legge il file come testo grezzo (stesso approccio di
 * `check-galaxy-watch-article-claims.ts`) cosi' non dipende da altri branch
 * (questo hotfix e' isolato da origin/main, senza dipendenze da PR aperte).
 *
 * Fallisce (exit 1) se il file contiene:
 *  1. Il recupero storico descritto come automatico SENZA negazione vicina
 *     ("automatico"/"automatically" non preceduto da NON/not/nicht/pas/no
 *     nella stessa frase) — la verita' verificata (fonte S1) e' che NON lo
 *     e' senza il permesso di lettura storica esteso.
 *  2. "Samsung Health" abbinato a "tempo reale"/"real-time"/"Echtzeit"/
 *     "temps réel"/"tiempo real" nello stesso paragrafo — il testo corretto
 *     non ha mai bisogno di questa formulazione (fonte S2: la scrittura
 *     Samsung Health→Health Connect e' di norma rapida ma senza SLA
 *     garantita, non va mai descritta come "real-time").
 *  3. "Fitbit" citato come app corrente senza "Google Health" nelle vicinanze
 *     (±2 righe) — dal 19/05/2026 l'app e' Google Health (fonte S3).
 *  4. Una frase assoluta bandita esplicitamente dall'addendum: "causa numero
 *     uno"/"number one cause", "cinque minuti"/"five minutes" come tempo di
 *     fix garantito, "di gran lunga"/"by far" abbinato a "causa", "risolve
 *     la maggioranza dei casi"/"resolves the majority of cases".
 *  5. Un'istruzione azionabile che dice all'utente di concedere/abilitare il
 *     permesso di lettura storica DENTRO FitMesh — l'AndroidManifest reale
 *     (letto in sola lettura) non lo dichiara: sarebbe azionabile-ma-falso.
 *  6. Una percentuale numerica (\d+%) non presente in nessuna fonte S1-S4 —
 *     il file oggi non ne usa nessuna: qualunque comparsa e' un numero non
 *     documentato per definizione di questo guardrail.
 *  7. Un URL in `sources` non presente come stringa letterale da nessuna
 *     parte nel corpo del file (fonte citata ma non visibile al lettore).
 *  8. Un artefatto di corruzione testuale noto (KVKK al posto di "Health
 *     Connect", `__FENCE`, o la sequenza `},'` tipica delle corruzioni gia'
 *     trovate in TR/PL).
 *  9. (MICRO-ADDENDUM 2026-08-06) "Samsung Health" + "collo di bottiglia"/
 *     "bottleneck"/"cuello de botella"/"Flaschenhals"/"knelpunt" presentato
 *     come causa UNICA della latenza — Samsung documenta 3 trigger diversi
 *     (riconnessione, apertura app, pull-to-refresh: fonti S5/S6), quindi la
 *     riga deve citare almeno 2 di questi 3 concetti (radice "riconnett"
 *     o equivalente per lingua; apertura dell'app; pull-to-refresh) per
 *     non tornare a una formulazione a causa singola.
 * 10. (MICRO-ADDENDUM 2026-08-06) Stesso controllo del punto 9, applicato al
 *     testo sv/da di `lib/blog/nordic-overlay.json` per questo post — sv/da
 *     sono locale LIVE (`isPostTranslated===true`) tramite l'overlay, non
 *     tramite questo file: un residuo di formulazione a causa singola li'
 *     sarebbe invisibile a questo guardrail se limitato al solo file .ts
 *     (bug reale trovato durante la verifica pre-merge: flaskhalsen/
 *     flaskehalsen SV/DA avevano ancora la vecchia formulazione mentre la
 *     .ts era gia' corretta).
 * 11. (ULTIMO CHECK 2026-08-06) "30 giorni"/"30 days"/equivalenti SENZA un
 *     ancoraggio esplicito alla PRIMA concessione del permesso, nella stessa
 *     riga del file .ts — Health Connect senza READ_HEALTH_DATA_HISTORY non
 *     applica una finestra mobile "ultimi 30 giorni da oggi", ma impedisce
 *     la lettura di dati anteriori ai 30 giorni precedenti la prima
 *     concessione del permesso (bug reale trovato dall'ULTIMO CHECK pre-GO:
 *     TL;DR e "In sintesi" lo dicevano senza ancoraggio, mentre la FAQ era
 *     gia' corretta fin dall'hotfix iniziale).
 * 12. Stesso controllo del punto 11, applicato a `lib/blog/nordic-overlay.json`
 *     per sv/da (stesso motivo del punto 10: locale live tramite overlay,
 *     invisibile a un controllo limitato al solo file .ts).
 * 18. (MICRO-GATE P1.8A-A, secondo giro, 2026-08-25) Il blocco `seoTitle`
 *     conteneva "7 fixes that work": promette che le soluzioni funzionano
 *     in modo universale, un claim assoluto non verificabile — corretto in
 *     "Android fixes" (query invariata, contesto Android, niente promessa
 *     di efficacia). Guardia di regressione su "N fixes/solutions/
 *     soluzioni ... that work(s)" e affini (garantito/guaranteed/100%
 *     effective/always works), cercati SOLO dentro il blocco `seoTitle`
 *     (non nel corpo, dove "qui trovi 7 soluzioni" resta testo legittimo:
 *     e' la promessa di efficacia nel TITLE il problema, non il numero).
 *     `seoTitle` non ha chiavi sv/da in nordic-overlay.json per questo
 *     post (verificato: sv/da ricadono su hero.title via la catena di
 *     fallback, non su seoTitle.en) — nessuna estensione overlay necessaria.
 *
 * Uso (Docker, nessun runtime locale):
 *   docker run --rm -v "$PWD":/app -w /app node:22 npx tsx tools/check-p17-health-connect-truth.ts
 */
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(__dirname, "..");
const TARGET = "lib/blog/posts/health-connect-not-syncing.ts";
const full = path.join(repoRoot, TARGET);
const errors: string[] = [];

if (!fs.existsSync(full)) {
  console.error(`❌ File atteso non trovato: ${TARGET}`);
  process.exit(1);
}

const content = fs.readFileSync(full, "utf8");
const lines = content.split("\n");

// ── 1. Backfill "automatico" senza negazione vicina ──────────────────────
// Scoperto SOLO nel contesto storico/backfill (non deve bannare "retry
// automatico" della resilienza di FitMesh, che e' un claim diverso e vero).
const AUTOMATIC_WORD = /(automatico|automatically|automatisch|automatique|automático|automatisk|automatycznie|automatyczn|otomatik|自動的|자동으로|자동)/i;
const NEGATION_WORD = /\b(non|not|isn't|doesn't|nicht|pas|no|niet|não|nie)\b|değil|ではない|ではありません|아닙니다|아닌/i;
const HISTORY_CONTEXT_WORD = /(storic|recover|recuper|backfill|cronologia|history|30 giorni|30 days|30 dias|30 días|30 Tage|30 dni|30 gün|30日|30일)/i;
for (let i = 0; i < lines.length; i++) {
  const trimmed = lines[i].trim();
  if (trimmed.startsWith("//")) continue; // commento editoriale, non testo pubblicato
  const line = lines[i];
  if (!HISTORY_CONTEXT_WORD.test(line)) continue; // fuori contesto backfill, non pertinente
  let m: RegExpExecArray | null;
  const re = new RegExp(AUTOMATIC_WORD.source, "gi");
  while ((m = re.exec(line))) {
    // ADDENDUM P1.8A: finestra allargata dopo il match (5 -> 40 caratteri).
    // TR/JA/KO sono lingue a negazione POST-posta ("otomatik değildir" =
    // automatico+non-e', "自動ではありません" = automatico+non), quindi la
    // negazione vive DOPO la parola "automatico", non prima come in IT/EN/
    // FR/ES/DE/PT. La finestra +5 originale (pensata per IT/EN) tagliava
    // fuori "아닙니다"/"değildir"/"ではありません" quasi sempre, producendo
    // falsi positivi su testo gia' corretto.
    const windowStart = Math.max(0, m.index - 40);
    const window = line.slice(windowStart, m.index + m[0].length + 40);
    if (!NEGATION_WORD.test(window)) {
      errors.push(
        `[backfill-automatico-senza-negazione] riga ${i + 1}: "${window.trim()}" — "automatico" senza negazione nella finestra circostante (contesto storico/backfill).`,
      );
    }
  }
}

// ── 2. Samsung Health + "real-time" nello stesso paragrafo ───────────────
const REALTIME_WORD = /(tempo reale|real-time|realtime|Echtzeit|temps réel|tiempo real)/i;
for (let i = 0; i < lines.length; i++) {
  if (/Samsung Health/i.test(lines[i]) && REALTIME_WORD.test(lines[i])) {
    errors.push(`[samsung-health-realtime-assoluto] riga ${i + 1}: "Samsung Health" e un termine "real-time" nella stessa riga.`);
  }
}

// ── 3. "Fitbit" senza "Google Health" nelle vicinanze ─────────────────────
for (let i = 0; i < lines.length; i++) {
  if (!/Fitbit/.test(lines[i])) continue;
  if (lines[i].trim().startsWith("//")) continue; // commento editoriale, non testo pubblicato
  if (/brandsMentioned/.test(lines[i])) continue; // elenco struttrale, non testo per l'utente
  const windowLines = lines.slice(Math.max(0, i - 2), i + 3).join(" ");
  if (!/Google Health/.test(windowLines)) {
    errors.push(`[fitbit-senza-google-health] riga ${i + 1}: "Fitbit" citato senza "Google Health" nelle 2 righe circostanti.`);
  }
}

// ── 4. Frasi assolute bandite esplicitamente ──────────────────────────────
const BANNED_ABSOLUTES: Array<{ re: RegExp; label: string }> = [
  { re: /causa numero uno/i, label: "causa-numero-uno" },
  { re: /number one cause/i, label: "number-one-cause" },
  { re: /cinque minuti/i, label: "cinque-minuti" },
  { re: /\bfive minutes\b/i, label: "five-minutes" },
  { re: /di gran lunga,?\s*(è|e')\s*l'ottimizzazione/i, label: "di-gran-lunga-causa" },
  { re: /by far the most common cause/i, label: "by-far-most-common-cause" },
  { re: /risolve la maggioranza dei casi/i, label: "risolve-maggioranza-casi" },
  { re: /resolves the majority of cases/i, label: "resolves-majority-cases" },
  // ADDENDUM P1.8A (2026-08-25): equivalenti PT/FR/PL/TR/JA/KO trovati vivi
  // (non IT/EN) in queste 6 locale — la lista precedente era IT/EN-only per
  // costruzione e non li intercettava affatto.
  { re: /\bde longe\b/i, label: "de-longe-pt" },
  { re: /\bde loin\b/i, label: "de-loin-fr" },
  { re: /\bzdecydowanie\b/i, label: "zdecydowanie-pl" },
  { re: /açık ara farkla/i, label: "acik-ara-farkla-tr" },
  { re: /圧倒的/i, label: "attoutekiteki-ja" },
  { re: /\b단연\b/i, label: "danyeon-ko" },
  { re: /\ba causa principal\b/i, label: "causa-principal-pt" },
  { re: /\bla cause principale\b/i, label: "cause-principale-fr" },
  { re: /najważniejszą przyczyną/i, label: "najwazniejsza-przyczyna-pl" },
  { re: /en önemli neden/i, label: "en-onemli-neden-tr" },
  { re: /最大の原因/i, label: "saidai-no-gen-in-ja" },
  { re: /가장 큰 원인/i, label: "gajang-keun-wonin-ko" },
  { re: /\ba maioria dos casos\b/i, label: "maioria-dos-casos-pt" },
  { re: /\bla majorité des cas\b/i, label: "majorite-des-cas-fr" },
  { re: /większość przypadków/i, label: "wiekszosc-przypadkow-pl" },
  { re: /çoğu durumu çözer(?!.{0,20}hepsini değil)/i, label: "cogu-durumu-cozer-unqualified-tr" },
  { re: /ほとんどのケースを解決/i, label: "hotondo-no-keesu-ja" },
  { re: /대부분의 경우를 해결/i, label: "daebubun-ui-gyeongu-ko" },
  // ADDENDUM P1.8A: forma numerica di "5 minuti" come tempo-di-risoluzione
  // (non generico "aspetta N minuti" operativo, che resta legittimo altrove
  // nel file — es. "aspetta 5-10 minuti per il primo sync" dopo un reset
  // permessi e' un'istruzione diversa e vera). Richiede "5" + "minut*" nella
  // STESSA riga di un verbo di risoluzione, in una qualsiasi lingua coperta.
  {
    re: /\b5\s*(minuti|minutes|minutos|Minuten|minut|dakika|dakikada|분)\b(?=.{0,60}(risolv|solve|löst|resolv|résout|rozwiąz|çöz|解決|해결))|(?:risolv|solve|löst|resolv|résout|rozwiąz|çöz|解決|해결).{0,60}\b5\s*(minuti|minutes|minutos|Minuten|minut|dakika|dakikada|분)\b/i,
    label: "5-minuti-tempo-risoluzione",
  },
];
for (let i = 0; i < lines.length; i++) {
  if (lines[i].trim().startsWith("//")) continue; // commento editoriale che documenta lo storico del fix
  for (const { re, label } of BANNED_ABSOLUTES) {
    if (re.test(lines[i])) {
      errors.push(`[assoluto-bandito:${label}] riga ${i + 1}: "${lines[i].trim().slice(0, 120)}"`);
    }
  }
}

// ── 5. Istruzione azionabile "concedi il permesso di lettura storica" ────
const GRANT_VERB = /\b(concedi|grant|abilita|enable|activa|aktiviere|attiva)\b/i;
const HISTORY_PERMISSION = /(permesso di lettura storica|history-read permission|READ_HEALTH_DATA_HISTORY|lettura storica)/i;
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.trim().startsWith("//")) continue;
  if (GRANT_VERB.test(line) && HISTORY_PERMISSION.test(line)) {
    // Non e' un'istruzione azionabile se la riga descrive il limite in
    // negativo ("without/senza the extended grant...") o chiarisce
    // esplicitamente che FitMesh non lo richiede — solo allora e' un fatto
    // spiegato, non uno step da eseguire dentro l'app.
    const isFactualNegative = /\bwithout\b|\bsenza\b|\bohne\b|\bsans\b|\bsin\b/i.test(line);
    const isClarified = /non richiede|doesn't request|does not request|non lo richiede|não solicita|ne demande pas|no solicita|fordert.*nicht an/i.test(line);
    if (!isFactualNegative && !isClarified) {
      errors.push(`[permesso-storico-azionabile-falso] riga ${i + 1}: istruzione a concedere il permesso di lettura storica senza chiarire che FitMesh non lo richiede.`);
    }
  }
}

// ── 6. Percentuali numeriche non documentate ──────────────────────────────
// Esclude i commenti editoriali (es. note CTR/GSC su <title>/meta, che sono
// percentuali reali di Search Console, non claim rivolti al lettore).
for (let i = 0; i < lines.length; i++) {
  if (lines[i].trim().startsWith("//")) continue;
  if (/\d+\s?%/.test(lines[i])) {
    errors.push(`[percentuale-non-documentata] riga ${i + 1}: contiene una percentuale numerica non prevista da nessuna fonte S1-S4.`);
  }
}

// ── 7. URL in `sources` non presenti come stringa letterale nel corpo ────
const sourcesMatch = content.match(/sources:\s*\[([\s\S]*?)\]/);
if (sourcesMatch) {
  const urls = Array.from(sourcesMatch[1].matchAll(/"(https?:\/\/[^"]+)"/g)).map((m) => m[1]);
  if (urls.length === 0) {
    errors.push(`[sources-vuoto] l'array "sources" esiste ma non contiene URL.`);
  }
  for (const url of urls) {
    const occurrences = content.split(url).length - 1;
    // 1 sola occorrenza = solo nell'array sources, mai citata nel corpo visibile.
    if (occurrences < 2) {
      errors.push(`[fonte-non-visibile] "${url}" e' in "sources" ma non compare come citazione nel corpo del testo.`);
    }
  }
} else {
  errors.push(`[sources-assente] il post non ha un array "sources": richiesto dalla FASE 2 dell'addendum (fonti visibili + JSON-LD).`);
}

// ── 8. Artefatti di corruzione testuale noti ──────────────────────────────
// Verifica riga-per-riga (non whole-file): l'esclusione del commento header
// che DOCUMENTA lo storico del bug non deve mascherare una NUOVA occorrenza
// altrove nel file (bug reale in una prima versione di questo check: un
// `!/sostituzioni errate/.test(content)` sull'intero file era sempre falso,
// perché quella frase compare comunque nel commento header — trovato dal
// negative test di questo stesso guardrail).
for (let i = 0; i < lines.length; i++) {
  const trimmed = lines[i].trim();
  if (trimmed.startsWith("//")) continue; // commento editoriale che documenta lo storico
  if (/KVKK/.test(lines[i])) {
    errors.push(`[corruzione-kvkk] riga ${i + 1}: trovato "KVKK" al posto di "Health Connect".`);
  }
  if (/__FENCE/.test(lines[i])) {
    errors.push(`[corruzione-fence] riga ${i + 1}: artefatto template "__FENCE" non risolto.`);
  }
  if (/\},'/.test(lines[i])) {
    errors.push(`[corruzione-brace-quote] riga ${i + 1}: sequenza "}," ',' tipica delle corruzioni gia' viste in TR/PL.`);
  }
}

// ── 9/10. Samsung Health + "collo di bottiglia" come causa UNICA ─────────
// MICRO-ADDENDUM 2026-08-06: la latenza watch->telefono e' UNA possibile
// causa fra piu' trigger documentati da Samsung (S5/S6), non l'unica causa
// dimostrata. Richiede che il testo citi almeno 2 dei 3 trigger noti.
// Estratta in funzione riusabile: si applica sia al file .ts (riga per
// riga) sia alle stringhe sv/da di nordic-overlay.json (per-stringa) —
// sv/da sono locale live tramite l'overlay, un residuo li' sarebbe
// invisibile se il controllo restasse limitato al solo file .ts.
// FASE 4 (2026-08-06): "goulot d'étranglement"/"gargalo" (FR/PT) aggiunti —
// fr/pt diventano locale live per questo post in questa stessa release, un
// residuo a causa-singola li' sarebbe stato invisibile a questo check senza
// i termini FR/PT (stesso bug-pattern gia' corretto per sv/da al punto 10).
const BOTTLENECK_WORD = /(collo di bottiglia|bottleneck|cuello de botella|Flaschenhals|knelpunt|flaskhals|flaskehals|goulot d.étranglement|gargalo)/i;
// "reconect" (radice, senza doppia n) copre le coniugazioni ES/PT
// (reconecta/reconectou/reconectar/reconectando); "reconnect" (doppia n)
// copre EN/FR (reconnect/reconnecte/reconnecter/reconnected).
const RECONNECT_WORD = /(riconnett|reconnect|reconect|verbindet|opnieuw verbind|återanslut|genopret.{0,3}forbind)/i;
const OPEN_APP_WORD = /(apr[ai].{0,3}(l'app|app)|open.{0,3}the app|open.{0,3}samsung health app|abre.{0,3}la app|öffnest|app te openen|opens? samsung health|öppnar.{0,3}(app|samsung health)|åbner.{0,3}(app|samsung health)|åbne.{0,3}(app|samsung health)|ouvre[zr]?.{0,25}samsung health|abr[ae].{0,25}samsung health)/i;
const PULL_REFRESH_WORD = /pull-to-refresh/i;

function countSamsungTriggers(text) {
  return [RECONNECT_WORD, OPEN_APP_WORD, PULL_REFRESH_WORD].filter((re) => re.test(text)).length;
}

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.trim().startsWith("//")) continue;
  if (!/Samsung Health/i.test(line) || !BOTTLENECK_WORD.test(line)) continue;
  const triggerCount = countSamsungTriggers(line);
  if (triggerCount < 2) {
    errors.push(`[samsung-causa-unica] riga ${i + 1}: "collo di bottiglia"/"bottleneck" con Samsung Health ma solo ${triggerCount}/3 trigger documentati citati (riconnessione/apertura app/pull-to-refresh) — rischio di tornare a una causa unica non dimostrata.`);
  }
}

// ── 11. "30 giorni"/equivalenti senza ancoraggio alla PRIMA concessione ──
// ULTIMO CHECK 2026-08-06: senza READ_HEALTH_DATA_HISTORY, Health Connect
// non applica una finestra mobile "ultimi 30 giorni da oggi" — impedisce la
// lettura di dati anteriori ai 30 giorni precedenti la PRIMA concessione del
// permesso. Bug reale trovato: TL;DR e "In sintesi" lo dicevano senza
// ancoraggio (leggibile come finestra mobile), mentre la FAQ era gia'
// corretta fin dall'hotfix iniziale.
// FASE 4 (2026-08-06): "30 (derniers )?jours" (FR) e "30 dias" (PT) aggiunti
// — fr/pt diventano locale live per questo post in questa release, un
// residuo "finestra mobile da oggi" li' sarebbe stato invisibile senza
// questi termini (stesso bug-pattern gia' corretto per sv/da al punto 12).
// ADDENDUM P1.8A (2026-08-25): "30 dni"(PL)/"30 gün"(TR)/"30日"(JA)/"30일"(KO)
// aggiunti — la lista precedente era IT/EN/ES/DE/NL/SV/DA/FR/PT-only per
// costruzione: il residuo "finestra mobile" era gia' vivo in questi 4 file
// (TL;DR + "In sintesi") e invisibile a questo guardrail prima di ora.
const HISTORY_WINDOW_WORD = /(30 giorni|30 days|30 días|30 Tage|30 dagen|30 dagar|30 dage|30 (derniers )?jours|30 dias|30 dni|30 gün|30日|30일)/i;
// ADDENDUM P1.8A: pattern PL/TR/JA/KO allargati dalla forma esatta scritta
// nei MIEI edit ("pierwsze udzielenie uprawnienia" ecc.) alla radice
// concettuale "accesso/permesso + concesso/dato" — il testo PREESISTENTE
// nella FAQ di questi 4 file usava gia' un ancoraggio corretto ma con
// parole diverse ("od momentu przyznania dostępu" / "erişim verildiği
// andan itibaren" / "アクセスが許可された時点から" / "접근 권한이 부여된
// 시점부터"), e la prima versione di questo pattern non lo riconosceva —
// falso positivo trovato sulla FAQ, che era gia' corretta.
const HISTORY_ANCHOR_WORD = /(prima concessione|da quando ha ricevuto l'accesso|first permission grant|granted access|primera concesión|se le concedió el acceso|ersten? Berechtigungserteilung|Zeitpunkt der Berechtigungserteilung|eerste toestemming|moment van toegang|första behörigheten|åtkomst beviljades|första gången|första tillfället|første tilladelse|adgangen blev givet|première autorisation accordée|l'accès.{0,20}a été accordé|primeira concessão|acesso foi concedido|udzielenie uprawnienia|przyznania dostępu|udzielenia dostępu|verildiği andan|(izin|iznin).{0,20}verildiği|eri[şs]im.{0,20}verildiği|権限を付与した時点|許可された時点|権限が.{0,10}付与された|권한을 부여한 시점|권한이.{0,10}부여된|허용된 시점)/i;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.trim().startsWith("//")) continue;
  if (!HISTORY_WINDOW_WORD.test(line)) continue;
  if (!HISTORY_ANCHOR_WORD.test(line)) {
    errors.push(`[finestra-storica-non-ancorata] riga ${i + 1}: menziona "30 giorni/days" senza ancorarli esplicitamente alla prima concessione del permesso (rischio di lettura come finestra mobile da oggi).`);
  }
}

// ── 13. Emoji in righe di testo pubblicabile ──────────────────────────────
// ADDENDUM P1.8A: trovato un emoji incollato dentro una parola in PL
// ("przy😊ezdaj"). Nessuna riga di corpo/TL;DR/FAQ di questo articolo
// tecnico dovrebbe mai contenere un emoji.
// NOTA: range ristretto ai soli blocchi Unicode "pittografici" reali
// (emoticon/simboli/trasporti/pittogrammi supplementari). Un primo tentativo
// includeva anche Arrows (U+2190-21FF) e Misc Symbols (U+2600-27BF): il
// file usa "→" ovunque per i percorsi di navigazione UI ("Impostazioni →
// Sistema → ..."), quindi quel range dava ~150 falsi positivi su ogni
// freccia legittima. Ristretto al solo blocco che conteneva l'emoji reale
// trovato in PL (😊, U+1F60A).
const EMOJI_RANGE = /[\u{1F300}-\u{1FAFF}]/u;
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.trim().startsWith("//")) continue;
  if (EMOJI_RANGE.test(line)) {
    errors.push(`[emoji-in-testo] riga ${i + 1}: contiene un emoji — nessun emoji e' previsto in questo articolo.`);
  }
}

// ── 14. Acronimi di legge sulla privacy fuori contesto ────────────────────
// ADDENDUM P1.8A: "RODO" (GDPR polacco) e "KVKK" (legge turca) trovati come
// sostituzioni corrotte di "Health Connect"/"Android" in PL, non solo nei 4
// artefatti TR gia' noti. Nessuno dei due acronimi ha una ragione legittima
// di comparire in un articolo di troubleshooting Health Connect.
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.trim().startsWith("//")) continue;
  if (/\bRODO\b/.test(line)) {
    errors.push(`[corruzione-rodo] riga ${i + 1}: trovato "RODO" (probabile corruzione, non ha contesto legittimo in questo articolo).`);
  }
  if (/\bKVKK\b/.test(line)) {
    errors.push(`[corruzione-kvkk-linea] riga ${i + 1}: trovato "KVKK" (probabile corruzione, non ha contesto legittimo in questo articolo).`);
  }
}

// ── 15. Placeholder/artefatti a doppio underscore non risolti ─────────────
// ADDENDUM P1.8A: questo sito usa SOLO **bold** come light-markdown (vedi
// commento di lib/blog/types.ts) — MAI underscore per corsivo o enfasi.
// Qualunque sequenza __qualcosa__ o _parola_ dentro il testo pubblicabile e'
// per definizione un artefatto di template/traduzione non risolto (trovato
// live in PL: "**_feedback_app__**").
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.trim().startsWith("//")) continue;
  if (/_{2,}|\b_[a-zA-Z]+_\b/.test(line)) {
    errors.push(`[placeholder-underscore] riga ${i + 1}: sequenza underscore non prevista dal light-markdown del sito (solo **bold** e' ammesso).`);
  }
}

// ── 16. Nomi di subreddit letterali non tradotti ───────────────────────────
// ADDENDUM P1.8A: "r/AndroidHealth" tradotto in "r/AndroidSağlık" (TR) punta
// a un subreddit inesistente — i nomi community sono stringhe letterali,
// mai da tradurre. Whitelist dei subreddit realmente citati nel file.
const KNOWN_SUBREDDITS = new Set(["r/AndroidHealth", "r/GalaxyWatch"]);
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.trim().startsWith("//")) continue;
  // \b prima di "r": senza, "fr/integrations" (locale "fr" + path) e
  // "saatler/günler" (testo TR con uno slash generico) matchavano come
  // falsi subreddit — trovato come falso positivo al primo giro di questo
  // check. Richiede maiuscola dopo la "r" (i subreddit reali sono
  // CamelCase), cosi' non intercetta piu' testo comune con uno slash.
  const matches = line.matchAll(/\br\/[A-ZÀ-Ý][A-Za-zÀ-ÿğüşöçıİĞÜŞÖÇ]*/g);
  for (const m of matches) {
    if (!KNOWN_SUBREDDITS.has(m[0])) {
      errors.push(`[subreddit-non-letterale] riga ${i + 1}: "${m[0]}" non e' nella whitelist dei subreddit noti — probabile traduzione errata di un nome community, che deve restare letterale.`);
    }
  }
}

// ── 17. Contraddizione Android 13-/14+ specifica gia' trovata e corretta ──
// ADDENDUM P1.8A (Fix 6): il paragrafo diceva che l'aggiornamento non
// comparirebbe nell'elenco del Play Store, mentre gli step immediatamente
// successivi dicevano di cercarlo nel Play Store. Guardia di regressione
// sulla frase esatta rimossa, per lingua.
const PLAY_STORE_CONTRADICTION = /non comparirà nell'elenco aggiornamenti del Play Store|won't show up in the Play Store's update list|no aparecerá en la lista de actualizaciones|erscheint nicht in der Update-Liste des Play Store|não aparecerá na lista de atualizações|n'apparaîtra pas dans la liste des mises à jour|nie pojawi się na liście aktualizacji|güncelleme listesinde görünmez|verschijnt niet in de updatelijst|更新リストには表示されません|업데이트 목록에는 표시되지 않습니다/i;
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.trim().startsWith("//")) continue;
  if (PLAY_STORE_CONTRADICTION.test(line)) {
    errors.push(`[android14-play-store-contraddizione] riga ${i + 1}: e' tornata la frase che contraddice gli step "cerca su Play Store e aggiorna" subito dopo.`);
  }
}

// ── 18. Efficacia assoluta bandita nel blocco `seoTitle` ──────────────────
// Regressione specifica: "7 fixes that work" prometteva efficacia
// universale nel <title> renderizzato. Scope volutamente ristretto al solo
// blocco seoTitle (stesso pattern di estrazione del check 7 su `sources`)
// — "qui trovi 7 soluzioni" nel corpo del post resta testo legittimo,
// il problema e' la promessa di efficacia nel title, non il numero in se'.
const seoTitleMatch = content.match(/seoTitle:\s*\{([\s\S]*?)\n\s*\},/);
if (seoTitleMatch) {
  const ABSOLUTE_EFFICACY_TITLE = /\d+\s*(fixes?|solutions?|soluzioni|soluciones|Lösungen|solutions|oplossingen|rozwiązań|çözüm|解決策|해결책)\s*that\s*(actually\s*|really\s*)?work(s)?\b|works?\s*every\s*time\b|guaranteed\s*to\s*work|100%\s*(effective|efficac)/i;
  const seoTitleLines = seoTitleMatch[0].split("\n");
  const offset = content.slice(0, seoTitleMatch.index).split("\n").length - 1;
  for (let j = 0; j < seoTitleLines.length; j++) {
    if (seoTitleLines[j].trim().startsWith("//")) continue; // commento editoriale, non testo pubblicato
    if (ABSOLUTE_EFFICACY_TITLE.test(seoTitleLines[j])) {
      errors.push(`[title-efficacia-assoluta] riga ${offset + j + 1}: il blocco seoTitle promette efficacia universale ("...that work(s)"/garantito/100% effective) — claim non verificabile, gia' rimosso una volta.`);
    }
  }
}

// ── 10/12 (overlay). Estrae {lang -> [testo, indice-o-null]} da un valore
// overlay che puo' essere una stringa singola o un array di stringhe (es.
// "tldr"/"body.N.items" sono array per lingua) — check 10 in una prima
// versione iterava solo stringhe dirette e saltava silenziosamente i campi
// array (bug reale: e' esattamente li' che viveva il residuo "30 giorni"
// senza ancoraggio trovato dall'ULTIMO CHECK pre-GO).
function* overlayTextEntries(byLang) {
  for (const [lang, value] of Object.entries(byLang)) {
    if (typeof value === "string") {
      yield [lang, value, null];
    } else if (Array.isArray(value)) {
      // `yield` funziona solo nel corpo diretto del generatore, non dentro
      // una callback annidata come .forEach(): bug reale trovato al primo
      // avvio di questa funzione (esbuild: "yield is a reserved word").
      for (let idx = 0; idx < value.length; idx++) {
        if (typeof value[idx] === "string") yield [lang, value[idx], idx];
      }
    }
  }
}

const overlayPath = path.join(repoRoot, "lib/blog/nordic-overlay.json");
let overlayPostForChecks = null;
if (fs.existsSync(overlayPath)) {
  const overlay = JSON.parse(fs.readFileSync(overlayPath, "utf8"));
  overlayPostForChecks = overlay["health-connect-not-syncing"];
}
if (overlayPostForChecks) {
  for (const [fieldPath, byLang] of Object.entries(overlayPostForChecks)) {
    if (typeof byLang !== "object" || byLang === null) continue;
    for (const [lang, text, idx] of overlayTextEntries(byLang)) {
      const loc = idx === null ? `"${fieldPath}"."${lang}"` : `"${fieldPath}"."${lang}"[${idx}]`;
      // check 10
      if (/Samsung Health/i.test(text) && BOTTLENECK_WORD.test(text)) {
        const triggerCount = countSamsungTriggers(text);
        if (triggerCount < 2) {
          errors.push(`[samsung-causa-unica-overlay] nordic-overlay.json ${loc}: solo ${triggerCount}/3 trigger citati — rischio formulazione a causa singola nel testo live sv/da.`);
        }
      }
      // check 12
      if (HISTORY_WINDOW_WORD.test(text) && !HISTORY_ANCHOR_WORD.test(text)) {
        errors.push(`[finestra-storica-non-ancorata-overlay] nordic-overlay.json ${loc}: menziona "30 giorni/dagar/dage" senza ancorarli alla prima concessione del permesso.`);
      }
      // ADDENDUM P1.8A: check 6 (percentuali) esteso all'overlay — trovato
      // vivo "90 %" in sv/da (body.0.text), invisibile perche' i check
      // originali 4/6 leggevano solo il file .ts, mai nordic-overlay.json.
      if (/\d+\s?%/.test(text)) {
        errors.push(`[percentuale-non-documentata-overlay] nordic-overlay.json ${loc}: contiene una percentuale numerica non prevista da nessuna fonte S1-S4.`);
      }
      // ADDENDUM P1.8A: check 4 (assoluti banditi) esteso all'overlay.
      for (const { re, label } of BANNED_ABSOLUTES) {
        if (re.test(text)) {
          errors.push(`[assoluto-bandito-overlay:${label}] nordic-overlay.json ${loc}: "${text.slice(0, 120)}"`);
        }
      }
      // ADDENDUM P1.8A: emoji/RODO/KVKK/underscore estesi all'overlay.
      if (EMOJI_RANGE.test(text)) {
        errors.push(`[emoji-in-testo-overlay] nordic-overlay.json ${loc}: contiene un emoji.`);
      }
      if (/\bRODO\b/.test(text) || /\bKVKK\b/.test(text)) {
        errors.push(`[corruzione-acronimo-privacy-overlay] nordic-overlay.json ${loc}: trovato RODO/KVKK fuori contesto.`);
      }
      if (/_{2,}|\b_[a-zA-Z]+_\b/.test(text)) {
        errors.push(`[placeholder-underscore-overlay] nordic-overlay.json ${loc}: sequenza underscore non prevista dal light-markdown del sito.`);
      }
    }
  }
}

if (errors.length > 0) {
  console.error(`❌ P0 hotfix guardrail (health-connect-not-syncing truth-fix): ${errors.length} problemi.\n`);
  for (const e of errors) console.error("  " + e);
  process.exit(1);
}
console.log(
  "✅ P0 hotfix guardrail (health-connect-not-syncing truth-fix): nessuna regressione su backfill/real-time/Fitbit-obsoleto/permesso-storico-azionabile/assoluti-banditi/percentuali-non-documentate/fonti-non-visibili/corruzioni-testuali.",
);
