'use client';

import type { DailyStepsChartProps } from './types';
import { InteractiveChart } from './InteractiveChart';
import { normalizeChartPoints } from './normalize-points';
import { CHART } from './primitives';

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
  stateLabels,
  valueLabels,
  summaryText: summaryOverride,
}: DailyStepsChartProps) {
  const points = normalizeChartPoints(rawPoints);
  const isIt = locale === 'it';
  const unit = isIt ? 'passi' : 'steps';
  const unitOne = isIt ? 'passo' : 'step';
  const defaultTitle = isIt ? 'Passi giornalieri' : 'Daily steps';
  const defaultSubtitle = isIt
    ? `Andamento a barre (${plural(period, 'giorno', 'giorni')})`
    : `Daily bar chart (${plural(period, 'day', 'days')})`;

  const formatSteps = (val: number, loc: string) =>
    new Intl.NumberFormat(loc === 'it' ? 'it-IT' : 'en-US', {
      maximumFractionDigits: 0,
    }).format(Math.round(val));

  // Media e conteggio "misurati" riguardano solo misurato, zero misurato e parziale: un valore
  // semplicemente ricevuto non e' una misura e non entra nella media (si conta a parte).
  const validPoints = points.filter(
    (p) => p.value !== null && (p.state === 'measured' || p.state === 'measured-zero' || p.state === 'partial'),
  );
  const validCount = validPoints.length;
  const zeroCount = points.filter((p) => p.state === 'measured-zero').length;
  const partialCount = points.filter((p) => p.state === 'partial').length;
  const absentCount = points.filter((p) => p.state === 'absent').length;
  const errorCount = points.filter((p) => p.state === 'error').length;
  const receivedCount = points.filter((p) => p.state === 'received').length;
  const ambiguousCount = points.filter((p) => p.state === 'ambiguous').length;
  const undeterminedCount = points.filter((p) => p.state === 'undetermined').length;
  const placeholderCount = points.filter((p) => p.state === 'placeholder').length;
  const extraIt =
    (receivedCount > 0 ? ` ${plural(receivedCount, 'giorno', 'giorni')} con valore ricevuto.` : '') +
    (ambiguousCount > 0 ? ` ${plural(ambiguousCount, 'giorno', 'giorni')} con piu' righe, valore non scelto.` : '') +
    (undeterminedCount > 0 ? ` ${plural(undeterminedCount, 'giorno', 'giorni')} con zero non determinabile.` : '') +
    (placeholderCount > 0 ? ` ${plural(placeholderCount, 'giorno', 'giorni')} con segnaposto.` : '');
  const extraEn =
    (receivedCount > 0 ? ` ${plural(receivedCount, 'day', 'days')} with received value.` : '') +
    (ambiguousCount > 0 ? ` ${plural(ambiguousCount, 'day', 'days')} with several rows, no value chosen.` : '') +
    (undeterminedCount > 0 ? ` ${plural(undeterminedCount, 'day', 'days')} with undetermined zero.` : '') +
    (placeholderCount > 0 ? ` ${plural(placeholderCount, 'day', 'days')} with placeholder.` : '');
  const extraCount = receivedCount + ambiguousCount + undeterminedCount + placeholderCount;

  const totalSteps = validPoints.reduce((acc, p) => acc + (p.value ?? 0), 0);
  const avgSteps = validCount > 0 ? Math.round(totalSteps / validCount) : 0;

  // Media (e totale) includono i giorni parziali: lo si dichiara nella stessa frase.
  const inclIt = partialCount > 0 ? `, ${partialCount === 1 ? 'incluso' : 'inclusi'} ${partialCount} ${partialCount === 1 ? 'giorno parziale' : 'giorni parziali'}` : '';
  const inclEn = partialCount > 0 ? `, including ${partialCount} ${partialCount === 1 ? 'partial day' : 'partial days'}` : '';

  const generatedSummary = validCount === 0 && extraCount === 0
    ? (isIt ? `Nessun dato registrato nel periodo di ${plural(period, 'giorno', 'giorni')}.` : `No data recorded in the ${period}-day period.`)
    : isIt
      ? `Grafico a barre dei passi giornalieri per ${plural(period, 'giorno', 'giorni')}. ` +
        (validCount > 0
          ? `${plural(validCount, 'giorno', 'giorni')} con misurazione registrata su ${points.length}, ` +
            `media di ${formatSteps(avgSteps, 'it')} ${avgSteps === 1 ? 'passo' : 'passi'} al giorno${inclIt}. `
          : `Nessuna misurazione registrata su ${points.length} giorni. `) +
        `${zeroCount > 0 ? `${plural(zeroCount, 'giorno', 'giorni')} con zero misurato. ` : ''}` +
        `${partialCount > 0 ? `${plural(partialCount, 'giorno', 'giorni')} con dati parziali. ` : ''}` +
        `${absentCount > 0 ? `${plural(absentCount, 'giorno', 'giorni')} senza dati. ` : ''}` +
        `${errorCount > 0 ? `${plural(errorCount, 'giorno', 'giorni')} con errore.` : ''}` +
        extraIt
      : `Daily steps bar chart for ${plural(period, 'day', 'days')}. ` +
        (validCount > 0
          ? `${plural(validCount, 'day', 'days')} with recorded readings out of ${points.length}, ` +
            `average of ${formatSteps(avgSteps, 'en')} ${avgSteps === 1 ? 'step' : 'steps'} per day${inclEn}. `
          : `No recorded readings out of ${points.length} days. `) +
        `${zeroCount > 0 ? `${plural(zeroCount, 'day', 'days')} with measured zero. ` : ''}` +
        `${partialCount > 0 ? `${plural(partialCount, 'day', 'days')} with partial data. ` : ''}` +
        `${absentCount > 0 ? `${plural(absentCount, 'day', 'days')} with no data. ` : ''}` +
        `${errorCount > 0 ? `${plural(errorCount, 'day', 'days')} with error.` : ''}` +
        extraEn;
  // Gli spazi si normalizzano solo quando il riepilogo contiene frasi dei nuovi stati.
  const summaryText = summaryOverride ?? (extraCount > 0 ? generatedSummary.replace(/ {2,}/g, ' ').trim() : generatedSummary);

  return (
    <div id={id} data-chart-wrapper="steps" className={className}>
      <InteractiveChart
        id={id}
        title={title || defaultTitle}
        subtitle={subtitle || defaultSubtitle}
        unit={unit}
        unitOne={unitOne}
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
        stateLabels={stateLabels}
        valueLabels={valueLabels}
      />
    </div>
  );
}
