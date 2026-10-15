/**
 * La qualificazione dei passi, giorno per giorno (DASHBOARD-REAL-02, B3a).
 *
 * Dato l'insieme delle righe del titolare (quelle del reader, vedi letture-titolare.ts) e
 * la finestra dei sette giorni conclusi (finestra.ts), dice per OGNI giorno della finestra
 * che cosa si puo' affermare sui passi e che cosa no. E' un tipo di dominio PROPRIO della
 * dashboard reale: non dipende dal kit dei grafici, sara' la pagina a mapparlo ai punti.
 *
 * REGOLE (mandato del primo grafico):
 *   - nessuna riga per il giorno          -> nessun_dato. MAI zero.
 *   - piu righe per lo stesso giorno      -> ambiguo, qualunque ne sia il valore (anche una a
 *     zero, anche della stessa sorgente). Nessuna somma, nessun massimo, nessuna «riga
 *     migliore», nessuna precedenza fra sorgenti. NON e' «il dispositivo non ha dati».
 *     COSTO dichiarato: chi ha piu sorgenti (per esempio un telefono e Strava, Oura o un
 *     anello) ha giornate non visualizzabili; il reader non porta device_id ne source_device,
 *     quindi due righe con la stessa sorgente non si distinguono fra loro.
 *   - una riga, steps null o assente      -> nessun_dato.
 *   - una riga, steps non valido          -> non_disponibile: negativo, NaN, infinito, testo,
 *     booleano, oggetto, non intero, oltre i interi sicuri. Non corretto, non azzerato.
 *   - una riga, steps > 0                 -> ricevuto. Un valore RICEVUTO: non dice che la
 *     giornata sia completa (una giornata conclusa puo' ricevere sync tardive) e non porta
 *     nessuna copertura ne percentuale.
 *   - una riga, steps = 0                 -> segnaposto SOLO per le sorgenti il cui zero e'
 *     provatamente letterale nell'app (SORGENTI_CON_ZERO_SEGNAPOSTO); per tutte le altre
 *     non_determinabile.
 *
 * ZERO MISURATO NON ESISTE in questo modulo: nessuna sorgente della whitelist fornisce
 * l'evidenza del suo significato (l'app scrive 0 sia per «giornata ferma» sia per «passi non
 * letti»; il commento di health_snapshot.dart la' lo dichiara limite noto). Non c'e' uno
 * stato «zero misurato» e nessun percorso del codice produce `passi: 0`. Per ottenerlo
 * servirebbe un marcatore in una colonna della whitelist (per esempio una versione dello
 * schema scritta dall'app) e un GO: non e' in questo lotto.
 *
 * Il campo `source` e' testo libero (un utente puo' scriverci qualunque cosa): qui se ne
 * deriva UNA classe, «e' una delle due sorgenti con segnaposto provato si/no», e il testo
 * non esce dal modulo ne finisce nel risultato. Nel risultato ci sono solo `giorno`, `stato`
 * e, per `ricevuto`, `passi`.
 *
 * Il giorno si attribuisce per UGUAGLIANZA ESATTA di `local_day_key` con una data della
 * finestra: una chiave malformata (spazi, ora, altro formato) non e' attribuita a nessun
 * giorno. LIMITE: una riga cosi non genera ne ambiguita ne valore, quindi il giorno a cui
 * «doveva» appartenere puo' risultare nessun_dato. Il database la ammette (colonna di testo).
 *
 * Modulo puro: nessuno stato di modulo, nessuna cache, input mai modificato, risultato
 * congelato. L'unica lettura dell'orologio e' la verifica che la finestra sia conclusa.
 * Solo lato server.
 */
import { eFinestraConclusaValida, type FinestraGiorni } from './finestra';
import type { RigaMetrica } from './letture-titolare';

export type StatoPassi =
  | 'ricevuto'
  | 'ambiguo'
  | 'non_determinabile'
  | 'segnaposto'
  | 'non_disponibile'
  | 'nessun_dato';

export type GiornoPassi =
  /** UNA riga con un intero > 0. Non dimostra una giornata completa. */
  | { readonly giorno: string; readonly stato: 'ricevuto'; readonly passi: number }
  /** Due o piu righe per il giorno: nessun valore scelto, sommato o preferito. */
  | { readonly giorno: string; readonly stato: 'ambiguo' }
  /** UNA riga con steps = 0 da una sorgente senza prova: zero reale o passi non letti, indistinguibili. */
  | { readonly giorno: string; readonly stato: 'non_determinabile' }
  /** UNA riga con steps = 0 da una sorgente il cui zero e' provatamente letterale: la fonte non fornisce i passi. */
  | { readonly giorno: string; readonly stato: 'segnaposto' }
  /** UNA riga con un valore non valido (negativo, NaN, testo, non intero...). */
  | { readonly giorno: string; readonly stato: 'non_disponibile' }
  /** Nessuna riga, o una riga senza passi (steps null): nessun dato ricevuto. Mai zero. */
  | { readonly giorno: string; readonly stato: 'nessun_dato' };

/**
 * Le sole sorgenti il cui `steps = 0` e' PROVATAMENTE un segnaposto: il codice dell'app
 * scrive il letterale `steps: 0` nello snapshot, che porta solo exercise_sessions
 * (strava_oauth) o sonno e HRV (oura_oauth), in providers.dart, funzioni _stravaSnapshot e
 * _ouraSnapshot. Confronto di testo ESATTO, maiuscole comprese: un testo diverso non e'
 * provato. NON aggiungere voci senza la stessa prova (file e riga) nel referto.
 */
export const SORGENTI_CON_ZERO_SEGNAPOSTO: readonly string[] = Object.freeze(['strava_oauth', 'oura_oauth']);

/** Le sole colonne lette: tutto il resto della riga non entra nel calcolo. */
type RigaLetta = Readonly<Partial<Pick<RigaMetrica, 'local_day_key' | 'steps' | 'source'>>>;

type Candidata = { readonly steps: unknown; readonly segnaposto: boolean };

function qualificaGiorno(giorno: string, candidate: readonly Candidata[]): GiornoPassi {
  if (candidate.length === 0) return Object.freeze({ giorno, stato: 'nessun_dato' });
  if (candidate.length > 1) return Object.freeze({ giorno, stato: 'ambiguo' });
  const { steps, segnaposto } = candidate[0];
  if (steps === null || steps === undefined) return Object.freeze({ giorno, stato: 'nessun_dato' });
  if (typeof steps !== 'number' || !Number.isSafeInteger(steps) || steps < 0) {
    return Object.freeze({ giorno, stato: 'non_disponibile' });
  }
  if (steps > 0) return Object.freeze({ giorno, stato: 'ricevuto', passi: steps });
  return Object.freeze({ giorno, stato: segnaposto ? 'segnaposto' : 'non_determinabile' });
}

/**
 * Lo stato dei passi per ciascuno dei giorni della finestra, nell'ordine della finestra.
 *
 * Lancia RangeError se la finestra non e' ben formata o contiene un giorno non concluso
 * (un giorno aperto non si valuta mai), TypeError se `righe` non e' un array: sono errori
 * del chiamante, non dati, e NON diventano «nessun dato».
 */
export function qualificaPassi(righe: readonly RigaLetta[], finestra: FinestraGiorni): readonly GiornoPassi[] {
  if (!Array.isArray(righe)) throw new TypeError('le righe devono essere un array');
  if (!eFinestraConclusaValida(finestra)) {
    throw new RangeError('finestra dei giorni non valida o con un giorno non concluso');
  }
  const perGiorno = new Map<string, Candidata[]>();
  for (const giorno of finestra.giorni) perGiorno.set(giorno, []);
  for (const riga of righe) {
    if (typeof riga !== 'object' || riga === null) continue;
    const giorno = riga.local_day_key;
    if (typeof giorno !== 'string') continue;
    const lista = perGiorno.get(giorno);
    if (!lista) continue; // fuori finestra, o chiave non identica a una data della finestra
    const { source } = riga;
    lista.push({
      steps: riga.steps,
      segnaposto: typeof source === 'string' && SORGENTI_CON_ZERO_SEGNAPOSTO.includes(source),
    });
  }
  return Object.freeze(finestra.giorni.map((giorno) => qualificaGiorno(giorno, perGiorno.get(giorno) ?? [])));
}
