/**
 * Dalle colonne del server agli stati dei dati: le sole regole con cui una riga,
 * un valore nullo o l'ASSENZA di righe diventano misurato, zero misurato,
 * parziale o assente. Funzioni pure, nessun accesso a Supabase.
 *
 * Le regole, una per una (la tabella completa metrica per stato sta nel
 * resoconto dello sprint):
 *
 *  1. Un valore NULLO in una riga esistente e' un dato ASSENTE, mai 0. Il server
 *     scrive con `coalesce(nuovo, vecchio)`: un nullo vuol dire «nessun campione
 *     ricevuto», non «zero».
 *  2. Uno ZERO e' un dato solo per i contatori giornalieri (passi, distanza,
 *     calorie attive): 0 passi e' una misura (regola del prototipo sintetico; ATTENZIONE, la ricerca
 *     del 29/09/2026 mostra che sulle righe REALI lo zero dei contatori NON e' provato: l'app manda
 *     sempre passi, calorie, distanza e sonno non nulli, con 0 quando non ha letto, e le righe OAuth
 *     portano zeri finti. Prima di collegare dati reali la regola va decisa: vedi `columnMeasure`). Per i valori puntuali (battito,
 *     sonno, HRV) 0 non e' una misura possibile: e' assente, come fa l'app (il
 *     sonno e' un segnale solo se maggiore di 0). Anche la durata di una sessione
 *     con `duration_min = 0` e' ASSENTE («durata non ricevuta»): non e' provato
 *     dal codice dell'app che la fonte non scriva 0 quando non conosce la durata
 *     (e `coalesce(nuovo, vecchio)` conserva uno 0 scritto per errore). Torna a
 *     essere uno zero misurato solo dopo la verifica sul codice dell'app.
 *  3. L'ASSENZA di righe non e' mai zero. Un giorno senza righe di allenamenti
 *     non dice «zero allenamenti»: dice «nessun dato ricevuto», perche' il
 *     server non possiede nessun campo che provi «ho letto e non ce n'erano».
 *  4. Il parziale nasce solo da cio' che il server sa: il giorno non e' finito
 *     (`window_open`), oppure alcune righe non hanno il campo (`incomplete_coverage`).
 *     Mai una causa che il server non conosce (orologio spento, permesso tolto).
 *  5. UNA COLONNA IN WHITELIST NON RENDE DISPONIBILE UN GRAFICO (regola di Matteo, 29/09/2026).
 *     Le serie (passi orari, battito, fasi del sonno) e l'HRV si derivano solo con le funzioni
 *     `hourlyStepsFromRow`, `heartSeriesFromRow`, `sleepNightFromRow` e `hrvRmssdFromRow`: ognuna
 *     parte da «assente» e ne esce solo se la FORMA della riga prova la misura. Forma non
 *     riconosciuta, JSON illeggibile, indici fuori intervallo, unita' sbagliate (secondi al posto
 *     di millisecondi), serie corta, fuso non dimostrato: assente, mai un grafico a meta'.
 *     Gli stati sono solo quelli che la ricerca del 29/09 dichiara dimostrabili:
 *       - passi orari: misurato (ora `covered`, o storica con passi > 0); zero misurato SOLO per il
 *         percorso `samsungDiretto`; parziale se la riga dichiara un cumulativo (`srcCumul`);
 *       - battito: misurato o assente (mediane a 5 minuti; nessun minimo o massimo, nessuno zero);
 *       - sonno: misurato o assente (nessun marcatore di completezza, quindi mai parziale);
 *       - HRV: misurato o assente, solo per sorgenti non iOS.
 *     Le tre serie e l'HRV nascono dallo stesso percorso di scrittura: app 191, POST /api/v1/sync,
 *     upsert_fitness_metrics_v189. Ogni funzione legge UNA riga: le righe di sorgenti diverse dello
 *     stesso giorno non si sommano e non si fondono (la scelta fra sorgenti sta nell'app, non qui).
 *
 * ALLENAMENTI, RICONCILIATI CON L'APP 191. L'app NON legge mai `workouts`: legge
 * `fitness_metrics.exercise_sessions` e le unisce con `mergeExerciseSessions`
 * (row_collapse.dart), chiave (floor(start/60000) | floor(end/60000) | lower(trim(type ?? name))),
 * vince la versione «piu' ricca». Il web legge `workouts`, che il server riempie con
 * `upsert_workouts_v189` da quelle stesse sessioni (best effort: se l'upsert fallisce, una
 * sessione resta in `exercise_sessions` e manca in `workouts`). Il web NON legge
 * `exercise_sessions` (e' un JSONB fuori whitelist): la stessa attivita' non puo' essere contata
 * due volte fra le due sorgenti perche' ne esiste una sola. La chiave del web e' la piu' vicina
 * possibile a quella dell'indice unico del server. Divergenze che RESTANO, dichiarate:
 *   - il server deduplica anche per `device_id`, che non e' in whitelist: due telefoni con gli
 *     stessi orari sono una sessione sola per il web;
 *   - l'app arrotonda al minuto (start e end), il web e il server confrontano il millisecondo:
 *     due righe che differiscono di secondi restano due sessioni per il web (il server le fonde
 *     entro 120 s e 90% di sovrapposizione solo se create dopo 189-RC2 e dello stesso dispositivo);
 *   - `type` NULL (righe vecchie con solo `name`): l'app usa `name`, il web ha `''`;
 *   - `calories_kcal` e' NULL per le sessioni Health Connect/HealthKit (l'app scrive
 *     `activeCaloriesKcal`, che la route non legge): assente, mai 0;
 *   - il giorno: l'app lo prende dalla riga che contiene la sessione, il web dall'istante di
 *     `start_ms` nel fuso di chi guarda;
 *   - `duration_min = 0` viene da round((end - start) / 60000): e' una sessione sotto i 30
 *     secondi, uno zero vero ma senza senso come durata. Resta ASSENTE, come prima;
 *   - spazi bianchi nel tipo: il web toglie ai bordi anche tabulazioni e a capo, come l'app;
 *     `trim()` di Postgres toglie solo gli spazi. Qui il web coincide con l'app, non con il server;
 *   - fuso non valido o vuoto: nessun allenamento viene attribuito a un giorno, ogni giorno e' assente
 *     (mai un'eccezione che fa cadere la pagina).
 *
 * SERIE: DIVERGENZE CHE RESTANO, dichiarate (dettaglio nel commento di ogni funzione):
 *   - sonno: la ripartizione per fase si confronta e si riporta sul totale ricavato dagli stadi, non
 *     sulla colonna `sleep_minutes` come fa l'app;
 *   - battito: `minute` e' il tempo trascorso dalla mezzanotte locale, non l'ora dell'orologio. Nei
 *     giorni del cambio d'ora (23 o 25 ore) chi disegna l'asse deve etichettarlo dall'istante, non da
 *     minute / 60;
 *   - passi orari: nella riga di oggi l'ora in corso esce misurata e le ore future `no_samples`
 *     (manca il contesto del giorno); nel giorno di 25 ore l'ora 2 somma due ore reali. La funzione non
 *     e' collegata alle schermate: va risolto prima di collegarla.
 */
import { TZ } from './format';
import { absent, partial, sumMeasures, value, type AbsentReason, type Measure } from './measure';
import type { SleepBlock, SleepNight, SleepStage, SourceId, SourceRow, Workout, WorkoutsWeekDay } from './model';
import { SOURCE_IDS } from './model';

/** `counter`: 0 e' una misura. `spot`: 0 non e' una misura possibile (assente). */
export type ColumnPolicy = 'counter' | 'spot';

/**
 * Una colonna numerica di UNA riga esistente. Null, undefined, NaN, testo o un
 * numero negativo non sono un valore: sono assenti. Lo zero segue la politica.
 */
export function columnMeasure(raw: unknown, policy: ColumnPolicy): Measure<number> {
  if (typeof raw !== 'number' || !Number.isFinite(raw) || raw < 0) return absent('no_samples');
  if (raw === 0 && policy === 'spot') return absent('no_samples');
  return value(raw);
}

/**
 * La durata di una sessione (`duration_min`). Nulla, negativa o illeggibile: assente. Anche
 * ZERO e' assente («durata non ricevuta»): l'app potrebbe scrivere 0 quando la fonte non
 * da' la durata, e non e' verificato sul suo codice. Non e' uno zero misurato.
 */
export function durationMeasure(raw: unknown): Measure<number> {
  return columnMeasure(raw, 'spot');
}

/** Cio' che serve a dire PERCHE' un giorno senza righe manca. Tutto e' calcolabile da `received_at` e dall'orologio. */
export interface DayContext {
  /** Oggi nel fuso di chi guarda (AAAA-MM-GG). */
  today: string;
  /** Quanta parte di oggi e' trascorsa, 0..1: la finestra di oggi e' aperta. */
  todayFraction: number;
  /**
   * Giorno locale del `received_at` piu' recente in tutta la lettura; `null` se non e' arrivato nulla.
   * Per gli allenamenti e' un'APPROSSIMAZIONE: `workouts` non ha `received_at` nella whitelist, quindi si
   * usa quello di `fitness_metrics`, e l'invio degli allenamenti e' best effort dopo quello delle metriche.
   * `not_synced_yet` per gli allenamenti dice «dopo l'ultimo invio di metriche», non «dopo l'ultimo invio di allenamenti».
   */
  lastReceivedDay: string | null;
  timeZone?: string;
}

/**
 * Il motivo per cui un giorno SENZA righe e' assente. Mai «zero».
 * Il server conosce le sorgenti solo attraverso le righe: se non e' arrivata nessuna riga
 * non sa se una sorgente sia collegata, sa solo che «nessun dato e' stato ricevuto».
 */
export function absentReasonForDay(day: string, ctx: DayContext): AbsentReason {
  if (day > ctx.today) return 'not_yet';
  if (ctx.lastReceivedDay === null) return 'no_data_received';
  if (day > ctx.lastReceivedDay) return 'not_synced_yet';
  // Prima dell'ultimo dato ricevuto il server non sa dire altro che «nessun campione»: non distingue
  // «la fonte non fornisce il tipo» da «nessun dato».
  return 'no_samples';
}

/**
 * Il giorno locale (AAAA-MM-GG) di un istante, nel fuso dato. `null` se l'istante non e' leggibile o se il
 * fuso non e' valido o e' vuoto (mai un'eccezione: chi chiama tratta `null` come «giorno non attribuibile»).
 */
export function localDayOf(ms: unknown, timeZone: string = TZ): string | null {
  if (typeof ms !== 'number' || !Number.isFinite(ms)) return null;
  const fmt = dayFormatter(timeZone);
  if (fmt === null) return null;
  try {
    return fmt.format(new Date(ms));
  } catch {
    return null;
  }
}

/**
 * Le colonne di `workouts` che servono al riquadro settimanale: il giorno si
 * ricava da `start_ms`, l'identita' della sessione da `start_ms`, `end_ms` e `type`.
 */
export interface WorkoutRowLike {
  start_ms: unknown;
  duration_min: unknown;
  end_ms?: unknown;
  type?: unknown;
}

/** Le righe di `workouts` che corrispondono agli allenamenti del modello (per la sola derivazione settimanale). */
export function workoutRowsOf(list: readonly Workout[]): WorkoutRowLike[] {
  return list.map((w) => ({
    start_ms: Date.parse(w.startedAt),
    end_ms: Date.parse(w.startedAt) + (w.durationMin.kind === 'absent' ? 0 : w.durationMin.value) * 60_000,
    type: w.type,
    duration_min: w.durationMin.kind === 'absent' ? null : w.durationMin.value,
  }));
}

/**
 * Una sessione, una riga. Prima della correzione 189-RC2 ogni nuovo invio della
 * stessa sessione aggiungeva una riga uguale (misurati 30.575 righe per 4.345
 * sessioni distinte, circa l'86% duplicati) e le righe vecchie restano. Senza
 * questo passaggio il numero di allenamenti e la durata totale sarebbero gonfiati.
 * L'identita' e' (start_ms, end_ms, tipo minuscolo senza spazi bianchi ai bordi), tutte colonne della
 * whitelist; fra righe uguali vale la durata piu' alta fra quelle presenti (gli
 * invii successivi completano i campi, non li tolgono).
 *
 * DIVERGENZA DAL SERVER: la chiave dell'indice unico (migration 20260722084223) e'
 * (user_id, device_id, start_ms, end_ms, lower(trim(type))). `device_id` NON e' nella
 * whitelist di lib/dashboard/letture-titolare.ts, quindi qui due dispositivi con gli
 * stessi orari e lo stesso tipo diventano una sessione sola: il conteggio web e'
 * «non fuso per dispositivo». L'app inoltre fonde le sessioni sovrapposte con orari
 * diversi (mergeExerciseSessions), cosa che il web non fa: numero e durata possono
 * risultare piu' alti di quelli dell'app.
 *
 * SPAZI BIANCHI: `.trim()` di JavaScript toglie ai bordi spazi, tabulazioni e a capo, come il trim di Dart
 * nell'app. `trim()` di Postgres toglie SOLO gli spazi: per il server 'run\t' e 'run' sono due sessioni, per
 * il web e per l'app una. Il web coincide con l'app, non con il server.
 */
export function dedupeWorkoutRows(rows: readonly WorkoutRowLike[]): WorkoutRowLike[] {
  const byIdentity = new Map<string, WorkoutRowLike>();
  const loose: WorkoutRowLike[] = [];
  for (const row of rows) {
    if (typeof row.start_ms !== 'number' || !Number.isFinite(row.start_ms)) {
      loose.push(row);
      continue;
    }
    const key = `${row.start_ms}|${String(row.end_ms ?? '')}|${String(row.type ?? '').trim().toLowerCase()}`;
    const seen = byIdentity.get(key);
    if (!seen) {
      byIdentity.set(key, row);
      continue;
    }
    const a = durationMeasure(seen.duration_min);
    const b = durationMeasure(row.duration_min);
    if (b.kind === 'value' && (a.kind !== 'value' || b.value > a.value)) byIdentity.set(key, { ...seen, duration_min: row.duration_min });
  }
  return [...byIdentity.values(), ...loose];
}

/**
 * Numero di allenamenti e durata totale per giorno, derivati SOLO dalle righe di
 * `workouts` (colonne `start_ms` e `duration_min`).
 *
 *  - le righe uguali (stessa sessione inviata piu' volte) contano una volta sola;
 *  - almeno una riga nel giorno: il numero e' misurato, la durata e' la somma
 *    delle righe che hanno `duration_min` maggiore di 0 (una riga con 0 o senza il
 *    campo non e' un valore: la somma diventa parziale, e se nessuna riga ha la
 *    durata il giorno ha il numero ma la durata e' assente, «durata non ricevuta»);
 *  - nessuna riga: assente, con il motivo. MAI zero allenamenti: il server non
 *    ha un campo che provi che li ha letti tutti e non ce n'erano;
 *  - oggi: la giornata e' aperta, quindi parziale (`window_open`).
 */
export function workoutsWeekFromRows(rows: readonly WorkoutRowLike[], days: readonly string[], ctx: DayContext): WorkoutsWeekDay[] {
  const tz = ctx.timeZone ?? TZ;
  const byDay = new Map<string, WorkoutRowLike[]>();
  for (const row of dedupeWorkoutRows(rows)) {
    const day = localDayOf(row.start_ms, tz);
    if (day === null) continue;
    byDay.set(day, [...(byDay.get(day) ?? []), row]);
  }
  return days.map((date) => {
    const dayRows = byDay.get(date) ?? [];
    if (dayRows.length === 0) {
      const reason = absentReasonForDay(date, ctx);
      return { date, count: absent(reason), durationMin: absent(reason) };
    }
    const open = date === ctx.today;
    const fraction = Number.isFinite(ctx.todayFraction) ? Math.min(1, Math.max(0, ctx.todayFraction)) : 0;
    const count: Measure<number> = open ? partial(dayRows.length, fraction, 'window_open') : value(dayRows.length);
    let duration = sumMeasures(dayRows.map((r) => durationMeasure(r.duration_min)));
    if (open && duration.kind !== 'absent') {
      duration = partial(duration.value, duration.kind === 'partial' ? Math.min(duration.coverage, fraction) : fraction, 'window_open');
    }
    return { date, count, durationMin: duration };
  });
}

/**
 * Le sessioni di un giorno come misura. Una lista vuota NON e' «zero
 * allenamenti misurato»: e' assente, con il motivo che il chiamante ricava da
 * `absentReasonForDay`. E' l'unico punto che costruisce `Measure<Workout[]>`.
 */
export function workoutsSessions(list: readonly Workout[], emptyReason: AbsentReason): Measure<Workout[]> {
  return list.length === 0 ? absent(emptyReason) : value([...list]);
}


// ─────────────────────────────────────────────────────────────────────────────
// Sorgenti: vocabolario chiuso e ultimo dato ricevuto
// ─────────────────────────────────────────────────────────────────────────────

/**
 * I soli valori di `fitness_metrics.source` che l'app scrive (percorsi in providers.dart e
 * platform_source.dart). Il server NON valida la colonna (`z.string().nullish()`): un utente
 * puo' scrivere qualunque testo nelle proprie righe, anche un nome di persona. Per questo la
 * tabella e' chiusa e ogni altro valore, o un valore non testuale, diventa `other`.
 */
const SOURCE_BY_COLUMN: Readonly<Record<string, SourceId>> = Object.freeze({
  health_connect: 'health_connect',
  healthkit: 'healthkit',
  apple_health: 'healthkit',
  colmi_ble: 'ring',
  strava_oauth: 'strava',
  oura_oauth: 'oura',
  suunto_oauth: 'suunto',
});

/** L'id del vocabolario chiuso. `Object.hasOwn`: `constructor` o `__proto__` non sono sorgenti. */
export function sourceIdOf(raw: unknown): SourceId {
  return typeof raw === 'string' && Object.hasOwn(SOURCE_BY_COLUMN, raw) ? SOURCE_BY_COLUMN[raw] : 'other';
}

/** Le colonne che servono a dire quando e' arrivato l'ultimo dato di una sorgente. */
export interface ReceivedRowLike {
  source?: unknown;
  received_at?: unknown;
}

/**
 * Una riga per sorgente del vocabolario, con l'ultimo `received_at` letto. Solo il QUANDO: il
 * server non ha una cronologia (`received_at` e' sovrascritto a ogni invio) ne' l'esito dei sync.
 * Una riga con `received_at` illeggibile non genera la sorgente: dire «mai arrivato nulla» di una
 * sorgente di cui esiste una riga sarebbe falso, e inventare un momento pure. Nessun testo della
 * riga arriva al risultato, solo l'id del vocabolario e l'istante.
 */
export function sourcesFromRows(rows: readonly ReceivedRowLike[]): SourceRow[] {
  const latest = new Map<SourceId, number>();
  for (const row of rows) {
    const ms = typeof row.received_at === 'string' ? Date.parse(row.received_at) : Number.NaN;
    if (!Number.isFinite(ms)) continue;
    const id = sourceIdOf(row.source);
    if (ms > (latest.get(id) ?? Number.NEGATIVE_INFINITY)) latest.set(id, ms);
  }
  return SOURCE_IDS.filter((id) => latest.has(id)).map((id) => ({
    ref: { id },
    lastReceivedAt: new Date(latest.get(id) as number).toISOString(),
  }));
}

// ─────────────────────────────────────────────────────────────────────────────
// HRV
// ─────────────────────────────────────────────────────────────────────────────

/**
 * `hrv_rmssd` e' un RMSSD in millisecondi solo per queste sorgenti (Health Connect, Oura, Suunto,
 * anello). Su iPhone il server scrive SEMPRE `hrv_rmssd = NULL` e mette il valore in `hrv_sdnn`
 * (un'altra metrica, mai fusa con questa), e le righe storiche `healthkit`/`apple_health` hanno
 * SDNN dentro `hrv_rmssd` (67 + 14 righe di 7 utenti, audit di luglio 2026, mai corrette).
 */
const HRV_RMSSD_SOURCES: ReadonlySet<string> = new Set(['health_connect', 'oura_oauth', 'suunto_oauth', 'colmi_ble']);

export interface HrvRowLike {
  source?: unknown;
  hrv_rmssd?: unknown;
}

/** Misurato (> 0, sorgente non iOS) oppure assente. Mai zero, mai parziale, mai un valore di iPhone. */
export function hrvRmssdFromRow(row: HrvRowLike): Measure<number> {
  if (typeof row.source !== 'string' || !HRV_RMSSD_SOURCES.has(row.source)) return absent('source_lacks_type');
  return columnMeasure(row.hrv_rmssd, 'spot');
}

// ─────────────────────────────────────────────────────────────────────────────
// Passi orari (`intraday_steps`)
// ─────────────────────────────────────────────────────────────────────────────

export const HOURS_PER_DAY = 24;

/** Tolleranza di riconciliazione fra bucket e totale: 1% arrotondato per eccesso, fra 1 e 100 (steps_reconciliation.dart). */
export function stepsReconciliationTolerance(declaredTotal: number): number {
  return Math.min(100, Math.max(1, Math.ceil(declaredTotal * 0.01)));
}

const noHours = (): Measure<number>[] => Array.from({ length: HOURS_PER_DAY }, () => absent<number>('no_samples'));

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

export interface StepsSeriesRowLike {
  steps?: unknown;
  intraday_steps?: unknown;
}

/**
 * Le 24 ore di UNA riga, come le scrive l'app (`_buildIntradaySteps`): un array di ESATTAMENTE 24
 * oggetti `{hour: 0..23, steps: intero >= 0, covered?, srcSame?, srcCumul?, srcPath?, srcCovH?, ...}`.
 * Parte da 24 assenti; ne esce solo se TUTTI i controlli passano.
 *
 * Forma (una violazione = serie assente, non «qualche ora»):
 *  - array di 24 elementi, ognuno un oggetto con `hour` intero 0..23 mai ripetuto e `steps` intero >= 0;
 *  - `covered`, se c'e', e' un booleano. Le fette dell'anello (`startMinute`, `complete`) non hanno
 *    `hour`: forma non verificata, assenti;
 *  - somma dei passi > 0. Una serie a zero e' quella di una riga senza dettaglio (125 su 2.406 in 14
 *    giorni, 18/08/2026, esistono ancora nel database), non un giorno fermo.
 *
 * Provenienza e copertura, dalla PRIMA voce come fa l'app (`_seriesProvenance`):
 *  - `srcSame === false`: la serie e' di un'altra origine rispetto al totale della riga. L'app la usa
 *    come serie non confrontabile; il web non ha la fusione e non sa dire di CHI sia: assente;
 *  - `srcCumul === true`: la fonte dichiara anche un cumulativo, i bucket coprono solo una parte del
 *    giorno. Ore parziali (`incomplete_coverage`) con copertura = ore dichiarate coperte / 24, che si
 *    fida solo se le ore `covered: true` coincidono con `srcCovH` (altrimenti l'app non sa e il web
 *    nemmeno: assente);
 *  - altrimenti la serie deve riconciliarsi col totale `steps` DELLA STESSA riga entro la tolleranza
 *    (`stepsReconciliationTolerance`). Fuori tolleranza la fonte contraddice se stessa: assente.
 *    Se la provenienza e' ignota (righe storiche senza `src*`) l'app la mostra comunque; il web e'
 *    piu' severo e chiede la stessa riconciliazione.
 *
 * Per ora:
 *  - `covered === false`: assente (non so, mai zero);
 *  - passi > 0: misurato (o parziale col cumulativo);
 *  - passi = 0: zero misurato SOLO se `covered === true` e `srcPath === 'samsungDiretto'` (li' `covered`
 *    e' la presenza del gruppo di record, quindi un'ora ferma e' misurata) e senza cumulativo. Ovunque
 *    altrove uno zero orario e' «non so»: assente.
 *
 * Il fuso non serve: `hour` e' gia' l'ora locale del telefono.
 *
 * Riconciliazione: si sommano solo le ore con `covered !== false`, come l'app (`_buckets`, poi
 * `dedupedBucketTotal`). Un'ora dichiarata non coperta e' assente e non conta nel totale.
 *
 * CASI NON ANCORA GESTITI (la funzione non e' collegata alle schermate; vanno risolti prima di collegarla):
 *  - riga di OGGI: la funzione non conosce l'orologio. L'ora in corso esce misurata e non parziale
 *    (`window_open`), le ore future escono assenti con `no_samples` e non `not_yet`. Serve passarle il
 *    contesto del giorno;
 *  - giorno di 25 ORE: l'ora 2 contiene i passi di due ore reali, perche' l'app somma le due fette nello
 *    stesso indice. Il web la mostra come una sola ora (fixture nei test);
 *  - giorno di 23 ore: l'ora saltata e' una voce come le altre, di solito senza passi, quindi assente.
 */
export function hourlyStepsFromRow(row: StepsSeriesRowLike): Measure<number>[] {
  const raw = row.intraday_steps;
  if (!Array.isArray(raw) || raw.length !== HOURS_PER_DAY) return noHours();

  const byHour: Record<string, unknown>[] = new Array(HOURS_PER_DAY);
  let total = 0;
  for (const entry of raw) {
    if (!isRecord(entry)) return noHours();
    const { hour, steps, covered } = entry;
    if (typeof hour !== 'number' || !Number.isInteger(hour) || hour < 0 || hour >= HOURS_PER_DAY) return noHours();
    if (byHour[hour] !== undefined) return noHours();
    if (typeof steps !== 'number' || !Number.isInteger(steps) || steps < 0) return noHours();
    if (covered !== undefined && typeof covered !== 'boolean') return noHours();
    byHour[hour] = entry;
    // Come l'app (`_buckets`, poi `dedupedBucketTotal`): un'ora dichiarata non coperta non entra nella somma.
    if (covered !== false) total += steps;
  }
  if (total <= 0) return noHours();

  const head = raw[0] as Record<string, unknown>;
  if (head.srcSame === false) return noHours();
  const cumulative = head.srcCumul === true;

  let coverage = 1;
  if (cumulative) {
    const covered = coveredHoursDeclared(raw as Record<string, unknown>[]);
    if (covered === null || covered <= 0) return noHours();
    coverage = covered / HOURS_PER_DAY;
  } else {
    const declared = row.steps;
    if (typeof declared !== 'number' || !Number.isFinite(declared) || declared <= 0) return noHours();
    if (Math.abs(total - declared) > stepsReconciliationTolerance(declared)) return noHours();
  }

  const direct = head.srcPath === 'samsungDiretto';
  return byHour.map((entry) => {
    const steps = entry.steps as number;
    if (entry.covered === false) return absent<number>('no_samples');
    if (steps === 0) return entry.covered === true && direct && !cumulative ? value(0) : absent<number>('no_samples');
    return cumulative ? partial(steps, coverage, 'incomplete_coverage') : value(steps);
  });
}

/**
 * Le ore distinte con `covered: true`, come `_oreCoperteDichiarate` dell'app: `null` («non lo so»)
 * se nessuna voce dichiara `covered`, se `srcCovH` compare con valori diversi, o se il numero
 * dichiarato non coincide con le ore contate. Trasformare `null` in 0 riaprirebbe la deduzione
 * «nessuna ora coperta = giorno fermo» che l'app esiste per impedire.
 */
function coveredHoursDeclared(entries: readonly Record<string, unknown>[]): number | null {
  const hours = new Set<number>();
  let anyDeclares = false;
  let declaredCovH: number | null = null;
  for (const e of entries) {
    if (typeof e.srcCovH === 'number' && Number.isFinite(e.srcCovH)) {
      const v = Math.trunc(e.srcCovH);
      if (declaredCovH !== null && declaredCovH !== v) return null;
      declaredCovH = v;
    }
    if (typeof e.covered !== 'boolean') continue;
    anyDeclares = true;
    if (e.covered) hours.add(e.hour as number);
  }
  if (!anyDeclares) return null;
  if (declaredCovH !== null && declaredCovH !== hours.size) return null;
  return hours.size;
}

/** Vero se almeno un'ora e' un dato: una serie tutta assente non si disegna. */
export const hasAnyHour = (hours: readonly Measure<number>[]): boolean => hours.some((m) => m.kind !== 'absent');

// ─────────────────────────────────────────────────────────────────────────────
// Battito (`intraday_hr`)
// ─────────────────────────────────────────────────────────────────────────────

/** Un bucket da 5 minuti: la MEDIANA dei campioni della fonte con priorita' piu' alta in quel bucket. */
export interface HeartBucket {
  /**
   * Minuti trascorsi dall'inizio del giorno locale all'inizio del bucket: (ts - inizio del giorno) / 60000.
   * Sempre crescente, anche nell'ora ripetuta: 0-1435 in un giorno di 24 ore, fino a 1375 in uno di 23 e
   * fino a 1495 in uno di 25. NON e' l'ora dell'orologio: dopo il cambio d'ora le due differiscono di 60.
   */
  minute: number;
  bpm: number;
}

export interface HeartRowLike {
  local_day_key?: unknown;
  intraday_hr?: unknown;
}

const HR_BUCKET_MS = 5 * 60 * 1000;
/** Da 2000 a 2100: fuori sono secondi o microsecondi scritti al posto dei millisecondi. */
const EPOCH_MS_MIN = 946_684_800_000;
const EPOCH_MS_MAX = 4_102_444_800_000;
const isEpochMs = (v: unknown): v is number => typeof v === 'number' && Number.isSafeInteger(v) && v >= EPOCH_MS_MIN && v <= EPOCH_MS_MAX;

/** Il formattatore del giorno locale (AAAA-MM-GG) nel fuso dato, o `null` se il fuso non e' valido o e' vuoto. */
function dayFormatter(timeZone: unknown): Intl.DateTimeFormat | null {
  if (typeof timeZone !== 'string' || timeZone === '') return null;
  try {
    return new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' });
  } catch {
    return null;
  }
}

const QUARTER_HOUR_MS = 15 * 60_000;

/**
 * Il primo istante del giorno locale `day` (la mezzanotte, o l'ora in cui il giorno comincia davvero se il
 * cambio d'ora salta la mezzanotte). Si cerca a passi di 15 minuti in una finestra di 15 ore attorno alla
 * mezzanotte UTC: ogni fuso attuale ha scarti multipli di 15 minuti. `null` se il giorno non esiste.
 */
function localDayStartMs(day: string, fmt: Intl.DateTimeFormat): number | null {
  const [y, m, d] = day.split('-').map(Number);
  const base = Date.UTC(y, m - 1, d);
  if (!Number.isFinite(base)) return null;
  for (let t = base - 15 * 3_600_000; t <= base + 15 * 3_600_000; t += QUARTER_HOUR_MS) {
    if (fmt.format(new Date(t)) === day) return t;
  }
  return null;
}

/** Il giorno dopo `day` (AAAA-MM-GG), sul calendario, senza fuso. */
function nextDayKey(day: string): string {
  const [y, m, d] = day.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + 1)).toISOString().slice(0, 10);
}

/**
 * I bucket di battito di UNA riga, sul giorno locale `local_day_key`. `intraday_hr` e' un array di
 * `{ts: epoch ms d'inizio bucket, bpm}`, una voce ogni 5 minuti (288 in un giorno di 24 ore, 276 o 300 nei giorni
 * del cambio d'ora), MEDIANE a 5 minuti della sola
 * fonte con la priorita' piu' alta di quella riga (`_buildIntradayHr`), non campioni.
 *
 * Per questo NON esistono qui minimo e massimo: sarebbero il minimo e il massimo di mediane, non gli
 * estremi veri. Ne' zero (bpm 25-240) ne' parziale (nessun marcatore di completezza): o un bucket c'e',
 * o e' un buco.
 *
 * FUSO. Il server non conosce il fuso di chi ha misurato (`profiles.time_zone` e' il default per 572 su
 * 573 righe e l'app non lo invia): mettere un bucket «alle 08:15» richiede un fuso che nessun dato prova.
 * `timeZone` e' quindi un ARGOMENTO, e senza (`null`) o non valido la serie e' assente. Il chiamante lo
 * passa solo quando lo ha dimostrato; l'ipotesi Europe/Rome del prototipo non e' una prova. Con un fuso
 * dato, contano solo i bucket che cadono davvero in `local_day_key`: un fuso sbagliato sposta i bucket
 * fuori dal giorno e la serie sparisce invece di mostrare ore false.
 *
 * Forma: `ts` intero in millisecondi (2000-2100) e multiplo di 5 minuti come li scrive l'app, `bpm`
 * intero 25-240. Una voce che non lo rispetta si scarta (e' un buco, non un valore). Due voci con lo
 * stesso `ts`: la forma non e' quella scritta dall'app, serie assente. Il limite di voci si conta solo sui
 * bucket che cadono nel giorno, sulla sua durata reale: le voci di altri giorni si scartano e basta (il
 * costruttore dell'app scarta solo quelle prima della mezzanotte, il server non limita).
 *
 * POSIZIONE: `minute` e' il tempo trascorso dalla mezzanotte locale, non l'ora dell'orologio. Nel giorno di
 * 25 ore le 02:00 legali e le 02:00 solari sono 120 e 180, e il grafico non torna mai indietro.
 */
export function heartSeriesFromRow(row: HeartRowLike, timeZone: string | null): Measure<HeartBucket[]> {
  const none = absent<HeartBucket[]>('no_samples');
  const fmt = dayFormatter(timeZone);
  if (fmt === null) return none;
  const day = row.local_day_key;
  if (typeof day !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(day)) return none;
  const raw = row.intraday_hr;
  if (!Array.isArray(raw) || raw.length === 0) return none;
  // Il giorno locale e' [inizio, inizio del giorno dopo): 23, 24 o 25 ore secondo il cambio d'ora.
  const dayStart = localDayStartMs(day, fmt);
  const dayEnd = dayStart === null ? null : localDayStartMs(nextDayKey(day), fmt);
  if (dayStart === null || dayEnd === null || dayEnd <= dayStart) return none;

  const seen = new Set<number>();
  const out: HeartBucket[] = [];
  for (const entry of raw) {
    if (!isRecord(entry)) continue;
    const { ts, bpm } = entry;
    if (!isEpochMs(ts) || ts % HR_BUCKET_MS !== 0) continue;
    if (seen.has(ts)) return none;
    seen.add(ts);
    if (typeof bpm !== 'number' || !Number.isInteger(bpm) || bpm < 25 || bpm > 240) continue;
    if (ts < dayStart || ts >= dayEnd) continue;
    out.push({ minute: (ts - dayStart) / 60_000, bpm });
  }
  // Il limite si conta solo sui bucket del giorno e sulla sua durata reale (276, 288 o 300 bucket).
  if (out.length === 0 || out.length > (dayEnd - dayStart) / HR_BUCKET_MS) return none;
  return value(out.sort((a, b) => a.minute - b.minute));
}

// ─────────────────────────────────────────────────────────────────────────────
// Sonno (`sleep_stages`)
// ─────────────────────────────────────────────────────────────────────────────

export interface SleepRowLike {
  sleep_stages?: unknown;
}

/**
 * Il vocabolario dell'app (sleep_stage_durations.dart, misurato in produzione l'11/08/2026: light,
 * awake, rem, deep, asleep). `asleep` e' un CONTENITORE che avvolge le proprie fasi: conta nel totale
 * (unione) ma non e' una fase da disegnare. `in_bed` non e' sonno ne' veglia. Cio' che non si capisce
 * non diventa mai sonno.
 */
const STAGE_ASLEEP: ReadonlySet<string> = new Set(['rem', 'deep', 'light', 'sleeping', 'asleep']);
const STAGE_AWAKE: ReadonlySet<string> = new Set(['awake', 'out_of_bed']);
const LANE_OF: Readonly<Record<string, SleepStage>> = Object.freeze({
  awake: 'awake',
  out_of_bed: 'awake',
  rem: 'rem',
  light: 'light',
  sleeping: 'light',
  deep: 'deep',
});

/** Una notte non dura piu' di un giorno: oltre, i millisecondi sono di un'altra unita' o la riga e' rotta. */
const MAX_NIGHT_MS = 24 * 3_600_000;
/** Come l'app (`kSleepStageReconciliationMaxDiscrepancyRatio`): oltre il 15% la ripartizione non si mostra. */
const STAGE_SPLIT_MAX_DISCREPANCY = 0.15;

type Interval = readonly [number, number];

function mergeIntervals(list: readonly Interval[]): Interval[] {
  const sorted = [...list].sort((a, b) => a[0] - b[0]);
  const merged: Array<[number, number]> = [];
  for (const [start, end] of sorted) {
    const last = merged[merged.length - 1];
    if (last && start <= last[1]) last[1] = Math.max(last[1], end);
    else merged.push([start, end]);
  }
  return merged;
}

function subtractIntervals(from: readonly Interval[], minus: readonly Interval[]): Interval[] {
  const out: Array<[number, number]> = [];
  for (const [start, end] of from) {
    let cursor = start;
    for (const [mStart, mEnd] of minus) {
      if (mEnd <= cursor || mStart >= end) continue;
      if (mStart > cursor) out.push([cursor, mStart]);
      if (mEnd > cursor) cursor = mEnd;
      if (cursor >= end) break;
    }
    if (cursor < end) out.push([cursor, end]);
  }
  return out;
}

const lengthOf = (list: readonly Interval[]): number => list.reduce((sum, [a, b]) => sum + (b - a), 0);

/** I segmenti riconosciuti di UNA sessione (`sessionIdx`), accumulati prima di scegliere la principale. */
interface SleepSessionAcc {
  idx: number;
  seen: Set<string>;
  asleep: Interval[];
  awake: Interval[];
  lanes: Record<SleepStage, Interval[]>;
  blocks: Array<{ stage: SleepStage; start: number; end: number }>;
  first: number;
  last: number;
  asleepMs: number;
}

/**
 * REM, leggero e profondo riportati sul totale col metodo del resto piu grande, come
 * `reconcileSleepStagesToTotal` dell'app (sleep_stage_durations.dart): si scala, si prende la parte
 * intera, i minuti che mancano vanno a chi ha il resto maggiore. La somma e' il totale per costruzione.
 */
function reconcileStagesToTotal(laneMs: readonly [number, number, number], totalMinutes: number): [number, number, number] {
  const rawMinutes = (laneMs[0] + laneMs[1] + laneMs[2]) / 60_000;
  const scaled = laneMs.map((ms) => (ms / 60_000) * (totalMinutes / rawMinutes));
  const floors = scaled.map((v) => Math.floor(v));
  let left = totalMinutes - floors.reduce((a, b) => a + b, 0);
  const order = [0, 1, 2].sort((a, b) => scaled[b] - floors[b] - (scaled[a] - floors[a]));
  for (const i of order) {
    if (left <= 0) break;
    floors[i] += 1;
    left -= 1;
  }
  return [floors[0], floors[1], floors[2]];
}

/**
 * La sessione principale di UNA riga: quella con PIU' MINUTI DORMITI, come l'app (sleep_fusion.dart sceglie
 * la piu' lunga, mai per orario). `sessionIdx` serve solo a separare le sessioni: il server le rinumera in
 * ordine cronologico a ogni aggiornamento (migration 20260722084132), quindi un pisolino serale puo' avere
 * l'indice 0 e la notte l'1. A parita' di minuti vince l'indice piu' basso. Un `sessionIdx` mancante o
 * nullo vale 0, come app (`?? 0`) e server; testo o frazione rendono il segmento illeggibile.
 *
 * Minuti dormiti come l'app: UNIONE degli intervalli di sonno meno UNIONE delle veglie, mai la somma
 * delle durate (il contenitore `asleep` conterebbe due volte le proprie fasi). Notte e risveglio sono il
 * primo inizio e l'ultima fine dei segmenti riconosciuti della sessione principale: NON si usano
 * `sleep_start_ms` e `sleep_end_ms` (fuori whitelist: 8,6% e 16,6% di sessioni Health Connect e HealthKit
 * stavano fuori dalla propria finestra prima del 17/08/2026, e le righe non sono state corrette).
 *
 * Assente se: `sleep_stages` non e' un array, non ha segmenti leggibili, gli istanti non sono millisecondi
 * (2000-2100), `endMs <= startMs`, la sessione principale dura piu' di 24 ore, o i minuti dormiti sono 0.
 * Un segmento illeggibile (stadio non testuale, `sessionIdx` non intero, istanti fuori) si scarta; i
 * segmenti IDENTICI (stessi `startMs`, `endMs`, stadio) della stessa sessione contano una volta, come
 * nell'app (66 segmenti al posto di 33 in una notte reale HealthKit, 29/07/2026).
 *
 * Fasi: `stages` solo se c'e' almeno un segmento REM, leggero o profondo (una notte di soli `asleep`, o con
 * la sola veglia, non ha un ipnogramma da disegnare); `stageMinutes` solo se le corsie grezze di REM,
 * leggero e profondo tornano col totale entro il 15% (altrimenti la ripartizione non e' provata). Poi
 * REM, leggero e profondo si riportano sul totale col metodo del resto piu' grande, come
 * `reconcileSleepStagesToTotal` dell'app: la loro somma e' sempre il totale mostrato. La veglia resta la
 * propria somma. DIVERGENZA: l'app confronta e riporta sulla colonna `sleep_minutes`, il web sul totale
 * ricavato dagli stadi (la colonna non e' la stessa misura della sessione scelta).
 * Il parziale non esiste: nessun marcatore di completezza nella riga.
 */
export function sleepNightFromRow(row: SleepRowLike): Measure<SleepNight> {
  const none = absent<SleepNight>('no_samples');
  const raw = row.sleep_stages;
  if (!Array.isArray(raw) || raw.length === 0) return none;

  const sessions = new Map<number, SleepSessionAcc>();
  for (const entry of raw) {
    if (!isRecord(entry)) continue;
    const { stage, startMs, endMs } = entry;
    // Mancante o nullo vale 0, come l'app (`?? 0`) e il server («defaulting to 0»). Testo o frazione: segmento rotto.
    const sessionIdx = entry.sessionIdx ?? 0;
    if (typeof stage !== 'string') continue;
    if (typeof sessionIdx !== 'number' || !Number.isInteger(sessionIdx)) continue;
    if (!isEpochMs(startMs) || !isEpochMs(endMs) || endMs <= startMs) continue;
    const key = stage.trim().toLowerCase();
    const isAsleep = STAGE_ASLEEP.has(key);
    const isAwake = STAGE_AWAKE.has(key);
    if (!isAsleep && !isAwake) continue;
    let s = sessions.get(sessionIdx);
    if (!s) {
      s = { idx: sessionIdx, seen: new Set(), asleep: [], awake: [], lanes: { awake: [], rem: [], light: [], deep: [] }, blocks: [], first: Number.POSITIVE_INFINITY, last: Number.NEGATIVE_INFINITY, asleepMs: 0 };
      sessions.set(sessionIdx, s);
    }
    const identity = `${startMs}|${endMs}|${key}`;
    if (s.seen.has(identity)) continue;
    s.seen.add(identity);

    (isAsleep ? s.asleep : s.awake).push([startMs, endMs]);
    s.first = Math.min(s.first, startMs);
    s.last = Math.max(s.last, endMs);
    const lane = LANE_OF[key];
    if (lane) {
      s.lanes[lane].push([startMs, endMs]);
      s.blocks.push({ stage: lane, start: startMs, end: endMs });
    }
  }

  // La principale e' la sessione con piu minuti dormiti, come l'app (sleep_fusion.dart): l'indice e' solo
  // contabilita' del server, che rinumera in ordine cronologico. A parita' vince l'indice piu basso.
  let main: SleepSessionAcc | null = null;
  for (const s of sessions.values()) {
    s.asleepMs = lengthOf(subtractIntervals(mergeIntervals(s.asleep), mergeIntervals(s.awake)));
    if (main === null || s.asleepMs > main.asleepMs || (s.asleepMs === main.asleepMs && s.idx < main.idx)) main = s;
  }
  if (main === null) return none;
  const { lanes, blocks, first, last, asleepMs } = main;
  if (!Number.isFinite(first) || last - first > MAX_NIGHT_MS) return none;

  const totalMinutes = Math.floor(asleepMs / 60_000);
  if (totalMinutes <= 0) return none;

  const sleepBlocks: SleepBlock[] = blocks
    .sort((a, b) => a.start - b.start || a.end - b.end)
    .map((b) => ({ stage: b.stage, fromMin: (b.start - first) / 60_000, toMin: (b.end - first) / 60_000 }));

  const laneMs = (stage: SleepStage) => lengthOf(mergeIntervals(lanes[stage]));
  const sleepLaneMs = laneMs('rem') + laneMs('light') + laneMs('deep');
  let stageMinutes: Measure<Record<SleepStage, number>> = absent(sleepLaneMs === 0 ? 'source_lacks_type' : 'no_samples');
  if (sleepLaneMs > 0 && Math.abs(sleepLaneMs - asleepMs) / asleepMs <= STAGE_SPLIT_MAX_DISCREPANCY) {
    const [rem, light, deep] = reconcileStagesToTotal([laneMs('rem'), laneMs('light'), laneMs('deep')], totalMinutes);
    // La veglia resta la propria somma, fuori dal totale, come nell'app.
    stageMinutes = value({ awake: Math.round(laneMs('awake') / 60_000), rem, light, deep });
  }

  return value({
    bedtime: new Date(first).toISOString(),
    wakeup: new Date(last).toISOString(),
    totalMinutes: value(totalMinutes),
    stages: sleepLaneMs > 0 ? value(sleepBlocks) : absent('source_lacks_type'),
    stageMinutes,
  });
}
