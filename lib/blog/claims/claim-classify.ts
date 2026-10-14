/**
 * Classificazione di una frase del contenuto coperto: rilevatore di richiamo + guardie v3 per decidere se la
 * frase AFFERMA davvero (frequenza attribuita a una causa/un problema, promessa di integrazione) oppure e'
 * neutra/etichetta/domanda. La stessa funzione serve al generatore e al test: la classificazione memorizzata
 * nel registro deve coincidere con quella ricalcolata, quindi non si puo' «declassare» una voce a mano.
 */
import { THIRD_PARTY_SERVICE, detectClaim, normalizeClaimText, type ClaimDetection } from "./claim-detectors";
import { COVERED_POSTS, claimSentences, segmentCell, type ClaimSentence } from "./claim-cells";
import { GA_CTA_PATH, GA_NEGATION, cellLang, fitbitFrequencyVerdict, garminCellVerdict, garminPromiseProblems, nz } from "./text-guards-v3";

const soggettoOf = (s: string): ClaimDetection["soggetto"] => (/FitMesh/i.test(s) ? "fitmesh" : "generico");

// Etichette della CTA in riga rossa del post Garmin: ammesse a testo esatto dal test seo-metadata-batch1.
export const isGarminCta = (path: string): boolean => GA_CTA_PATH.test(path);
export const GA_NEG_ITEM = /^(?:ts|overlay):body\.15\.items\.[a-z]{2}\.2$/;
// Marcatori di integrazione/avallo che, con FitMesh soggetto e fonte «nessuna», sono una promessa non ammessa.
// «diretta» e' anche «Bluetooth diretto» e «legge direttamente da Health Connect»: conta SOLO con un servizio di
// una terza parte nominato (Fitbit, Garmin, Google Health...) e, sul post Garmin, la decide garminPromiseProblems.
const OFFICIAL_MARKS = ["ufficiale", "partnership", "certificazione"];
const hasOfficialMark = (post: string, s: string, d: ClaimDetection): boolean =>
  d.marcatori.some((m) => OFFICIAL_MARKS.includes(m)) ||
  (post !== "garmin" && d.marcatori.includes("diretta") && THIRD_PARTY_SERVICE.test(s));

// Una frase della voce body.15.items[2] e' «stato onesto» se contiene la clausola di negazione ammessa della sua
// lingua, oppure il riferimento a Health Connect (la voce intera e' poi verificata dalla guardia isFitmeshSyncNegationCell).
export function isHonestStatusSentence(path: string, sentence: string): boolean {
  if (!GA_NEG_ITEM.test(path)) return false;
  const neg = GA_NEGATION[cellLang(path)];
  const t = nz(sentence);
  return /Health[ -]Connect/.test(t) || (neg !== undefined && neg.test(t));
}

export function classifyClaim(slugKey: string, path: string, sentence: string): ClaimDetection | null {
  const d0 = detectClaim(sentence);
  // Una frase che una guardia v3 segnala e' SEMPRE un claim registrato, anche se il rilevatore di richiamo la
  // classificherebbe sotto un altro tipo (priorita' fra tipi) o non la vedesse affatto.
  const s = normalizeClaimText(sentence);
  // sul post Fitbit vale anche l'attribuzione attributiva («un problema frequente»), come il vecchio divieto
  // l'attribuzione attributiva («un problema frequente», «a common cause») vale su tutti i post coperti
  const freqVerdict = fitbitFrequencyVerdict;
  const guardFreq = freqVerdict(path, s).length > 0;
  // la guardia di promessa Garmin e' tarata sul post Garmin (e' li' che gira nei test): su altri post darebbe falsi positivi
  const guardPromise = slugKey === "garmin" && garminPromiseProblems(s).length > 0;
  if ((guardFreq || guardPromise) && !(slugKey === "garmin" && (isGarminCta(path) || GA_NEG_ITEM.test(path)))) {
    const base = d0 ?? { tipo: "capacita" as const, soggetto: soggettoOf(s), polarita: "afferma" as const, marcatori: [] };
    return { ...base, tipo: guardFreq ? "frequenza" : "integrazione", polarita: "afferma" };
  }
  const d = d0;
  if (!d) return null;
  if (slugKey === "garmin" && isGarminCta(path)) return { ...d, tipo: "integrazione", polarita: "etichetta" };
  if (slugKey === "garmin" && isHonestStatusSentence(path, sentence)) {
    return { ...d, tipo: "negazione", polarita: "nega" };
  }
  if (d.polarita !== "afferma") return d;
  if (d.tipo === "frequenza") {
    return { ...d, polarita: freqVerdict(path, s).length > 0 ? "afferma" : "neutra" };
  }
  const promessa =
    (slugKey === "garmin" && garminPromiseProblems(s).length > 0) ||
    (d.soggetto === "fitmesh" && hasOfficialMark(slugKey, s, d)) ||
    // S6-02: una promessa FUTURA di FitMesh («Presto FitMesh importera'...», «FitMesh will add...») senza fonte
    (d.soggetto === "fitmesh" && d.tipo === "roadmap");
  if (d.tipo === "integrazione" || d.tipo === "roadmap" || d.tipo === "disponibilita") {
    return { ...d, polarita: promessa ? "afferma" : "neutra" };
  }
  return { ...d, polarita: "neutra" };
}

// ---- S6-04: classificazione coerente per CELLA EQUIVALENTE ----
// La stessa frase tradotta (stesso post, stesso percorso senza lingua, stessa posizione) non puo' essere «afferma» in
// una lingua e «neutra» in un'altra solo perche' il lessico di una lingua e' meno ricco. Se un fratello della stessa
// cella equivalente AFFERMA un tipo (frequenza, integrazione, roadmap, disponibilita'), ogni altro fratello con lo
// STESSO tipo rilevato e polarita' «neutra» diventa «afferma». Non tocca negazioni, domande ed etichette.
const RAISABLE = new Set(["frequenza", "integrazione", "roadmap", "disponibilita"]);
export const equivalentCellKey = (path: string, lang: string, indice: number): string =>
  `${path.replace(/^(?:ts|overlay):/, "").replace(new RegExp(`\\.${lang}(?=\\.|$)`), "")}#${indice}`;

export type ClassifiedSentence = ClaimSentence & { post: string; slug: string; det: ClaimDetection; raised: boolean };

export function harmonizeEquivalentCells(out: ClassifiedSentence[]): ClassifiedSentence[] {
  const groups = new Map<string, ClassifiedSentence[]>();
  for (const c of out) {
    const k = equivalentCellKey(c.path, c.lang, c.indice);
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k)!.push(c);
  }
  for (const g of groups.values()) {
    for (const tipo of RAISABLE) {
      if (!g.some((c) => c.det.tipo === tipo && c.det.polarita === "afferma")) continue;
      for (const c of g) {
        if (c.det.tipo === tipo && c.det.polarita === "neutra") {
          c.det = { ...c.det, polarita: "afferma" };
          c.raised = true;
        }
      }
    }
  }
  return out;
}

export function classifyPostClaims(post: string): ClassifiedSentence[] {
  const slug = COVERED_POSTS[post];
  const seen = new Set<string>();
  const out: ClassifiedSentence[] = [];
  for (const s of claimSentences(slug)) {
    const k = `${s.path}|${s.impronta}`;
    if (seen.has(k)) continue;
    const det = classifyClaim(post, s.path, s.testo);
    if (!det) continue;
    seen.add(k);
    out.push({ ...s, post, slug, det, raised: false });
  }
  return harmonizeEquivalentCells(out);
}

// ---- Politica e verdetto di sistema (usati dal test del registro e dal corpus S6) ----
// Marcatori che, con FitMesh soggetto, fanno di una frase di integrazione/roadmap/disponibilita' una promessa non
// ammessa senza fonte primaria ne' decisione di Matteo. «roadmap» = promessa futura di FitMesh (S6-02).
export const PROMISE_MARKS = ["ufficiale", "diretta", "partnership", "certificazione", "roadmap"];
export function isPolicyViolation(d: Pick<ClaimDetection, "tipo" | "soggetto" | "polarita" | "marcatori">): boolean {
  if (d.polarita !== "afferma") return false; // negazioni, domande, etichette, frasi neutre: ammesse
  if (d.tipo === "frequenza") return true; // frequenza attribuita a una causa/un problema
  return d.soggetto === "fitmesh" && d.marcatori.some((m) => PROMISE_MARKS.includes(m)) && ["integrazione", "roadmap", "disponibilita"].includes(d.tipo);
}

// Verdetto per una CELLA di testo come lo darebbero i test: guardia di cella (Garmin: promessa; altri post:
// frequenza) e politica del registro frase per frase. Vuoti = verde.
export function claimSystemVerdict(post: string, path: string, text: string): { guard: string[]; policy: string[] } {
  const t = nz(text);
  const guard = post === "garmin" ? garminCellVerdict(path, t) : fitbitFrequencyVerdict(path, t);
  const policy: string[] = [];
  for (const sentence of segmentCell(t)) {
    const d = classifyClaim(post, path, sentence);
    if (d && isPolicyViolation(d)) policy.push(`${d.tipo}/${d.soggetto}/[${d.marcatori.join(",")}]: ${sentence.slice(0, 80)}`);
  }
  return { guard, policy };
}
