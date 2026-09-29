/**
 * Zero misurato, dato parziale, dato assente: tre cose diverse.
 *
 *  - `value`: la fonte ha misurato. Il valore puo' essere 0 (0 passi, 0 minuti
 *    di attivita'): e' un dato, e si mostra come dato.
 *  - `partial`: il valore e' reale ma copre solo una parte della finestra (il
 *    telefono era spento, la fonte ha sincronizzato meta' giornata). Non e' un
 *    totale: si mostra con la copertura, mai come cifra piena.
 *  - `absent`: nessun dato. Non e' zero. Non si scrive «0» e non si disegna una
 *    barra a zero: si dice PERCHE' manca.
 *
 * Confondere `absent` con `value: 0` fa dire a una dashboard «hai dormito 0
 * ore» a chi semplicemente non aveva l'orologio al polso.
 */

export type AbsentReason =
  | 'no_source' // nessuna fonte collegata
  | 'not_synced_yet' // fonte collegata, nessun sync ancora avvenuto
  | 'permission_missing' // lettura di questo tipo non autorizzata
  | 'source_lacks_type' // la fonte non fornisce questo tipo di dato
  | 'no_samples' // fonte collegata, ma in questa finestra non ha consegnato campioni
  | 'not_yet' // la finestra non e' ancora arrivata (ore future di oggi)
  | 'read_error'; // la lettura e' fallita

export type PartialNote = 'device_off' | 'sync_incomplete' | 'window_open';

export type Measure<T> =
  | { kind: 'value'; value: T }
  | { kind: 'partial'; value: T; coverage: number; note: PartialNote }
  | { kind: 'absent'; reason: AbsentReason };

export const value = <T>(v: T): Measure<T> => ({ kind: 'value', value: v });
export const absent = <T = never>(reason: AbsentReason): Measure<T> => ({ kind: 'absent', reason });
export const partial = <T>(v: T, coverage: number, note: PartialNote): Measure<T> => ({
  kind: 'partial',
  value: v,
  coverage: Math.min(1, Math.max(0, coverage)),
  note,
});

export type Presentation<T> =
  | { state: 'measured'; value: T; isZero: false }
  | { state: 'measured-zero'; value: T; isZero: true }
  | { state: 'partial'; value: T; coverage: number; note: PartialNote; isZero: boolean }
  | { state: 'absent'; reason: AbsentReason };

/** Come una misura va letta da un componente: un solo punto che decide. */
export function presentNumber(m: Measure<number>): Presentation<number> {
  if (m.kind === 'absent') return { state: 'absent', reason: m.reason };
  if (m.kind === 'partial') {
    return { state: 'partial', value: m.value, coverage: m.coverage, note: m.note, isZero: m.value === 0 };
  }
  return m.value === 0
    ? { state: 'measured-zero', value: 0, isZero: true }
    : { state: 'measured', value: m.value, isZero: false };
}

export const isAbsent = (m: Measure<unknown>): m is { kind: 'absent'; reason: AbsentReason } =>
  m.kind === 'absent';

/** Il numero, se c'e': `null` per l'assente. Mai 0 al posto di «manca». */
export function numberOrNull(m: Measure<number>): number | null {
  return m.kind === 'absent' ? null : m.value;
}

/**
 * Somma di una serie di misure giornaliere.
 * - le assenti NON contano come zero: restano fuori e si contano a parte;
 * - se ce n'e' anche una sola assente o parziale, il totale e' `partial`
 *   (copertura = giorni pieni / giorni), non un totale;
 * - se sono tutte assenti, il risultato e' assente.
 */
export function sumMeasures(items: readonly Measure<number>[]): Measure<number> {
  if (items.length === 0) return absent('no_source');
  const present = items.filter((m) => m.kind !== 'absent') as Array<Exclude<Measure<number>, { kind: 'absent' }>>;
  if (present.length === 0) return absent((items[0] as { reason: AbsentReason }).reason);
  const total = present.reduce((s, m) => s + m.value, 0);
  const full = items.filter((m) => m.kind === 'value').length;
  return full === items.length ? value(total) : partial(total, full / items.length, 'sync_incomplete');
}

/** Media dei soli giorni con dato: mai diluita dagli assenti. `null` se non ce ne sono. */
export function meanOfPresent(items: readonly Measure<number>[]): number | null {
  const present = items.filter((m) => m.kind !== 'absent') as Array<Exclude<Measure<number>, { kind: 'absent' }>>;
  if (present.length === 0) return null;
  return present.reduce((s, m) => s + m.value, 0) / present.length;
}
