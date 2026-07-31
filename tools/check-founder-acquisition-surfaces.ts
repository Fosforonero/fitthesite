/**
 * Sprint P0.10K — FASE 9 — guardrail
 * "founder:acquisition-surfaces-check": ZERO SUPERFICI PUBBLICHE DI
 * ACQUISIZIONE FOUNDER.
 *
 * Il sito e' nello stato commerciale post-Founder: le adesioni via sito sono
 * chiuse, /beta e' l'ARCHIVIO STORICO (200, noindex/follow, nessun form,
 * nessuna CTA di adesione). Questo guardrail e' l'unico controllo che
 * verifica quell'invariante in modo ESPLICITO e SITO-WIDE, e fallisce se una
 * qualunque superficie pubblica torna a proporre l'adesione.
 *
 * Cosa NON e' questo file: non tocca backend, Supabase, entitlement, il
 * cutoff FOUNDER_END_AT, la finestra individuale di 14 giorni o i Founder
 * gia' concessi (li verificano founder:window-check, founder:backend-check,
 * founder:migration-identity-check). Qui si guarda SOLO cio' che un
 * visitatore anonimo puo' vedere e cliccare.
 *
 * ── PERCHE' ESISTE, DATO CHE C'E' GIA' founder:commercial-truth-check ──
 * Quel guardrail nasce come controllo delle 5 superfici commerciali note
 * (homepage/header/footer/menu/beta) piu' una lista chiusa di frasi-CTA
 * italiane/inglesi. Ha due limiti che questo file chiude:
 *
 *  1. NON SCANSIONA I FILE .json. Oggi NESSUN guardrail del repo lo fa, e
 *     lib/blog/nordic-overlay.json + lib/landing/es-overlay.json
 *     SOVRASCRIVONO a build-time il testo dei .ts corrispondenti (titoli,
 *     sottotitoli, corpo, ctaLabel). Significa che le 4 locale nordiche
 *     (sv/da/no/fi) e lo spagnolo potevano regredire a una CTA di adesione
 *     Founder senza che un solo gate se ne accorgesse. E' il buco piu'
 *     grande emerso dall'audit di questo sprint.
 *  2. La lista frasi e' ancorata alla PAROLA, non alla STRUTTURA. Una
 *     regex sulla sola parola non sa distinguere una CTA cliccabile da
 *     prosa d'archivio legittima — ed e' esattamente la distinzione che
 *     serve, perche' il sito DEVE poter continuare a raccontare la storia
 *     ("i primi 1000 founder, entro il 31 luglio 2026, hanno ricevuto il
 *     Pro a vita gratis") senza per questo invitare nessuno ad aderire.
 *
 * ── IL PRINCIPIO: STRUTTURA, NON PAROLA ──
 * Ogni controllo qui sotto e' ancorato a una POSIZIONE azionabile:
 *  - la label dentro un <Link>/<a> (JSX) o dentro un link markdown [..](..)
 *    usato dalla prosa di blog/landing;
 *  - il valore di un campo CTA per nome: ctaLabel / ctaHref /
 *    primaryCta.label|href / secondaryCta.label|href, sia negli oggetti .ts
 *    sia nelle chiavi dei .json di overlay;
 *  - l'href di quel link/campo.
 * La prosa d'archivio, che non vive in nessuna di queste posizioni, non fa
 * fallire il gate. Dove un controllo deve per forza guardare del testo
 * libero (contatore posti, offerta "Pro a vita gratis"), l'ancora non e' la
 * parola ma un SEGNALE DI ATTUALITA': un numero accanto al contatore, un
 * verbo di acquisizione in seconda persona accanto all'offerta. "hanno
 * ricevuto il Pro a vita gratis" passa, "ricevi il Pro a vita gratis" no.
 *
 * ── IL LESSICO E' MULTILINGUE, MA VINCOLATO AL FOUNDER ──
 * Il sito ha 15 locale (it,en,es,de,pt,fr,pl,tr,nl,ja,ko,sv,da,no,fi) e ha
 * anche liste d'attesa LEGITTIME che non c'entrano nulla col Founder:
 * la beta chiusa Huawei Health Kit e la waitlist OAuth Garmin
 * (lib/providers/data.ts, tutte e 15 le locale). Per questo i verbi di
 * adesione generici ("iscriviti", "join", "tilmeld dig", "ilmoittaudu",
 * "bekleme listesi"...) fanno fallire il gate SOLO se la CTA e' legata al
 * Founder: label che nomina il Founder, oppure href verso /beta. Le frasi
 * che nominano gia' il Founder ("diventa founder", "founder werden",
 * "torne-se founder", ...) falliscono sempre, ovunque siano.
 *
 * ── LA DECISIONE ESPLICITA DELL'UTENTE SUL LINK D'ARCHIVIO ──
 * Matteo ha deciso in questo sprint che l'archivio /beta deve restare
 * RAGGIUNGIBILE: il link testuale neutro verso /beta (footer "Founder",
 * nav/menu "Beta") e' AMMESSO. Il guardrail lo permette e allo stesso tempo
 * vieta che quel link torni ad essere una CTA: vedi CLASSE C, che fallisce
 * se la label di un link verso /beta acquista un verbo di adesione o un
 * badge promozionale (gratis/nuovo/ultimi posti/emoji/animate-pulse/...),
 * e CLASSE B, che vieta un ctaHref verso /beta in qualunque caso (un campo
 * che si chiama "CTA" non puo' puntare a un archivio).
 *
 * ── LE 7 CLASSI DI VIOLAZIONE (a..g del mandato) ──
 *  a. form di adesione Founder/beta renderizzato da una pagina pubblica;
 *  b. CTA di acquisizione Founder (label di adesione in un link o in un
 *     campo ctaLabel);
 *  c. href/ctaHref verso /beta usato come CTA;
 *  d. contatore posti / "posti rimasti" / chiamate a /api/v1/beta/spots;
 *  e. "Pro a vita gratis" (e equivalenti) presentato come offerta CORRENTE;
 *  f. gate temporale nelle superfici statiche (<FounderClientGate>/
 *     <BetaFounderGate> renderizzati da una pagina pubblica, o Date.now()/
 *     setTimeout/setInterval usati per decidere se mostrare una superficie
 *     Founder);
 *  g. offerta Founder nel JSON-LD (Offer con availability/prezzo Founder).
 *
 * Le classi a ed f sono le uniche che usano la RAGGIUNGIBILITA': un form o
 * un gate contano solo se una pagina pubblica li renderizza davvero. Per
 * questo il file costruisce il grafo degli import a partire dalle pagine
 * pubbliche. BetaSignupForm.tsx, FounderClientGate.tsx e BetaFounderGate.tsx
 * restano nel repo (non e' codice da cancellare) ma NON devono essere
 * raggiungibili: se qualcuno li ri-collega a una pagina, il gate cade.
 * Le classi b..e,g sono sito-wide: una CTA di adesione non e' accettabile
 * nemmeno in un file oggi non renderizzato.
 */
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(__dirname, "..");
const errors: string[] = [];

// ─────────────────────────────────────────────────────────────────────────
// Inventario file
// ─────────────────────────────────────────────────────────────────────────
const SCAN_DIRS = ["app", "components", "lib"];
const SCAN_EXCLUDE_DIRS = new Set(["node_modules", ".next", ".git", "__snapshots__"]);

/**
 * Esclusioni motivate (percorsi relativi a repoRoot):
 *  - lib/founder/historical-note.ts: e' LA definizione della clausola
 *    storica invariante ("i primi 1000 ... ricevono il Pro a vita gratis"),
 *    usata da press/blog/landing/llms.txt. E' la fonte, non una superficie;
 *    il suo contenuto e' gia' verificato da founder:commercial-truth-check
 *    (check 6) e founder:metadata-invariant-check.
 *  - app/api/v1/beta/spots/route.ts: tombstone 404 statica, di competenza
 *    esclusiva di founder:counter-check (che la verifica riga per riga).
 */
const EXEMPT_FILES = new Set([
  "lib/founder/historical-note.ts",
  "app/api/v1/beta/spots/route.ts",
]);

function walk(dir: string, out: string[]) {
  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    if (SCAN_EXCLUDE_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, out);
      continue;
    }
    if (!/\.(ts|tsx|json)$/.test(entry.name)) continue;
    if (/\.(test|spec)\.tsx?$/.test(entry.name)) continue;
    out.push(full);
  }
}

const allFiles: string[] = [];
for (const dir of SCAN_DIRS) walk(path.join(repoRoot, dir), allFiles);

const rel = (full: string) => path.relative(repoRoot, full);
const scanned = allFiles.filter((f) => !EXEMPT_FILES.has(rel(f)));

// Il contenuto si legge per TUTTI i file, anche gli esenti: il grafo degli
// import deve poter attraversare un file esente, altrimenti tutto cio' che
// solo lui importa risulterebbe irraggiungibile per sbaglio. L'esenzione
// agisce sui CONTROLLI (scanned), non sulla lettura.
const contentOf = new Map<string, string>();
for (const f of allFiles) contentOf.set(f, fs.readFileSync(f, "utf8"));

/**
 * I commenti non vengono renderizzati: un controllo strutturale che li
 * legge produce solo falsi positivi (questo repo documenta a lungo, nei
 * commenti, proprio le CTA che ha rimosso). Il `//` viene tolto solo se non
 * preceduto da `:` per non spezzare gli URL dentro le stringhe.
 *
 * I commenti vengono SOSTITUITI CON SPAZI, non cancellati: cosi' ogni
 * offset resta identico a quello del file reale e le righe riportate negli
 * errori sono quelle che l'utente apre nell'editor. Cancellandoli, un file
 * con 60 righe di intestazione riportava violazioni decine di righe piu' su.
 */
function stripComments(src: string): string {
  const blank = (s: string) => s.replace(/[^\n]/g, " ");
  return src
    .replace(/\/\*[\s\S]*?\*\//g, blank)
    .replace(/(^|[^:\\])\/\/.*$/gm, (full, head: string) => head + blank(full.slice(head.length)));
}

const codeOf = new Map<string, string>();
for (const f of allFiles) codeOf.set(f, /\.json$/.test(f) ? contentOf.get(f)! : stripComments(contentOf.get(f)!));

function lineOf(content: string, index: number): number {
  return content.slice(0, index).split("\n").length;
}

// ─────────────────────────────────────────────────────────────────────────
// Lessico
// ─────────────────────────────────────────────────────────────────────────

/** Il programma Founder, nominato nelle 15 locale del sito. */
const FOUNDER_TOKEN_RE =
  /(founders?|fondator[ei]|fundador(?:es|as)?|gr[üu]nder(?:in)?|kurucu|za[łl]o[żz]yciel|grunnlegger|grundare|grundl[æa]gger|perustaja|ファウンダー|파운더)/i;

/**
 * Frasi che nominano gia' l'adesione al Founder: vietate ovunque, in
 * qualunque posizione azionabile, senza bisogno di guardare l'href.
 * Sono l'elenco del mandato, esteso alle 15 locale del sito.
 */
const FOUNDER_ADHESION_PHRASES: { label: string; re: RegExp }[] = [
  { label: "it — diventa founder", re: /divent(?:a|are)\s+(?:un\s+)?founder/i },
  { label: "it — voglio essere founder", re: /voglio\s+(?:essere|diventare)\s+(?:un\s+)?founder/i },
  { label: "it — programma fondatori", re: /programma\s+fondatori/i },
  { label: "en — become a founder", re: /becom(?:e|ing)\s+an?\s+founder/i },
  { label: "en — join the founder program", re: /join\s+the\s+founder/i },
  { label: "en — claim your founder", re: /claim\s+(?:your\s+)?founder/i },
  { label: "es — hazte founder", re: /(?:hazte|conviértete\s+en|conviertete\s+en)\s+(?:un\s+)?(?:founder|fundador)/i },
  { label: "de — founder werden", re: /(?:founder|gründer|grunder)\s*[-\s]?werden/i },
  { label: "pt — torne-se founder", re: /torne[-\s]se\s+(?:um\s+)?(?:founder|fundador)/i },
  { label: "fr — devenir founder", re: /(?:devenir|deviens|devenez)\s+(?:un\s+)?(?:founder|fondateur)/i },
  { label: "nl — word founder", re: /word\s+(?:nu\s+)?founder/i },
  { label: "pl — zostan founderem", re: /zosta[nń]\s+(?:founderem|za[łl]o[żz]ycielem)/i },
  { label: "tr — founder ol", re: /(?:founder|kurucu)\s+ol(?:un)?\b/i },
  { label: "sv — bli founder", re: /bli\s+(?:en\s+)?(?:founder|grundare)/i },
  { label: "da — bliv founder", re: /bliv\s+(?:en\s+)?(?:founder|grundlægger)/i },
  { label: "no — bli founder", re: /bli\s+(?:en\s+)?(?:founder|grunnlegger)/i },
  { label: "fi — ryhdy perustajaksi", re: /(?:ryhdy|liity)\s+perustaja/i },
  { label: "ja — ファウンダーになる", re: /ファウンダー(?:に|として)?\s*(?:なる|登録|参加)/ },
  { label: "ko — 파운더 되기/가입", re: /파운더\s*(?:되기|가입|신청|참여)/ },
];

/**
 * Verbi/formule di adesione GENERICI, nelle 15 locale. Da soli non provano
 * nulla: lib/providers/data.ts ha waitlist legittime (beta chiusa Huawei,
 * OAuth Garmin) che li usano. Fanno fallire il gate solo se la CTA e' legata
 * al Founder (label che nomina il Founder, o href verso /beta).
 */
const GENERIC_ADHESION_RE = new RegExp(
  [
    // it
    "iscriviti", "unisciti", "aderisci", "entra\\s+in\\s+beta", "partecipa\\s+alla\\s+beta", "lista\\s+d['’]attesa",
    // en
    "\\bjoin\\b", "sign\\s*up", "\\benroll\\b", "\\bwaitlist\\b", "waiting\\s+list", "get\\s+on\\s+the\\s+list",
    // es
    "[úu]nete", "ap[úu]ntate", "inscr[íi]bete", "reg[íi]strate", "lista\\s+de\\s+espera",
    // de
    "jetzt\\s+beitreten", "\\bbeitreten\\b", "anmelden", "eintragen", "warteliste",
    // pt
    "inscreva-se", "junte-se", "participe", "lista\\s+de\\s+espera",
    // fr
    "rejoign(?:ez|s|dre)", "inscri(?:vez-vous|s-toi)", "liste\\s+d['’]attente",
    // nl
    "meld\\s+je\\s+aan", "schrijf\\s+je\\s+in", "doe\\s+mee", "wachtlijst",
    // pl
    "do[łl][ąa]cz", "zapisz\\s+si[eę]", "lista\\s+oczekuj[ąa]cych",
    // tr
    "kaydol", "kat[ıi]l(?:[ıi]n)?", "bekleme\\s+listesi",
    // sv
    "anm[äa]l\\s+dig", "g[åa]\\s+med", "v[äa]ntelista",
    // da
    "tilmeld\\s+dig", "\\bdeltag\\b", "venteliste",
    // no
    "meld\\s+deg\\s+p[åa]", "bli\\s+med", "venteliste",
    // fi
    "ilmoittaudu", "\\bliity\\b", "jonotuslista", "odotuslista",
    // ja / ko
    "参加(?:する|しよう)", "登録(?:する|しよう)", "ウェイトリスト",
    "참여(?:하기|하세요)", "가입(?:하기|하세요)", "대기자\\s*명단",
  ].join("|"),
  "i",
);

/**
 * Badge/decorazioni promozionali che trasformano un link neutro d'archivio
 * in una promo. Il link "Founder" nel footer e "Beta" in nav/menu devono
 * restare TESTO NUDO (decisione esplicita di Matteo in questo sprint).
 */
const PROMO_BADGE_RE = new RegExp(
  [
    "\\bgratis\\b", "\\bfree\\b", "\\bkostenlos\\b", "gratuit", "gr[áa]tis", "gratuito",
    "za\\s*darmo", "[üu]cretsiz", "ilmainen", "무료", "無料",
    "\\bnuov[oa]\\b", "\\bnew\\b", "\\bneu\\b", "nouveau", "\\bnovo\\b", "\\bnuevo\\b",
    "ultimi\\s+post", "last\\s+chance", "solo\\s+per\\s+poco",
    "animate-pulse", "<Badge", "badge=", "🔥", "✨", "🎉", "⚡", "🚀",
  ].join("|"),
  "i",
);

/** Lessico "contatore posti" nelle 15 locale (classe d). */
const SEATS_COUNTER_RE = new RegExp(
  [
    "posti\\s+(?:rimasti|disponibili|liberi|residui)",
    "(?:seats|spots|places)\\s+(?:left|remaining|available)",
    "remaining\\s+(?:seats|spots)",
    "plazas\\s+(?:restantes|disponibles)",
    "(?:verbleibende\\s+)?pl[äa]tze(?:\\s+[üu]brig|\\s+frei)?",
    "places\\s+restantes",
    "vagas\\s+restantes",
    "plaatsen\\s+over",
    "miejsc\\s+(?:pozosta[łl]o|wolnych)",
    "kalan\\s+(?:yer|kontenjan)",
    "platser\\s+kvar",
    "pladser\\s+tilbage",
    "plasser\\s+igjen",
    "paikkaa\\s+j[äa]ljell[äa]",
    "残り(?:枠|席)", "남은\\s*(?:자리|좌석)",
  ].join("|"),
  "i",
);

/** "Pro a vita gratis" e equivalenti, 15 locale (classe e). */
const LIFETIME_FREE_RE = new RegExp(
  [
    "pro\\s+a\\s+vita\\s+(?:gratis|gratuito)",
    "(?:free\\s+)?lifetime\\s+pro\\s+free|lifetime\\s+pro\\s+free|free\\s+lifetime\\s+pro",
    "pro\\s+de\\s+por\\s+vida\\s+gratis",
    "pro\\s+(?:dauerhaft\\s+)?kostenlos|lebenslanges\\s+pro\\s+kostenlos",
    "pro\\s+vital[íi]cio\\s+gr[áa]tis",
    "pro\\s+[àa]\\s+vie\\s+gratuit(?:ement)?",
    "pro\\s+levenslang\\s+gratis|levenslang\\s+pro\\s+gratis",
    "pro\\s+do[żz]ywotnio\\s+za\\s+darmo",
    "[öo]m[üu]r\\s+boyu\\s+[üu]cretsiz\\s+pro",
    "pro\\s+p[åa]\\s+livstid\\s+gratis",
    "ikuinen\\s+pro\\s+ilmaiseksi",
    "永久\\s*pro\\s*無料|無料\\s*で\\s*永久\\s*pro",
    "평생\\s*pro\\s*무료",
  ].join("|"),
  "i",
);

/**
 * Verbi di acquisizione in SECONDA PERSONA (imperativo/tu-voi): il segnale
 * che l'offerta e' presentata come CORRENTE. Deliberatamente esclusi i
 * passati e le terze persone della prosa storica ("hanno ricevuto",
 * "ricevono", "got", "received"), che devono continuare a passare.
 *
 * Esclusi anche i SOSTANTIVI omografi: "unlock"/"sblocco a vita"/
 * "Freischaltung"/"desbloqueo" compaiono nel listino corrente ("un
 * abbonamento leggero oppure lo sblocco a vita") a poche parole dalla frase
 * storica sul Pro a vita gratis. Sono nomi di prodotto, non inviti: qui
 * "unlock" conta solo con un complemento in seconda persona.
 */
const ACQUIRE_VERB_RE = new RegExp(
  [
    "\\brichiedi\\b", "\\bricevi\\b", "\\bottieni\\b", "\\bprendi\\b", "\\bsblocca\\b", "\\battivalo\\b",
    "\\bget\\s+(?:your|yours|it)\\b", "\\bclaim\\b", "\\bgrab\\b", "\\bunlock\\s+(?:your|yours|it|now)\\b",
    "\\bconsigue\\b", "\\bobt[ée]n\\b", "\\bdesbloquea\\b",
    "\\bsichere?\\s+dir\\b", "\\bhol\\s+dir\\b",
    "\\bobtenha\\b", "\\bgaranta\\b", "\\bdesbloqueie\\b",
    "\\bobtenez\\b", "\\bprofitez\\b", "\\bd[ée]bloquez\\b",
    "\\bkrijg\\b", "\\bpak\\s+je\\b", "\\bontgrendel\\b",
    "\\bodbierz\\b", "\\bzgarnij\\b", "\\bodblokuj\\b",
    "\\bhemen\\s+(?:al|kap)\\b", "\\bkap[ıi]n\\b",
    "\\bs[äa]kra\\s+din\\b", "\\bf[åa]\\s+din(?:t|n)?\\b", "\\bhanki\\b",
    "受け取(?:ろう|ってください)", "받으세요",
  ].join("|"),
  "i",
);

// ─────────────────────────────────────────────────────────────────────────
// Grafo degli import a partire dalle pagine pubbliche (classi a, f)
// ─────────────────────────────────────────────────────────────────────────

/**
 * Radici = i file che Next.js renderizza per un visitatore anonimo.
 * `app/(frontend)/[locale]/admin/**` e' escluso deliberatamente: e' il
 * back-office di Matteo, non una superficie di acquisizione pubblica (ha
 * una tabella beta_signups che nominerebbe "beta" ovunque). L'area
 * `[locale]/app/**` resta DENTRO: e' post-login ma pur sempre un posto dove
 * un form di adesione Founder sarebbe una superficie di acquisizione.
 */
const PUBLIC_ROOT_RE = /^app\/\(frontend\)\/.*\/(page|layout|template|not-found|error)\.tsx$/;
const ADMIN_AREA_RE = /^app\/\(frontend\)\/\[locale\]\/admin\//;

const publicRoots = scanned.filter((f) => {
  const r = rel(f);
  return PUBLIC_ROOT_RE.test(r) && !ADMIN_AREA_RE.test(r);
});

const IMPORT_RE = /(?:import|export)\s[^;]*?from\s*["']([^"']+)["']|import\s*\(\s*["']([^"']+)["']\s*\)/g;
const RESOLVE_EXTS = ["", ".ts", ".tsx", ".json", "/index.ts", "/index.tsx"];

function resolveImport(fromFile: string, spec: string): string | null {
  let base: string;
  if (spec.startsWith("@/")) base = path.join(repoRoot, spec.slice(2));
  else if (spec.startsWith("./") || spec.startsWith("../")) base = path.resolve(path.dirname(fromFile), spec);
  else return null; // pacchetto npm
  for (const ext of RESOLVE_EXTS) {
    const candidate = base + ext;
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) return candidate;
  }
  return null;
}

const reachable = new Set<string>();
const queue = [...publicRoots];
while (queue.length > 0) {
  const file = queue.pop()!;
  if (reachable.has(file)) continue;
  reachable.add(file);
  const src = contentOf.get(file);
  if (src === undefined) continue;
  IMPORT_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = IMPORT_RE.exec(src)) !== null) {
    const spec = m[1] ?? m[2];
    if (!spec) continue;
    const target = resolveImport(file, spec);
    if (target && contentOf.has(target) && !reachable.has(target)) queue.push(target);
  }
}

// ─────────────────────────────────────────────────────────────────────────
// Estrattori di POSIZIONI AZIONABILI
// ─────────────────────────────────────────────────────────────────────────

type CtaSlot = {
  file: string;
  line: number;
  /** testo mostrato all'utente (o l'espressione JSX che lo produce) */
  label: string;
  /** destinazione, se ricavabile */
  href: string;
  /** come e' stato trovato, per il messaggio d'errore */
  kind: string;
};

/**
 * Le label JSX spesso sono espressioni ({dict.nav.download}). Risolverle
 * contro i dizionari e' l'unico modo di vedere davvero cosa legge l'utente
 * nelle 15 locale: senza questo, bastava spostare la CTA in un dizionario
 * per aggirare il gate.
 */
const dictionaries: Record<string, unknown>[] = [];
for (const f of scanned) {
  if (!/^lib\/dictionaries\/[a-z]{2}\.json$/.test(rel(f))) continue;
  try {
    dictionaries.push(JSON.parse(contentOf.get(f)!));
  } catch {
    /* un dizionario illeggibile e' problema di un altro guardrail */
  }
}

function dictLookup(pathExpr: string): string[] {
  const parts = pathExpr.split(".").slice(1); // scarta "dict"
  const out: string[] = [];
  for (const d of dictionaries) {
    let cur: unknown = d;
    for (const p of parts) {
      if (cur && typeof cur === "object" && p in (cur as Record<string, unknown>)) cur = (cur as Record<string, unknown>)[p];
      else {
        cur = undefined;
        break;
      }
    }
    if (typeof cur === "string") out.push(cur);
  }
  return out;
}

const DICT_EXPR_RE = /\bdict(?:\.[A-Za-z0-9_]+)+/g;

function expandLabel(raw: string): string {
  let out = raw;
  DICT_EXPR_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = DICT_EXPR_RE.exec(raw)) !== null) out += " " + dictLookup(m[0]).join(" ");
  return out;
}

const slots: CtaSlot[] = [];

// ── (1) link JSX: <Link ...>label</Link>, <a ...>label</a> ───────────────
const JSX_LINK_RE = /<(Link|a)\b([^>]*)>([\s\S]{0,600}?)<\/\1>/g;
for (const file of scanned) {
  if (/\.json$/.test(file)) continue;
  const code = codeOf.get(file)!;
  JSX_LINK_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = JSX_LINK_RE.exec(code)) !== null) {
    slots.push({
      file,
      line: lineOf(code, m.index),
      label: expandLabel(m[3]),
      href: m[2],
      kind: `<${m[1]}>`,
    });
  }
}

// ── (2) link markdown nella prosa: [label](/it/beta) ─────────────────────
const MD_LINK_RE = /\[([^\]\n]{1,120})\]\(([^)\s]{1,200})\)/g;
for (const file of scanned) {
  const src = codeOf.get(file)!;
  MD_LINK_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = MD_LINK_RE.exec(src)) !== null) {
    slots.push({ file, line: lineOf(src, m.index), label: m[1], href: m[2], kind: "link markdown" });
  }
}

/** Ritaglia il blocco `{ ... }` bilanciato che inizia a `open`. */
function braceBlock(src: string, open: number): string {
  let depth = 0;
  for (let i = open; i < src.length && i < open + 20000; i++) {
    if (src[i] === "{") depth++;
    else if (src[i] === "}") {
      depth--;
      if (depth === 0) return src.slice(open, i + 1);
    }
  }
  return src.slice(open, Math.min(src.length, open + 2000));
}

// ── (3) campi CTA per nome negli oggetti .ts (ctaLabel/ctaHref/*Cta) ─────
const CTA_FIELD_RE = /\b(ctaLabel|ctaHref|primaryCta|secondaryCta)\s*:\s*/g;
for (const file of scanned) {
  if (/\.json$/.test(file)) continue;
  const code = codeOf.get(file)!;
  CTA_FIELD_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = CTA_FIELD_RE.exec(code)) !== null) {
    const valueStart = m.index + m[0].length;
    const value = code[valueStart] === "{" ? braceBlock(code, valueStart) : code.slice(valueStart, valueStart + 400);
    // ctaLabel e ctaHref sono fratelli: la finestra successiva contiene la
    // destinazione della stessa CTA.
    const region = code.slice(m.index, Math.min(code.length, m.index + value.length + 900));
    slots.push({ file, line: lineOf(code, m.index), label: value, href: region, kind: `campo ${m[1]}` });
  }
}

// ── (4) campi CTA nei .json di overlay (il buco storico) ─────────────────
const JSON_CTA_KEY_RE = /(^|\.)(ctaLabel|ctaHref|cta|primaryCta|secondaryCta)(\.|$)|(^|\.)(label|href)$/i;

type JsonEntry = { file: string; keyPath: string; value: string };
const jsonEntries: JsonEntry[] = [];

function walkJson(file: string, node: unknown, keyPath: string) {
  if (typeof node === "string") {
    jsonEntries.push({ file, keyPath, value: node });
    return;
  }
  if (Array.isArray(node)) {
    node.forEach((child, i) => walkJson(file, child, `${keyPath}.${i}`));
    return;
  }
  if (node && typeof node === "object") {
    for (const [k, v] of Object.entries(node as Record<string, unknown>)) walkJson(file, v, keyPath ? `${keyPath}.${k}` : k);
  }
}

const jsonFiles = scanned.filter((f) => /\.json$/.test(f));
for (const file of jsonFiles) {
  try {
    walkJson(file, JSON.parse(contentOf.get(file)!), "");
  } catch {
    errors.push(`${rel(file)}: JSON non parsabile — il guardrail non puo' verificarlo, correggi il file.`);
  }
}

for (const e of jsonEntries) {
  // Le chiavi degli overlay sono "piatte" e contengono i punti dentro il
  // nome ("body.3.ctaLabel"), quindi il match va fatto sull'intero keyPath.
  if (!JSON_CTA_KEY_RE.test(e.keyPath)) continue;
  // Il localizzatore autorevole e' il keyPath (unico nel file); la riga e'
  // un aiuto: si cerca il valore codificato a partire dall'inizio del suo
  // slug, cosi' due slug con la stessa CTA non si confondono.
  const src = contentOf.get(e.file)!;
  const slugStart = Math.max(0, src.indexOf(`"${e.keyPath.split(".")[0]}"`));
  const idx = src.indexOf(JSON.stringify(e.value), slugStart);
  slots.push({
    file: e.file,
    line: idx >= 0 ? lineOf(src, idx) : 1,
    label: e.value,
    href: e.value,
    kind: `chiave JSON "${e.keyPath}"`,
  });
}

// ─────────────────────────────────────────────────────────────────────────
// CLASSE b — CTA di acquisizione Founder
// CLASSE c — href/ctaHref verso /beta usato come CTA
// ─────────────────────────────────────────────────────────────────────────
const BETA_HREF_RE = /\/(?:\$\{[^}]*\}|[a-z]{2})\/beta\b|["'`]\/beta\b|\/api\/v1\/beta\/signup/;
const CTA_FIELD_KIND_RE = /campo (ctaHref|ctaLabel|primaryCta|secondaryCta)|chiave JSON/;

for (const s of slots) {
  const r = rel(s.file);
  const label = s.label;
  const pointsToBeta = BETA_HREF_RE.test(s.href) || BETA_HREF_RE.test(label);

  // b.1 — frase che nomina gia' l'adesione Founder: vietata sempre.
  for (const { label: name, re } of FOUNDER_ADHESION_PHRASES) {
    if (!re.test(label)) continue;
    errors.push(
      `[b] ${r}:${s.line} — ${s.kind} con label di adesione Founder (${name}): "${label.trim().replace(/\s+/g, " ").slice(0, 90)}". Il sito e' post-Founder: nessuna superficie pubblica puo' invitare ad aderire.`,
    );
  }

  // b.2 — verbo di adesione generico, ma legato al Founder (label che
  // nomina il Founder o destinazione /beta). Senza questo vincolo il gate
  // colpirebbe le waitlist legittime Garmin/Huawei di lib/providers/data.ts.
  if (GENERIC_ADHESION_RE.test(label) && (FOUNDER_TOKEN_RE.test(label) || pointsToBeta)) {
    errors.push(
      `[b] ${r}:${s.line} — ${s.kind} di adesione legata al programma Founder: "${label.trim().replace(/\s+/g, " ").slice(0, 90)}". Verbo di adesione + contesto Founder/href /beta = CTA di acquisizione.`,
    );
  }

  // c.1 — un campo che si CHIAMA "CTA" non puo' puntare all'archivio.
  if (CTA_FIELD_KIND_RE.test(s.kind) && pointsToBeta) {
    errors.push(
      `[c] ${r}:${s.line} — ${s.kind} punta a /beta. /beta e' l'archivio storico (noindex), non una destinazione di conversione: un campo CTA non deve puntarci.`,
    );
  }

  // c.2 — DECISIONE ESPLICITA DELL'UTENTE (Sprint P0.10K): il link
  // TESTUALE NEUTRO verso /beta e' AMMESSO — l'archivio deve restare
  // raggiungibile (footer "Founder", nav/menu "Beta"). Quello che NON e'
  // ammesso e' che quel link torni ad avere una label di adesione (gia'
  // coperta da b.1/b.2 sopra) o un badge promozionale.
  if (!CTA_FIELD_KIND_RE.test(s.kind) && pointsToBeta && PROMO_BADGE_RE.test(label)) {
    errors.push(
      `[c] ${r}:${s.line} — il link verso /beta ha un badge/decorazione promozionale: "${label.trim().replace(/\s+/g, " ").slice(0, 90)}". Il link d'archivio e' ammesso solo come testo neutro (decisione esplicita di Matteo in questo sprint), mai come promo.`,
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────
// CLASSE a — form di adesione renderizzato da una pagina pubblica
// CLASSE f — gate temporale su una superficie statica
// ─────────────────────────────────────────────────────────────────────────
/**
 * Il nome del componente si cattura INTERO e si filtra dopo, invece di
 * cercare "Beta"/"Founder" dentro il pattern: `[A-Z][A-Za-z0-9]*(?:Beta|
 * Founder)` non puo' matchare proprio i nomi che COMINCIANO con Beta o
 * Founder (la `[A-Z]` iniziale si mangia la B di BetaSignupForm e il gruppo
 * non ha piu' dove agganciarsi). Trovato con il test negativo di FASE 9:
 * <BetaSignupForm> reintrodotto su /beta non faceva fallire il gate.
 */
const SIGNUP_COMPONENT_RE = /<\s*([A-Z][A-Za-z0-9]*)\b/g;
const FOUNDER_COMPONENT_RE = /(Beta|Founder)/;
const SIGNUP_NAME_RE = /(Signup|SignUp|Subscribe|Form|Join|Waitlist)/;
const SIGNUP_ENDPOINT_RE = /["'`][^"'`]*\/api\/v1\/beta\/signup/;
const GATE_RE = /<\s*(FounderClientGate|BetaFounderGate)\b/;
const TIME_API_RE = /Date\.now\s*\(|new\s+Date\s*\(|setTimeout\s*\(|setInterval\s*\(/g;
/**
 * Il <form> si valuta sul PROPRIO blocco (piu' un breve cappello che lo
 * introduce), non su una finestra larga attorno: l'area post-login ha un
 * form di logout a poche righe dal ramo `isFounder` che mostra il banner di
 * recensione ai Founder gia' concessi. Sono cose diverse, e una finestra
 * larga le confonderebbe.
 */
const FORM_BLOCK_RE = /<form[\s>][\s\S]{0,4000}?<\/form>/gi;
const FORM_HEAD = 200;
const TIME_WINDOW = 500;

for (const file of reachable) {
  const r = rel(file);
  if (EXEMPT_FILES.has(r)) continue;
  const code = codeOf.get(file);
  if (code === undefined) continue;

  // a.1 — componente di signup Founder/beta renderizzato
  SIGNUP_COMPONENT_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = SIGNUP_COMPONENT_RE.exec(code)) !== null) {
    if (!FOUNDER_COMPONENT_RE.test(m[1]) || !SIGNUP_NAME_RE.test(m[1])) continue;
    errors.push(
      `[a] ${r}:${lineOf(code, m.index)} — <${m[1]}> e' renderizzato da una pagina pubblica (raggiungibile dal grafo degli import). Il modulo di adesione Founder/beta resta nel repo ma non deve avere alcun punto di rendering pubblico.`,
    );
  }

  // a.2 — POST diretto all'endpoint di iscrizione
  if (SIGNUP_ENDPOINT_RE.test(code)) {
    errors.push(`[a] ${r} — chiama /api/v1/beta/signup da una superficie pubblica: e' un form di adesione, comunque sia presentato.`);
  }

  // a.3 — <form> generico in un contesto Founder/beta
  FORM_BLOCK_RE.lastIndex = 0;
  while ((m = FORM_BLOCK_RE.exec(code)) !== null) {
    const w = code.slice(Math.max(0, m.index - FORM_HEAD), m.index) + m[0];
    if (!FOUNDER_TOKEN_RE.test(w) && !/\bbeta\b/i.test(w)) continue;
    errors.push(
      `[a] ${r}:${lineOf(code, m.index)} — <form> in un contesto Founder/beta su una pagina pubblica. L'archivio /beta e le superfici commerciali non devono contenere alcun modulo di adesione.`,
    );
  }

  // f.1 — gate client-side ri-collegato a una superficie pubblica
  if (GATE_RE.test(code)) {
    errors.push(
      `[f] ${r} — renderizza <FounderClientGate>/<BetaFounderGate> da una pagina pubblica. Le superfici sono statiche e permanenti: un gate che decide sull'orologio del browser ri-esporrebbe l'adesione.`,
    );
  }

  // f.2 — decisione temporale accanto a contenuto Founder
  TIME_API_RE.lastIndex = 0;
  while ((m = TIME_API_RE.exec(code)) !== null) {
    const w = code.slice(Math.max(0, m.index - TIME_WINDOW), Math.min(code.length, m.index + TIME_WINDOW));
    if (!FOUNDER_TOKEN_RE.test(w)) continue;
    errors.push(
      `[f] ${r}:${lineOf(code, m.index)} — "${m[0]}" a meno di ${TIME_WINDOW} caratteri da contenuto Founder, su una superficie pubblica. Nessuna superficie statica deve decidere sull'orologio se mostrare qualcosa di Founder.`,
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────
// CLASSE d — contatore posti / endpoint /api/v1/beta/spots
// ─────────────────────────────────────────────────────────────────────────
const SPOTS_FETCH_RE = /(?:fetch|axios(?:\.[a-z]+)?|useSWR|useQuery|request)\s*\(\s*[^)]{0,160}\/api\/v1\/beta\/spots/g;
const COUNTER_NUMBER_RE = /\d|\{[^}]{1,60}\}|\$\{/;
const SEATS_TOTAL_RE = /\b\d{1,4}\s*(?:\/|su|of|von|de|av|af|\/)\s*1[.,]?000\b/g;

for (const file of scanned) {
  const r = rel(file);
  const code = codeOf.get(file)!;

  SPOTS_FETCH_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = SPOTS_FETCH_RE.exec(code)) !== null) {
    errors.push(
      `[d] ${r}:${lineOf(code, m.index)} — chiamata a /api/v1/beta/spots. L'endpoint e' una tombstone 404: nessuna superficie deve interrogarlo, ne' mostrare un conteggio di posti Founder.`,
    );
  }

  // Il lessico "posti rimasti" da solo non basta: la prosa d'archivio lo usa
  // legittimamente in negativo ("il numero di posti rimasti non e' mai stato
  // pubblicato"). Il segnale di un contatore VERO e' il numero (o il
  // placeholder) accanto.
  const seatsRe = new RegExp(SEATS_COUNTER_RE.source, "gi");
  while ((m = seatsRe.exec(code)) !== null) {
    const near = code.slice(Math.max(0, m.index - 25), Math.min(code.length, m.index + m[0].length + 25));
    if (!COUNTER_NUMBER_RE.test(near)) continue;
    const wide = code.slice(Math.max(0, m.index - 200), Math.min(code.length, m.index + 200));
    if (!FOUNDER_TOKEN_RE.test(wide) && !/\bbeta\b/i.test(wide)) continue;
    errors.push(
      `[d] ${r}:${lineOf(code, m.index)} — contatore posti Founder ("${m[0]}" con un valore accanto). Il conteggio pubblico e' stato rimosso perche' non riconciliato coi grant reali: non deve tornare in nessuna forma.`,
    );
  }

  SEATS_TOTAL_RE.lastIndex = 0;
  while ((m = SEATS_TOTAL_RE.exec(code)) !== null) {
    const wide = code.slice(Math.max(0, m.index - 200), Math.min(code.length, m.index + 200));
    if (!FOUNDER_TOKEN_RE.test(wide)) continue;
    errors.push(
      `[d] ${r}:${lineOf(code, m.index)} — conteggio "${m[0]}" su un totale di 1000 posti Founder: e' un contatore, vietato.`,
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────
// CLASSE e — "Pro a vita gratis" presentato come offerta CORRENTE
// ─────────────────────────────────────────────────────────────────────────
for (const s of slots) {
  if (!LIFETIME_FREE_RE.test(s.label)) continue;
  errors.push(
    `[e] ${rel(s.file)}:${s.line} — ${s.kind} promette il Pro a vita gratis: "${s.label.trim().replace(/\s+/g, " ").slice(0, 90)}". In una posizione cliccabile e' un'offerta corrente, e l'offerta non esiste piu'.`,
  );
}

const OFFER_WINDOW = 90;
for (const file of scanned) {
  const r = rel(file);
  const code = codeOf.get(file)!;
  const re = new RegExp(LIFETIME_FREE_RE.source, "gi");
  let m: RegExpExecArray | null;
  while ((m = re.exec(code)) !== null) {
    const w = code.slice(Math.max(0, m.index - OFFER_WINDOW), Math.min(code.length, m.index + m[0].length + OFFER_WINDOW));
    if (!ACQUIRE_VERB_RE.test(w)) continue;
    errors.push(
      `[e] ${r}:${lineOf(code, m.index)} — "${m[0]}" con un verbo di acquisizione in seconda persona a fianco: e' un'offerta presentata come corrente. La prosa storica ("hanno ricevuto il Pro a vita gratis") e' legittima, l'invito ("ricevi il Pro a vita gratis") no.`,
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────
// CLASSE g — offerta Founder nel JSON-LD
// ─────────────────────────────────────────────────────────────────────────
const JSONLD_OFFER_RE = /["']?@type["']?\s*:\s*["']Offer["']/g;
const OFFERS_PROP_RE = /["']?offers["']?\s*:\s*[{[]/g;
const JSONLD_WINDOW = 400;

for (const file of scanned) {
  const r = rel(file);
  const code = codeOf.get(file)!;
  for (const [reSrc, what] of [
    [JSONLD_OFFER_RE.source, 'un nodo JSON-LD "@type": "Offer"'],
    [OFFERS_PROP_RE.source, "una proprieta' JSON-LD `offers`"],
  ] as const) {
    const re = new RegExp(reSrc, "g");
    let m: RegExpExecArray | null;
    while ((m = re.exec(code)) !== null) {
      const w = code.slice(m.index, Math.min(code.length, m.index + JSONLD_WINDOW));
      if (!FOUNDER_TOKEN_RE.test(w)) continue;
      errors.push(
        `[g] ${r}:${lineOf(code, m.index)} — ${what} descrive un'offerta Founder (prezzo/availability). I dati strutturati sono machine-readable e finiscono nei rich result: non devono pubblicizzare un'offerta chiusa.`,
      );
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────
// Esito
// ─────────────────────────────────────────────────────────────────────────
if (errors.length > 0) {
  console.error(`❌ founder:acquisition-surfaces-check FALLITO — ${errors.length} superficie/i pubblica/e di acquisizione Founder:\n`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}

console.log(
  `✅ founder:acquisition-surfaces-check: zero superfici pubbliche di acquisizione Founder — ${scanned.length} file scansionati in app/components/lib (${jsonFiles.length} .json inclusi: overlay nordico/spagnolo e dizionari), ${slots.length} posizioni azionabili (link JSX, link markdown, campi ctaLabel/ctaHref/primaryCta/secondaryCta), ${reachable.size} file raggiungibili da ${publicRoots.length} pagine pubbliche (zero form di adesione, zero gate temporale). Link testuale neutro verso l'archivio /beta ammesso per decisione esplicita.`,
);
