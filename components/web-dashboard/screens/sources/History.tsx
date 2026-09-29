import type { SharedCopy } from '@/lib/web-dashboard/copy';
import { fmtDateTime, fmtInt, type UiLocale } from '@/lib/web-dashboard/format';
import type { SyncLogEntry } from '@/lib/web-dashboard/model';

import { Icon } from '../../Icon';
import { AbsentMark, Card, Chip, SectionLabel } from '../../primitives';
import type { SourcesCopy } from '../SourcesScreen.copy';
import { fill } from '../SourcesScreen.copy';

import { STATE_ICON, STATE_TONE } from './helpers';

const labelCls = 'text-[11px] font-semibold uppercase tracking-[0.16em] text-text-muted';

/**
 * Le quattro colonne dell'elenco (da `sm` in su): quando, esito, durata, tipi.
 * L'elenco e' una lista semantica (ul > li > dl), non una tabella: da telefono
 * ogni voce si impila da sola con le sue etichette, da schermo largo le
 * etichette passano alla riga d'intestazione e le colonne restano allineate
 * perche' ogni riga usa lo stesso modello di griglia.
 */
const COLS = 'sm:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)_minmax(0,0.9fr)_minmax(0,1.5fr)]';

/** Durata: un secondo misurato (anche 0) e' un dato; una durata non registrata e' assente, non «0 s». */
function Duration({ seconds, c, copy, ui }: { seconds: number | null; c: SourcesCopy; copy: SharedCopy; ui: UiLocale }) {
  const gap = 'mt-1 sm:mt-0';
  if (seconds === null) {
    return (
      <dd data-measure-state="absent" className={`${gap} flex items-center gap-2 text-sm text-text-muted`}>
        <AbsentMark className="shrink-0" />
        <span className="sr-only">{copy.measure.noData}</span>
        <span className="text-xs">{c.history.durationNone}</span>
      </dd>
    );
  }
  return (
    <dd data-measure-state={seconds === 0 ? 'measured-zero' : 'measured'} className={`${gap} text-sm tabular-nums text-text-primary`}>
      {c.history.seconds(fmtInt(seconds, ui))}
    </dd>
  );
}

function LogEntry({ e, c, copy, ui }: { e: SyncLogEntry; c: SourcesCopy; copy: SharedCopy; ui: UiLocale }) {
  return (
    <li data-slot="log-entry" data-log-state={e.state} className="py-4 first:pt-0 last:pb-0">
      <dl className={`grid grid-cols-2 gap-x-4 gap-y-3 sm:items-center sm:gap-y-0 ${COLS}`}>
        <div className="min-w-0">
          <dt className={`${labelCls} sm:sr-only`}>{c.history.cols.when}</dt>
          <dd className="mt-1 text-sm font-medium tabular-nums text-text-primary sm:mt-0">
            <time dateTime={e.at}>{fmtDateTime(e.at, ui)}</time>
          </dd>
        </div>
        <div className="min-w-0">
          <dt className={`${labelCls} sm:sr-only`}>{c.history.cols.result}</dt>
          <dd className="mt-1 sm:mt-0">
            <Chip tone={STATE_TONE[e.state]} icon={STATE_ICON[e.state]}>
              {copy.sync[e.state]}
            </Chip>
          </dd>
        </div>
        <div className="min-w-0">
          <dt className={`${labelCls} sm:sr-only`}>{c.history.cols.duration}</dt>
          <Duration seconds={e.durationSeconds} c={c} copy={copy} ui={ui} />
        </div>
        <div className="min-w-0">
          <dt className={`${labelCls} sm:sr-only`}>{c.history.cols.types}</dt>
          {/* i due conteggi sono misure vere: uno 0 qui e' «letti zero, falliti nove», un dato, non una mancanza */}
          <dd className="mt-1 text-sm text-text-secondary sm:mt-0">
            <span data-count="read" data-measure-state={e.readTypes === 0 ? 'measured-zero' : 'measured'}>
              {c.history.readTypes(e.readTypes)}
            </span>
            {', '}
            <span
              data-count="failed"
              data-measure-state={e.failedTypes === 0 ? 'measured-zero' : 'measured'}
              className={e.failedTypes > 0 ? 'font-medium text-error' : ''}
            >
              {c.history.failedTypes(e.failedTypes)}
            </span>
          </dd>
        </div>
      </dl>
    </li>
  );
}

/**
 * Cronologia dei sync. Senza voci non e' «0 sync»: e' una cronologia che non
 * c'e' ancora, e lo dice a parole. Se l'ultimo sync e' vecchio (`staleSince`) la
 * prima riga e' un vuoto tratteggiato: cio' che viene dopo non e' arrivato.
 */
export function HistoryCard({
  log,
  staleSince,
  c,
  copy,
  ui,
}: {
  log: readonly SyncLogEntry[];
  staleSince: string | null;
  c: SourcesCopy;
  copy: SharedCopy;
  ui: UiLocale;
}) {
  // dal piu' recente, qualunque ordine arrivi dal dato
  const entries = [...log].sort((a, b) => Date.parse(b.at) - Date.parse(a.at));

  return (
    <Card aria-labelledby="sources-log-title" className="sm:p-6">
      <div data-slot="sync-history" data-slot-state={entries.length > 0 ? 'measured' : 'absent'}>
        <SectionLabel id="sources-log-title">{c.history.title}</SectionLabel>
        <p className="mt-1 text-sm text-text-secondary">{c.history.subtitle}</p>

        {entries.length === 0 ? (
          <div
            data-slot="log-empty"
            data-slot-state="absent"
            className="mt-4 flex gap-4 rounded border border-dashed border-text-muted/60 p-4"
          >
            <span aria-hidden="true" className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/5 text-text-secondary">
              <Icon name="clock" size={20} />
            </span>
            <div className="min-w-0">
              <p className="font-display text-base font-semibold text-text-primary">{c.history.emptyTitle}</p>
              <p className="mt-1 text-sm text-text-secondary">{c.history.emptyBody}</p>
            </div>
          </div>
        ) : (
          <div className="mt-4">
            {staleSince ? (
              <p
                data-slot="log-gap"
                data-slot-state="absent"
                className="mb-4 flex items-start gap-3 rounded border border-dashed border-text-muted/60 p-3 text-sm text-text-secondary"
              >
                <AbsentMark className="mt-1 shrink-0 text-text-muted" />
                {fill(c.history.gap, { when: fmtDateTime(staleSince, ui) })}
              </p>
            ) : null}
            {/* intestazione di colonna solo a schermo largo; per gli screen reader ogni voce ha le sue etichette */}
            <div aria-hidden="true" className={`hidden gap-x-4 border-b border-divider pb-2 sm:grid ${COLS} ${labelCls}`}>
              <span>{c.history.cols.when}</span>
              <span>{c.history.cols.result}</span>
              <span>{c.history.cols.duration}</span>
              <span>{c.history.cols.types}</span>
            </div>
            <ul aria-label={c.history.listAria} className="divide-y divide-divider sm:pt-4">
              {entries.map((e, i) => (
                <LogEntry key={`${e.at}-${i}`} e={e} c={c} copy={copy} ui={ui} />
              ))}
            </ul>
          </div>
        )}
      </div>
    </Card>
  );
}
