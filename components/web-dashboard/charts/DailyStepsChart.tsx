'use client';

import type { DailyStepsChartProps } from './types';
import { InteractiveChart } from './InteractiveChart';
import { normalizeChartPoints } from './normalize-points';
import { CHART } from '../primitives';

// Accordo singolare/plurale del conteggio: 1 resta singolare, 0 e N plurale.
const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

export function DailyStepsChart({
  id = 'daily-steps-chart',
  title = 'Passi giornalieri',
  subtitle,
  points: rawPoints,
  period,
  locale = 'it',
  className = '',
  tableLabel,
  goalSteps,
  isDemo = true,
}: DailyStepsChartProps) {
  const points = normalizeChartPoints(rawPoints);
  const isIt = locale === 'it';
  const unit = isIt ? 'passi' : 'steps';
  const defaultTitle = isIt ? 'Passi giornalieri' : 'Daily steps';
  const defaultSubtitle = isIt
    ? `Andamento a barre (${plural(period, 'giorno', 'giorni')})`
    : `Daily bar chart (${plural(period, 'day', 'days')})`;

  const formatSteps = (val: number, loc: string) =>
    new Intl.NumberFormat(loc === 'it' ? 'it-IT' : 'en-US', {
      maximumFractionDigits: 0,
    }).format(Math.round(val));

  const validPoints = points.filter((p) => p.value !== null && p.state !== 'absent' && p.state !== 'error');
  const validCount = validPoints.length;
  const zeroCount = points.filter((p) => p.state === 'measured-zero').length;
  const partialCount = points.filter((p) => p.state === 'partial').length;
  const absentCount = points.filter((p) => p.state === 'absent').length;
  const errorCount = points.filter((p) => p.state === 'error').length;

  const totalSteps = validPoints.reduce((acc, p) => acc + (p.value ?? 0), 0);
  const avgSteps = validCount > 0 ? Math.round(totalSteps / validCount) : 0;

  // Media (e totale) includono i giorni parziali: lo si dichiara nella stessa frase.
  const inclIt = partialCount > 0 ? `, ${partialCount === 1 ? 'incluso' : 'inclusi'} ${partialCount} ${partialCount === 1 ? 'giorno parziale' : 'giorni parziali'}` : '';
  const inclEn = partialCount > 0 ? `, including ${partialCount} ${partialCount === 1 ? 'partial day' : 'partial days'}` : '';

  const summaryText = validCount === 0
    ? (isIt ? `Nessun dato registrato nel periodo di ${plural(period, 'giorno', 'giorni')}.` : `No data recorded in the ${period}-day period.`)
    : isIt
      ? `Grafico a barre dei passi giornalieri per ${plural(period, 'giorno', 'giorni')}. ` +
        `${plural(validCount, 'giorno', 'giorni')} con misurazione registrata su ${points.length}, ` +
        `media di ${formatSteps(avgSteps, 'it')} passi al giorno${inclIt}. ` +
        `${zeroCount > 0 ? `${plural(zeroCount, 'giorno', 'giorni')} con zero misurato. ` : ''}` +
        `${partialCount > 0 ? `${plural(partialCount, 'giorno', 'giorni')} con dati parziali. ` : ''}` +
        `${absentCount > 0 ? `${plural(absentCount, 'giorno', 'giorni')} senza dati. ` : ''}` +
        `${errorCount > 0 ? `${plural(errorCount, 'giorno', 'giorni')} con errore.` : ''}`
      : `Daily steps bar chart for ${plural(period, 'day', 'days')}. ` +
        `${plural(validCount, 'day', 'days')} with recorded readings out of ${points.length}, ` +
        `average of ${formatSteps(avgSteps, 'en')} steps per day${inclEn}. ` +
        `${zeroCount > 0 ? `${plural(zeroCount, 'day', 'days')} with measured zero. ` : ''}` +
        `${partialCount > 0 ? `${plural(partialCount, 'day', 'days')} with partial data. ` : ''}` +
        `${absentCount > 0 ? `${plural(absentCount, 'day', 'days')} with no data. ` : ''}` +
        `${errorCount > 0 ? `${plural(errorCount, 'day', 'days')} with error.` : ''}`;

  return (
    <div id={id} data-chart-wrapper="steps" className={className}>
      <InteractiveChart
        id={id}
        title={title || defaultTitle}
        subtitle={subtitle || defaultSubtitle}
        unit={unit}
        metricKind="bars"
        color={CHART.steps}
        points={points}
        period={period}
        locale={locale}
        isDemo={isDemo}
        tableLabel={tableLabel}
        formatValue={formatSteps}
        formatAxisTick={(v, loc) => formatSteps(v, loc)}
        goalValue={goalSteps}
        goalLabel={
          goalSteps !== undefined
            ? isIt
              ? `Obiettivo di esempio: ${formatSteps(goalSteps, 'it')} ${unit}`
              : `Example goal: ${formatSteps(goalSteps, 'en')} ${unit}`
            : undefined
        }
        summaryText={summaryText}
      />
    </div>
  );
}
