'use client';

import type { SleepDurationChartProps } from './types';
import { InteractiveChart } from './InteractiveChart';
import { normalizeChartPoints } from './normalize-points';
import { CHART } from '../primitives';

function formatMinutesToHm(totalMin: number, locale: string): string {
  const rounded = Math.round(totalMin);
  const h = Math.floor(rounded / 60);
  const m = rounded % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} h`;
  return `${h} h ${m} min`;
}

export function SleepDurationChart({
  id = 'sleep-duration-chart',
  title = 'Durata del sonno',
  subtitle,
  points: rawPoints,
  period,
  locale = 'it',
  className = '',
  tableLabel,
  goalMinutes,
  isDemo = true,
}: SleepDurationChartProps) {
  const points = normalizeChartPoints(rawPoints);
  const isIt = locale === 'it';
  const unit = isIt ? 'ore/minuti' : 'hours/minutes';
  const defaultTitle = isIt ? 'Durata del sonno' : 'Sleep duration';
  const defaultSubtitle = isIt
    ? `Andamento notturno a barre (${period} notti)`
    : `Nightly sleep duration bars (${period} nights)`;

  const validPoints = points.filter((p) => p.value !== null && p.state !== 'absent' && p.state !== 'error');
  const validCount = validPoints.length;
  const zeroCount = points.filter((p) => p.state === 'measured-zero').length;
  const partialCount = points.filter((p) => p.state === 'partial').length;
  const absentCount = points.filter((p) => p.state === 'absent').length;
  const errorCount = points.filter((p) => p.state === 'error').length;

  const totalMin = validPoints.reduce((acc, p) => acc + (p.value ?? 0), 0);
  const avgMin = validCount > 0 ? Math.round(totalMin / validCount) : 0;

  const summaryText = validCount === 0
    ? (isIt ? `Nessun dato registrato nel periodo di ${period} notti.` : `No data recorded in the ${period}-night period.`)
    : isIt
      ? `Grafico a barre della durata del sonno per ${period} notti. ` +
        `${validCount} notti con dato registrato su ${points.length}, ` +
        `media di ${formatMinutesToHm(avgMin, 'it')} per notte. ` +
        `${zeroCount > 0 ? `${zeroCount} notti con zero misurato. ` : ''}` +
        `${partialCount > 0 ? `${partialCount} notti con dati parziali. ` : ''}` +
        `${absentCount > 0 ? `${absentCount} notti senza dati. ` : ''}` +
        `${errorCount > 0 ? `${errorCount} notti con errore.` : ''}`
      : `Sleep duration bar chart for ${period} nights. ` +
        `${validCount} nights with recorded data out of ${points.length}, ` +
        `average of ${formatMinutesToHm(avgMin, 'en')} per night. ` +
        `${zeroCount > 0 ? `${zeroCount} nights with measured zero. ` : ''}` +
        `${partialCount > 0 ? `${partialCount} nights with partial data. ` : ''}` +
        `${absentCount > 0 ? `${absentCount} nights with no data. ` : ''}` +
        `${errorCount > 0 ? `${errorCount} nights with error.` : ''}`;

  // Y axis ticks in hours: 2h (120), 4h (240), 6h (360), 8h (480), 10h (600)
  const rawMax = Math.max(660, goalMinutes !== undefined && Number.isFinite(goalMinutes) ? goalMinutes : 0, ...validPoints.map((p) => p.value as number));
  const padded = rawMax * 1.1;
  const yMax = Number.isFinite(padded) ? Math.ceil(padded / 60) * 60 : rawMax;
  const yTicks = Array.from(new Set([0, Math.round(yMax / 180) * 60, Math.round(yMax / 90) * 60, yMax]));

  return (
    <div id={id} data-chart-wrapper="sleep" className={className}>
      <InteractiveChart
        id={id}
        title={title || defaultTitle}
        subtitle={subtitle || defaultSubtitle}
        unit={unit}
        metricKind="bars"
        color={CHART.sleep}
        points={points}
        period={period}
        locale={locale}
        isDemo={isDemo}
        tableLabel={tableLabel}
        formatValue={formatMinutesToHm}
        formatAxisTick={(v) => `${Math.round(v / 60)} h`}
        yMin={0}
        yMax={yMax}
        yTicks={yTicks}
        goalValue={goalMinutes}
        goalLabel={
          goalMinutes !== undefined
            ? isIt
              ? `Obiettivo di esempio: ${formatMinutesToHm(goalMinutes, 'it')}`
              : `Example goal: ${formatMinutesToHm(goalMinutes, 'en')}`
            : undefined
        }
        summaryText={summaryText}
      />
    </div>
  );
}
