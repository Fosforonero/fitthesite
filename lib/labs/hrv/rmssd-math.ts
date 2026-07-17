/**
 * FitMesh Labs: motore di calcolo HRV (RMSSD/SDNN da intervalli RR/IBI).
 *
 * Puro TypeScript, zero dipendenze da DOM/rete/storage: input -> output,
 * nessun side effect. Questo file NON deve mai importare da `next/*`,
 * `react`, o da alcun modulo che tocchi rete/cookie/localStorage: è il
 * cuore matematico dello strumento e deve restare testabile in isolamento
 * (vedi rmssd-math.test.ts) e verificabile da terzi senza eseguire l'app.
 *
 * Formule implementate (documentate anche nel copy della pagina):
 *   RMSSD = sqrt( sum_{i=1}^{n-1} (RR[i+1] - RR[i])^2 / (n-1) )
 *   HR derivata = 60000 / RR medio (ms)
 *   Deviazione standard degli intervalli inseriti: campionaria, denominatore
 *     (n-1): NON chiamata "SDNN" da questo modulo: SDNN in senso clinico
 *     richiede intervalli normal-to-normal ripuliti da artefatti/ectopie,
 *     cosa che questo tool esplicitamente NON fa (vedi Fase 3, "Qualità
 *     dati": nessuna rimozione automatica di intervalli sospetti).
 */

export type RrUnit = "ms" | "s";

export type RejectReason = "non-numeric" | "zero" | "negative";

export interface RejectedToken {
  raw: string;
  reason: RejectReason;
}

export interface AmbiguousToken {
  raw: string;
  /** Spiegazione testuale (IT) del perché il token è stato escluso senza tentare un'interpretazione automatica. */
  reason: string;
}

export interface ParsedRrInput {
  /** Intervalli validi, in millisecondi, nell'ordine originale di inserimento. */
  validIntervalsMs: number[];
  rejectedTokens: RejectedToken[];
  ambiguousTokens: AmbiguousToken[];
  /** Numero totale di token individuati nel testo grezzo (validi + rifiutati + ambigui). */
  totalTokensFound: number;
}

/**
 * Pattern di un chunk "ambiguo virgola-decimale": cifre, UNA virgola, 1-2
 * cifre finali, nient'altro, SENZA spazi adiacenti alla virgola (vedi
 * normalizzazione sotto). Es. "800,5" o "0,82". Attivo SOLO quando l'input
 * intero non contiene già un punto decimale altrove (se l'utente usa già il
 * punto per i decimali, la virgola è inequivocabilmente un separatore in
 * tutto il testo: vedi `hasDecimalPoint` sotto).
 */
const AMBIGUOUS_COMMA_DECIMAL_RE = /^\d+,\d{1,2}$/;

/**
 * Tokenizza l'input grezzo. Spazi, newline e punto e virgola sono SEMPRE
 * separatori (mai simboli decimali in nessuna lingua). La virgola è
 * ambigua SOLO quando è "stretta" fra due cifre senza spazio adiacente
 * (es. "800,5"): una virgola seguita o preceduta da uno spazio (es.
 * "800, 810", o una virgola finale prima di un a-capo) non è ambigua, è
 * chiaramente un separatore di lista scritto con lo stile "virgola normale
 * seguita da spazio": viene normalizzata a spazio PRIMA dello split
 * principale, così non finisce incollata al numero precedente/successivo.
 */
function tokenize(raw: string): { tokens: string[]; ambiguous: AmbiguousToken[] } {
  const hasDecimalPoint = /\d\.\d/.test(raw);

  // Una virgola adiacente a uno spazio (prima o dopo) è inequivocabilmente
  // un separatore, mai un simbolo decimale: nessuna lingua scrive "800 ,5"
  // o "800, 5" per indicare 800.5. Neutralizzata a spazio così i comma
  // "stretti" rimasti (es. "800,5") sono gli unici candidati all'ambiguità.
  const normalized = raw.replace(/,(?=\s)/g, " ").replace(/(?<=\s),/g, " ");

  const chunks = normalized
    .split(/[\s;]+/)
    .map((c) => c.trim())
    .filter((c) => c.length > 0);

  const tokens: string[] = [];
  const ambiguous: AmbiguousToken[] = [];

  for (const chunk of chunks) {
    if (!chunk.includes(",")) {
      tokens.push(chunk);
      continue;
    }

    if (!hasDecimalPoint && AMBIGUOUS_COMMA_DECIMAL_RE.test(chunk)) {
      // Nessun punto decimale nel testo E il chunk ha la forma esatta
      // "cifre,1-2cifre" senza spazi adiacenti alla virgola: potrebbe essere
      // un decimale scritto con la virgola (es. "800,5" = 800.5) oppure due
      // valori distinti incollati senza spazio. Non decidiamo per l'utente.
      ambiguous.push({
        raw: chunk,
        reason:
          `"${chunk}" è ambiguo: se intendevi un numero decimale usa il punto ` +
          `(es. ${chunk.replace(",", ".")}), se intendevi due valori separati ` +
          `aggiungi uno spazio (es. "${chunk.replace(",", " ")}").`,
      });
      continue;
    }

    // Virgola come separatore all'interno di un chunk "stretto" (es.
    // "800,-810,790" o "800,abc,790" o "800,810,790"): divide sempre in
    // parti individuali e lascia che la validazione numerica del chiamante
    // decida parte per parte (numero non valido/zero/negativo vengono
    // rifiutati singolarmente, non fanno fallire l'intero chunk).
    chunk
      .split(",")
      .map((p) => p.trim())
      .filter((p) => p.length > 0)
      .forEach((p) => tokens.push(p));
  }

  return { tokens, ambiguous };
}

/**
 * Converte l'input grezzo (textarea) in una lista di intervalli RR validi in
 * millisecondi, più le liste di token rifiutati/ambigui per la UI.
 *
 * Rifiuta SOLO valori non numerici, zero o negativi (per esplicita
 * indicazione dello sprint). Non filtra valori "fisiologicamente
 * implausibili" (troppo corti/lunghi): quelli restano nel calcolo, il tool
 * si limita a segnalarli come possibili artefatti nella UI, senza
 * rimuoverli né correggerli automaticamente.
 */
export function parseRrInput(raw: string, unit: RrUnit): ParsedRrInput {
  const { tokens, ambiguous } = tokenize(raw);
  const validIntervalsMs: number[] = [];
  const rejectedTokens: RejectedToken[] = [];

  for (const token of tokens) {
    const n = Number(token);
    if (!Number.isFinite(n) || Number.isNaN(n)) {
      rejectedTokens.push({ raw: token, reason: "non-numeric" });
      continue;
    }
    if (n === 0) {
      rejectedTokens.push({ raw: token, reason: "zero" });
      continue;
    }
    if (n < 0) {
      rejectedTokens.push({ raw: token, reason: "negative" });
      continue;
    }
    validIntervalsMs.push(unit === "s" ? n * 1000 : n);
  }

  return {
    validIntervalsMs,
    rejectedTokens,
    ambiguousTokens: ambiguous,
    totalTokensFound: tokens.length + ambiguous.length,
  };
}

export interface HrvMetrics {
  validIntervalCount: number;
  totalDurationMs: number;
  meanRrMs: number;
  derivedHeartRateBpm: number;
  rmssdMs: number;
  /** null quando RMSSD = 0: ln(0) non è definito (tende a -Infinity). */
  lnRmssd: number | null;
  stdDevMs: number;
  /** Denominatore usato per la deviazione standard: sempre esplicito, mai implicito. */
  stdDevDenominator: "n-1";
}

/**
 * Calcola le metriche HRV da una lista di intervalli RR validi (ms).
 * Ritorna `null` se gli intervalli validi sono meno di 2: RMSSD richiede
 * almeno una differenza successiva, quindi almeno 2 intervalli.
 */
export function calculateHrvMetrics(validIntervalsMs: number[]): HrvMetrics | null {
  const n = validIntervalsMs.length;
  if (n < 2) return null;

  const totalDurationMs = validIntervalsMs.reduce((a, b) => a + b, 0);
  const meanRrMs = totalDurationMs / n;
  const derivedHeartRateBpm = 60000 / meanRrMs;

  let sumSquaredSuccessiveDiffs = 0;
  for (let i = 0; i < n - 1; i++) {
    const diff = validIntervalsMs[i + 1] - validIntervalsMs[i];
    sumSquaredSuccessiveDiffs += diff * diff;
  }
  const rmssdMs = Math.sqrt(sumSquaredSuccessiveDiffs / (n - 1));
  const lnRmssd = rmssdMs > 0 ? Math.log(rmssdMs) : null;

  const sumSquaredDeviations = validIntervalsMs.reduce(
    (acc, rr) => acc + (rr - meanRrMs) ** 2,
    0,
  );
  // n - 1: se n === 1 questo ramo non è raggiungibile (return null sopra),
  // quindi il denominatore è sempre >= 1.
  const stdDevMs = Math.sqrt(sumSquaredDeviations / (n - 1));

  return {
    validIntervalCount: n,
    totalDurationMs,
    meanRrMs,
    derivedHeartRateBpm,
    rmssdMs,
    lnRmssd,
    stdDevMs,
    stdDevDenominator: "n-1",
  };
}

/**
 * Soglia di campione "corto": scelta editoriale di QUESTO strumento (non un
 * cutoff scientifico universale), usata solo per mostrare un avviso di
 * affidabilità, mai per bloccare il calcolo. Documentata nel copy della
 * pagina (sezione Limiti/Metodologia) con la stessa motivazione qui sotto:
 * la letteratura su registrazioni ultra-brevi discute soglie diverse a
 * seconda del contesto; 30 intervalli (~30 battiti) è un limite prudente e
 * dichiaratamente arbitrario sotto il quale il risultato è statisticamente
 * instabile.
 */
export const SHORT_SAMPLE_INTERVAL_THRESHOLD = 30;

export function isShortSample(validIntervalCount: number): boolean {
  return validIntervalCount < SHORT_SAMPLE_INTERVAL_THRESHOLD;
}

/** Dati di esempio precaricabili nel form: usati anche come test vector. */
export const SAMPLE_RR_INTERVALS_MS: readonly number[] = [
  812, 828, 795, 840, 803, 822, 788, 831, 806, 819, 797, 825, 811, 804, 833,
  798, 816, 809, 827, 792, 815, 801, 823, 807, 818, 796, 829, 805, 813, 799,
  820, 810,
];
