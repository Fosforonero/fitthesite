import type { UiLocale } from '@/lib/web-dashboard/format';
import type { AbsentReason } from '@/lib/web-dashboard/measure';
import type { DataTypeKey, ReceiptStatus, SourceRef, SourceRow, SourceTypeStatus } from '@/lib/web-dashboard/model';
import { SYNTHETIC_NOW } from '@/lib/web-dashboard/synthetic';

import type { IconName } from '../../Icon';
import type { ActionKey } from '../SourcesScreen.copy';

/**
 * Oltre 48 ore l'app stessa parla di «dati molto vecchi» (syncBodyVeryStale):
 * la stessa soglia decide qui quando l'eta' dell'ultimo dato ricevuto diventa il
 * fatto principale della schermata, e quando cio' che manca dopo va detto «non e' zero».
 */
export const STALE_AFTER_MINUTES = 48 * 60;

/**
 * Minuti fra un istante e «ora». Nell'anteprima «ora» e' SYNTHETIC_NOW (fissa,
 * cosi' gli screenshot sono riproducibili); con dati reali sarebbe l'ora del server.
 * `null` se la data non e' leggibile: mai 0 al posto di «non so».
 */
export function minutesSince(iso: string): number | null {
  const diff = (Date.parse(SYNTHETIC_NOW) - Date.parse(iso)) / 60_000;
  return Number.isFinite(diff) ? Math.max(0, diff) : null;
}

/** Eta' dell'ultimo dato ricevuto: quella dichiarata dal dato, altrimenti calcolata dalla data, altrimenti ignota. */
export function receivedAge(receipt: ReceiptStatus): number | null {
  if (receipt.ageMinutes !== null) return receipt.ageMinutes;
  return receipt.lastReceivedAt ? minutesSince(receipt.lastReceivedAt) : null;
}

/**
 * «12 minuti fa», «3 giorni fa»: la forma estesa, per il numero grande. Le soglie
 * sono quelle di fmtAge (format.ts), che resta la forma breve per le righe piccole.
 */
export function fmtAgeLong(minutes: number, l: UiLocale): string {
  const rtf = new Intl.RelativeTimeFormat(l, { numeric: 'always', style: 'long' });
  if (minutes < 60) return rtf.format(-Math.max(1, Math.round(minutes)), 'minute');
  if (minutes < 60 * 48) return rtf.format(-Math.round(minutes / 60), 'hour');
  return rtf.format(-Math.round(minutes / 1440), 'day');
}

export const isStaleAge = (minutes: number | null): boolean => minutes !== null && minutes >= STALE_AFTER_MINUTES;

type Tone = 'neutral' | 'success' | 'warning' | 'error';

/**
 * Stato di un tipo di dato per una sorgente. Tutto cio' che non e' `ok` e' un
 * dato ASSENTE per quella sorgente, e parla con lo stesso vocabolario dei motivi
 * di assenza condivisi (`reason`): niente cifre, niente «0», un riquadro tratteggiato.
 * Descrive la COPERTURA del dato, non l'esito di un sync.
 */
export const TYPE_STATUS: Record<SourceTypeStatus['status'], { tone: Tone; icon: IconName; reason: AbsentReason | null }> = {
  ok: { tone: 'success', icon: 'check', reason: null },
  no_data: { tone: 'neutral', icon: 'dash', reason: 'no_samples' },
  not_provided: { tone: 'neutral', icon: 'dash', reason: 'source_lacks_type' },
};

/** Per ogni tipo, le sorgenti che vincono: FitMesh ne sceglie una, non le somma. */
export function winnersByType(rows: readonly SourceRow[]): Map<DataTypeKey, SourceRef[]> {
  const map = new Map<DataTypeKey, SourceRef[]>();
  for (const row of rows) {
    for (const t of row.types) {
      if (!t.winning) continue;
      map.set(t.type, [...(map.get(t.type) ?? []), row.ref]);
    }
  }
  return map;
}

/**
 * Cosa puo' fare la persona. Mai un pulsante che finge di sincronizzare: il web
 * non puo' avviare un sync, si dice di aprire l'app. Solo due casi: nessun dato
 * ricevuto mai (collega o sincronizza) e dato vecchio (sincronizza dall'app).
 */
export function actionsFor(receipt: ReceiptStatus, hasSources: boolean): ActionKey[] {
  if (receipt.lastReceivedAt === null && receipt.ageMinutes === null) return hasSources ? ['open_sync'] : ['connect_device'];
  return isStaleAge(receivedAge(receipt)) ? ['open_sync'] : [];
}
