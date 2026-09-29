import type { SharedCopy } from '@/lib/web-dashboard/copy';
import { fmtDateTime, type UiLocale } from '@/lib/web-dashboard/format';
import type { AbsentReason } from '@/lib/web-dashboard/measure';
import type { SyncStatus } from '@/lib/web-dashboard/model';

import { Icon } from '../../Icon';
import { AbsentMark, Card, SectionLabel } from '../../primitives';
import type { SourcesCopy } from '../SourcesScreen.copy';

import { STATE_CIRCLE, STATE_ICON, actionsFor, fmtAgeLong, isStaleAge, syncAge } from './helpers';

const focusRing = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-aqua';
const labelCls = 'text-[11px] font-semibold uppercase tracking-[0.16em] text-text-muted';

/**
 * Ultimo sync: l'ETA' e' il numero grande, la data esatta le sta sotto. Quando e'
 * vecchio (oltre 48 ore) l'eta' diventa ambra e la frase sotto dice che cio' che
 * viene dopo NON e' arrivato: non e' zero. Se un sync non c'e' mai stato non si
 * scrive una data ne' «0 minuti fa»: trattino tratteggiato e motivo.
 */
function LastSync({
  sync,
  hasSources,
  stale,
  c,
  copy,
  ui,
}: {
  sync: SyncStatus;
  hasSources: boolean;
  stale: boolean;
  c: SourcesCopy;
  copy: SharedCopy;
  ui: UiLocale;
}) {
  const age = syncAge(sync);

  if (sync.lastSyncAt === null && age === null) {
    // il motivo dipende da cio' che sappiamo: senza sorgenti non c'e' nulla da sincronizzare
    const reason: AbsentReason = hasSources ? 'not_synced_yet' : 'no_source';
    return (
      <dd className="mt-2 text-text-muted" data-slot="sync-age" data-slot-state="absent" data-absent-reason={reason}>
        <div className="flex h-[2.25rem] items-center">
          <AbsentMark />
          <span className="sr-only">{copy.measure.noData}</span>
        </div>
        <p className="mt-1 text-sm">{copy.measure.absent[reason]}</p>
      </dd>
    );
  }

  const big = age !== null ? fmtAgeLong(age, ui) : fmtDateTime(sync.lastSyncAt as string, ui);
  return (
    <dd className="mt-2" data-slot="sync-age" data-slot-state={stale ? 'stale' : 'measured'}>
      <p className={`font-display text-metric font-semibold tracking-tightest ${stale ? 'text-warning' : 'text-text-primary'}`}>{big}</p>
      {age !== null && sync.lastSyncAt ? (
        <p className="mt-1 text-sm text-text-secondary">
          <time dateTime={sync.lastSyncAt}>{fmtDateTime(sync.lastSyncAt, ui)}</time>
        </p>
      ) : null}
      {stale ? (
        <p className="mt-3 text-sm text-text-secondary" data-slot="stale-note">
          {c.status.staleNote}
        </p>
      ) : null}
    </dd>
  );
}

/** Intestazione della schermata: come e' andato l'ultimo sync, perche', e cosa puo' fare la persona. */
export function StatusCard({
  sync,
  hasSources,
  c,
  copy,
  ui,
}: {
  sync: SyncStatus;
  hasSources: boolean;
  c: SourcesCopy;
  copy: SharedCopy;
  ui: UiLocale;
}) {
  const stale = isStaleAge(syncAge(sync));
  const actions = actionsFor(sync, hasSources);
  const isProblem = sync.problem !== null || sync.state === 'error' || sync.state === 'partial';

  // la frase dice cio' che e' successo: dal codice motivo se c'e', altrimenti dallo stato
  const body = sync.problem
    ? c.status.problem[sync.problem]
    : sync.state === 'error'
      ? c.status.problemGeneric.error
      : sync.state === 'partial'
        ? c.status.problemGeneric.partial
        : sync.state === 'never'
          ? hasSources
            ? c.status.neverWithSources
            : c.status.neverNoSources
          : c.status.okBody;

  return (
    <Card aria-labelledby="sources-sync-title" className="sm:p-6">
      <div data-slot="sync-status" data-sync-state={sync.state} data-stale={stale ? 'true' : 'false'}>
        <SectionLabel id="sources-sync-title">{c.status.title}</SectionLabel>

        <div className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-8">
          <div>
            <div className="flex items-center gap-3">
              <span aria-hidden="true" className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${STATE_CIRCLE[sync.state]}`}>
                <Icon name={STATE_ICON[sync.state]} size={20} />
              </span>
              <p className="font-display text-xl font-semibold tracking-tightest text-text-primary" data-slot="sync-state-label">
                {copy.sync[sync.state]}
              </p>
            </div>
            <dl className="mt-5">
              <dt className={labelCls}>{copy.sync.label}</dt>
              <LastSync sync={sync} hasSources={hasSources} stale={stale} c={c} copy={copy} ui={ui} />
            </dl>
          </div>

          <div className="border-t border-divider pt-5 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
            <p className={labelCls}>{isProblem ? c.status.whatHappened : c.status.outcome}</p>
            <p className="mt-2 max-w-[40rem] text-sm text-text-primary" data-slot="sync-problem" data-problem={sync.problem ?? 'none'}>
              {body}
            </p>

            {actions.length > 0 ? (
              <div className="mt-5" data-slot="sync-actions">
                <p className={labelCls}>{c.status.actionsTitle}</p>
                <ol className="mt-2 max-w-[40rem] list-decimal space-y-1.5 pl-5 text-sm text-text-secondary marker:text-text-muted">
                  {actions.map((k) => (
                    <li key={k} data-action={k}>
                      {c.status.actions[k]}
                    </li>
                  ))}
                </ol>
              </div>
            ) : null}

            {hasSources && isProblem ? (
              <a
                href="#sources-list-title"
                className={`mt-4 inline-flex min-h-[44px] items-center gap-2 rounded-pill border border-divider px-4 py-2 text-sm font-semibold text-text-primary hover:bg-white/5 ${focusRing}`}
              >
                <Icon name="sources" size={16} />
                {c.status.seeTypes}
              </a>
            ) : null}
          </div>
        </div>

        <p className="mt-6 flex items-start gap-2 border-t border-divider pt-4 text-xs text-text-muted" data-slot="web-note">
          <Icon name="info" size={16} className="mt-px shrink-0" />
          {c.status.webNote}
        </p>
      </div>
    </Card>
  );
}
