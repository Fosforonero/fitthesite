import { fmtAge, fmtDateTime } from '@/lib/web-dashboard/format';
import type { DataTypeKey, SourceRow, SourceTypeStatus } from '@/lib/web-dashboard/model';

import { Icon } from '../../Icon';
import { Card, Chip, SectionLabel } from '../../primitives';

import { DetailLink, focusRing, type OverviewCtx } from './parts';

type Issue = Exclude<SourceTypeStatus['status'], 'ok'>;

/** Tipi di dato per cui questa sorgente ha un problema, raggruppati per problema. */
function issuesOf(row: SourceRow): Array<{ status: Issue; types: DataTypeKey[] }> {
  const map = new Map<Issue, DataTypeKey[]>();
  for (const t of row.types) {
    if (t.status === 'ok') continue;
    map.set(t.status, [...(map.get(t.status) ?? []), t.type]);
  }
  return [...map.entries()].map(([status, types]) => ({ status, types }));
}

/**
 * «Da dove vengono i tuoi dati»: quali sorgenti hanno contribuito, quale ha
 * vinto sui passi (FitMesh ne usa una, non somma), quando e' arrivato l'ultimo dato.
 * Senza sorgenti diventa la spiegazione + il link alla pagina dei dispositivi
 * (rotta reale /{lc}/app/devices): e' l'unica cosa utile che si puo' fare.
 */
export function SourcesCard({ ctx }: { ctx: OverviewCtx }) {
  const { lc, ui, copy, oc, href } = ctx;
  const { receipt, sources, activity } = ctx.data;
  const empty = sources.length === 0;
  const stepsAbsent = activity.steps.kind === 'absent';
  const winner = stepsAbsent ? null : activity.stepsSource;

  const age = receipt.ageMinutes === null ? null : fmtAge(receipt.ageMinutes, ui);

  return (
    <div data-overview-card="sources" data-sources-count={sources.length}>
      <Card aria-labelledby="ov-sources-title">
        <div className="flex items-start justify-between gap-4">
          <SectionLabel id="ov-sources-title">{oc.sources.title}</SectionLabel>
          <DetailLink href={href('sources')} label={oc.detail} context={copy.nav.sources} />
        </div>

        {empty ? (
          <div className="mt-4 flex gap-4">
            <span aria-hidden="true" className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/5 text-text-secondary">
              <Icon name="plug" size={20} />
            </span>
            <div className="min-w-0">
              <p className="font-display text-base font-semibold text-text-primary">{oc.sources.empty.title}</p>
              <p className="mt-1 text-sm text-text-secondary">{oc.sources.empty.body}</p>
              <a
                href={`/${lc}/app/devices`}
                data-devices-link=""
                className={`mt-3 inline-flex min-h-[44px] items-center gap-2 rounded-pill border border-divider px-4 text-sm font-semibold text-text-primary hover:bg-white/5 ${focusRing}`}
              >
                <Icon name="plug" size={16} />
                {oc.sources.empty.cta}
              </a>
            </div>
          </div>
        ) : (
          <>
            {/* chi ha vinto sui passi: e' la domanda che ogni lettore si fa davanti a due sorgenti */}
            <div data-steps-source={winner?.id ?? 'none'} className="mt-4 rounded bg-white/5 p-4">
              <p className="text-xs text-text-muted">{oc.sources.stepsFrom}</p>
              {winner ? (
                <>
                  <p className="mt-1 font-display text-lg font-semibold text-text-primary">{winner.label}</p>
                  <p className="mt-0.5 text-xs text-text-secondary">
                    {oc.sources.kind[winner.kind]} · {oc.sources.via[winner.via]}
                  </p>
                </>
              ) : (
                <>
                  <p className="mt-1 text-sm font-medium text-text-primary">{oc.sources.stepsNone}</p>
                  {activity.steps.kind === 'absent' ? <p className="mt-0.5 text-xs text-text-secondary">{copy.measure.absent[activity.steps.reason]}</p> : null}
                </>
              )}
              <p className="mt-2 text-xs text-text-muted">{oc.sources.oneSource}</p>
            </div>

            <ul className="mt-4 divide-y divide-divider">
              {sources.map((row) => {
                const chosen = row.types.filter((t) => t.winning).length;
                const issues = issuesOf(row);
                return (
                  <li key={row.ref.id} data-source={row.ref.id} className="py-3 first:pt-0">
                    <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                      <p className="text-sm font-semibold text-text-primary">{row.ref.label}</p>
                      {winner?.id === row.ref.id ? <Chip tone="success" icon="check">{oc.tiles.steps}</Chip> : null}
                    </div>
                    <p className="mt-0.5 text-xs text-text-secondary">
                      {oc.sources.kind[row.ref.kind]} · {oc.sources.via[row.ref.via]}
                    </p>
                    <p className="mt-1 text-xs text-text-secondary">{chosen > 0 ? oc.sources.chosenFor(chosen) : oc.sources.chosenNone}</p>
                    {issues.map((i) => (
                      <p key={i.status} data-source-issue={i.status} className="mt-1 text-xs text-text-muted">
                        {oc.sources.status[i.status]}: {i.types.map((t) => oc.sources.types[t]).join(', ')}
                      </p>
                    ))}
                  </li>
                );
              })}
            </ul>
          </>
        )}

        <div data-slot="last-received" className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-divider pt-4">
          {receipt.lastReceivedAt && age ? (
            <p className="text-xs text-text-secondary">
              {copy.received.label}: {age} · {fmtDateTime(receipt.lastReceivedAt, ui)}
            </p>
          ) : (
            <p className="text-xs text-text-muted">{copy.received.never}</p>
          )}
        </div>
      </Card>
    </div>
  );
}
