'use client';

import type { HeartRateChartProps } from './types';
import { InteractiveChart } from './InteractiveChart';
import { normalizeChartPoints } from './normalize-points';
import { CHART } from '../primitives';

// Accordo singolare/plurale del conteggio: 1 resta singolare, 0 e N plurale.
const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

export function HeartRateTrendChart({
  id = 'heart-rate-chart',
  title = 'Frequenza cardiaca',
  subtitle,
  points: rawPoints,
  period,
  locale = 'it',
  className = '',
  tableLabel,
  referenceHr,
  isDemo = true,
}: HeartRateChartProps) {
  const points = normalizeChartPoints(rawPoints);
  const isIt = locale === 'it';
  const unit = 'bpm';
  const defaultTitle = isIt ? 'Frequenza cardiaca' : 'Heart rate';
  const defaultSubtitle = isIt
    ? `Andamento a riposo (${plural(period, 'giorno', 'giorni')}, intervalli senza dati non collegati)`
    : `Resting heart rate trend (${plural(period, 'day', 'days')}, gaps remain disconnected)`;

  const formatHr = (val: number) => `${Math.round(val)}`;

  const validPoints = points.filter((p) => p.value !== null && p.state !== 'absent' && p.state !== 'error');
  const validCount = validPoints.length;
  const zeroCount = points.filter((p) => p.state === 'measured-zero').length;
  const partialCount = points.filter((p) => p.state === 'partial').length;
  const absentCount = points.filter((p) => p.state === 'absent').length;
  const errorCount = points.filter((p) => p.state === 'error').length;

  const validVals = validPoints.map((p) => p.value as number);
  const minHr = validVals.length > 0 ? Math.min(...validVals) : 0;
  const maxHr = validVals.length > 0 ? Math.max(...validVals) : 0;
  const avgHr = validVals.length > 0 ? Math.round(validVals.reduce((a, b) => a + b, 0) / validVals.length) : 0;

  // Media, minimo e massimo includono i giorni parziali: lo si dichiara nella stessa frase.
  const inclIt = partialCount > 0 ? `, ${partialCount === 1 ? 'incluso' : 'inclusi'} ${partialCount} ${partialCount === 1 ? 'giorno parziale' : 'giorni parziali'}` : '';
  const inclEn = partialCount > 0 ? `, including ${partialCount} ${partialCount === 1 ? 'partial day' : 'partial days'}` : '';

  const summaryText = validCount === 0
    ? (isIt ? `Nessun dato registrato nel periodo di ${plural(period, 'giorno', 'giorni')}.` : `No data recorded in the ${period}-day period.`)
    : isIt
      ? `Grafico dell'andamento della frequenza cardiaca per ${plural(period, 'giorno', 'giorni')}. ` +
        `${plural(validCount, 'giorno', 'giorni')} con misurazione registrata su ${points.length}, ` +
        `valore medio di ${avgHr} bpm, minimo ${minHr} bpm, massimo ${maxHr} bpm${inclIt}. ` +
        `Gli intervalli con dato assente non sono collegati da linee continue. ` +
        `${zeroCount > 0 ? `${plural(zeroCount, 'giorno', 'giorni')} con zero misurato. ` : ''}` +
        `${partialCount > 0 ? `${plural(partialCount, 'giorno', 'giorni')} con dati parziali. ` : ''}` +
        `${absentCount > 0 ? `${plural(absentCount, 'giorno', 'giorni')} senza dati. ` : ''}` +
        `${errorCount > 0 ? `${plural(errorCount, 'giorno', 'giorni')} con errore.` : ''}`
      : `Heart rate trend chart for ${plural(period, 'day', 'days')}. ` +
        `${plural(validCount, 'day', 'days')} with recorded readings out of ${points.length}, ` +
        `average value of ${avgHr} bpm, min ${minHr} bpm, max ${maxHr} bpm${inclEn}. ` +
        `Intervals without data remain disconnected. ` +
        `${zeroCount > 0 ? `${plural(zeroCount, 'day', 'days')} with measured zero. ` : ''}` +
        `${partialCount > 0 ? `${plural(partialCount, 'day', 'days')} with partial data. ` : ''}` +
        `${absentCount > 0 ? `${plural(absentCount, 'day', 'days')} with no data. ` : ''}` +
        `${errorCount > 0 ? `${plural(errorCount, 'day', 'days')} with error.` : ''}`;

  return (
    <div id={id} data-chart-wrapper="heart" className={className}>
      <InteractiveChart
        id={id}
        title={title || defaultTitle}
        subtitle={subtitle || defaultSubtitle}
        unit={unit}
        metricKind="line"
        color={CHART.heart}
        points={points}
        period={period}
        locale={locale}
        isDemo={isDemo}
        tableLabel={tableLabel}
        formatValue={formatHr}
        formatAxisTick={formatHr}
        goalValue={referenceHr}
        goalLabel={
          referenceHr !== undefined
            ? isIt
              ? `Riferimento di esempio: ${referenceHr} bpm`
              : `Example reference: ${referenceHr} bpm`
            : undefined
        }
        summaryText={summaryText}
      />
    </div>
  );
}
