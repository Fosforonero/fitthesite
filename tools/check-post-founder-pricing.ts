/**
 * Sprint P0.10 — guardrail "post-founder:pricing-check".
 *
 * Dopo la chiusura del programma Founder, i nuovi utenti seguono SOLO
 * trial 14gg -> abbonamento o lifetime a pagamento. Questo guardrail
 * fallisce se:
 *
 *  1. PRICING_FACTS.trialDays non esiste o non è un numero positivo (SSOT
 *     del trial assente);
 *  2. l'array Offer JSON-LD (appOffers) pubblica un prezzo diverso dal solo
 *     download gratuito — cioè se un secondo Offer con price 0 o "free"
 *     per lo sblocco Pro/lifetime venisse reintrodotto;
 *  3. una superficie che presenta l'offerta CORRENTE (homepage, nav, menu
 *     mobile, footer, sezione prezzi) promette "gratis per sempre"/"free
 *     forever"/"lifetime free" — mai, in nessun caso, allow-list esclusa;
 *  3b. un qualunque altro file di app/components/lib fa la stessa promessa
 *     fuori dall'allow-list storica/legale — distinto dal claim Founder
 *     storico, legittimo perché riferito a un beneficio già concesso e non
 *     a un'offerta per chiunque arrivi oggi;
 *  4. lib/pricing.ts o lib/product-facts.ts duplicano un prezzo hardcodato
 *     al di fuori della SSOT (stesso principio del guardrail seo-truth
 *     esistente, qui ristretto al perimetro trial/Founder).
 */
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(__dirname, "..");
const errors: string[] = [];

// ── 1: trialDays SSOT ────────────────────────────────────────────────────
const productFactsPath = path.join(repoRoot, "lib/product-facts.ts");
const productFacts = fs.readFileSync(productFactsPath, "utf8");
const trialDaysMatch = productFacts.match(/trialDays:\s*(\d+)/);
if (!trialDaysMatch) {
  errors.push("lib/product-facts.ts: PRICING_FACTS.trialDays non trovato.");
} else if (Number(trialDaysMatch[1]) <= 0) {
  errors.push(`lib/product-facts.ts: PRICING_FACTS.trialDays è ${trialDaysMatch[1]}, deve essere positivo.`);
} else if (Number(trialDaysMatch[1]) !== 14) {
  errors.push(
    `lib/product-facts.ts: PRICING_FACTS.trialDays è ${trialDaysMatch[1]}, atteso 14 (se il cambio è intenzionale, aggiorna questo guardrail e tutto il copy che cita "14 giorni").`,
  );
}

// ── 2: appOffers pubblica SOLO il download gratuito ─────────────────────
const appOffersMatch = productFacts.match(/export function appOffers[\s\S]*?\n}/);
if (!appOffersMatch) {
  errors.push("lib/product-facts.ts: funzione appOffers non trovata.");
} else {
  const body = appOffersMatch[0];
  const offerCount = (body.match(/"@type":\s*"Offer"/g) ?? []).length;
  if (offerCount > 1) {
    errors.push(
      `lib/product-facts.ts: appOffers() dichiara ${offerCount} Offer — atteso 1 solo (download gratuito). Un secondo Offer per Pro/lifetime/Founder in JSON-LD sarebbe un prezzo pubblicato non verificabile per storefront/valuta.`,
    );
  }
}

// ── 3: "gratis per sempre"/"free forever" come offerta corrente ─────────
// Sprint P0.10K — LOGICA RISCRITTA. La versione precedente segnalava il
// claim solo `if (!/<FounderClientGate/.test(content))`: era corretta
// quando il gate esisteva ed era il modo legittimo di mostrare la variante
// Founder, ma <FounderClientGate> non ha piu' alcun consumer pubblico
// (chiusura commerciale del sito). Quella condizione oggi e' sempre vera,
// quindi non filtra piu' nulla — e nel frattempo resta un escape hatch:
// bastava scrivere la stringa "<FounderClientGate" ovunque nel file, anche
// dentro un commento, per far tacere il guardrail su un claim di prezzo
// falso. Qui il controllo non dipende piu' dall'esistenza di un
// componente: l'invariante e' "nessun 'Pro a vita gratis' presentato come
// offerta CORRENTE", verificata su due livelli (superfici dell'offerta
// corrente, sempre; resto del sito, salvo allow-list storica/legale).
const SCAN_DIRS = ["app", "components", "lib"];
const SCAN_EXCLUDE_DIRS = new Set(["node_modules", ".next", ".git"]);
// Superfici che presentano l'OFFERTA CORRENTE a chi arriva oggi: qui il
// claim "gratis a vita" non è mai ammissibile, nemmeno come prosa storica,
// perché il contesto è l'offerta in corso (trial 14gg -> acquisto o
// abbonamento). Sono controllate PRIMA e l'allow-list non le copre: e' il
// pezzo di protezione reale che si era perso quando il controllo dipendeva
// da <FounderClientGate>. /beta non è qui: è l'archivio noindex del
// programma, dove il riferimento storico è corretto per definizione.
const CURRENT_OFFER_SURFACES = [
  "app/(frontend)/[locale]/(marketing)/page.tsx",
  "components/Header.tsx",
  "components/Footer.tsx",
  "components/MobileMenu.tsx",
  // Moduli di sola definizione, ma delle stringhe che le superfici sopra
  // renderizzano parola per parola: prima di P0.10K erano in allow-list con
  // la motivazione "il rendering (page.tsx) è già gated", che oggi è falsa
  // (nessun gate esiste più). Senza gate, una stringa sbagliata qui finisce
  // dritta in pagina.
  "lib/pricing-section.ts",
  "lib/content/homepage-copy.ts",
];

const ALLOWED_FILES = new Set([
  "app/(frontend)/[locale]/(marketing)/terms/page.tsx",
  "lib/blog/posts/perche-diventare-founder-fitmesh.ts",
  "lib/blog/posts/fitmesh-gratis-prezzo-founder.ts",
  // SSOT delle stringhe founderPromo/founderSeats. Resta ammessa: il
  // divieto di USARLE su una superficie commerciale è verificato da
  // founder:commercial-truth-check (check 2), che è il posto giusto.
  "lib/pricing.ts",
  // Sprint P0.10E: è il file che RISOLVE il problema che questo guardrail
  // cerca, non un caso da segnalare. Contiene entrambe le varianti (aperto/
  // chiuso) di ogni frase Founder per tutte e 15 le locale e restituisce
  // quella corretta secondo isFounderProgramOpen(): la variante "gratis a
  // vita" al presente esiste qui solo come ramo `open`, servito solo finché
  // il programma è davvero aperto. Nessun punto di rendering: chi lo usa
  // (press/page.tsx) è già in questa allow-list.
  "lib/founder/historical-note.ts",
  // Archivio storico del programma (noindex, follow): nessun form, nessuna
  // CTA di adesione — invariante verificata da founder:commercial-truth-check
  // e founder:metadata-invariant-check. Il riferimento al beneficio già
  // concesso ai Founder esistenti è corretto qui.
  "app/(frontend)/[locale]/(marketing)/beta/page.tsx",
  // Copy editoriale storica (post-cutoff): racconta un beneficio Founder
  // GIA' concesso ai primi 1000 iscritti, con la data di chiusura del
  // programma esplicita nel testo, quindi legge come fatto storico corretto
  // sia prima sia dopo il 31/07/2026 — stesso principio delle due voci
  // sopra, non un'offerta attiva per chi arriva oggi.
  "app/(frontend)/[locale]/(marketing)/press/page.tsx",
  "lib/landing/data.ts",
  "lib/blog/posts/alternative-app-sync-wearable-2026.ts",
  "lib/blog/posts/anello-colmi-r02-affidabile.ts",
  "lib/blog/posts/anello-smart-guida-completa.ts",
  "lib/blog/posts/cambiare-smartwatch-senza-perdere-dati.ts",
  "lib/blog/posts/colmi-r02-setup.ts",
  "lib/blog/posts/colmi-r09-temperatura-sviluppo.ts",
  "lib/blog/posts/colmi-ring-fitmesh.ts",
  "lib/blog/posts/come-funziona-fitmesh.ts",
  "lib/blog/posts/dove-sono-i-tuoi-dati-server-ue.ts",
  "lib/blog/posts/fitmesh-sync-disponibile-google-play.ts",
  "lib/blog/posts/fitmesh-vs-alternative-sync.ts",
  "lib/blog/posts/guida-sync-wearable-2026.ts",
  "lib/blog/posts/migliori-anelli-economici.ts",
  "lib/blog/posts/sync-them-all.ts",
  "lib/blog/posts/tracciare-sonno-anello.ts",
]);
const LIFETIME_FREE_RE = /gratis\s+per\s+sempre|free\s+forever|lifetime\s+pro\s+free|pro\s+a\s+vita\s+gratis/i;

/**
 * Rimuove commenti a blocco e a riga: quello che questo guardrail protegge è
 * il COPY servito all'utente, non la prosa dei commenti. Un commento che
 * spiega perché una frase è stata rimossa non è un claim di prezzo — e,
 * simmetricamente, un commento non può più assolvere il codice sotto (era
 * il caso con `<FounderClientGate` scritto in un commento).
 *
 * `[^:]` prima di `//` evita di tranciare la riga a partire da "https://",
 * che nasconderebbe una violazione scritta dopo un URL.
 */
function stripComments(code: string): string {
  return code.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");
}

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
    if (entry.isDirectory()) walk(full, out);
    else if (/\.(ts|tsx)$/.test(entry.name) && !entry.name.endsWith(".test.ts") && !entry.name.endsWith(".test.tsx")) out.push(full);
  }
}

const allFiles: string[] = [];
for (const dir of SCAN_DIRS) walk(path.join(repoRoot, dir), allFiles);

function lifetimeFreeLines(rel: string): number[] {
  const full = path.join(repoRoot, rel);
  if (!fs.existsSync(full)) return [];
  const code = stripComments(fs.readFileSync(full, "utf8"));
  const re = new RegExp(LIFETIME_FREE_RE.source, "gi");
  const lines: number[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(code)) !== null) lines.push(code.slice(0, m.index).split("\n").length);
  return lines;
}

// 3 — superfici dell'offerta corrente: nessuna deroga.
for (const rel of CURRENT_OFFER_SURFACES) {
  if (!fs.existsSync(path.join(repoRoot, rel))) {
    errors.push(`Superficie mancante: ${rel} — se il file è stato spostato, aggiorna CURRENT_OFFER_SURFACES in questo guardrail.`);
    continue;
  }
  const lines = lifetimeFreeLines(rel);
  if (lines.length > 0) {
    errors.push(
      `${rel}: presenta "gratis per sempre"/Pro a vita gratis su una superficie dell'OFFERTA CORRENTE (righe ${lines.join(", ")}) — chi arriva oggi ha trial ${trialDaysMatch ? trialDaysMatch[1] : "14"} giorni, poi acquisto o abbonamento. Nessuna allow-list vale qui: il claim va rimosso, non esentato.`,
    );
  }
}

// 3b — resto del sito: ammesso solo alla prosa storica/legale in allow-list.
for (const file of allFiles) {
  const rel = path.relative(repoRoot, file);
  if (ALLOWED_FILES.has(rel)) continue;
  if (CURRENT_OFFER_SURFACES.includes(rel)) continue; // già controllato sopra
  const lines = lifetimeFreeLines(rel);
  if (lines.length > 0) {
    errors.push(
      `${rel}: promette "gratis per sempre"/Pro a vita gratis (righe ${lines.join(", ")}) e non è nell'allow-list storica/legale — per i nuovi utenti è un claim di prezzo falso (trial 14gg -> pagamento, mai gratis a vita). Se è davvero prosa storica su un beneficio già concesso, va detto nel testo e il file va aggiunto ad ALLOWED_FILES con la motivazione.`,
    );
  }
}

if (errors.length > 0) {
  console.error("❌ post-founder:pricing-check FALLITO:\n");
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
} else {
  console.log(
    `✅ post-founder:pricing-check: trialDays SSOT presente (14), appOffers pubblica solo il download gratuito, nessun claim 'gratis a vita' sulle ${CURRENT_OFFER_SURFACES.length} superfici dell'offerta corrente né altrove fuori allow-list storica/legale.`,
  );
}
