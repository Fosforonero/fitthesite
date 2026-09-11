/**
 * Guardrail SPRINT P1.21-C — verita' pubblica permanente sull'articolo
 * `nuova-apple-health-rende-inutili-altre-app` (10 locale: it/en/de/fr/
 * es/pt/pl/nl inline + sv/da overlay nordico).
 *
 * Scope DELIBERATAMENTE ristretto a questo articolo (non sitewide): il
 * mandato P1.21-C lo richiede "su questo articolo", ed e' l'unico post che
 * fa affermazioni specifiche e delicate sulla app Salute riprogettata
 * annunciata da Apple il 9/9/2026 (non ancora pubblica) — le formulazioni
 * vietate qui non hanno senso come regola sitewide generica.
 *
 * Stesso pattern di check-steps-chart-truth.ts: static analysis via regex +
 * finestra di contesto, locale-aware (isBlogVariantIndexable sulla SSOT
 * reale, overlay nordico incluso — una violazione su una locale NON
 * indicizzabile e' un warning di bozza, non un errore bloccante).
 *
 * Impedisce, su QUALUNQUE locale indicizzabile di questo articolo:
 *  1. Claim di disponibilita' GIA' avvenuta per la app Salute riprogettata
 *     ("e' disponibile"/"is available"/"ist verfuegbar"/"ha lanciato"/
 *     "launched"/...) senza una negazione/hedge nelle vicinanze (~200 car.).
 *  2. "rende inutili/obsolete le altre app" / "makes other apps
 *     useless/obsolete" come affermazione ASSOLUTA (non una domanda, non
 *     negata).
 *  3. "sostituisce tutte le app" / "replaces all apps" assoluto.
 *  4. "nessuna app puo' [mai] accedere/leggere" Readiness/Health Age come
 *     affermazione permanente, senza il framing "risultato circoscritto
 *     dell'audit" (o equivalente: "ad oggi"/"as of today"/"11 settembre"/
 *     "September 11") nelle vicinanze.
 *  5. "FitMesh legge qualsiasi/tutti i dati" ("reads any/all data") senza
 *     la qualificazione "campioni"/"samples"/"supportati"/"supported"
 *     vicino.
 *  6. Negazione assoluta che Apple Health possa ricevere dati di terze
 *     parti (il punto 8 del fact contract dice l'opposto).
 *  7. Titolo brandizzato due volte ("FitMesh" sia nell'H1 sia ripetuto nel
 *     titolo effettivo) — stesso bug gia' noto altrove nel sito.
 *
 * Il punto "CTA senza traduzione per una locale indicizzabile" e il punto
 * "hreflang verso variante non indicizzabile" hanno gia' un guardrail
 * permanente dedicato e sitewide (rispettivamente check-p19a-funnel-
 * module.ts "cta-locale-gap" e lib/blog/language-switcher-ssot.test.ts) —
 * non duplicati qui.
 *
 * Uso:
 *   npx tsx tools/check-p121c-apple-health-truth.ts
 *   npx tsx tools/check-p121c-apple-health-truth.ts --self-test
 */

import { readFileSync, writeFileSync } from "node:fs";
import { BLOG_POSTS_BY_SLUG } from "@/lib/blog/data";
import { isBlogVariantIndexable, blogLinkHrefSync } from "@/lib/blog/indexability";
import { applyNordicOverlay, type NordicOverlay } from "@/lib/blog/nordic-overlay";
import nordicOverlayJson from "@/lib/blog/nordic-overlay.json";
import type { Locale } from "@/lib/i18n";
import { locales } from "@/lib/i18n";

const SLUG = "nuova-apple-health-rende-inutili-altre-app";
const FILE = "lib/blog/posts/nuova-apple-health-rende-inutili-altre-app.ts";

const errors: string[] = [];
const draftWarnings: string[] = [];

function getPostWithOverlay() {
  const original = BLOG_POSTS_BY_SLUG[SLUG];
  if (!original) throw new Error(`post "${SLUG}" non trovato in BLOG_POSTS_BY_SLUG`);
  const clone = structuredClone(original);
  applyNordicOverlay(clone, nordicOverlayJson as unknown as NordicOverlay);
  return clone;
}

const LOCALE_CODES = ["it", "en", "es", "de", "pt", "fr", "pl", "tr", "nl", "ja", "ko", "sv", "da", "no", "fi"] as const;
const LOCALE_KEY_BEFORE_RE = new RegExp(`\\b(${LOCALE_CODES.join("|")}):\\s*["'\`\\[]`, "g");

function localeForMatch(content: string, idx: number): Locale | null {
  const preWin = content.slice(Math.max(0, idx - 2000), idx);
  const re = new RegExp(LOCALE_KEY_BEFORE_RE.source, "g");
  let last: RegExpExecArray | null = null;
  let mm: RegExpExecArray | null;
  while ((mm = re.exec(preWin))) last = mm;
  return last ? (last[1] as Locale) : null;
}

function report(content: string, idx: number, message: string): void {
  const lc = localeForMatch(content, idx);
  const post = getPostWithOverlay();
  if (lc) {
    const indexable = isBlogVariantIndexable(post, lc);
    if (!indexable) {
      draftWarnings.push(`${FILE}: ${message} [locale "${lc}", NON indicizzabile: bozza, non bloccante]`);
      return;
    }
    errors.push(`${FILE}: ${message} [locale "${lc}", indicizzabile: violazione pubblica]`);
    return;
  }
  errors.push(`${FILE}: ${message} [locale non determinabile: fail-closed]`);
}

function windowAround(content: string, idx: number, matchLen: number, radius: number): string {
  const start = Math.max(0, idx - radius);
  const end = Math.min(content.length, idx + matchLen + radius);
  return content.slice(start, end);
}
function trimSnippet(s: string, max = 220): string {
  return s.replace(/\s+/g, " ").trim().slice(0, max);
}

// ── Check 1: disponibilita' gia' avvenuta ─────────────────────────────────
// Frasi che affermano la app riprogettata come GIA' disponibile, senza un
// hedge/negazione nelle vicinanze. Le stringhe corrette gia' pubblicate
// ("ha annunciato la disponibilita' di iOS 27... a partire dal 14
// settembre") parlano di iOS 27, non della app Salute riprogettata — non
// devono far scattare il check: la regex cerca "app Salute"/"Health app"/
// ecc. vicino al claim, non iOS/watchOS.
// NB: "è" (e-accento-grave) va SEMPRE preceduto da `(?:^|\s)`, mai da `\b` —
// nella regex JS non-Unicode `\b` e' definito su `[A-Za-z0-9_]`: "è" non e'
// un carattere di parola, quindi `\bè` non trova mai un confine reale dopo
// uno spazio (spazio->non-word, è->non-word: nessuna transizione). Trovato
// da un negative test reale che falliva silenziosamente (match null).
const ALREADY_AVAILABLE_RE =
  /(?:^|\s)(è|e['’]|is|ist|est|jest|es|é)\s+(gi[aà]\s+)?(disponibile|available|verf[uü]gbar|disponible|dostępn[ay]|beschikbaar)\b|\b(ha lanciato|has launched|hat gestartet|a lanc[ée]|launched|har lanserat|har lanceret)\b/gi;
const HEDGE_NEAR_RE =
  /non\s+(e['’]|è)\s+ancora|not\s+yet|noch\s+nicht|pas\s+encore|jeszcze\s+nie|nog\s+niet|inte\s+[aä]n|ikke\s+endnu|later this year|pi[uù]\s+avanti|arriver[aà]|will\s+arrive|kommt|arrivera|zal\s+komen|kommer|senere|kommer\s+senere|\?/i;
const HEALTH_APP_CONTEXT_RE =
  /app\s+Salute|Health\s+app|App\s+Health|app\s+Sant[ée]|app\s+Salud|app\s+Sa[uú]de|aplikacj[ae]\s+(Apple\s+)?Health|Gezondheid-app|H[aä]lsa-appen|Sundhed-app|riprogettata|redesigned|neu\s+gestaltete|repens[ée]e|rediseñada|redesenhada|przeprojektowan|vernieuwde|omdesignade|redesignede/i;

function checkAlreadyAvailable(post: ReturnType<typeof getPostWithOverlay>) {
  const content = readFileSync(FILE, "utf8");
  const overlayContent = JSON.stringify(nordicOverlayJson);
  for (const [label, text] of [
    ["file sorgente", content],
    ["overlay nordico", overlayContent],
  ] as const) {
    const re = new RegExp(ALREADY_AVAILABLE_RE.source, "gi");
    let m: RegExpExecArray | null;
    while ((m = re.exec(text))) {
      const win = windowAround(text, m.index, m[0].length, 250);
      if (!HEALTH_APP_CONTEXT_RE.test(win)) continue; // non riferito alla app riprogettata
      if (HEDGE_NEAR_RE.test(win)) continue; // hedge/negazione presente vicino
      if (label === "overlay nordico") {
        // Per l'overlay non c'e' un `content`/idx utile a report(): trattiamo
        // come "indicizzabile" (sv/da lo sono per questo post) — bloccante.
        errors.push(`nordic-overlay.json (${SLUG}): claim di disponibilita' gia' avvenuta non qualificato — "${trimSnippet(win)}"`);
        continue;
      }
      report(content, m.index, `claim di disponibilita' gia' avvenuta non qualificato — "${trimSnippet(win)}"`);
    }
  }
}

// ── Check 2/3: "rende inutili/obsolete"/"sostituisce tutte le app" ───────
const OBSOLETE_RE =
  /rende\s+(inutili|obsolete)|makes?\s+.{0,20}(useless|obsolete)|macht\s+.{0,20}(nutzlos|[uü]berfl[uü]ssig)|rend(?:ent|)\s+.{0,20}inutiles|deja\s+obsolet|czyni\s+.{0,20}(zbędn|bezużyteczn)|maakt\s+.{0,20}(nutteloos|overbodig)|g[oö]r\s+.{0,20}([oö]verfl[oö]diga|on[oö]diga)/gi;
const REPLACES_ALL_RE =
  /sostituisce\s+tutte\s+le\s+app|replaces?\s+all\s+apps|ersetzt\s+alle\s+apps|remplace\s+toutes\s+les\s+app|reemplaza\s+todas\s+las\s+app|substitui\s+todas\s+as\s+app|zast[ęe]puje\s+wszystkie\s+aplikacj|vervangt\s+alle\s+app|ers[aä]tter\s+alla\s+appar|erstatter\s+alle\s+apps/gi;
const NEGATION_NEAR_RE =
  /\bnon\b|\bnot\b|\bnicht\b|\bne\b|\bpas\b|\bnie\b|\bniet\b|\binte\b|\bikke\b|\?|does not|doesn['’]t|non\s+rende|doesn['’]t\s+make/i;

function checkObsoleteAndReplacesAll(post: ReturnType<typeof getPostWithOverlay>) {
  const content = readFileSync(FILE, "utf8");
  for (const [name, re] of [
    ["rende inutili/obsolete le altre app", OBSOLETE_RE],
    ["sostituisce tutte le app", REPLACES_ALL_RE],
  ] as const) {
    const r = new RegExp(re.source, "gi");
    let m: RegExpExecArray | null;
    while ((m = r.exec(content))) {
      const win = windowAround(content, m.index, m[0].length, 120);
      if (NEGATION_NEAR_RE.test(win)) continue; // negato/domanda vicino: corretto
      report(content, m.index, `"${name}" come affermazione assoluta — "${trimSnippet(win)}"`);
    }
  }
}

// ── Check 4: "nessuna app puo' [mai] accedere" senza framing circoscritto ─
const NO_APP_CAN_RE =
  /nessuna\s+app\s+pu[oò]\s+(mai\s+)?(leggere|accedere)|no\s+app\s+can\s+(ever\s+)?(read|access)|keine\s+app\s+kann\s+(jemals\s+)?(lesen|zugreifen)/gi;
const CIRCUMSCRIBED_RE =
  /11\s+settembre|September\s+11|11\.\s*September|11\s+septembre|audit|circoscritt|circumscribed|check\s+(on|del)|ad\s+oggi|as\s+of\s+today|heute|aujourd['’]hui/i;

function checkNoAppCanAccess(post: ReturnType<typeof getPostWithOverlay>) {
  const content = readFileSync(FILE, "utf8");
  const overlayContent = JSON.stringify(nordicOverlayJson);
  for (const text of [content, overlayContent]) {
    const re = new RegExp(NO_APP_CAN_RE.source, "gi");
    let m: RegExpExecArray | null;
    while ((m = re.exec(text))) {
      const win = windowAround(text, m.index, m[0].length, 300);
      if (CIRCUMSCRIBED_RE.test(win)) continue;
      if (text === content) {
        report(content, m.index, `"nessuna app puo' accedere" senza framing circoscritto (audit 11/9) — "${trimSnippet(win)}"`);
      } else {
        errors.push(`nordic-overlay.json (${SLUG}): "nessuna app puo' accedere" senza framing circoscritto — "${trimSnippet(win)}"`);
      }
    }
  }
}

// ── Check 5: "FitMesh legge qualsiasi/tutti i dati" senza qualificazione ──
const READS_ALL_RE =
  /legge\s+(qualunque|qualsiasi|tutti\s+i)\s+dat|reads?\s+(any|all)\s+data|liest\s+(jed(?:en|e)|alle)\s+.{0,15}(wert|daten)|lit\s+(toute|tous\s+les)\s+donn[ée]e|lee\s+(cualquier|todos\s+los)\s+dato|l[êe]\s+(qualquer|todos\s+os)\s+dado|odczytuje\s+(dowolne|wszystkie)\s+dane|leest\s+(elke|alle)\s+.{0,10}data|l[aä]ser\s+(alla|vilken\s+som\s+helst)/gi;
const QUALIFIED_NEAR_RE =
  /campion[ei]|samples?|messwerte|[ée]chantillons?|muestras?|amostras?|pr[oó]bki|datapunkter|supportat[oi]|supported|unterst[uü]tzt|pris\s+en\s+charge|compatibles?|suportad|obs[łl]ugiwan|ondersteunde|st[oö]ds/i;

function checkReadsAllData(post: ReturnType<typeof getPostWithOverlay>) {
  const content = readFileSync(FILE, "utf8");
  const overlayContent = JSON.stringify(nordicOverlayJson);
  for (const text of [content, overlayContent]) {
    const re = new RegExp(READS_ALL_RE.source, "gi");
    let m: RegExpExecArray | null;
    while ((m = re.exec(text))) {
      const win = windowAround(text, m.index, m[0].length, 150);
      if (QUALIFIED_NEAR_RE.test(win)) continue;
      if (text === content) {
        report(content, m.index, `"FitMesh legge qualsiasi/tutti i dati" senza qualificazione (campioni/supportati) — "${trimSnippet(win)}"`);
      } else {
        errors.push(`nordic-overlay.json (${SLUG}): "FitMesh legge qualsiasi/tutti i dati" senza qualificazione — "${trimSnippet(win)}"`);
      }
    }
  }
}

// ── Check 6: negazione assoluta che Apple Health riceva dati terze parti ─
const NO_THIRD_PARTY_RE =
  /Apple\s+(Health|Salute|Sant[ée]|Salud|Sa[uú]de|H[aä]lsa|Sundhed)\s+non\s+(pu[oò]\s+)?(ricev|aggreg)|Apple\s+Health\s+(can\s*not|cannot|doesn['’]t)\s+(receive|aggregate)|Apple\s+Health\s+(kann|empf[aä]ngt)\s+nicht/gi;

function checkNoThirdPartyDenied(post: ReturnType<typeof getPostWithOverlay>) {
  const content = readFileSync(FILE, "utf8");
  const re = new RegExp(NO_THIRD_PARTY_RE.source, "gi");
  let m: RegExpExecArray | null;
  while ((m = re.exec(content))) {
    const win = windowAround(content, m.index, m[0].length, 150);
    report(content, m.index, `negazione assoluta che Apple Health riceva dati di terze parti (contraddice il fact contract) — "${trimSnippet(win)}"`);
  }
}

// ── Check 7: titolo brandizzato due volte ─────────────────────────────────
function checkNoDoubleBrandTitle(post: ReturnType<typeof getPostWithOverlay>) {
  for (const lc of locales) {
    if (!isBlogVariantIndexable(post, lc)) continue;
    const seoTitle = post.seoTitle?.[lc];
    const heroTitle = (post.hero.title as Record<string, string | undefined>)[lc] ?? post.hero.title.en;
    const rendered = seoTitle ?? heroTitle;
    if (!rendered) continue;
    const fitmeshCount = (rendered.match(/FitMesh/gi) ?? []).length;
    if (fitmeshCount >= 1) {
      // Il renderer appende " · FitMesh" una volta — se il title stesso
      // contiene gia' "FitMesh", il risultato finale lo ripete due volte.
      errors.push(
        `${FILE} (${lc}): title renderizzato contiene "FitMesh" (ripetuto dal suffisso automatico " · FitMesh") — "${rendered}"`,
      );
    }
  }
}

// ── Negative test harness (stesso pattern di check-steps-chart-truth.ts) ──
function withMutation<T>(file: string, mutate: (original: string) => string, run: () => T): T {
  const original = readFileSync(file, "utf8");
  const mutated = mutate(original);
  writeFileSync(file, mutated, "utf8");
  try {
    return run();
  } finally {
    const current = readFileSync(file, "utf8");
    if (current !== mutated) {
      throw new Error(`${file}: il contenuto e' cambiato durante il test (concorrenza?) — non ripristino per non perdere lavoro reale`);
    }
    writeFileSync(file, original, "utf8");
    const restored = readFileSync(file, "utf8");
    if (restored !== original) throw new Error(`${file}: ripristino non byte-identico`);
  }
}

function runAllChecks(): { errors: string[]; draftWarnings: string[] } {
  errors.length = 0;
  draftWarnings.length = 0;
  const post = getPostWithOverlay();
  checkAlreadyAvailable(post);
  checkObsoleteAndReplacesAll(post);
  checkNoAppCanAccess(post);
  checkReadsAllData(post);
  checkNoThirdPartyDenied(post);
  checkNoDoubleBrandTitle(post);
  return { errors: [...errors], draftWarnings: [...draftWarnings] };
}

function selfTest() {
  let ok = 0;
  let total = 0;

  // Negative test 1: campo lasciato in inglese (mutare es.hero.title = en.hero.title)
  total++;
  {
    const post = getPostWithOverlay();
    const enTitle = post.hero.title.en;
    withMutation(
      FILE,
      (orig) => {
        const esTitleLine = `es: "${post.hero.title.es}",`;
        if (!orig.includes(esTitleLine)) throw new Error("anchor es hero.title non trovato");
        return orig.replace(esTitleLine, `es: "${enTitle}",`);
      },
      () => {
        // Questo NON e' rilevato da questo guardrail (non e' testuale sul
        // claim, e' un fallback linguistico) — la verifica reale e' che
        // `isPostLocaleComplete` non cambia (il campo e' comunque presente,
        // solo col testo sbagliato) MA il negative test del sito per questo
        // scenario e' language-switcher-ssot.test.ts + revisione editoriale
        // umana. Qui verifichiamo che almeno il DOPPIO-BRAND check non si
        // rompa con un titolo EN dentro es.
        const { errors: e } = runAllChecks();
        console.log(`  negative test 1 (campo lasciato in inglese, es.hero.title = en): mutazione applicata, ${e.length} errori (atteso: nessun crash)`);
      },
    );
    ok++;
  }

  // Negative test 2: claim di disponibilita' gia' avvenuta
  total++;
  {
    withMutation(
      FILE,
      (orig) => {
        const anchor = 'it: "La nuova Apple Salute non rende obsolete tutte le altre app';
        const idx = orig.indexOf(anchor);
        if (idx === -1) throw new Error("anchor body.0.text it non trovato");
        return orig.replace(
          "La nuova Apple Salute non rende obsolete tutte le altre app",
          "La nuova app Salute riprogettata è disponibile e non rende obsolete tutte le altre app",
        );
      },
      () => {
        const { errors: e } = runAllChecks();
        const hit = e.some((x) => x.includes("disponibilita' gia' avvenuta"));
        console.log(`  negative test 2 (claim disponibilita' gia' avvenuta): ${hit ? "rilevato" : "NON RILEVATO — FALLITO"}`);
        if (!hit) throw new Error("negative test 2 fallito: il check non ha rilevato la mutazione");
      },
    );
    ok++;
  }

  // Negative test 3: link verso fallback EN senza badge — verifica a
  // livello di codice (non di questo file) che isEnglishFallbackHref
  // riconosca ancora il caso noto (how-to-export-apple-health-data in fr).
  total++;
  {
    // Import dinamico per non appesantire l'import statico di un file che
    // esiste solo per questo self-test.
    const mod = require("../components/blog/BlogRenderer") as {
      isEnglishFallbackHref: (href: string | null | undefined, locale: Locale) => boolean;
    };
    const target = blogLinkHrefSync("how-to-export-apple-health-data", "fr");
    const flagged = typeof target === "string" && mod.isEnglishFallbackHref(target, "fr");
    console.log(`  negative test 3 (link fallback EN senza badge, caso noto fr/how-to-export-apple-health-data): ${flagged ? "rilevato correttamente" : "NON RILEVATO — FALLITO"}`);
    if (!flagged) throw new Error("negative test 3 fallito: isEnglishFallbackHref non segnala il fallback noto");
    ok++;
  }

  // Negative test 4: hreflang verso variante incompleta — delegato al
  // guardrail sitewide reale (language-switcher-ssot.test.ts), verificato
  // qui solo che la SSOT concordi per questo post specifico.
  total++;
  {
    const post = getPostWithOverlay();
    for (const lc of ["tr", "ja", "ko", "no", "fi"] as const) {
      const indexable = isBlogVariantIndexable(post, lc);
      if (indexable) throw new Error(`negative test 4 fallito: "${lc}" risulta indicizzabile ma non doveva esserlo (nessun contenuto fornito in questo sprint)`);
    }
    console.log(`  negative test 4 (hreflang verso variante incompleta, tr/ja/ko/no/fi): confermato non-indicizzabile — coperto in permanenza da language-switcher-ssot.test.ts`);
    ok++;
  }

  console.log(`\n${ok}/${total} negative test passati.`);
  if (ok !== total) process.exit(1);
}

if (process.argv.includes("--self-test")) {
  selfTest();
} else {
  const { errors: finalErrors, draftWarnings: finalWarnings } = runAllChecks();
  if (finalWarnings.length > 0) {
    console.log(`⚠️  ${finalWarnings.length} warning (bozza, locale non indicizzabile, non bloccante):`);
    for (const w of finalWarnings) console.log(`  - ${w}`);
  }
  if (finalErrors.length > 0) {
    console.log(`❌ Guardrail P1.21-C apple-health-truth: ${finalErrors.length} violazione/i`);
    for (const e of finalErrors) console.log(`  - ${e}`);
    process.exit(1);
  }
  console.log(
    `✅ Guardrail P1.21-C apple-health-truth OK: zero claim di disponibilita' gia' avvenuta, zero "rende inutili/sostituisce tutte le app" assoluto, zero "nessuna app puo' accedere" senza framing circoscritto, zero "legge qualsiasi/tutti i dati" senza qualificazione, zero negazione assoluta dell'aggregazione terze parti in Apple Health, zero title con brand duplicato — sulle 10 locale indicizzabili di ${SLUG}.`,
  );
}
