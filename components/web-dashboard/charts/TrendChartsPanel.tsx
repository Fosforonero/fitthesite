import { stepsUnit, type SharedCopy } from '@/lib/web-dashboard/copy';
import type { TrendMetric, TrendSeries } from '@/lib/web-dashboard/model';
import { toChartPoints } from '@/lib/web-dashboard/charts/measure-adapter';
import { fmtDayShort, fmtInt, fmtMinutes, fmtPercent } from '@/lib/web-dashboard/format';
import { Card, SectionLabel } from '../primitives';
import { MIN_DAYS } from '../screens/trends/derive';
import type { TrendsCopy } from '../screens/TrendsScreen.copy';
import { DailyStepsChart } from './DailyStepsChart';
import { HeartRateTrendChart } from './HeartRateTrendChart';
import { SleepDurationChart } from './SleepDurationChart';
import type { ChartPeriod } from './types';

export interface TrendChartsPanelProps {
  idPrefix: string;
  series: readonly TrendSeries[];
  period: ChartPeriod;
  locale: 'it' | 'en';
  isDemo: boolean;
  copy: SharedCopy;
  text: TrendsCopy;
}

/** Presentation only: the caller supplies an already-derived, ordered series. */
export function TrendChartsPanel({ idPrefix, series, period, locale, isDemo, copy, text }: TrendChartsPanelProps) {
  if ((locale !== 'it' && locale !== 'en') || (period !== 7 && period !== 30)) {
    throw new Error('Unsupported chart locale or period');
  }
  const labels = { absent: copy.measure.absent, partial: copy.measure.partial, invalid: copy.states.errorTitle };
  const metrics: readonly TrendMetric[] = ['steps', 'restingHr', 'sleepMinutes'];
  return (
    <section data-interactive-charts-section className="space-y-6" aria-label={text.rangeLabel}>
      {metrics.map((metric) => {
        const days = series.find((s) => s.metric === metric)?.days.slice(-period) ?? [];
        const points = toChartPoints(days, labels);
        const present = points.filter((p) => p.value !== null).length;
        const partials = points.filter((p) => p.state === 'partial').length;
        const suffix = metric === 'steps' ? 'steps' : metric === 'restingHr' ? 'heart' : 'sleep';
        const id = `${idPrefix}-${suffix}-chart`;
        const props = { id, title: text.metrics[metric].title, subtitle: text.ranges[period], points, period, locale, isDemo, tableLabel: text.table.label };
        if (present < MIN_DAYS) {
          return (
            <div key={metric} id={id} data-chart-insufficient>
              <Card aria-labelledby={`${id}-heading`}>
                <SectionLabel id={`${id}-heading`}>{props.title}</SectionLabel>
                {isDemo && <p className="text-xs text-warning">{copy.previewBannerShort}</p>}
                <p className="mt-3 text-sm text-text-secondary">{text.insufficient.need(MIN_DAYS, present, days.length)}</p>
                <details className="mt-3">
                  <summary className="min-h-[44px] cursor-pointer text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-aqua">{text.table.label}</summary>
                  <table className="w-full text-left text-xs">
                    <caption className="sr-only">{text.table.caption}</caption>
                    <thead><tr><th scope="col">{text.table.day}</th><th scope="col">{text.table.value}</th><th scope="col">{text.table.state}</th></tr></thead>
                    <tbody>{points.map((p) => <tr key={p.date} data-date={p.date} data-slot-state={p.state}>
                      <th scope="row">{fmtDayShort(p.date, locale)}</th>
                      <td>{p.value === null ? copy.measure.noData : metric === 'sleepMinutes' ? fmtMinutes(p.value, locale) : `${fmtInt(p.value, locale)} ${metric === 'steps' ? stepsUnit(copy, p.value) : copy.units.bpm}`}</td>
                      <td>{p.absentReason ?? (p.state === 'partial' ? `${copy.measure.partialLabel}${p.coverage !== undefined ? ` ${fmtPercent(p.coverage, locale)}` : ''}${p.partialNote ? `, ${p.partialNote}` : ''}` : p.state === 'measured-zero' ? copy.measure.zeroMeasured : copy.legend.measured)}</td>
                    </tr>)}</tbody>
                  </table>
                </details>
              </Card>
            </div>
          );
        }
        return (
          <div key={metric} data-chart-panel-metric={metric}>
            {metric === 'steps' ? <DailyStepsChart {...props} /> : metric === 'restingHr' ? <HeartRateTrendChart {...props} /> : <SleepDurationChart {...props} />}
            <p className="mt-2 text-xs text-text-secondary" data-chart-average-basis>{text.coverage.avgBasis(present, partials)}</p>
          </div>
        );
      })}
    </section>
  );
}
