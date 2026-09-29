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
 *     calorie attive): 0 passi e' una misura. Per i valori puntuali (battito,
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
 */
import { TZ } from './format';
import { absent, partial, sumMeasures, value, type AbsentReason, type Measure } from './measure';
import type { Workout, WorkoutsWeekDay } from './model';

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

/** Il giorno locale (AAAA-MM-GG) di un istante, nel fuso dato. `null` se l'istante non e' leggibile. */
export function localDayOf(ms: unknown, timeZone: string = TZ): string | null {
  if (typeof ms !== 'number' || !Number.isFinite(ms)) return null;
  return new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(ms));
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
 * L'identita' e' (start_ms, end_ms, lower(trim(type))), tutte colonne della
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
    const fraction = Math.min(1, Math.max(0, ctx.todayFraction));
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
