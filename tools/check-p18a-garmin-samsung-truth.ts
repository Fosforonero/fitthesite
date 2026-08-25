/**
 * Guardrail dedicato — Sprint P1.8A (2026-08-25) —
 * `lib/blog/posts/garmin-samsung-health-sync-guide.ts`.
 *
 * Modellato su `check-p17-health-connect-truth.ts` (stesso approccio: legge
 * il file come testo grezzo, riga per riga, cosi' non dipende dal resto del
 * branch). Nessun guardrail dedicato esisteva per questo post prima di
 * questo sprint — copre il fact-check fatto contro le fonti ufficiali
 * Garmin/Samsung (vedi il report dello sprint per le citazioni) piu' le
 * stesse categorie di corruzione testuale gia' note dall'articolo Health
 * Connect (emoji, placeholder underscore, acronimi privacy fuori contesto,
 * subreddit non letterali).
 *
 * Fallisce (exit 1) se il file (o l'entry nordica sv/da in
 * nordic-overlay.json) contiene:
 *  1. "Garmin" + "legge da Health Connect"/"reads from Health Connect" (o
 *     equivalenti multilingua) in un'affermazione — fonte Garmin: "this is
 *     a one-way transfer; Garmin will not read any data from Health
 *     Connect". Garmin scrive, non legge mai.
 *  2. "SpO2" nella lista dei tipi di dato sincronizzati Garmin->Health
 *     Connect — non presente nella lista ufficiale Garmin (Activity +
 *     Wellness Data).
 *  3. "sincronizzazione diretta"/"direct sync" (o equivalenti) riferito al
 *     percorso Garmin<->Samsung Health senza Health Connect — l'intera tesi
 *     dell'articolo e' che NON esiste integrazione diretta.
 *  4. Nome di un'app bridge concorrente (whitelist: solo Garmin/Samsung/
 *     Health Connect/Android/Google/FitMesh sono ammessi come nomi prodotto).
 *  5. Percentuali numeriche non documentate (stesso pattern del guardrail
 *     Health Connect).
 *  6. Emoji, placeholder underscore, acronimi privacy fuori contesto
 *     (RODO/KVKK), subreddit non letterali — stesse categorie del
 *     guardrail Health Connect.
 *  7. Titolo/description EN o DE fuori target (<=60 / 140-160 caratteri).
 *
 * Uso (Docker, nessun runtime locale):
 *   docker run --rm -v "$PWD":/app -w /app node:22 npx tsx tools/check-p18a-garmin-samsung-truth.ts
 */
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(__dirname, "..");
const TARGET = "lib/blog/posts/garmin-samsung-health-sync-guide.ts";
const full = path.join(repoRoot, TARGET);
const errors: string[] = [];

if (!fs.existsSync(full)) {
  console.error(`❌ File atteso non trovato: ${TARGET}`);
  process.exit(1);
}

const content = fs.readFileSync(full, "utf8");
const lines = content.split("\n");

// ── 1. Garmin descritto come se leggesse da Health Connect ────────────────
// Cerca "Garmin" vicino a un verbo di lettura riferito a Health Connect,
// nella stessa riga, SENZA una negazione nella finestra circostante (stesso
// pattern "finestra allargata" del guardrail Health Connect, per coprire
// negazioni post-poste in TR/JA/KO).
const GARMIN_WORD = /Garmin( Connect)?/i;
const READ_FROM_HC = /(legge da Health Connect|lee (eso|esos datos) de|liest.{0,15}(von|aus) Health Connect|lê.{0,10}(do|da) Health Connect|lit.{0,10}(depuis|de) Health Connect|odczytuje.{0,15}z Health Connect|Health Connect'ten okur|leest.{0,15}(van|uit) Health Connect|Health Connectから読み取|Health Connect에서 읽|reads (that data |your data )?from (it|Health Connect))/i;
const READ_NEGATION = /\b(non|not|never|nunca|niemals|jamais|nigdy|asla|nooit|nie)\b|読み取らない|読み取ることはあり|읽지 않|읽지않/i;
for (let i = 0; i < lines.length; i++) {
  const trimmed = lines[i].trim();
  if (trimmed.startsWith("//")) continue;
  const line = lines[i];
  let m: RegExpExecArray | null;
  const re = new RegExp(READ_FROM_HC.source, "gi");
  while ((m = re.exec(line))) {
    // Le righe di questo articolo sono paragrafi lunghi che menzionano
    // SPESSO sia Garmin che Samsung Health nella stessa frase — Samsung
    // Health LEGGE davvero da Health Connect, quindi un controllo
    // "Garmin compare da qualche parte nella riga" (bug del primo giro:
    // falso positivo su testo gia' corretto, dove "Garmin...scrive" e
    // "Samsung Health...legge" convivono nello stesso paragrafo) da solo
    // non basta. Richiede "Garmin" a ridosso (60 caratteri prima) del verbo
    // di lettura, non ovunque nella riga.
    const windowStart = Math.max(0, m.index - 60);
    const window = line.slice(windowStart, m.index + m[0].length + 40);
    if (!GARMIN_WORD.test(window)) continue;
    // Se "Samsung Health" compare PIU' vicino al verbo di lettura di quanto
    // non lo sia l'ultima occorrenza di "Garmin" nella finestra, il
    // soggetto grammaticale del verbo e' quasi certamente Samsung Health
    // (che legge davvero da HC), non Garmin — evita il falso positivo su
    // frasi tipo "Garmin scrive...Samsung Health legge" nella stessa riga.
    const lastGarminIdx = Math.max(...Array.from(window.matchAll(new RegExp(GARMIN_WORD.source, "gi")), (mm) => mm.index ?? -1));
    const samsungIdx = window.search(/Samsung Health/i);
    if (samsungIdx !== -1 && samsungIdx > lastGarminIdx) continue;
    if (!READ_NEGATION.test(window)) {
      errors.push(
        `[garmin-legge-da-hc] riga ${i + 1}: "${window.trim().slice(0, 160)}" — Garmin non legge mai da Health Connect (fonte Garmin: one-way transfer).`,
      );
    }
  }
}

// ── 2. SpO2 nella lista dati sincronizzati ─────────────────────────────────
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.trim().startsWith("//")) continue;
  if (/SpO2/i.test(line)) {
    errors.push(`[spo2-non-documentato] riga ${i + 1}: "SpO2" non e' nella lista ufficiale Garmin Activity/Wellness Data — non deve comparire come dato sincronizzato.`);
  }
}

// ── 3. "Sincronizzazione diretta" Garmin<->Samsung senza Health Connect ───
const DIRECT_SYNC_WORD = /(sincronizzazione diretta|direct sync|sincronización directa|direkte Synchronisierung|synchronisation directe|synchronizacja bezpośrednia|doğrudan senkronizasyon|directe synchronisatie|直接同期|직접 동기화|integración directa|intégration directe|直接統合|직접 통합)/i;
// "pas" (negazione FR standard "ne...pas"), "しません"/"ではありません" (JA
// negativo verbale), "되지 않"/"되나요" (radice KO negativa/interrogativa)
// aggiunti dopo un giro di falsi positivi su testo GIA' correttamente
// negato (JA "直接同期しません" e FR "n'ont pas d'intégration directe" non
// erano intercettati dalla lista di negazioni originale).
const DIRECT_SYNC_NEGATION = /\b(non|not|no|kein|aucune|żadn|hiçbir|geen|ninguna|pas)\b|存在しない|없습니다|없다|しません|ではありません|ありません|되지 않|않습니다/i;
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const trimmedLine = line.trim();
  if (trimmedLine.startsWith("//")) continue;
  // Una DOMANDA che pone il claim ("...sincronizza direttamente...?") e'
  // sicura per costruzione se poi negata nella risposta — stesso pattern
  // "q: pone, a: nega" gia' usato da check-p18s-product-led-claims.ts.
  // Qui, piu' semplice: una riga che termina con "?"/"？" e' una domanda,
  // non un'affermazione, quindi non e' il claim da bandire.
  if (/[?？]\s*",?\s*$/.test(line)) continue;
  if (DIRECT_SYNC_WORD.test(line) && !DIRECT_SYNC_NEGATION.test(line)) {
    errors.push(`[sincronizzazione-diretta-non-negata] riga ${i + 1}: "direct sync"/"sincronizzazione diretta" senza negazione nella stessa riga — Garmin e Samsung Health non hanno integrazione diretta.`);
  }
}

// ── 4. Nomi di app bridge concorrenti ──────────────────────────────────────
// Whitelist minima di nomi prodotto ammessi in questo articolo. Qualunque
// altro nome noto di app-bridge per wearable trovato nel testo pubblicabile
// e' una violazione della regola sitewide "niente nomi di bridge-app
// concorrenti".
const COMPETITOR_BRIDGE_APPS = /(Gadgetbridge|Sync Solver|HealthFit|Sweatcoin Sync|Tacx Sync|SyncMyTracks|RunGap|Tapiriik)/i;
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.trim().startsWith("//")) continue;
  if (COMPETITOR_BRIDGE_APPS.test(line)) {
    errors.push(`[competitor-bridge-app] riga ${i + 1}: nome di un'app bridge concorrente trovato nel testo.`);
  }
}

// ── 5. Percentuali numeriche non documentate ──────────────────────────────
for (let i = 0; i < lines.length; i++) {
  if (lines[i].trim().startsWith("//")) continue;
  if (/\d+\s?%/.test(lines[i])) {
    errors.push(`[percentuale-non-documentata] riga ${i + 1}: contiene una percentuale numerica non documentata da fonte primaria.`);
  }
}

// ── 6a. Emoji ───────────────────────────────────────────────────────────
const EMOJI_RANGE = /[\u{1F300}-\u{1FAFF}]/u;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].trim().startsWith("//")) continue;
  if (EMOJI_RANGE.test(lines[i])) {
    errors.push(`[emoji-in-testo] riga ${i + 1}: contiene un emoji.`);
  }
}

// ── 6b. Acronimi privacy fuori contesto ────────────────────────────────────
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.trim().startsWith("//")) continue;
  if (/\bRODO\b/.test(line) || /\bKVKK\b/.test(line)) {
    errors.push(`[corruzione-acronimo-privacy] riga ${i + 1}: trovato RODO/KVKK fuori contesto.`);
  }
}

// ── 6c. Placeholder underscore ─────────────────────────────────────────────
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.trim().startsWith("//")) continue;
  if (/_{2,}|\b_[a-zA-Z]+_\b/.test(line)) {
    errors.push(`[placeholder-underscore] riga ${i + 1}: sequenza underscore non prevista dal light-markdown del sito (solo **bold** e' ammesso).`);
  }
}

// ── 6d. Subreddit non letterali ────────────────────────────────────────────
const KNOWN_SUBREDDITS = new Set(["r/AndroidHealth", "r/GalaxyWatch", "r/Garmin", "r/GarminWatches"]);
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.trim().startsWith("//")) continue;
  const matches = line.matchAll(/\br\/[A-ZÀ-Ý][A-Za-zÀ-ÿğüşöçıİĞÜŞÖÇ]*/g);
  for (const m of matches) {
    if (!KNOWN_SUBREDDITS.has(m[0])) {
      errors.push(`[subreddit-non-letterale] riga ${i + 1}: "${m[0]}" non e' nella whitelist dei subreddit noti.`);
    }
  }
}

// ── 6e. URL in `sources` non presenti come stringa letterale nel corpo ────
// Stesso pattern di check-p17-health-connect-truth.ts regola 7: una fonte
// elencata ma mai citata visibilmente nel testo e' una fonte "fantasma".
const sourcesMatch = content.match(/sources:\s*\[([\s\S]*?)\]/);
if (sourcesMatch) {
  const urls = Array.from(sourcesMatch[1].matchAll(/"(https?:\/\/[^"]+)"/g)).map((m) => m[1]);
  if (urls.length === 0) {
    errors.push(`[sources-vuoto] l'array "sources" esiste ma non contiene URL.`);
  }
  for (const url of urls) {
    const occurrences = content.split(url).length - 1;
    if (occurrences < 2) {
      errors.push(`[fonte-non-visibile] "${url}" e' in "sources" ma non compare come citazione nel corpo del testo.`);
    }
  }
} else {
  errors.push(`[sources-assente] il post non ha un array "sources".`);
}

// ── 7. Titolo/description EN+DE fuori target ───────────────────────────────
const seoTitleMatch = content.match(/seoTitle:\s*\{([\s\S]*?)\n\s*\},/);
const metaDescMatch = content.match(/metaDescription:\s*\{([\s\S]*?)\n\s*\},/);
function extractLocaleString(block: string, locale: string): string | null {
  const re = new RegExp(`${locale}:\\s*"((?:[^"\\\\]|\\\\.)*)"`, "");
  const m = block.match(re);
  return m ? m[1] : null;
}
if (seoTitleMatch) {
  const enTitle = extractLocaleString(seoTitleMatch[1], "en");
  const deTitle = extractLocaleString(seoTitleMatch[1], "de");
  const suffix = " · FitMesh";
  if (enTitle && (enTitle + suffix).length > 60) {
    errors.push(`[title-en-troppo-lungo] title EN renderizzato ${(enTitle + suffix).length} caratteri (>60): "${enTitle}${suffix}"`);
  }
  if (deTitle && (deTitle + suffix).length > 60) {
    errors.push(`[title-de-troppo-lungo] title DE renderizzato ${(deTitle + suffix).length} caratteri (>60): "${deTitle}${suffix}"`);
  }
}
if (metaDescMatch) {
  const enDesc = extractLocaleString(metaDescMatch[1], "en");
  const deDesc = extractLocaleString(metaDescMatch[1], "de");
  if (enDesc) {
    const len = [...enDesc].length;
    if (len < 140 || len > 160) {
      errors.push(`[description-en-fuori-target] meta description EN lunga ${len} caratteri, attesi 140-160.`);
    }
  }
  if (deDesc) {
    const len = [...deDesc].length;
    if (len < 140 || len > 160) {
      errors.push(`[description-de-fuori-target] meta description DE lunga ${len} caratteri, attesi 140-160.`);
    }
  }
}

// ── overlay sv/da (post live tramite nordic-overlay.json) ─────────────────
function* overlayTextEntries(byLang: Record<string, unknown>) {
  for (const [lang, value] of Object.entries(byLang)) {
    if (typeof value === "string") {
      yield [lang, value, null] as const;
    } else if (Array.isArray(value)) {
      for (let idx = 0; idx < value.length; idx++) {
        if (typeof value[idx] === "string") yield [lang, value[idx], idx] as const;
      }
    }
  }
}
const overlayPath = path.join(repoRoot, "lib/blog/nordic-overlay.json");
if (fs.existsSync(overlayPath)) {
  const overlay = JSON.parse(fs.readFileSync(overlayPath, "utf8"));
  const overlayPost = overlay["garmin-samsung-health-sync-guide"];
  if (overlayPost) {
    for (const [fieldPath, byLang] of Object.entries(overlayPost)) {
      if (typeof byLang !== "object" || byLang === null) continue;
      for (const [lang, text, idx] of overlayTextEntries(byLang as Record<string, unknown>)) {
        const loc = idx === null ? `"${fieldPath}"."${lang}"` : `"${fieldPath}"."${lang}"[${idx}]`;
        if (/SpO2/i.test(text)) {
          errors.push(`[spo2-non-documentato-overlay] nordic-overlay.json ${loc}: "SpO2" non documentato.`);
        }
        if (/\d+\s?%/.test(text)) {
          errors.push(`[percentuale-non-documentata-overlay] nordic-overlay.json ${loc}: percentuale non documentata.`);
        }
        if (EMOJI_RANGE.test(text)) {
          errors.push(`[emoji-in-testo-overlay] nordic-overlay.json ${loc}: contiene un emoji.`);
        }
        if (/\bRODO\b/.test(text) || /\bKVKK\b/.test(text)) {
          errors.push(`[corruzione-acronimo-privacy-overlay] nordic-overlay.json ${loc}: RODO/KVKK fuori contesto.`);
        }
        if (/_{2,}|\b_[a-zA-Z]+_\b/.test(text)) {
          errors.push(`[placeholder-underscore-overlay] nordic-overlay.json ${loc}: sequenza underscore non prevista.`);
        }
        {
          const re2 = new RegExp(READ_FROM_HC.source, "gi");
          let m2: RegExpExecArray | null;
          while ((m2 = re2.exec(text))) {
            const windowStart = Math.max(0, m2.index - 60);
            const window = text.slice(windowStart, m2.index + m2[0].length + 40);
            if (!GARMIN_WORD.test(window)) continue;
            if (!READ_NEGATION.test(window)) {
              errors.push(`[garmin-legge-da-hc-overlay] nordic-overlay.json ${loc}: Garmin descritto come se leggesse da Health Connect.`);
            }
          }
        }
      }
    }
  }
}

if (errors.length > 0) {
  console.error(`❌ P1.8A guardrail (garmin-samsung-health-sync-guide truth-fix): ${errors.length} problemi.\n`);
  for (const e of errors) console.error("  " + e);
  process.exit(1);
}
console.log(
  "✅ P1.8A guardrail (garmin-samsung-health-sync-guide truth-fix): nessuna regressione su Garmin-legge-da-HC/SpO2/sync-diretta/competitor-app/percentuali/emoji/corruzioni/subreddit/title-description.",
);
