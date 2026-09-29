import { fmtPercent } from '@/lib/web-dashboard/format';

import { Icon } from '../../Icon';
import { AbsentMark, Card, Chip, SectionLabel } from '../../primitives';

import { collectMissing, type MissingGroup, type MissingItem } from './derive';
import type { OverviewCtx } from './parts';

function pillLabel(item: MissingItem, ctx: OverviewCtx): string {
  const { ui, oc } = ctx;
  const label = oc.missing.metrics[item.metric];
  if (item.none) return oc.missing.none(label);
  if (item.count !== undefined) return oc.missing.hours(label, item.count);
  if (item.coverage !== undefined) return `${label} ${fmtPercent(item.coverage, ui)}`;
  return label;
}

/**
 * Un gruppo = un motivo. L'icona e il bordo dicono lo STATO con lo stesso
 * linguaggio dei grafici: tratteggiato = assente, ambra = parziale, spunta =
 * zero misurato. Cosi' «non c'e'» e «vale zero» non si confondono neanche a
 * colpo d'occhio.
 */
function Group({ group, ctx }: { group: MissingGroup; ctx: OverviewCtx }) {
  const { copy, oc } = ctx;
  const pill =
    group.kind === 'absent'
      ? 'border-dashed border-text-muted/50 text-text-secondary'
      : group.kind === 'partial'
        ? 'border-warning/40 bg-warning/10 text-text-primary'
        : 'border-divider bg-white/5 text-text-primary';

  return (
    <li data-missing-group={group.id} data-missing-kind={group.kind} className="py-4 first:pt-0 last:pb-0">
      <p className="flex items-center gap-2 text-sm font-semibold text-text-primary">
        {group.kind === 'absent' ? (
          <>
            <AbsentMark className="shrink-0 text-text-muted" />
            {copy.measure.noData}
          </>
        ) : group.kind === 'partial' ? (
          <Chip tone="warning">{copy.measure.partialLabel}</Chip>
        ) : (
          <>
            <Icon name="check" size={16} className="shrink-0 text-success" />
            {oc.missing.zeroTitle}
          </>
        )}
      </p>
      <p className="mt-1 text-sm text-text-secondary">
        {group.kind === 'absent' && group.reason
          ? copy.measure.absent[group.reason]
          : group.kind === 'partial' && group.note
            ? copy.measure.partial[group.note]
            : oc.missing.zeroBody}
      </p>
      <ul className="mt-3 flex flex-wrap gap-2">
        {group.items.map((item) => (
          <li key={item.metric} data-missing-metric={item.metric} className={`rounded-pill border px-2.5 py-1 text-xs ${pill}`}>
            {pillLabel(item, ctx)}
          </li>
        ))}
      </ul>
    </li>
  );
}

/**
 * «Cosa manca in questo giorno»: ogni misura assente o parziale del giorno con
 * il suo motivo, raggruppata per motivo; in fondo, a parte, gli zeri misurati.
 * Se non manca nulla lo dice con una frase positiva. E' la card che rende
 * leggibile a un non esperto la differenza fra zero e assente.
 */
export function MissingCard({ ctx, className = '' }: { ctx: OverviewCtx; className?: string }) {
  const { data, oc } = ctx;
  const groups = collectMissing(data);
  const lacking = groups.filter((g) => g.kind !== 'zero');
  const zero = groups.find((g) => g.kind === 'zero');
  const lackingCount = lacking.reduce((s, g) => s + g.items.length, 0);

  return (
    <div data-overview-card="missing" data-missing-count={lackingCount} className={className}>
      <Card aria-labelledby="ov-missing-title">
        <div className="flex items-start justify-between gap-4">
          <SectionLabel id="ov-missing-title">{oc.missing.title}</SectionLabel>
          {lackingCount > 0 ? (
            <span className="shrink-0 [&>*]:whitespace-nowrap">
              <Chip tone="neutral">{oc.missing.count(lackingCount)}</Chip>
            </span>
          ) : null}
        </div>
        <p className="mt-2 text-sm text-text-secondary">{oc.missing.intro}</p>

        {lacking.length === 0 ? (
          <div data-missing-empty="" className="mt-4 flex items-start gap-3 rounded bg-success/10 p-4">
            <Icon name="check" size={20} className="mt-0.5 shrink-0 text-success" />
            <p className="text-sm text-text-primary">{oc.missing.allPresent}</p>
          </div>
        ) : (
          <ul className="mt-4 divide-y divide-divider">
            {lacking.map((g) => (
              <Group key={g.id} group={g} ctx={ctx} />
            ))}
          </ul>
        )}

        {zero ? (
          <ul className="mt-4 border-t border-divider pt-4">
            <Group group={zero} ctx={ctx} />
          </ul>
        ) : null}
      </Card>
    </div>
  );
}
