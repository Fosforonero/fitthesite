import type { SharedCopy } from '@/lib/web-dashboard/copy';
import { fmtAge, fmtDateTime, type UiLocale } from '@/lib/web-dashboard/format';
import type { DataTypeKey, SourceKind, SourceRef, SourceRow, SourceTypeStatus } from '@/lib/web-dashboard/model';

import { Icon } from '../../Icon';
import { AbsentMark, Card, Chip, SectionLabel } from '../../primitives';
import type { SourcesCopy } from '../SourcesScreen.copy';
import { fill } from '../SourcesScreen.copy';

import { TYPE_STATUS, isStaleAge, minutesSince, winnersByType } from './helpers';

const labelCls = 'text-[11px] font-semibold uppercase tracking-[0.16em] text-text-muted';
const focusRing = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-aqua';

/**
 * Icone del tipo di sorgente, nello stesso tratto di Icon.tsx (linea, 1.75,
 * angoli arrotondati). Il set condiviso ha solo l'orologio: telefono e anello
 * sono disegnati qui per non mischiare un secondo set.
 */
function KindIcon({ kind }: { kind: SourceKind }) {
  const common = { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.75, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true, focusable: false } as const;
  if (kind === 'watch') return <Icon name="sources" size={20} />;
  if (kind === 'phone') {
    return (
      <svg {...common}>
        <path d="M8 3h8a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zM11 18h2" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <path d="M12 21a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13zM9.5 8l1-4h3l1 4" />
    </svg>
  );
}

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
 * Un tipo di dato per una sorgente.
 *  - `ok` (letto): bordo pieno; e' la fonte VINCENTE (bordo e marcatore aqua) oppure
 *    no, e in quel caso si dice chi vince al suo posto;
 *  - ogni altro stato e' un dato ASSENTE per questa sorgente: bordo tratteggiato,
 *    nessuna cifra, e il motivo con le stesse parole dei motivi di assenza condivisi.
 */
function TypeTile({
  row,
  t,
  winners,
  c,
  copy,
}: {
  row: SourceRow;
  t: SourceTypeStatus;
  winners: Map<DataTypeKey, SourceRef[]>;
  c: SourcesCopy;
  copy: SharedCopy;
}) {
  const meta = TYPE_STATUS[t.status];
  const isOk = t.status === 'ok';
  const label = isOk ? c.sources.statusOk : t.status === 'no_data' ? copy.measure.noData : copy.measure.absent[meta.reason as NonNullable<typeof meta.reason>];
  // chi vince al posto di questa sorgente: solo se c'e' un'altra sorgente vincente per il tipo
  const others = (winners.get(t.type) ?? []).filter((r) => r.id !== row.ref.id);
  const wonBy = isOk && !t.winning && others.length > 0 ? others[0] : null;

  const frame = !isOk
    ? 'border-dashed border-text-muted/60 bg-transparent'
    : t.winning
      ? 'border-brand-aqua/50 bg-bg-secondary'
      : 'border-divider bg-bg-secondary';

  return (
    <li
      data-slot="source-type"
      data-type={t.type}
      data-status={t.status}
      data-winning={t.winning ? 'true' : 'false'}
      data-slot-state={isOk ? 'measured' : 'absent'}
      {...(meta.reason ? { 'data-absent-reason': meta.reason } : {})}
      className={`flex min-w-0 flex-wrap items-center justify-between gap-x-3 gap-y-2 rounded border p-4 ${frame}`}
    >
      {/* a sinistra il nome e, sotto, chi vince; a destra lo stato. Se lo stato non ci sta va a capo, non si stringe il nome */}
      <div className="min-w-0">
        <p className={`text-sm font-medium ${isOk ? 'text-text-primary' : 'text-text-secondary'}`}>{c.sources.types[t.type]}</p>
        {t.winning ? (
          <p data-slot="winning-marker" className="mt-1 flex items-center gap-1.5 text-[11px] font-semibold text-brand-aqua">
            <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-brand-aqua" />
            {c.sources.winning}
          </p>
        ) : wonBy ? (
          <p className="mt-1 text-xs text-text-muted" data-slot="won-by">
            {fill(c.sources.wonBy, { label: wonBy.label })}
          </p>
        ) : null}
      </div>
      <Chip tone={meta.tone} icon={meta.icon}>
        {label}
      </Chip>
    </li>
  );
}

function SourceCard({
  row,
  winners,
  c,
  copy,
  ui,
}: {
  row: SourceRow;
  winners: Map<DataTypeKey, SourceRef[]>;
  c: SourcesCopy;
  copy: SharedCopy;
  ui: UiLocale;
}) {
  const id = `source-${row.ref.id}`;
  const wins = row.types.filter((t) => t.winning).length;

  return (
    <Card as="article" aria-labelledby={`${id}-name`} className="sm:p-6">
      <div data-slot="source-card" data-source={row.ref.id} data-kind={row.ref.kind} data-via={row.ref.via}>
        <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-4">
          <div className="flex min-w-0 items-center gap-3">
            <span aria-hidden="true" className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/5 text-text-secondary">
              <KindIcon kind={row.ref.kind} />
            </span>
            <div className="min-w-0">
              <h3 id={`${id}-name`} className="font-display text-lg font-semibold tracking-tightest text-text-primary">
                {row.ref.label}
              </h3>
              <p className="mt-0.5 text-sm text-text-secondary">
                {c.sources.kind[row.ref.kind]} · {c.sources.via[row.ref.via]}
              </p>
            </div>
          </div>
          <dl className="sm:text-right">
            <dt className={labelCls}>{copy.received.label}</dt>
            <SourceLastSync iso={row.lastReceivedAt} copy={copy} ui={ui} />
          </dl>
        </div>

        <div className="mt-5 border-t border-divider pt-4">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <p id={`${id}-types`} className={labelCls}>
              {c.sources.typesTitle}
            </p>
            {row.types.length > 0 ? (
              <p className="text-xs text-text-secondary" data-slot="win-summary" data-wins={wins}>
                {wins > 0 ? fill(c.sources.wins, { n: wins, total: row.types.length }) : c.sources.winsNone}
              </p>
            ) : null}
          </div>

          {row.types.length > 0 ? (
            <ul aria-labelledby={`${id}-types`} className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {row.types.map((t) => (
                <TypeTile key={t.type} row={row} t={t} winners={winners} c={c} copy={copy} />
              ))}
            </ul>
          ) : (
            // nessun tipo elencato: non e' «zero tipi forniti», e' un elenco che non dice nulla
            <div
              className="mt-3 rounded border border-dashed border-text-muted/60 p-4 text-sm text-text-secondary"
              data-slot="types-none"
              data-slot-state="absent"
            >
              <span className="flex items-center gap-3 text-text-muted">
                <AbsentMark />
                <span className="sr-only">{copy.measure.noData}</span>
              </span>
              <p className="mt-2">{c.sources.typesNone}</p>
            </div>
          )}
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
  const winners = winnersByType(rows);
  return (
    <section aria-labelledby="sources-list-title" className="scroll-mt-6">
      <SectionLabel id="sources-list-title">{c.sources.title}</SectionLabel>
      {rows.length > 0 ? (
        <>
          <p className="mt-2 max-w-[44rem] text-sm text-text-secondary" data-slot="one-source-note">
            {c.sources.intro}
          </p>
          <div className="mt-4 space-y-4">
            {rows.map((row) => (
              <SourceCard key={row.ref.id} row={row} winners={winners} c={c} copy={copy} ui={ui} />
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
