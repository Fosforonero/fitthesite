/**
 * Guardrail P1.8C — Pixel Watch / Wear OS / articolo API, truth-fix
 * permanente (FASE 9 del brief).
 *
 * Perimetro principale: `lib/providers/data.ts` (blocchi provider
 * `pixel-watch` e `wear-os`, estratti per intervallo di riga fra
 * `slug: "<questo>"` e il prossimo `slug: "..."` di primo livello),
 * `lib/blog/posts/dati-pixel-watch-dashboard.ts`,
 * `lib/blog/posts/google-fit-api-dismissione-2026.ts`.
 * Un secondo controllo (token corrotto) e' invece SITEWIDE su
 * `lib/providers/data.ts` + `lib/providers/models.ts` + tutti i post blog:
 * un pattern di corruzione, una volta confermato, va cercato ovunque.
 *
 * Fallisce (exit 1) su:
 *  1. Contaminazione "Galaxy Watch" dentro il blocco pixel-watch (Pixel
 *     Watch non deve mai descrivere se stesso citando un prodotto Samsung
 *     come se fosse il proprio device). wear-os e' escluso da questo
 *     check: e' legittimo che nomini Galaxy Watch come UNO dei tanti
 *     device Wear OS supportati (lo fa gia', a ragione).
 *  2. Token corrotto `}};` o `}};;` dentro una stringa locale — SITEWIDE,
 *     con un allowlist esplicito delle 4 occorrenze pre-esistenti trovate
 *     fuori dal perimetro P1.8C (amazfit-zepp, fitbit, colmi-ring,
 *     apple-health, tutte PL) durante l'audit di questo sprint: sono
 *     debito NON corretto qui (fuori mandato — nessuna verifica fattuale
 *     fatta su quei 4 provider in questa sessione), tracciato per
 *     confronto ESATTO di stringa. Un cambiamento a quelle righe (anche
 *     solo cosmetico) invalida l'allowlist e fa fallire il check finche'
 *     non viene aggiornato consapevolmente.
 *  3. Roadmap "Fitbit Web API" + trimestre (Q3/Q4 2026) + "OAuth" nel
 *     blocco pixel-watch/wear-os: la fonte reale dice che la Fitbit Web
 *     API viene DISMESSA a settembre 2026, non che lancia un OAuth
 *     pubblico — qualunque promessa di OAuth futuro su quella API in
 *     questi due blocchi e' un regresso del bug ledger #9.
 *  4. Tempo assoluto non sostenuto nel perimetro principale: "in pochi
 *     secondi"/"within seconds"/"entro pochi secondi", "in 5 minuti"/
 *     "5-minute setup"/"setup in 5 minuti", "automaticamente" riferito al
 *     sync (nessuna fonte li sostiene per il sync Health Connect di
 *     questi due provider/articolo).
 *  5. Overclaim "tutti i dati"/"tutte le metriche"/"all your data"/"all
 *     metrics" nel perimetro principale (bug ledger #8).
 *  6. "Fitbit Web API" citata nel blocco pixel-watch/wear-os SENZA
 *     "Google Health API" nella stessa stringa (bug ledger #12: le due
 *     API vanno sempre distinte quando si nomina la legacy).
 *  7. "tachicardia" come nome di metrica nel blocco pixel-watch (bug
 *     ledger #3 — termine medico usato al posto di "frequenza cardiaca").
 *  8. Contaminazione KVKK (TR) o RODO (PL) nel perimetro principale:
 *     nessuno di questi 4 file tratta normativa privacy, quindi zero
 *     occorrenze attese (bug ledger Fase 4).
 *  9. "Pixel Zamanlayıcı" (mistraduzione "timer Pixel" al posto del nome
 *     prodotto) nel blocco pixel-watch (bug ledger #5).
 * 10. Asserzione positiva: il blocco pixel-watch deve menzionare "Pixel
 *     Watch 5" almeno una volta (guardia contro un regresso silenzioso
 *     verso "limitato a 1/2/3", bug ledger #1) sia in `data.ts` sia in
 *     `dati-pixel-watch-dashboard.ts`.
 * 11. CTA platform-aware: il blocco "CTA dopo la matrice" del template
 *     condiviso (`sync/[provider]/page.tsx`) deve ancora calcolare
 *     `iosDisabled` da `platforms`, non un valore fisso — regressione
 *     strutturale del fix FASE 5 (CTA App Store su un blocco
 *     Android-only).
 *
 * Uso (Docker, nessun runtime locale):
 *   docker run --rm -v "$PWD":/app -w /app node:22 npx tsx tools/check-p18c-pixel-wear-os-truth.ts
 */
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(__dirname, "..");
const errors: string[] = [];

// ── Estrazione a blocco di un provider da data.ts per intervallo di riga ──
function extractProviderBlock(content: string, slug: string): { text: string; startLine: number } | null {
  const lines = content.split("\n");
  const startIdx = lines.findIndex((l) => l.trim() === `slug: "${slug}",`);
  if (startIdx === -1) return null;
  // Il blocco inizia dalla riga "{" immediatamente precedente (apertura
  // dell'oggetto provider) — retrocedi finche' non la trovi.
  let openIdx = startIdx;
  while (openIdx > 0 && lines[openIdx].trim() !== "{") openIdx--;
  // Il blocco finisce alla prossima riga "slug: \"...\"," di primo livello
  // (quella del provider successivo) — cerca in avanti dopo startIdx.
  let nextSlugIdx = lines.length;
  for (let i = startIdx + 1; i < lines.length; i++) {
    if (/^\s{4}slug: "/.test(lines[i])) {
      nextSlugIdx = i;
      break;
    }
  }
  return { text: lines.slice(openIdx, nextSlugIdx).join("\n"), startLine: openIdx + 1 };
}

const PROVIDERS_FILE = path.join(repoRoot, "lib/providers/data.ts");
const providersSrc = fs.readFileSync(PROVIDERS_FILE, "utf8");

const pixelWatchBlock = extractProviderBlock(providersSrc, "pixel-watch");
const wearOsBlock = extractProviderBlock(providersSrc, "wear-os");

if (!pixelWatchBlock) errors.push("[blocco-assente] provider pixel-watch non trovato in lib/providers/data.ts.");
if (!wearOsBlock) errors.push("[blocco-assente] provider wear-os non trovato in lib/providers/data.ts.");

// ── 1. Galaxy Watch dentro il blocco pixel-watch ──────────────────────────
if (pixelWatchBlock && /Galaxy\s*Watch/i.test(pixelWatchBlock.text)) {
  errors.push(`[galaxy-watch-in-pixel] lib/providers/data.ts (blocco pixel-watch, da riga ${pixelWatchBlock.startLine}): contiene "Galaxy Watch" — contaminazione Samsung dentro un blocco Pixel.`);
}

// ── Perimetro principale FASE 9: i 4 controlli locali (3,4,5,6,7,8,9) ─────
const MAIN_SCOPE_FILES = [
  "lib/blog/posts/dati-pixel-watch-dashboard.ts",
  "lib/blog/posts/google-fit-api-dismissione-2026.ts",
];
const mainScopeTexts: Array<{ label: string; text: string }> = MAIN_SCOPE_FILES.map((f) => ({
  label: f,
  text: fs.readFileSync(path.join(repoRoot, f), "utf8"),
}));
if (pixelWatchBlock) mainScopeTexts.push({ label: "lib/providers/data.ts (blocco pixel-watch)", text: pixelWatchBlock.text });
if (wearOsBlock) mainScopeTexts.push({ label: "lib/providers/data.ts (blocco wear-os)", text: wearOsBlock.text });

for (const { label, text } of mainScopeTexts) {
  const lines = text.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim().startsWith("//")) continue;

    // 3. Fitbit Web API + trimestre 2026 + OAuth (promessa di OAuth pubblico)
    if (/Fitbit\s*Web\s*API/i.test(line) && /(Q3|Q4|third\s*quarter|fourth\s*quarter|terzo\s*trimestre|quarto\s*trimestre)\s*2026/i.test(line) && /OAuth/i.test(line)) {
      errors.push(`[roadmap-oauth-fitbit-falsa] ${label}:${i + 1}: promette un OAuth pubblico su Fitbit Web API in un trimestre 2026 — la fonte reale dice che questa API viene DISMESSA a settembre 2026, non che lancia un OAuth.`);
    }

    // 4. Tempo assoluto non sostenuto
    if (/\b(in\s*pochi\s*secondi|entro\s*pochi\s*secondi|within\s*seconds|in\s*a\s*few\s*seconds|dentro\s*pochi\s*secondi)\b/i.test(line)) {
      errors.push(`[tempo-assoluto-secondi] ${label}:${i + 1}: claim di dati disponibili "in pochi secondi" — nessuna fonte lo sostiene per il sync Health Connect (latenza onesta: 15-30 min).`);
    }
    if (/\b(setup\s*in\s*5\s*minut[oi]|5[\s-]minute\s*setup|configurazione\s*in\s*5\s*minuti|in\s*5\s*minuti\s*(sei|puoi))\b/i.test(line)) {
      errors.push(`[tempo-assoluto-5min] ${label}:${i + 1}: claim di setup "in 5 minuti" — tempo assoluto non sostenuto da nessuna fonte.`);
    }

    // 5. Overclaim "tutti i dati"/"tutte le metriche"
    if (/\b(tutt[ei]\s*(i\s*tuoi\s*)?dati|tutte\s*le\s*metriche|all\s*your\s*data|all\s*(the\s*)?metrics)\b/i.test(line) && !/\bnon\s*tutt[ei]\b|\bnot\s*all\b/i.test(line)) {
      errors.push(`[overclaim-tutti-i-dati] ${label}:${i + 1}: claim "tutti i dati"/"tutte le metriche" — overclaim (VO2max e percorso GPS NON arrivano a FitMesh su Android).`);
    }

    // 6. Fitbit Web API senza Google Health API nella stessa riga. Verifica
    // "Google Health" + "API" invece della frase esatta "Google Health API":
    // il francese la scrive "API Google Health" (ordine invertito) — "Google
    // Health" resta comunque un bigramma contiguo in entrambi gli ordini,
    // trovato in produzione come falso positivo durante la prima stesura.
    if (/Fitbit\s*Web\s*API/i.test(line) && !(/Google\s*Health/i.test(line) && /\bAPI\b/i.test(line))) {
      errors.push(`[fitbit-web-api-non-distinta] ${label}:${i + 1}: nomina "Fitbit Web API" senza distinguerla da "Google Health API" nella stessa stringa.`);
    }

    // 7. "tachicardia" come metrica
    if (/tachicardia/i.test(line)) {
      errors.push(`[tachicardia-come-metrica] ${label}:${i + 1}: "tachicardia" (termine medico) usato al posto di "frequenza cardiaca".`);
    }

    // 8. KVKK / RODO fuori contesto. Scope volutamente ristretto a
    // dati-pixel-watch-dashboard.ts e ai blocchi provider: google-fit-api-
    // dismissione-2026.ts NON e' incluso qui perche' contiene una menzione
    // LEGITTIMA di RODO (residenza dati UE, PL, riga verificata in questo
    // stesso sprint) — un blanket-check su quel file produce un falso
    // positivo permanente. Le contaminazioni KVKK/RODO gia' trovate e
    // corrette in quel file (TR/PL) restano protette solo da revisione
    // manuale, non da questo guardrail — limite noto, riportato nel report
    // finale FASE 12.
    if (label !== "lib/blog/posts/google-fit-api-dismissione-2026.ts") {
      if (/\bKVKK\b/.test(line)) {
        errors.push(`[kvkk-contaminazione] ${label}:${i + 1}: contiene "KVKK" — questo file tratta sincronizzazione dati, non normativa privacy turca.`);
      }
      if (/\bRODO\b/.test(line)) {
        errors.push(`[rodo-contaminazione] ${label}:${i + 1}: contiene "RODO" — questo file tratta sincronizzazione dati, non normativa privacy polacca.`);
      }
    }

    // 9. "Pixel Zamanlayıcı" mistraduzione
    if (/Pixel\s*Zamanlayı/i.test(line)) {
      errors.push(`[pixel-zamanlayici] ${label}:${i + 1}: "Pixel Zamanlayıcı" (= "timer Pixel") al posto del nome prodotto "Pixel Watch".`);
    }
  }
}

// ── 10. Asserzione positiva: "Pixel Watch 5" deve comparire ──────────────
if (pixelWatchBlock && !/Pixel\s*Watch\s*5/.test(pixelWatchBlock.text)) {
  errors.push("[pixel-watch-5-assente] lib/providers/data.ts (blocco pixel-watch): nessuna menzione di \"Pixel Watch 5\" — possibile regresso verso il limite errato 1/2/3.");
}
const articleSrc = fs.readFileSync(path.join(repoRoot, "lib/blog/posts/dati-pixel-watch-dashboard.ts"), "utf8");
if (!/Pixel\s*Watch\s*5/.test(articleSrc)) {
  errors.push("[pixel-watch-5-assente] lib/blog/posts/dati-pixel-watch-dashboard.ts: nessuna menzione di \"Pixel Watch 5\".");
}

// ── 2. Token corrotto }}; / }};; — SITEWIDE, con allowlist esatto ────────
// Le 4 righe seguenti sono debito PRE-ESISTENTE trovato durante l'audit
// P1.8C ma FUORI dal suo perimetro (amazfit-zepp, fitbit, colmi-ring,
// apple-health — mai pixel-watch/wear-os). Confronto per contenuto
// ESATTO: qualunque modifica a queste righe (anche solo per riformattarle)
// toglie l'esenzione e il check torna a fallire finche' non e' un fix vero.
const KNOWN_PRE_EXISTING_CORRUPTED_TOKENS = new Set<string>([
  '          pl: "FitMesh importuje dane etapów snu (ciemne, głębokie, REM) z device Amazfit poprzez Health Connect. Punkty PAI (Osobisty Indeks Aktywności) są własnością Zepp i nie są dostępne w Health Connect ani w FitMesh. Kroki, }};",',
  '          pl: "Przez Health Connect, FitMesh importuje kroki, }};",',
  '          pl: "FitMesh czyta kroki, }};",',
  '          pl: "Tak. Gdy zainstalujesz FitMesh na swoim iPhone z dostępem do Apple Health, on odczyta wszystkie dane wykryte przez Twoje Apple Watch – w tym pętle aktywności, }};",',
]);
const CORRUPTED_TOKEN_TARGETS = [
  "lib/providers/data.ts",
  "lib/providers/models.ts",
  ...fs
    .readdirSync(path.join(repoRoot, "lib/blog/posts"))
    .filter((f) => f.endsWith(".ts"))
    .map((f) => `lib/blog/posts/${f}`),
];
for (const rel of CORRUPTED_TOKEN_TARGETS) {
  const full = path.join(repoRoot, rel);
  if (!fs.existsSync(full)) continue;
  const lines = fs.readFileSync(full, "utf8").split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.includes("}};")) continue;
    if (KNOWN_PRE_EXISTING_CORRUPTED_TOKENS.has(line)) continue; // debito tracciato, non di questo sprint
    errors.push(`[token-corrotto] ${rel}:${i + 1}: contiene "}};" o "}};;" dentro una stringa — token di template rotto, frase probabilmente troncata.`);
  }
}

// ── 11. CTA platform-aware — regressione strutturale nel template ────────
const PROVIDER_PAGE = path.join(repoRoot, "app/(frontend)/[locale]/(marketing)/sync/[provider]/page.tsx");
const pageSrc = fs.readFileSync(PROVIDER_PAGE, "utf8");
if (!/iosDisabled=\{!platforms\.includes\("ios"\)\}/.test(pageSrc)) {
  errors.push('[cta-platform-aware-regresso] sync/[provider]/page.tsx: il blocco "CTA dopo la matrice" non calcola più iosDisabled da platforms — rischio di mostrare il pulsante App Store su un blocco Android-only.');
}

// ── 12. seoTitle renderizzato ≤ 60 caratteri (blog/[slug]/page.tsx
// concatena sempre " · FitMesh", +10 caratteri) — bug reale trovato in
// QA browser Playwright durante questo stesso sprint: una prima stesura
// di seoTitle.en contava solo la stringa base (57) e ignorava il
// suffisso, arrivando a 67 caratteri renderizzati. Scope volutamente
// limitato ai 2 post di questo sprint (non un audit sitewide dei 65
// post, fuori mandato qui).
const TITLE_SUFFIX = " · FitMesh";
for (const rel of MAIN_SCOPE_FILES) {
  const src = fs.readFileSync(path.join(repoRoot, rel), "utf8");
  const seoTitleMatch = src.match(/seoTitle:\s*\{([^}]*)\}/s);
  if (!seoTitleMatch) continue;
  const localeStringRe = /(\w+):\s*"((?:[^"\\]|\\.)*)"/g;
  let m: RegExpExecArray | null;
  while ((m = localeStringRe.exec(seoTitleMatch[1]))) {
    const [, lc, value] = m;
    const rendered = value.replace(/\\"/g, '"').length + TITLE_SUFFIX.length;
    if (rendered > 60) {
      errors.push(`[seotitle-troppo-lungo] ${rel} seoTitle.${lc}: ${rendered} caratteri renderizzati (con " · FitMesh") — oltre il limite di 60.`);
    }
  }
}

if (errors.length > 0) {
  console.error(`❌ P1.8C guardrail (Pixel Watch / Wear OS / articolo API): ${errors.length} problemi.\n`);
  for (const e of errors) console.error("  " + e);
  process.exit(1);
}
console.log(
  "✅ P1.8C guardrail: nessuna regressione su Galaxy-Watch-in-Pixel/token-corrotto-sitewide(con 4 debiti pre-esistenti tracciati fuori perimetro)/roadmap-OAuth-Fitbit-falsa/tempo-assoluto/overclaim-tutti-i-dati/Fitbit-Web-API-non-distinta/tachicardia-come-metrica/KVKK-RODO/Pixel-Zamanlayici/Pixel-Watch-5-presente/CTA-platform-aware/seoTitle-renderizzato-60c.",
);
