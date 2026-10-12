'use client';

import { useState, useCallback, useRef, useEffect, type ReactNode } from 'react';
import type { ChartDataPoint, ChartPeriod } from './types';
import { normalizeChartPoints } from './normalize-points';
import { CHART, Card, SectionLabel, Chip } from '../primitives';
import { PatternDefs } from '../chart-kit';

export interface InteractiveChartProps {
  id: string;
  title: string;
  subtitle?: string;
  unit: string;
  metricKind: 'bars' | 'line';
  color: string;
  points: ChartDataPoint[];
  period: ChartPeriod;
  locale: string;
  isDemo?: boolean;
  tableLabel?: string;
  formatValue: (val: number, locale: string) => string;
  formatAxisTick?: (val: number, locale: string) => string;
  goalValue?: number;
  goalLabel?: string;
  yMin?: number;
  yMax?: number;
  yTicks?: number[];
  headerAction?: ReactNode;
  summaryText: string;
}

const STATE_TEXT: Record<'it' | 'en', Record<string, string>> = {
  it: {
    measured: 'Misurato',
    'measured-zero': 'Zero misurato',
    partial: 'Parziale',
    absent: 'Dato assente',
    error: 'Errore',
  },
  en: {
    measured: 'Measured',
    'measured-zero': 'Measured zero',
    partial: 'Partial',
    absent: 'No data',
    error: 'Error',
  },
};

function formatDateLong(dateStr: string, locale: string): string {
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      return new Intl.DateTimeFormat(locale === 'it' ? 'it-IT' : 'en-US', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
      }).format(d);
    }
  } catch {
    // fallback
  }
  return dateStr;
}

function formatDateShort(dateStr: string, locale: string): string {
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      return new Intl.DateTimeFormat(locale === 'it' ? 'it-IT' : 'en-US', {
        day: 'numeric',
        month: 'numeric',
      }).format(d);
    }
  } catch {
    // fallback
  }
  return dateStr;
}

export function InteractiveChart({
  id,
  title,
  subtitle,
  unit,
  metricKind,
  color,
  points,
  period,
  locale,
  isDemo = true,
  tableLabel,
  formatValue,
  formatAxisTick,
  goalValue,
  goalLabel,
  yMin: customYMin,
  yMax: customYMax,
  yTicks: customYTicks,
  headerAction,
  summaryText,
}: InteractiveChartProps) {
  const isIt = locale === 'it';
  const stateLabels = isIt ? STATE_TEXT.it : STATE_TEXT.en;
  const tooltipElementId = `${id}-tooltip`;

  // Normalizzazione difensiva dei dati
  const normalizedPoints = normalizeChartPoints(points);

  // Misura reattiva della larghezza del canvas per coordinate SVG numeriche coerenti
  const plotContainerRef = useRef<HTMLDivElement>(null);
  const [chartWidth, setChartWidth] = useState<number>(800);

  useEffect(() => {
    if (!plotContainerRef.current) return;
    const el = plotContainerRef.current;
    if (el.clientWidth > 0) {
      setChartWidth(el.clientWidth);
    }
    if (typeof ResizeObserver !== 'undefined') {
      const ro = new ResizeObserver((entries) => {
        for (const entry of entries) {
          if (entry.contentRect.width > 0) {
            setChartWidth(entry.contentRect.width);
          }
        }
      });
      ro.observe(el);
      return () => ro.disconnect();
    }
  }, []);

  // Gestione stato tooltip: hover e selezione tramite click o tocco persistente
  const seriesKey = normalizedPoints.map((p) => p.date).join('\0');
  const [selection, setSelection] = useState<{ key: string; date: string; pinned: boolean } | null>(null);
  const activeDate = selection?.key === seriesKey ? selection.date : null;
  const selectedIdx = normalizedPoints.findIndex((p) => p.date === activeDate);
  const activeIdx = selectedIdx < 0 ? null : selectedIdx;
  const isPinned = activeIdx !== null && selection?.key === seriesKey && selection.pinned;
  const setActiveIdx = (index: number | null) => setSelection(index === null ? null : {
    key: seriesKey, date: normalizedPoints[index].date, pinned: Boolean(isPinned),
  });
  const setIsPinned = (pinned: boolean) => setSelection((current) => current ? { ...current, pinned } : null);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setSelection(null);
    }
  }, []);

  useEffect(() => {
    if (activeIdx === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelection(null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [activeIdx]);

  const totalPoints = normalizedPoints.length;
  const slotW = totalPoints > 0 ? chartWidth / totalPoints : chartWidth;
  const slotWidthPct = totalPoints > 0 ? 100 / totalPoints : 100;

  // Calcolo dominio Y
  const validValues = normalizedPoints
    .filter((p) => p.value !== null && p.state !== 'absent' && p.state !== 'error')
    .map((p) => p.value as number);

  const safeGoal = typeof goalValue === 'number' && Number.isFinite(goalValue) && goalValue >= 0 ? goalValue : undefined;
  const rawMax = validValues.length > 0 ? Math.max(...validValues, safeGoal ?? 0) : Math.max(10, safeGoal ?? 0);
  const rawMin = validValues.length > 0 ? Math.min(...validValues) : 0;

  let yLo = customYMin ?? (metricKind === 'line' ? Math.max(0, Math.floor((rawMin - 5) / 5) * 5) : 0);
  const paddedMax = Number.isFinite(rawMax * 1.15) ? Math.ceil(rawMax * 1.15) : rawMax;
  let yHi = customYMax ?? Math.max(yLo + 1, paddedMax);

  if (yHi <= yLo) yHi = yLo + 10;
  const span = yHi - yLo;

  const PLOT_H = 176;
  const TOP_PAD = 12;
  const BASE_Y = TOP_PAD + PLOT_H;
  const SVG_TOTAL_H = BASE_Y + 8;

  const yCoord = (val: number) => {
    const clamped = Math.max(yLo, Math.min(yHi, val));
    return BASE_Y - ((clamped - yLo) / span) * PLOT_H;
  };

  const ticks = customYTicks ?? Array.from(new Set([
    yLo,
    Math.round(yLo + span * 0.33),
    Math.round(yLo + span * 0.66),
    yHi,
  ])).sort((a, b) => a - b);

  // Segmentazione della linea su intervalli assenti o con errore
  const segments: Array<{ from: number; to: number; pts: Array<{ idx: number; val: number }> }> = [];
  if (metricKind === 'line') {
    let currentSeg: Array<{ idx: number; val: number }> = [];
    normalizedPoints.forEach((p, idx) => {
      if (p.state === 'partial' && p.value !== null) {
        if (currentSeg.length > 0) {
          segments.push({ from: currentSeg[0].idx, to: currentSeg[currentSeg.length - 1].idx, pts: currentSeg });
          currentSeg = [];
        }
        segments.push({ from: idx, to: idx, pts: [{ idx, val: p.value }] });
        return;
      }
      if (p.value !== null && p.state !== 'absent' && p.state !== 'error') {
        currentSeg.push({ idx, val: p.value });
      } else {
        if (currentSeg.length > 0) {
          segments.push({
            from: currentSeg[0].idx,
            to: currentSeg[currentSeg.length - 1].idx,
            pts: currentSeg,
          });
          currentSeg = [];
        }
      }
    });
    if (currentSeg.length > 0) {
      segments.push({
        from: currentSeg[0].idx,
        to: currentSeg[currentSeg.length - 1].idx,
        pts: currentSeg,
      });
    }
  }

  const activePoint = activeIdx !== null ? normalizedPoints[activeIdx] : null;

  // Indici delle etichette asse X
  const xLabelIndices =
    totalPoints <= 7
      ? normalizedPoints.map((_, i) => i)
      : [0, Math.floor(totalPoints / 4), Math.floor(totalPoints / 2), Math.floor((totalPoints * 3) / 4), totalPoints - 1];

  return (
    <Card aria-labelledby={`${id}-heading`}>
      <div className="relative flex flex-col space-y-4" onKeyDown={handleKeyDown}>
        {/* Intestazione grafico */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <SectionLabel id={`${id}-heading`}>{title}</SectionLabel>
              {isDemo && (
                <Chip tone="warning" title={isIt ? 'Dati dimostrativi' : 'Demo data'}>
                  {isIt ? 'Dati dimostrativi' : 'Demo data'}
                </Chip>
              )}
            </div>
            {subtitle && <p className="text-xs text-text-secondary">{subtitle}</p>}
          </div>
          {headerAction && <div className="shrink-0">{headerAction}</div>}
        </div>

        {/* Figura e visualizzazione dati */}
        <figure
          className="relative flex flex-col"
          role="group"
          aria-describedby={`${id}-summary`}
        >
          {/* Tooltip interattivo con ID esplicito per ARIA e test */}
          <div
            id={tooltipElementId}
            role="status"
            aria-live="polite"
            data-active-tooltip=""
            data-date={activePoint ? activePoint.date : undefined}
            className="min-h-[44px] mb-2 p-2 rounded-lg border border-divider bg-bg-elevated/70 flex flex-wrap items-center justify-between gap-2 text-xs"
          >
            {activePoint ? (
              <>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-text-primary">
                    {formatDateLong(activePoint.date, locale)}:
                  </span>
                  <span className="font-mono text-sm font-semibold text-brand-aqua">
                    {activePoint.value !== null ? formatValue(activePoint.value, locale) : (isIt ? 'Nessun dato' : 'No data')}
                  </span>
                  <span className="text-text-muted">({unit})</span>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${
                      activePoint.state === 'measured'
                        ? 'bg-success/15 text-success'
                        : activePoint.state === 'measured-zero'
                          ? 'bg-white/10 text-text-secondary'
                          : activePoint.state === 'partial'
                            ? 'bg-warning/15 text-warning'
                            : 'bg-white/5 text-text-muted'
                    }`}
                  >
                    {stateLabels[activePoint.state] ?? activePoint.state}
                    {activePoint.coverage !== undefined
                      ? ` (${Math.round(activePoint.coverage * 100)}%)`
                      : ''}
                  </span>
                  {activePoint.absentReason && (
                    <span className="text-[11px] text-text-muted">
                      {activePoint.absentReason}
                    </span>
                  )}
                  {activePoint.partialNote && (
                    <span className="text-[11px] text-text-muted">
                      {activePoint.partialNote}
                    </span>
                  )}
                </div>
              </>
            ) : (
              <span className="text-text-muted italic">
                {isIt
                  ? 'Seleziona una colonna per consultare il valore del giorno'
                  : 'Select a bar or point to inspect daily value'}
              </span>
            )}
          </div>

          {/* Canvas SVG e griglia interattiva */}
          <div className="overflow-x-auto overscroll-x-contain rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-aqua" tabIndex={0} role="region" aria-label={title} data-chart-scroll>
          <div className="relative flex" style={{ minWidth: 48 + totalPoints * 44 }}>
            {/* Etichette asse Y (HTML nitido) */}
            <div aria-hidden="true" className="relative w-12 shrink-0 select-none" style={{ height: SVG_TOTAL_H }}>
              {ticks.map((t, tIdx) => {
                const yPos = yCoord(t);
                return (
                  <span
                    key={`y-tick-${t}-${tIdx}`}
                    className="absolute right-2 -translate-y-1/2 text-[10px] sm:text-[11px] tabular-nums text-text-muted"
                    style={{ top: `${yPos}px` }}
                  >
                    {formatAxisTick ? formatAxisTick(t, locale) : t}
                  </span>
                );
              })}
            </div>

            {/* Area del grafico con coordinate numeriche coerenti */}
            <div ref={plotContainerRef} className="relative min-w-0 flex-1">
              <svg
                width="100%"
                height={SVG_TOTAL_H}
                focusable="false"
                aria-hidden="true"
                className="block w-full overflow-visible select-none"
              >
                <PatternDefs prefix={id} color={color} />

                {/* Linee di griglia orizzontali */}
                {ticks.map((t, tIdx) => (
                  <line
                    key={`grid-${t}-${tIdx}`}
                    x1={0}
                    x2={chartWidth}
                    y1={yCoord(t)}
                    y2={yCoord(t)}
                    strokeWidth="1"
                    className="stroke-divider"
                  />
                ))}
                <line
                  x1={0}
                  x2={chartWidth}
                  y1={BASE_Y}
                  y2={BASE_Y}
                  strokeWidth="1.5"
                  strokeOpacity="0.6"
                  className="stroke-text-muted"
                />

                {/* Linea traguardo/obiettivo se fornita esplicitamente */}
                {safeGoal !== undefined && (
                  <g>
                    <line
                      x1={0}
                      x2={chartWidth}
                      y1={yCoord(safeGoal)}
                      y2={yCoord(safeGoal)}
                      strokeWidth="1.5"
                      strokeDasharray="4 3"
                      stroke={CHART.goal}
                    />
                    <text
                      x={chartWidth - 6}
                      y={yCoord(safeGoal) - 5}
                      textAnchor="end"
                      fill={CHART.goal}
                      fontSize="10"
                      className="font-medium"
                    >
                      {goalLabel ?? `${safeGoal} ${unit}`}
                    </text>
                  </g>
                )}

                {/* Sfondo tratteggiato per dati assenti o errori */}
                {normalizedPoints.map((p, idx) => {
                  if (p.state !== 'absent' && p.state !== 'error') return null;
                  const xCoord = Number((idx * slotW).toFixed(2));
                  const widthCoord = Number(slotW.toFixed(2));
                  return (
                    <rect
                      key={`absent-bg-${p.date}`}
                      data-date={p.date}
                      data-slot-state={p.state}
                      x={xCoord}
                      width={widthCoord}
                      y={TOP_PAD}
                      height={PLOT_H}
                      fill={`url(#${id}-absent)`}
                      strokeWidth="1"
                      strokeDasharray="3 2"
                      className="stroke-text-muted/40"
                    />
                  );
                })}

                {/* Barre verticali con coordinate numeriche pure */}
                {metricKind === 'bars' &&
                  normalizedPoints.map((p, idx) => {
                    if (p.value === null || p.state === 'absent' || p.state === 'error') return null;
                    const barWidthFactor = totalPoints <= 7 ? 0.5 : totalPoints <= 14 ? 0.65 : 0.78;
                    const barW = Number((slotW * barWidthFactor).toFixed(2));
                    const barX = Number((idx * slotW + (slotW - barW) / 2).toFixed(2));

                    if (p.state === 'measured-zero' || p.value === 0) {
                      const tickW = Number(Math.min(slotW * 0.9, barW + slotW * 0.15).toFixed(2));
                      const tickX = Number((idx * slotW + (slotW - tickW) / 2).toFixed(2));
                      return (
                        <rect
                          key={`zero-bar-${p.date}`}
                          data-bar=""
                          data-date={p.date}
                          data-slot-state={p.state}
                          x={tickX}
                          width={tickW}
                          y={BASE_Y - 3}
                          height={3}
                          rx={1.5}
                          fill={p.state === 'partial' ? `url(#${id}-partial)` : color}
                          stroke={p.state === 'partial' ? CHART.calories : undefined}
                          strokeWidth={p.state === 'partial' ? 1.25 : undefined}
                        />
                      );
                    }

                    const barTop = yCoord(p.value);
                    const barH = Number(Math.max(3, BASE_Y - barTop).toFixed(2));
                    const isPartial = p.state === 'partial';

                    return (
                      <rect
                        key={`bar-${p.date}`}
                        data-bar=""
                        data-date={p.date}
                        data-slot-state={p.state}
                        x={barX}
                        width={barW}
                        y={Number((BASE_Y - barH).toFixed(2))}
                        height={barH}
                        rx={totalPoints > 20 ? 1 : 2.5}
                        fill={isPartial ? `url(#${id}-partial)` : color}
                        stroke={isPartial ? CHART.calories : undefined}
                        strokeWidth={isPartial ? 1.25 : undefined}
                        className="transition-opacity"
                        opacity={activeIdx === idx ? 1 : 0.88}
                      />
                    );
                  })}

                {/* Linea continua su coordinate numeriche spezzata sui buchi */}
                {metricKind === 'line' && (
                  <>
                    {segments.map((seg, sIdx) => {
                      const pathCoords = seg.pts.map((pt) => {
                        const x = Number(((pt.idx + 0.5) * slotW).toFixed(2));
                        const y = Number(yCoord(pt.val).toFixed(2));
                        return { x, y, idx: pt.idx, val: pt.val };
                      });
                      const dString = pathCoords.length >= 2
                        ? `M ${pathCoords.map((c) => `${c.x} ${c.y}`).join(' L ')}`
                        : '';

                      return (
                        <g key={`seg-${sIdx}`} data-line-segment="">
                          {dString && (
                            <path
                              data-line-path=""
                              d={dString}
                              fill="none"
                              stroke={color}
                              strokeWidth="2.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          )}
                          {pathCoords.map((pt) => {
                            const isActive = activeIdx === pt.idx;
                            return (
                              <circle
                                key={`pt-${pt.idx}`}
                                data-line-point=""
                                cx={pt.x}
                                cy={pt.y}
                                r={isActive ? 5 : totalPoints > 20 ? 3 : 4}
                                fill={color}
                                strokeWidth="2"
                                className="stroke-bg-card transition-transform"
                              />
                            );
                          })}
                        </g>
                      );
                    })}
                  </>
                )}
              </svg>

              {/* Livello di interazione accessibile per tastiera e tocco touch */}
              <div
                className="absolute inset-0 flex"
                style={{ height: SVG_TOTAL_H }}
                role="group"
                aria-label={isIt ? 'Elementi del grafico' : 'Chart items'}
              >
                {normalizedPoints.map((p, idx) => {
                  const isActive = activeIdx === idx;
                  const fullDate = formatDateLong(p.date, locale);
                  const valStr = p.value !== null ? formatValue(p.value, locale) : (isIt ? 'Nessun dato' : 'No data');
                  const stateStr = stateLabels[p.state] ?? p.state;
                  const accessibleLabel = `${fullDate}: ${valStr} ${unit}, ${stateStr}`;

                  return (
                    <button
                      key={`interactive-slot-${p.date}`}
                      data-date={p.date}
                      data-slot-state={p.state}
                      data-slot-index={idx}
                      type="button"
                      tabIndex={0}
                      aria-label={accessibleLabel}
                      aria-describedby={isActive ? tooltipElementId : undefined}
                      onFocus={() => {
                        setActiveIdx(idx);
                      }}
                      onBlur={() => {
                        if (!isPinned) {
                          setSelection((curr) => (curr?.date === p.date ? null : curr));
                        }
                      }}
                      onMouseEnter={() => {
                        if (!isPinned) {
                          setActiveIdx(idx);
                        }
                      }}
                      onMouseLeave={() => {
                        if (!isPinned) {
                          setSelection((curr) => (curr?.date === p.date ? null : curr));
                        }
                      }}
                      onClick={() => {
                        if (activeIdx === idx && isPinned) {
                          setActiveIdx(null);
                          setIsPinned(false);
                        } else {
                          setActiveIdx(idx);
                          setIsPinned(true);
                        }
                      }}
                      className="relative h-full flex-1 min-w-0 select-none p-0 border-0 bg-transparent cursor-pointer outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-aqua focus-visible:ring-offset-1 focus-visible:ring-offset-bg-card group"
                      style={{ minHeight: '44px' }}
                    >
                      <span
                        aria-hidden="true"
                        className={`absolute inset-x-0 inset-y-0 transition-colors pointer-events-none ${
                          isActive ? 'bg-white/10' : 'group-hover:bg-white/5'
                        }`}
                      />
                    </button>
                  );
                })}
              </div>

              {/* Etichette asse X */}
              <div aria-hidden="true" className="relative mt-2 h-7 select-none">
                {xLabelIndices.map((i) => {
                  const p = normalizedPoints[i];
                  if (!p) return null;
                  const atStart = i === 0;
                  const atEnd = i === totalPoints - 1;
                  const leftPos = (i + 0.5) * slotWidthPct;
                  const alignStyle = atStart
                    ? { left: '0%', transform: 'none' }
                    : atEnd
                      ? { right: '0%', left: 'auto', transform: 'none' }
                      : { left: `${leftPos}%`, transform: 'translateX(-50%)' };

                  return (
                    <span
                      key={`x-lbl-${p.date}`}
                      className={`absolute top-0 text-[10px] sm:text-[11px] tabular-nums whitespace-nowrap text-text-muted ${
                        atStart ? 'text-left' : atEnd ? 'text-right' : 'text-center'
                      }`}
                      style={alignStyle}
                    >
                      {totalPoints <= 7 ? formatDateLong(p.date, locale) : formatDateShort(p.date, locale)}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
          </div>

          {/* Legenda visiva */}
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-text-secondary">
            <span className="inline-flex items-center gap-1.5">
              <span className="inline-block w-3.5 h-2.5 rounded-sm" style={{ backgroundColor: color }} />
              {stateLabels.measured}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="inline-block w-3.5 h-1 rounded-sm" style={{ backgroundColor: color }} />
              {stateLabels['measured-zero']}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span
                className="inline-block w-3.5 h-2.5 rounded-sm border border-warning/60"
                style={{
                  backgroundImage:
                    'repeating-linear-gradient(45deg, #FFB547, #FFB547 2px, transparent 2px, transparent 5px)',
                }}
              />
              {stateLabels.partial}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span
                className="inline-block w-3.5 h-2.5 rounded-sm border border-dashed border-text-muted/60"
                style={{
                  backgroundImage:
                    'repeating-linear-gradient(45deg, rgba(255,255,255,0.08), rgba(255,255,255,0.08) 2px, transparent 2px, transparent 5px)',
                }}
              />
              {stateLabels.absent}
            </span>
          </div>
        </figure>

        {/* Tabella accessibile alternativa */}
        <details className="group rounded-lg border border-divider/60 bg-bg-elevated/40 p-3 text-xs">
          <summary className="min-h-[44px] cursor-pointer font-medium text-text-secondary hover:text-text-primary select-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-aqua">
            {tableLabel ?? (isIt ? 'Mostra tabella dati accessibile' : 'Show accessible data table')}
          </summary>
          <div className="mt-3 overflow-x-auto">
            <p id={`${id}-summary`} className="text-xs text-text-secondary mb-3">
              {summaryText}
            </p>
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-divider text-text-muted">
                  <th scope="col" className="py-1.5 pr-3 font-medium">
                    {isIt ? 'Data' : 'Date'}
                  </th>
                  <th scope="col" className="py-1.5 pr-3 font-medium">
                    {isIt ? `Valore (${unit})` : `Value (${unit})`}
                  </th>
                  <th scope="col" className="py-1.5 pr-3 font-medium">
                    {isIt ? 'Stato' : 'State'}
                  </th>
                  <th scope="col" className="py-1.5 font-medium">
                    {isIt ? 'Note' : 'Notes'}
                  </th>
                </tr>
              </thead>
              <tbody>
                {normalizedPoints.map((p) => (
                  <tr key={`row-${p.date}`} data-date={p.date} data-slot-state={p.state} className="border-b border-divider/40">
                    <td className="py-1.5 pr-3 font-mono">{p.date}</td>
                    <td className="py-1.5 pr-3 tabular-nums font-medium text-text-primary">
                      {p.value !== null ? formatValue(p.value, locale) : (isIt ? 'Nessun dato' : 'No data')}
                    </td>
                    <td className="py-1.5 pr-3">
                      {stateLabels[p.state] ?? p.state}
                    </td>
                    <td className="py-1.5 text-text-muted">
                      {p.coverage !== undefined ? `${Math.round(p.coverage * 100)}%` : ''}
                      {p.coverage !== undefined && p.partialNote ? ', ' : ''}
                      {p.absentReason ?? p.partialNote ?? ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      </div>
    </Card>
  );
}
