/**
 * Classificazione di una frase del contenuto coperto: rilevatore di richiamo + guardie v3 per decidere se la
 * frase AFFERMA davvero (frequenza attribuita a una causa/un problema, promessa di integrazione) oppure e'
 * neutra/etichetta/domanda. La stessa funzione serve al generatore e al test: la classificazione memorizzata
 * nel registro deve coincidere con quella ricalcolata, quindi non si puo' «declassare» una voce a mano.
 */
import { detectClaim, normalizeClaimText, type ClaimDetection } from "./claim-detectors";
import { GA_CTA_PATH, GA_NEGATION, cellLang, fitbitCellVerdict, fitbitFrequencyVerdict, garminPromiseProblems, nz } from "./text-guards-v3";

const soggettoOf = (s: string): ClaimDetection["soggetto"] => (/FitMesh/i.test(s) ? "fitmesh" : "generico");

// Etichette della CTA in riga rossa del post Garmin: ammesse a testo esatto dal test seo-metadata-batch1.
export const isGarminCta = (path: string): boolean => GA_CTA_PATH.test(path);
export const GA_NEG_ITEM = /^(?:ts|overlay):body\.15\.items\.[a-z]{2}\.2$/;
const OFFICIAL_MARKS = ["ufficiale", "partnership"]; // «diretta» da sola e' anche Bluetooth diretto: la decide garminPromiseProblems

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
  const freqVerdict = slugKey === "fitbit" ? fitbitFrequencyVerdict : fitbitCellVerdict;
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
    (d.soggetto === "fitmesh" && d.marcatori.some((m) => OFFICIAL_MARKS.includes(m)));
  if (d.tipo === "integrazione" || d.tipo === "roadmap" || d.tipo === "disponibilita") {
    return { ...d, polarita: promessa ? "afferma" : "neutra" };
  }
  return { ...d, polarita: "neutra" };
}
