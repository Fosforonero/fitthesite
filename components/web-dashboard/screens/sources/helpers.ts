import type { UiLocale } from '@/lib/web-dashboard/format';
import type { AbsentReason } from '@/lib/web-dashboard/measure';
import type { DataTypeKey, SourceRef, SourceRow, SourceTypeStatus, SyncState, SyncStatus } from '@/lib/web-dashboard/model';
import { SYNTHETIC_NOW } from '@/lib/web-dashboard/synthetic';

import type { IconName } from '../../Icon';
import type { ActionKey } from '../SourcesScreen.copy';

/**
 * Oltre 48 ore l'app stessa parla di «dati molto vecchi» (syncBodyVeryStale):
 * la stessa soglia decide qui quando l'eta' dell'ultimo sync diventa il fatto
 * principale della schermata, e quando cio' che manca dopo va detto «non e' zero».
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

/** Eta' dell'ultimo sync: quella dichiarata dal dato, altrimenti calcolata dalla data, altrimenti ignota. */
export function syncAge(sync: SyncStatus): number | null {
  if (sync.ageMinutes !== null) return sync.ageMinutes;
  return sync.lastSyncAt ? minutesSince(sync.lastSyncAt) : null;
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

export const STATE_TONE: Record<SyncState, Tone> = { ok: 'success', partial: 'warning', error: 'error', never: 'neutral' };
export const STATE_ICON: Record<SyncState, IconName> = { ok: 'check', partial: 'info', error: 'alert', never: 'dash' };

/** Sfondo e colore del cerchio con l'icona, negli stessi toni dei chip (BRAND.md sez. 9: colore/15 + colore pieno). */
export const STATE_CIRCLE: Record<SyncState, string> = {
  ok: 'bg-success/15 text-success',
  partial: 'bg-warning/15 text-warning',
  error: 'bg-error/15 text-error',
  never: 'bg-white/5 text-text-secondary',
};

/**
 * Stato di un tipo di dato per una sorgente. Tutto cio' che non e' `ok` e' un
 * dato ASSENTE per quella sorgente, e parla con lo stesso vocabolario dei motivi
 * di assenza condivisi (`reason`): niente cifre, niente «0», un riquadro tratteggiato.
 */
export const TYPE_STATUS: Record<SourceTypeStatus['status'], { tone: Tone; icon: IconName; reason: AbsentReason | null }> = {
  ok: { tone: 'success', icon: 'check', reason: null },
  no_data: { tone: 'neutral', icon: 'dash', reason: 'no_samples' },
  permission_missing: { tone: 'warning', icon: 'lock', reason: 'permission_missing' },
  not_provided: { tone: 'neutral', icon: 'dash', reason: 'source_lacks_type' },
  error: { tone: 'error', icon: 'alert', reason: 'read_error' },
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
 * Cosa puo' fare la persona, in base al codice motivo. Mai un pulsante che finge
 * di sincronizzare: il web non puo' avviare un sync, si dice di aprire l'app.
 * Se non c'e' un codice, si decide dallo stato.
 */
export function actionsFor(sync: SyncStatus, hasSources: boolean): ActionKey[] {
  switch (sync.problem) {
    case 'permission_revoked':
      return ['grant_permissions', 'open_sync'];
    case 'source_unreachable':
      return ['check_source', 'open_sync'];
    case 'upload_failed':
      return ['check_connection', 'open_sync'];
    case 'partial_types':
      return ['check_types', 'open_sync'];
    default:
      if (sync.state === 'never') return hasSources ? ['open_sync'] : ['connect_device'];
      if (sync.state === 'error') return ['open_sync'];
      if (sync.state === 'partial') return ['check_types', 'open_sync'];
      return [];
  }
}
