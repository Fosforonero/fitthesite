'use client';

import type { DailyStepsChartProps } from './types';
import { InteractiveChart } from './InteractiveChart';
import { normalizeChartPoints } from './normalize-points';
import { CHART } from '../primitives';

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
    ? `Andamento a barre (${period} giorni)`
    : `Daily bar chart (${period} days)`;

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

  const summaryText = validCount === 0
    ? (isIt ? `Nessun dato registrato nel periodo di ${period} giorni.` : `No data recorded in the ${period}-day period.`)
    : isIt
      ? `Grafico a barre dei passi giornalieri per ${period} giorni. ` +
        `${validCount} giorni con misurazione registrata su ${points.length}, ` +
        `media di ${formatSteps(avgSteps, 'it')} passi al giorno. ` +
        `${zeroCount > 0 ? `${zeroCount} giorni con zero misurato. ` : ''}` +
        `${partialCount > 0 ? `${partialCount} giorni con dati parziali. ` : ''}` +
        `${absentCount > 0 ? `${absentCount} giorni senza dati. ` : ''}` +
        `${errorCount > 0 ? `${errorCount} giorni con errore.` : ''}`
      : `Daily steps bar chart for ${period} days. ` +
        `${validCount} days with recorded readings out of ${points.length}, ` +
        `average of ${formatSteps(avgSteps, 'en')} steps per day. ` +
        `${zeroCount > 0 ? `${zeroCount} days with measured zero. ` : ''}` +
        `${partialCount > 0 ? `${partialCount} days with partial data. ` : ''}` +
        `${absentCount > 0 ? `${absentCount} days with no data. ` : ''}` +
        `${errorCount > 0 ? `${errorCount} days with error.` : ''}`;

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
