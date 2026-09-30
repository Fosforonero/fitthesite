/**
 * Le letture della dashboard web: SOLO le righe del titolare.
 *
 * La RLS dice cosa un utente PUO' leggere, non cosa e' suo: su fitness_metrics
 * la policy dei gruppi consegna ai co-membri la riga intera (glicemia e
 * pressione comprese), e gli admin leggono profili, dispositivi e abbonamenti
 * di tutti. Per questo ogni lettura qui ha:
 *
 *   - un filtro esplicito sul proprietario, con l'uid dell'accesso concesso;
 *   - una lista di colonne esplicita, mai `*`;
 *   - un controllo dopo la lettura: se arriva una riga con un altro
 *     proprietario la lettura si ferma (errore), non la scarta in silenzio;
 *   - la paginazione, perche' PostgREST tronca in silenzio a max_rows e una
 *     pagina troncata mostrerebbe numeri sbagliati senza errore.
 *
 * Nessuna lettura di gruppo, famiglia, caregiver o sfida: il mandato del
 * 24/09/2026 non le estende ai membri di un gruppo.
 *
 * Si legge solo con un `AccessoConcesso`, che esiste solo come risposta di
 * `leggiVerdettoDashboard`: niente verdetto, niente dati premium.
 *
 * Le liste delle colonne coincidono con quelle di
 * supabase/tests/reset-pg17/18-test-letture-dashboard-titolare.sql, che le
 * esegue come `authenticated` su un database con gruppi e admin.
 *
 * ESTENSIONE del 29/09/2026 (regola di Matteo): entrano SOLO colonne la cui
 * fonte e' verificata sul percorso di scrittura (app 191, POST /api/v1/sync,
 * upsert_fitness_metrics_v189) e solo del titolare. Una colonna in whitelist
 * NON rende disponibile un grafico: lo stato lo decide il modulo delle derivazioni
 * (from-rows.ts, nel prototipo), riga per riga, e nel dubbio e' «assente».
 *   - hrv_rmssd: scalare, ma vale solo per sorgenti non iOS (su iPhone il server la
 *     azzera e il valore vive in hrv_sdnn): la regola sta in `hrvRmssdFromRow`.
 *   - intraday_steps, intraday_hr, sleep_stages: JSONB pesanti (egress), quindi NON
 *     stanno nella lista degli intervalli: si leggono un giorno per volta con
 *     `leggiSerieDelGiorno` e la lista COLONNE_SERIE_DEL_GIORNO.
 * Restano fuori, di proposito: glicemia, pressione, piani (somma senza dedup di
 * origine), sleep_start_ms/sleep_end_ms (le righe vecchie sono incoerenti con gli
 * stadi, che bastano), hrv_sdnn, intraday_calories, exercise_sessions, notes, e ogni
 * identificativo o nome di dispositivo: source_device, source_package, hr_source_name
 * e device_id sono testo libero che su iPhone puo' contenere il nome di una persona.
 * Fuori anche il titolo libero degli allenamenti, la FC massima e la fonte.
 *
 * Solo lato server.
 */
import { eAccessoConcesso, type AccessoConcesso } from './verdetto';

export const COLONNE_METRICHE = [
  'user_id',
  'local_day_key',
  'window_start_ms',
  'window_end_ms',
  'source',
  'steps',
  'distance_meters',
  'active_calories_kcal',
  'calories_kcal',
  'sleep_minutes',
  'heart_rate_bpm',
  'resting_heart_rate_bpm',
  'hrv_rmssd',
  'received_at',
] as const;

/**
 * Le colonne dei JSONB, lette SOLO per un giorno alla volta. `source` e `steps` ci sono
 * perche' la regola della serie oraria dei passi confronta la serie con il totale e con
 * la sorgente della STESSA riga.
 */
export const COLONNE_SERIE_DEL_GIORNO = [
  'user_id',
  'local_day_key',
  'source',
  'steps',
  'intraday_steps',
  'intraday_hr',
  'sleep_stages',
] as const;

export const COLONNE_ALLENAMENTI = [
  'user_id',
  'id',
  'start_ms',
  'end_ms',
  'type',
  'duration_min',
  'distance_meters',
  'calories_kcal',
  'hr_avg',
] as const;

type Colonna<T extends readonly string[]> = Exclude<T[number], 'user_id'>;
export type RigaMetrica = Record<Colonna<typeof COLONNE_METRICHE>, unknown>;
export type RigaSerie = Record<Colonna<typeof COLONNE_SERIE_DEL_GIORNO>, unknown>;
export type RigaAllenamento = Record<Colonna<typeof COLONNE_ALLENAMENTI>, unknown>;

export type Lettura<R> = {
  righe: R[];
  /** falso se ci si e' fermati al massimo di pagine: i dati sono parziali. */
  completo: boolean;
};

/** Sotto il max_rows di PostgREST (1000): una pagina piena non e' mai troncata. */
export const RIGHE_PER_PAGINA = 500;
export const MASSIMO_PAGINE = 40;

type RispostaPagina = PromiseLike<{
  data: Record<string, unknown>[] | null;
  error: { code?: string | null; message?: string | null } | null;
}>;

/** La sola parte del client Supabase che serve: un query builder PostgREST. */
export type ClientLetture = {
  from(tabella: 'fitness_metrics' | 'workouts'): {
    select(colonne: string): FiltroLetture;
  };
};
export type FiltroLetture = {
  eq(colonna: string, valore: string): FiltroLetture;
  gte(colonna: string, valore: string | number): FiltroLetture;
  lte(colonna: string, valore: string | number): FiltroLetture;
  lt(colonna: string, valore: string | number): FiltroLetture;
  order(colonna: string, opzioni: { ascending: boolean }): FiltroLetture;
  range(da: number, a: number): RispostaPagina;
};

export class ErroreLettura extends Error {
  constructor(
    readonly codice: 'accesso_non_concesso' | 'intervallo_non_valido' | 'riga_altrui' | 'errore_server',
    messaggio: string,
  ) {
    super(messaggio);
    this.name = 'ErroreLettura';
  }
}

const GIORNO = /^\d{4}-\d{2}-\d{2}$/;

function verificaAccesso(accesso: AccessoConcesso): string {
  if (!eAccessoConcesso(accesso)) {
    throw new ErroreLettura('accesso_non_concesso', 'lettura senza un accesso concesso dal verdetto');
  }
  return accesso.uid;
}

async function leggiPaginato<R>(
  pagina: (da: number, a: number) => RispostaPagina,
  uid: string,
  massimoPagine: number,
): Promise<Lettura<R>> {
  const righe: R[] = [];
  for (let p = 0; p < massimoPagine; p++) {
    const da = p * RIGHE_PER_PAGINA;
    const { data, error } = await pagina(da, da + RIGHE_PER_PAGINA - 1);
    // Solo il codice: un messaggio di PostgREST puo' contenere valori.
    if (error) throw new ErroreLettura('errore_server', `lettura non riuscita (${error.code ?? 'senza codice'})`);
    const lette = data ?? [];
    for (const riga of lette) {
      if (riga.user_id !== uid) {
        throw new ErroreLettura('riga_altrui', 'la lettura ha restituito una riga di un altro proprietario');
      }
      const { user_id: _proprietario, ...resto } = riga;
      righe.push(resto as R);
    }
    if (lette.length < RIGHE_PER_PAGINA) return { righe, completo: true };
  }
  return { righe, completo: false };
}

/** Le righe giornaliere del titolare fra due giorni locali, estremi compresi. */
export async function leggiMetricheDelTitolare(
  client: ClientLetture,
  accesso: AccessoConcesso,
  intervallo: { daGiorno: string; aGiorno: string },
  massimoPagine: number = MASSIMO_PAGINE,
): Promise<Lettura<RigaMetrica>> {
  const uid = verificaAccesso(accesso);
  if (!GIORNO.test(intervallo.daGiorno) || !GIORNO.test(intervallo.aGiorno)) {
    throw new ErroreLettura('intervallo_non_valido', 'i giorni vanno scritti come AAAA-MM-GG');
  }
  return leggiPaginato<RigaMetrica>(
    (da, a) =>
      client
        .from('fitness_metrics')
        .select(COLONNE_METRICHE.join(','))
        .eq('user_id', uid)
        .gte('local_day_key', intervallo.daGiorno)
        .lte('local_day_key', intervallo.aGiorno)
        .order('local_day_key', { ascending: true })
        .order('id', { ascending: true })
        .range(da, a),
    uid,
    massimoPagine,
  );
}

/**
 * Le righe del titolare di UN giorno locale con le serie (passi orari, battito, fasi del
 * sonno). Un giorno solo: quei JSONB pesano, e su un intervallo lungo l'egress crescerebbe
 * senza che nessuno li mostri. Piu' righe per lo stesso giorno sono normali (una per sorgente
 * e dispositivo): non si sommano e non si fondono qui, ogni riga si legge da sola.
 */
export async function leggiSerieDelGiorno(
  client: ClientLetture,
  accesso: AccessoConcesso,
  giorno: string,
  massimoPagine: number = MASSIMO_PAGINE,
): Promise<Lettura<RigaSerie>> {
  const uid = verificaAccesso(accesso);
  if (!GIORNO.test(giorno)) {
    throw new ErroreLettura('intervallo_non_valido', 'il giorno va scritto come AAAA-MM-GG');
  }
  return leggiPaginato<RigaSerie>(
    (da, a) =>
      client
        .from('fitness_metrics')
        .select(COLONNE_SERIE_DEL_GIORNO.join(','))
        .eq('user_id', uid)
        .eq('local_day_key', giorno)
        .order('id', { ascending: true })
        .range(da, a),
    uid,
    massimoPagine,
  );
}

/** Gli allenamenti del titolare iniziati nell'intervallo [daMs, aMs). */
export async function leggiAllenamentiDelTitolare(
  client: ClientLetture,
  accesso: AccessoConcesso,
  intervallo: { daMs: number; aMs: number },
  massimoPagine: number = MASSIMO_PAGINE,
): Promise<Lettura<RigaAllenamento>> {
  const uid = verificaAccesso(accesso);
  if (!Number.isFinite(intervallo.daMs) || !Number.isFinite(intervallo.aMs) || intervallo.daMs > intervallo.aMs) {
    throw new ErroreLettura('intervallo_non_valido', 'intervallo di tempo non valido');
  }
  return leggiPaginato<RigaAllenamento>(
    (da, a) =>
      client
        .from('workouts')
        .select(COLONNE_ALLENAMENTI.join(','))
        .eq('user_id', uid)
        .gte('start_ms', intervallo.daMs)
        .lt('start_ms', intervallo.aMs)
        .order('start_ms', { ascending: true })
        .order('id', { ascending: true })
        .range(da, a),
    uid,
    massimoPagine,
  );
}
