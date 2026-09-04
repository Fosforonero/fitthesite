#!/usr/bin/env tsx
/**
 * P0.18A — guardrail permanente di non-regressione sui claim privacy rimossi.
 *
 * SCOPO E PERIMETRO (leggere prima di estendere)
 * ------------------------------------------------
 * Questo NON è un guardrail sitewide: copre SOLO le 9 superfici toccate dal
 * micro-sprint P0.18A (hotfix "privacy containment"), impedendo che i claim
 * rimossi lì rientrino per regressione. Il resto del sito (in particolare
 * ~20 blog post con "GDPR compliant"/"server UE"/tempistiche di cancellazione
 * non provate, già inventariati in P018-inventario-privacy-claims.md) resta
 * PENDING per un giro successivo — NON è coperto qui di proposito, e non va
 * aggiunto a questo file per "farlo verde": va corretto nel contenuto, poi
 * aggiunto alla lista FILES sotto.
 *
 * Le 7 categorie vietate (via GO "P0.18A PRIVACY CONTAINMENT"):
 *   1. GDPR usato come certificazione/bollino ("GDPR compliant", "100% GDPR",
 *      "GDPR certified" e equivalenti in altre lingue) — NON i riferimenti
 *      informativi reali a diritti/articoli GDPR.
 *   2. "Actually private" / promesse assolute di privacy incondizionata.
 *   3. "server UE"/"EU servers" come claim di esclusività non provata.
 *   4. "Data not collected" assoluto, quando esistono account/dati sanitari.
 *   5. Cancellazione garantita entro 24/48 ore, "one-click deletion",
 *      rimozione immediata di ogni copia.
 *   6. Prezzo numerico obsoleto (fuori scope qui: nessun prezzo hardcoded
 *      nelle superfici coperte da questo file — vedi P018-inventario).
 *   7. Programma Founder presentato come attualmente disponibile.
 *
 * Ogni check instrada la violazione su TRUE ERROR (bloccante, file
 * pubblicamente indicizzabile) solo per i file in questo elenco: sono TUTTI
 * pubblici e indicizzabili, quindi qui non serve il routing locale/SSOT usato
 * da altri guardrail di questo repo — ogni occorrenza è già in scope reale.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(__dirname, "..");

type Category =
  | "gdpr_as_certification"
  | "actually_private"
  | "eu_servers_exclusive"
  | "data_not_collected_absolute"
  | "unproven_deletion_timing"
  | "founder_current_availability";

/**
 * Per file: quali categorie sono state EFFETTIVAMENTE corrette in P0.18A —
 * solo quelle vengono controllate qui. Un file può contenere claim di una
 * categoria mai toccata in questo sprint (es. "server UE" in press/page.tsx,
 * deliberatamente fuori scope): quel claim non è una regressione, perché non
 * è mai stato rimosso. Aggiungerlo a "categories" qui SOLO dopo averlo
 * effettivamente corretto nel file, non prima.
 *
 * `fromLine`: se impostato, scansiona solo da quella riga in poi (1-based).
 * ATTENZIONE (lezione MICRO-GATE P0.18A-A): non fidarsi di un commento nel
 * codice sorgente che dichiara un blocco "mai renderizzato" senza
 * ripercorrere ogni funzione che lo importa — in famiglia/page.tsx l'intero
 * COPY object sembrava dead-code dietro COMING_SOON=true, ma ComingSoonState()
 * (il ramo VIVO) rileggeva 4 delle 6 faqs di COPY[it|es|en] verbatim,
 * pubblicandole anche nel FAQPage JSON-LD — un claim li' dentro era quindi
 * pubblico. Preferire `skipLines`/`skipRanges` mirati (con la riga di codice
 * che PROVA che quel percorso non è mai letto) invece di un `fromLine`
 * grezzo su un intero blocco.
 *
 * `skipLines`/`skipRanges`: righe (1-based, inclusive) note e verificate come
 * NON claim di prima parte su FitMesh — quindi fuori dal perimetro delle 6
 * categorie, non "regressioni" quando il pattern vi compare comunque. Ogni
 * uso è commentato inline con la verifica fatta (MICRO-GATE P0.18A-A,
 * 04/09/2026). Non aggiungere una entry qui senza aver riletto per intero il
 * contesto della riga.
 */
const FILES: Array<{
  path: string;
  categories: Category[];
  fromLine?: number;
  skipLines?: number[];
  skipRanges?: Array<[number, number]>;
}> = [
  { path: "lib/content/homepage-copy.ts", categories: ["eu_servers_exclusive", "gdpr_as_certification", "unproven_deletion_timing"] },
  { path: "app/(frontend)/[locale]/(marketing)/page.tsx", categories: ["gdpr_as_certification"] }, // "EU servers" resta lecito nel commento esplicativo che lo cita come rimosso
  { path: "components/TrustBadges.tsx", categories: ["eu_servers_exclusive", "gdpr_as_certification"] },
  { path: "lib/content/about-copy.ts", categories: ["eu_servers_exclusive", "actually_private", "gdpr_as_certification", "unproven_deletion_timing"] },
  { path: "lib/content/self-host-copy.ts", categories: ["unproven_deletion_timing"] },
  { path: "lib/providers/data.ts", categories: ["eu_servers_exclusive"] },
  { path: "app/(frontend)/[locale]/(marketing)/press/page.tsx", categories: ["gdpr_as_certification", "eu_servers_exclusive"] }, // MICRO-GATE P0.18A-A: rimosso anche "server UE"/"EU servers" (MATRIX_COMPLETE_FOR_SITE=NO), senza sostituzione geografica
  {
    path: "app/(frontend)/[locale]/(marketing)/famiglia/page.tsx",
    categories: ["gdpr_as_certification", "eu_servers_exclusive"],
    // CORREZIONE MICRO-GATE P0.18A-A (punto 6, scansione HTML costruito):
    // il precedente fromLine:1375 presumeva l'INTERO COPY object (righe
    // 47-976) morto perché COMING_SOON=true fa un return anticipato sul
    // render "full mode" — falso per faqs[0,1,3,4]: ComingSoonState()
    // (viva) li rilegge VERBATIM da COPY[faqLocale] (riga ~1472,
    // faqLocale solo it/es/en) e li pubblica anche nel FAQPage JSON-LD.
    // faqs[3] ("dati salute al sicuro?") conteneva "Supabase EU
    // (Francoforte)" + "Conformità GDPR full" in it/en/es: ERA LIVE,
    // pubblicato, mai trovato prima — corretto qui. Le righe sotto restano
    // skip perché VERAMENTE morte (confermato leggendo faqLocale nel
    // codice): faqs[3] di de/pt/fr/pl/tr (mai usate, faqLocale non le
    // seleziona mai) e il resto del render "full mode" (righe 977-1370,
    // mai raggiunto).
    skipLines: [495, 611, 727, 843, 959],
    skipRanges: [[977, 1370]],
  },
  { path: "app/(frontend)/[locale]/(marketing)/privacy/page.tsx", categories: ["gdpr_as_certification", "unproven_deletion_timing"] },
  { path: "app/(frontend)/[locale]/(marketing)/terms/page.tsx", categories: ["unproven_deletion_timing"] },
  { path: "lib/seo/entities.ts", categories: ["eu_servers_exclusive"] }, // trovato via QA live sul JSON-LD Person/author bio, non dal primo inventario

  // ── MICRO-GATE P0.18A-A (04/09/2026): superfici aggiuntive trovate con la
  // scansione sitewide richiesta al punto 4 e 5, mai coperte dal GO originale. ──
  { path: "app/(frontend)/[locale]/(marketing)/cookies/page.tsx", categories: ["gdpr_as_certification"] },
  { path: "app/(frontend)/[locale]/(marketing)/fitness-data-sync/page.tsx", categories: ["eu_servers_exclusive"] },
  { path: "app/(frontend)/[locale]/(marketing)/layout.tsx", categories: ["gdpr_as_certification", "eu_servers_exclusive"] },
  {
    path: "lib/llms-txt.ts",
    categories: ["gdpr_as_certification", "eu_servers_exclusive"],
    // MICRO-GATE P0.18A-B (04/09/2026): riga 139 ("backend on Supabase
    // Postgres (Frankfurt, EU)") e riga 35 ("Supabase, EU infrastructure")
    // erano state giudicate legittime in P0.18A-A per analogia con la
    // tabella sub-processor di privacy/page.tsx — riesame piu' severo: a
    // differenza di privacy.tsx, questo file non discloso MAI, in nessun
    // punto, i sub-processor USA (Vercel/Resend/Firebase/Google Sign-In)
    // che compaiono nella stessa pagina/documento; un lettore (umano o un
    // agente IA, il pubblico dichiarato di questo file) non ha modo di
    // sapere qui che il resto del backend NON e' esclusivamente UE.
    // Rimosse entrambe le clausole geografiche, nessuna sostituzione.
  },
  { path: "lib/product-facts.ts", categories: ["gdpr_as_certification", "eu_servers_exclusive"] }, // altissima diffusione: importato da quasi ogni pagina marketing
  { path: "lib/landing/data.ts", categories: ["gdpr_as_certification", "eu_servers_exclusive"] }, // 6508 righe, FAQ riusate da /lp/[slug]
  // MICRO-GATE P0.18A-B (04/09/2026): layer di gap-fill spagnolo per le
  // landing page, SEPARATO da data.ts (lib/landing/es-overlay.ts), mai
  // enumerato da nessun fix precedente — scoperto solo dalla scansione
  // esaustiva dell'HTML costruito. 7 claim "servidor/nube en la UE
  // (Fráncfort/Frankfurt)" rimossi su 5 landing page.
  { path: "lib/landing/es-overlay.json", categories: ["eu_servers_exclusive"] },

  // ── 18 blog post (17 dal primo giro P0.18A-A + 1 trovato nella scansione
  // finale). dove-sono-i-tuoi-dati-server-ue.ts è ESCLUSO di proposito: il
  // claim "server UE" è il titolo/slug/tesi dell'intero articolo, non una
  // frase isolata — rimuoverlo richiede una decisione editoriale dedicata,
  // non un containment meccanico (vedi report). ──
  {
    path: "lib/blog/posts/best-health-data-sync-app-android.ts",
    categories: ["gdpr_as_certification", "eu_servers_exclusive"],
    // righe 662-729 e 1109-1136: checklist "cosa cercare in QUALSIASI app di
    // sync" (generica, non menziona FitMesh) e la sua ripetizione in FAQ.
    // Verificato riga per riga (MICRO-GATE P0.18A-A): non è un claim su
    // FitMesh — resta PENDING_EDITORIAL_DECISION nel report, non rimosso qui
    // meccanicamente perché riscriverlo è una scelta editoriale sul
    // contenuto del checklist, non una rimozione di claim già dimostrato
    // falso. Le due frasi in prima persona su FitMesh in questo stesso file
    // (server europei/EU servers, GDPR compliance esplicita) SONO già state
    // rimosse e restano protette da regressione ovunque fuori da questi due
    // range.
    skipRanges: [
      [662, 729],
      [1109, 1136],
    ],
  },
  { path: "lib/blog/posts/cambiare-smartwatch-senza-perdere-dati.ts", categories: ["eu_servers_exclusive"] },
  { path: "lib/blog/posts/colmi-ring-fitmesh.ts", categories: ["gdpr_as_certification"] },
  { path: "lib/blog/posts/come-funziona-fitmesh.ts", categories: ["eu_servers_exclusive"] },
  { path: "lib/blog/posts/da-android-a-iphone-dati-fitness.ts", categories: ["eu_servers_exclusive"] },
  { path: "lib/blog/posts/dati-anello-smart-apple-salute.ts", categories: ["gdpr_as_certification", "eu_servers_exclusive"] },
  { path: "lib/blog/posts/esportare-dati-xiaomi-amazfit.ts", categories: ["eu_servers_exclusive"] },
  { path: "lib/blog/posts/fitmesh-arriva-su-iphone.ts", categories: ["gdpr_as_certification", "eu_servers_exclusive"] },
  { path: "lib/blog/posts/fitmesh-gratis-prezzo-founder.ts", categories: ["eu_servers_exclusive"] },
  { path: "lib/blog/posts/fitmesh-samsung-health-usarli-insieme.ts", categories: ["eu_servers_exclusive"] },
  { path: "lib/blog/posts/fitmesh-sync-disponibile-google-play.ts", categories: ["eu_servers_exclusive"] },
  {
    path: "lib/blog/posts/fitmesh-vs-alternative-sync.ts",
    categories: ["gdpr_as_certification", "eu_servers_exclusive"],
    // righe 130/167/290/293: claim su FitnessSyncer (terzi) — l'articolo
    // dichiara esplicitamente "we found no explicit GDPR-compliant statement
    // ... so we won't attribute a GDPR-compliance claim to them that they
    // don't make themselves"; riga 167 è il link all'articolo-tesi escluso
    // (dove-sono-i-tuoi-dati-server-ue). Verificato riga per riga.
    skipLines: [130, 167, 290, 293],
  },
  {
    path: "lib/blog/posts/gdpr-dati-fitness-smartwatch.ts",
    categories: ["gdpr_as_certification"],
    // righe 925/1087: non sono claim di certificazione, sono corruzioni di
    // traduzione automatica (TR "KVKK uyumluluğu" iniettato in una frase che
    // in ogni altra lingua non menziona alcuna conformità; PL "RODO" usato
    // come aggettivo per "il setup più rispettoso della privacy" riferito a
    // Health Connect, non a un brand). Nessuna delle due riguarda FitMesh né
    // un brand terzo nominato — problema di qualità della traduzione, fuori
    // perimetro P0.18A, non corretto qui. Verificato riga per riga.
    skipLines: [925, 1087],
  },
  { path: "lib/blog/posts/google-fit-api-dismissione-2026.ts", categories: ["eu_servers_exclusive"] },
  { path: "lib/blog/posts/novita-fitmesh-su-app-store.ts", categories: ["gdpr_as_certification", "eu_servers_exclusive"] },
  { path: "lib/blog/posts/perche-diventare-founder-fitmesh.ts", categories: ["eu_servers_exclusive"] },
  { path: "lib/blog/posts/sincronizzare-withings.ts", categories: ["eu_servers_exclusive"] },
  { path: "lib/blog/posts/sync-them-all.ts", categories: ["gdpr_as_certification", "eu_servers_exclusive", "unproven_deletion_timing"] },

  // ── Layer di traduzione nordico (sv/da/no/fi) dei post — SEPARATO dai file
  // .ts sopra, iniettato a runtime (lib/blog/nordic-overlay.ts), scoperto
  // SOLO dalla scansione dell'HTML costruito (punto 6 MICRO-GATE P0.18A-A):
  // ogni fix precedente di questo sprint enumerava 10-11 locale, mai le 4
  // nordiche. righe 3486/3622: stessa checklist "cosa cercare in QUALSIASI
  // app di sync" lasciata PENDING_EDITORIAL_DECISION nella versione IT/EN
  // di best-health-data-sync-app-android.ts — coerenza, non un buco.
  {
    path: "lib/blog/nordic-overlay.json",
    categories: ["gdpr_as_certification", "eu_servers_exclusive", "unproven_deletion_timing"],
    // 3485-3489 (sv) + 3486 (da): faq.2.q/faq.2.a — stessa domanda/risposta
    // "cosa cercare in QUALSIASI app di sync" lasciata PENDING_EDITORIAL_DECISION
    // nella versione IT/EN del file .ts principale. 3616 (sv) + 3622 (da):
    // body.9.rows.2 — la riga della checklist-tabella corrispondente.
    skipLines: [3485, 3486, 3489, 3616, 3622],
  },
];

type Violation = { file: string; line: number; pattern: string; excerpt: string };

// ── Pattern vietati (case-insensitive), con negazione contestuale minima ────

function windowAround(text: string, index: number, radius = 60): string {
  return text.slice(Math.max(0, index - radius), Math.min(text.length, index + radius));
}

/** Categoria 1: GDPR come bollino isolato — "GDPR compliant"/"GDPR-compliant"/
 * "100% GDPR"/"GDPR certified" e le varianti tradotte già rimosse da questo
 * sprint. NON blocca riferimenti a articoli/diritti (es. "art. 6 GDPR",
 * "diritto alla cancellazione (GDPR)"). */
const GDPR_CERT_SUFFIX_RE =
  /\b(GDPR|RGPD|DSGVO|RODO|AVG|KVKK)[\s-]?(compliant|compliance|conform[ei]?|-konform|kompatibel|uyumlu|yhteensopiv\w*|overholdelse|overensstemmelse|samsvar|準拠|준수)/gi;
const GDPR_CERT_PREFIX_RE =
  /\b(\d{1,3}\s?%\s*|conform[ei]?\s+(al|a|alla|au|zu|to|con)?\s*|compliant\s+with\s*|compliance\s+(con|with|avec)?\s*|full\s+|fuld\s+|fullt\s+|täysin\s+|i\s+full\s+samsvar\s+med\s+)(GDPR|RGPD|DSGVO|RODO|AVG|KVKK)\b/gi;
const GDPR_INFORMATIVE_HINT = /art\.?\s?\d|artikel|article|articolo|diritt[oi]|right[s]?|derecho/i;

function checkGdprCertification(text: string): Array<{ index: number; match: string }> {
  const hits: Array<{ index: number; match: string }> = [];
  for (const re of [GDPR_CERT_SUFFIX_RE, GDPR_CERT_PREFIX_RE]) {
    for (const m of text.matchAll(re)) {
      const idx = m.index ?? 0;
      const ctx = windowAround(text, idx, 40);
      if (GDPR_INFORMATIVE_HINT.test(ctx)) continue; // riferimento normativo reale, non bollino
      hits.push({ index: idx, match: m[0] });
    }
  }
  return hits;
}

/** Categoria 2: promesse assolute "actually/davvero/realmente privato" senza
 * qualificazione (label neutra "Privacy e controllo dei dati" è ammessa e non
 * matcha questo pattern). */
const ACTUALLY_PRIVATE_RE =
  /\b(actually|davvero|realmente|wirklich|vraiment)\s+privat[ae]?\b|privacy:\s*(no compromise|nessun compromesso)/gi;

/** Categoria 3: "server UE"/"EU servers" come claim di esclusività — solo
 * quando non è già una lista di provider/regioni con eccezioni esplicite. Le
 * 9 superfici coperte qui sono già state ripulite: qualunque occorrenza
 * residua è una regressione. */
const EU_SERVERS_RE =
  /\b(server[i]?\s+(in\s+)?(UE|EU)\b|EU\s+servers?\b|servidor(es)?\s+(en|na|de)\s+la?\s?UE\b|nube\s+europea\b|EU-Server\b|EU-servrar\b|EU-servere\b|EU-palvelimet\b|serveurs?\s+(en\s+)?UE\b|serwery\s+w\s+UE\b|AB\s+sunucular[ıi]\b|Avrupa.{0,15}sunucu\w*|EU-servers?\b|EU-cloud\b|EU\s+cloud\b|cloud\s+FitMesh\s+EU\b|FitMesh\s+EU\s+cloud\b|server\s+europe[oi]\b|European\s+servers?\b|europ[äae]ische[nr]?\s+server|servidores?\s+europeos|servidores?\s+europeus|serveurs?\s+europ[ée]ens|europejskie\s+serwery|europeiske\s+server\w*|europ[äaæ]iske?\s+server\w*|eurooppalais\w*\s+palvelim\w*|Frankfurt|Francoforte|Francfort|Fráncfort|EUサーバー|ヨーロッパ.{0,5}サーバー|欧州.{0,5}サーバー|EU\s*서버|유럽\s*서버)/gi;

/** Categoria 4: "non raccogliamo dati"/"data not collected" assoluto. */
const DATA_NOT_COLLECTED_RE =
  /\bdata\s+not\s+collected\b|\bnon\s+raccogliamo\s+(alcun\s+)?dat[oi]\s+(personal[ei]?)?\b|\bwe\s+don'?t\s+collect\s+any\s+data\b/gi;

/** Categoria 5: cancellazione garantita entro N ore, one-click deletion. */
const DELETION_TIMING_RE =
  /\b(cancellazione|eliminazione|delete|deletion|suppression|löschung|eliminación|exclusão)\b(?:\s+\S+){0,3}?\s+(in|entro|within|dans les|en un plazo de|em até|innerhalb von)\s*\d{1,3}\s*(ore|hours?|horas?|heures?|stunden)\b|\bone-?click\s+delet(ion|e)\b|\bun\s+click.*tutto\s+è\s+cancellat[oi]\b|\b\d{1,3}\s*(timer|timar|tunnin|tuntia)\b(?:\s+\S+){0,6}?\s*(slett|sletning|radering|poist)\w*|\b(slett|sletning|radering|poist)\w*(?:\s+\S+){0,6}?\s*\d{1,3}\s*(timer|timar|tunnin|tuntia)\b|\bett\s+klick\b|\bmed\s+et\s+klik\b|\bén\s+klikk\b/gi;

/** Categoria 7: Founder presentato come disponibile ORA (CTA/countdown), non
 * una menzione storica. Cerca verbi al presente/futuro immediato accanto a
 * "Founder" SENZA marcatori di chiusura nelle vicinanze. */
const FOUNDER_LIVE_RE = /\bfounder\b/gi;
const FOUNDER_CLOSED_HINT =
  /chius[oa]|closed|31\s*(luglio|july)|program.*(end|ended|termin)|storic[oa]|historical|cutoff|posti\s+(esauriti|usati)/i;

function checkFounderLive(text: string): Array<{ index: number; match: string }> {
  const hits: Array<{ index: number; match: string }> = [];
  for (const m of text.matchAll(FOUNDER_LIVE_RE)) {
    const idx = m.index ?? 0;
    const ctx = windowAround(text, idx, 150);
    if (FOUNDER_CLOSED_HINT.test(ctx)) continue;
    // Solo se accanto compare un verbo/CTA di azione corrente (join/attiva/unisciti/become)
    if (!/\b(join|unisciti|diventa|become|attiva|sign up|iscriviti|claim your|get founder)\b/i.test(ctx)) continue;
    hits.push({ index: idx, match: m[0] });
  }
  return hits;
}

function scanFile(entry: {
  path: string;
  categories: Category[];
  fromLine?: number;
  skipLines?: number[];
  skipRanges?: Array<[number, number]>;
}): Violation[] {
  const abs = join(ROOT, entry.path);
  const fullText = readFileSync(abs, "utf-8");
  const offset = entry.fromLine ? fullText.split("\n").slice(0, entry.fromLine - 1).join("\n").length + 1 : 0;
  const text = entry.fromLine ? fullText.slice(offset) : fullText;
  const violations: Violation[] = [];
  const active = new Set(entry.categories);
  const skipLines = new Set(entry.skipLines ?? []);
  const skipRanges = entry.skipRanges ?? [];

  function isSkipped(lineNo: number): boolean {
    if (skipLines.has(lineNo)) return true;
    return skipRanges.some(([from, to]) => lineNo >= from && lineNo <= to);
  }

  function push(indexInSlice: number, pattern: string) {
    const absoluteIndex = offset + indexInSlice;
    const lineNo = fullText.slice(0, absoluteIndex).split("\n").length;
    if (isSkipped(lineNo)) return;
    violations.push({ file: entry.path, line: lineNo, pattern, excerpt: windowAround(text, indexInSlice, 50).replace(/\s+/g, " ") });
  }

  if (active.has("gdpr_as_certification")) for (const h of checkGdprCertification(text)) push(h.index, `gdpr_as_certification: "${h.match}"`);
  if (active.has("actually_private")) for (const m of text.matchAll(ACTUALLY_PRIVATE_RE)) push(m.index ?? 0, `actually_private: "${m[0]}"`);
  if (active.has("eu_servers_exclusive")) for (const m of text.matchAll(EU_SERVERS_RE)) push(m.index ?? 0, `eu_servers_exclusive: "${m[0]}"`);
  if (active.has("data_not_collected_absolute")) for (const m of text.matchAll(DATA_NOT_COLLECTED_RE)) push(m.index ?? 0, `data_not_collected_absolute: "${m[0]}"`);
  if (active.has("unproven_deletion_timing")) for (const m of text.matchAll(DELETION_TIMING_RE)) push(m.index ?? 0, `unproven_deletion_timing: "${m[0]}"`);
  if (active.has("founder_current_availability")) for (const h of checkFounderLive(text)) push(h.index, `founder_current_availability: "${h.match}"`);

  return violations;
}

// ── Self-test (--self-test) ─────────────────────────────────────────────────

type SelfTestCase = { name: string; text: string; expectViolation: boolean };

const SELF_TESTS: SelfTestCase[] = [
  // 1. gdpr_as_certification — deve scattare
  { name: "GDPR compliant bollino", text: "Fully GDPR compliant. Trust us.", expectViolation: true },
  { name: "100% GDPR variante IT", text: "Conforme al GDPR al 100%, promesso.", expectViolation: true },
  // negativo: riferimento normativo reale
  { name: "GDPR art. 17 riferimento reale — non deve scattare", text: "Hai diritto alla cancellazione ex art. 17 GDPR.", expectViolation: false },
  // 2. actually_private
  { name: "Actually private assoluto", text: "Privacy: no compromise. Actually private, always.", expectViolation: true },
  { name: "Label neutra ammessa — non deve scattare", text: "Privacy e controllo dei dati / Privacy and data control", expectViolation: false },
  // 3. eu_servers_exclusive
  { name: "EU servers claim esclusivo", text: "Your data lives on EU servers, always.", expectViolation: true },
  { name: "server UE variante IT", text: "I tuoi dati restano su server in UE.", expectViolation: true },
  { name: "europæiske servere (DA, æ)", text: "Data opbevares på europæiske servere.", expectViolation: true },
  { name: "GDPR overholdelse (DA/NO)", text: "Fuld GDPR overholdelse, altid.", expectViolation: true },
  { name: "GDPR-kompatibel (SV)", text: "Fullt GDPR-kompatibelt, garanterat.", expectViolation: true },
  { name: "Frankfurt come trigger EU-server", text: "Backend hostad i Frankfurt (EU), alltid.", expectViolation: true },
  { name: "sletning inden for N timer (DA)", text: "Sletning af data sker inden for 48 timer.", expectViolation: true },
  // 4. data_not_collected_absolute
  { name: "Data not collected assoluto", text: "Data not collected. We are invisible.", expectViolation: true },
  { name: "non raccogliamo dati personali", text: "Non raccogliamo dati personali, mai.", expectViolation: true },
  // 5. unproven_deletion_timing
  { name: "cancellazione entro 24 ore", text: "La cancellazione avviene entro 24 ore.", expectViolation: true },
  { name: "deletion within 48 hours", text: "Deletion within 48 hours, guaranteed.", expectViolation: true },
  { name: "one-click deletion", text: "Enjoy one-click deletion of your account.", expectViolation: true },
  // negativo: rimando alla pagina reale, nessun numero assoluto
  {
    name: "rimando a /delete-account senza numero — non deve scattare",
    text: "La cancellazione segue le procedure descritte nella pagina di cancellazione account (fitmesh.fit/delete-account).",
    expectViolation: false,
  },
  // 7. founder_current_availability
  { name: "Founder CTA live", text: "Join the Founder program today and become a Founder now!", expectViolation: true },
  {
    name: "Founder menzione storica — non deve scattare",
    text: "Il programma Founder si è chiuso il 31 luglio 2026 (storico, posti esauriti).",
    expectViolation: false,
  },
  // controllo positivo aggiuntivo: negazione corretta di 'non condividiamo... per pubblicità' non è nel perimetro di questo guardrail (nessun pattern la intercetta) — non serve un caso qui.
];

function runSelfTest(): boolean {
  let ok = true;
  for (const t of SELF_TESTS) {
    const hits = [
      ...checkGdprCertification(t.text).map((h) => `gdpr:${h.match}`),
      ...[...t.text.matchAll(ACTUALLY_PRIVATE_RE)].map((m) => `actually_private:${m[0]}`),
      ...[...t.text.matchAll(EU_SERVERS_RE)].map((m) => `eu_servers:${m[0]}`),
      ...[...t.text.matchAll(DATA_NOT_COLLECTED_RE)].map((m) => `data_not_collected:${m[0]}`),
      ...[...t.text.matchAll(DELETION_TIMING_RE)].map((m) => `deletion_timing:${m[0]}`),
      ...checkFounderLive(t.text).map((h) => `founder_live:${h.match}`),
    ];
    const got = hits.length > 0;
    if (got !== t.expectViolation) {
      ok = false;
      console.error(`  ❌ [self-test] "${t.name}": atteso violation=${t.expectViolation}, ottenuto=${got} (hits: ${hits.join(", ") || "nessuno"})`);
    } else {
      console.log(`  ✓ [self-test] "${t.name}"`);
    }
  }
  return ok;
}

// ── Main ─────────────────────────────────────────────────────────────────

function main() {
  const selfTestMode = process.argv.includes("--self-test");

  if (selfTestMode) {
    const ok = runSelfTest();
    if (!ok) {
      console.error("\n❌ P0.18A containment guardrail: self-test FALLITO.");
      process.exit(1);
    }
    console.log(`\n✅ P0.18A containment guardrail: self-test OK (${SELF_TESTS.length} casi).`);
    return;
  }

  const allViolations: Violation[] = [];
  for (const f of FILES) {
    allViolations.push(...scanFile(f));
  }

  if (allViolations.length > 0) {
    console.error(`❌ P0.18A containment guardrail: ${allViolations.length} regressione/i sui claim rimossi:`);
    for (const v of allViolations) {
      console.error(`  - ${v.file}:${v.line} — ${v.pattern}\n      …${v.excerpt}…`);
    }
    process.exit(1);
  }

  const totalCategoryChecks = FILES.reduce((n, f) => n + f.categories.length, 0);
  console.log(
    `✅ P0.18A containment guardrail: zero regressioni — ${FILES.length} file, ${totalCategoryChecks} coppie file/categoria controllate (solo le categorie effettivamente corrette in ciascun file, vedi mappa FILES).`
  );
  console.log(
    "   Perimetro NON sitewide: blog post e altri file fuori da FILES restano PENDING, vedi header di questo file."
  );
}

main();
