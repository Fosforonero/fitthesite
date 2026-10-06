import type { SharedCopy } from '@/lib/web-dashboard/copy';
import { fmtAge, fmtDateTime, type UiLocale } from '@/lib/web-dashboard/format';
import type { SourceRow } from '@/lib/web-dashboard/model';

import { Icon } from '../../Icon';
import { AbsentMark, Card, SectionLabel } from '../../primitives';
import type { SourcesCopy } from '../SourcesScreen.copy';

import { isStaleAge, minutesSince } from './helpers';

const labelCls = 'text-[11px] font-semibold uppercase tracking-[0.16em] text-text-muted';
const focusRing = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-aqua';

/** Data e ora dell'ultimo dato ricevuto da una sorgente, con l'eta'. Nessun dato: trattino tratteggiato e motivo. */
function SourceLastSync({ iso, copy, ui }: { iso: string | null; copy: SharedCopy; ui: UiLocale }) {
  const age = iso ? minutesSince(iso) : null;
  if (iso === null) {
    return (
      <dd className="mt-1.5 text-text-muted" data-slot="source-last-received" data-slot-state="absent" data-absent-reason="not_synced_yet">
        <span className="flex h-6 items-center">
          <AbsentMark />
          <span className="sr-only">{copy.measure.noData}</span>
        </span>
        <span className="block text-xs">{copy.measure.absent.not_synced_yet}</span>
      </dd>
    );
  }
  const stale = isStaleAge(age);
  return (
    <dd className="mt-1.5" data-slot="source-last-received" data-slot-state={stale ? 'stale' : 'measured'}>
      <span className="block font-display text-base font-semibold tabular-nums tracking-tightest text-text-primary">
        <time dateTime={iso}>{fmtDateTime(iso, ui)}</time>
      </span>
      {age !== null ? (
        <span className={`mt-0.5 flex items-center gap-1.5 text-xs ${stale ? 'text-warning' : 'text-text-muted'}`}>
          {stale ? <Icon name="clock" size={16} className="shrink-0" /> : null}
          {fmtAge(age, ui)}
        </span>
      ) : null}
    </dd>
  );
}

/**
 * Una sorgente: il nome del vocabolario chiuso (mai un nome preso dalle righe) e l'ultimo dato ricevuto.
 * Il server non sa se una sorgente sia un orologio o un telefono ne' se «vinca» per un tipo di dato:
 * nessun genere, nessuna icona per genere, nessun elenco dei tipi.
 */
function SourceCard({ row, copy, ui }: { row: SourceRow; copy: SharedCopy; ui: UiLocale }) {
  const id = `source-${row.ref.id}`;

  return (
    <Card as="article" aria-labelledby={`${id}-name`} className="sm:p-6">
      <div data-slot="source-card" data-source={row.ref.id}>
        <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-4">
          <div className="flex min-w-0 items-center gap-3">
            <span aria-hidden="true" className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/5 text-text-secondary">
              <Icon name="sources" size={20} />
            </span>
            <h3 id={`${id}-name`} className="font-display text-lg font-semibold tracking-tightest text-text-primary">
              {copy.sourceNames[row.ref.id]}
            </h3>
          </div>
          <dl className="sm:text-right">
            <dt className={labelCls}>{copy.received.label}</dt>
            <SourceLastSync iso={row.lastReceivedAt} copy={copy} ui={ui} />
          </dl>
        </div>
      </div>
    </Card>
  );
}

/** Nessuna sorgente: una spiegazione amichevole e il link vero per l'abbinamento, non un elenco vuoto. */
function EmptySources({ c, lc }: { c: SourcesCopy; lc: string }) {
  return (
    <div
      data-slot="sources-empty"
      data-slot-state="absent"
      data-absent-reason="no_data_received"
      className="rounded-card border border-dashed border-text-muted/60 bg-bg-card/60 p-5 sm:p-6"
    >
      <div className="flex gap-4">
        <span aria-hidden="true" className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/5 text-text-secondary">
          <Icon name="plug" size={20} />
        </span>
        <div className="min-w-0">
          <p className="font-display text-base font-semibold text-text-primary">{c.sources.empty.title}</p>
          <p className="mt-1 max-w-[40rem] text-sm text-text-secondary">{c.sources.empty.body}</p>
        </div>
      </div>
      <div className="mt-5 border-t border-divider pt-4">
        <p className={labelCls}>{c.sources.empty.stepsTitle}</p>
        <ol className="mt-2 max-w-[40rem] list-decimal space-y-1.5 pl-5 text-sm text-text-secondary marker:text-text-muted">
          {c.sources.empty.steps.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ol>
        <a
          href={`/${lc}/app/devices`}
          className={`mt-4 inline-flex min-h-[44px] items-center gap-2 rounded-pill border border-divider px-4 py-2 text-sm font-semibold text-text-primary hover:bg-white/5 ${focusRing}`}
        >
          <Icon name="plug" size={16} />
          {c.sources.empty.link}
        </a>
      </div>
    </div>
  );
}

export function SourcesSection({
  rows,
  lc,
  c,
  copy,
  ui,
}: {
  rows: readonly SourceRow[];
  lc: string;
  c: SourcesCopy;
  copy: SharedCopy;
  ui: UiLocale;
}) {
  return (
    <section aria-labelledby="sources-list-title" className="scroll-mt-6">
      <SectionLabel id="sources-list-title">{c.sources.title}</SectionLabel>
      {rows.length > 0 ? (
        <>
          <p className="mt-2 max-w-[44rem] text-sm text-text-secondary" data-slot="sources-intro">
            {c.sources.intro}
          </p>
          <div className="mt-4 space-y-4">
            {rows.map((row) => (
              <SourceCard key={row.ref.id} row={row} copy={copy} ui={ui} />
            ))}
          </div>
        </>
      ) : (
        <div className="mt-4">
          <EmptySources c={c} lc={lc} />
        </div>
      )}
    </section>
  );
}
