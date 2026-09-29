import type { ReactNode } from 'react';

import { fmtInt, fmtMinutes, fmtPercent } from '@/lib/web-dashboard/format';
import type { AbsentReason, Measure } from '@/lib/web-dashboard/measure';
import type { HeartDay } from '@/lib/web-dashboard/model';

import { ChartFrame, StateLegend } from '../chart-kit';
import { Icon } from '../Icon';
import { AbsentMark, CHART, Card, Chip, MeasureValue, MetricTile, SectionLabel, SkeletonBlock } from '../primitives';
import type { ScreenProps } from '../screen-types';

import { heartCopy, type HeartCopy } from './HeartScreen.copy';
import { HATCH, HeartChart } from './heart/HeartChart';
import { HeartTables } from './heart/HeartTables';
import { STAT_GRID, TILE_ORDER, TILE_SPAN, TILE_WRAP, type TileKey } from './heart/layout';
import {
  DAY_MIN,
  analyzeSeries,
  hhmm,
  hourRows,
  niceAxis,
  nowMinuteFor,
  workoutOverlay,
  type SeriesAnalysis,
} from './heart/series';

/**
 * Cuore: la frequenza cardiaca del giorno scelto.
 *
 * Solo informazione: nessuna zona, nessuna lettura medica (il modello dati non
 * ha zone e non spetta a questa schermata inventarle).
 *
 * Zero / parziale / assente, qui:
 *  - i cinque valori sono MeasureValue, ognuno col proprio stato: un min/max
 *    parziale porta la copertura, un HRV assente dice perche' manca;
 *  - nel grafico la linea si spezza a ogni finestra senza campioni e il buco
 *    e' una banda tratteggiata, mai un tratto a 0 bpm;
 *  - se non c'e' NESSUN campione, al posto del grafico c'e' una scheda
 *    tratteggiata che spiega il motivo (non una linea piatta).
 */

const focusRing = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-aqua';

/** Motivo per cui la serie e' vuota: lo dicono i valori del giorno, non lo si indovina. */
function emptyReason(h: HeartDay): AbsentReason {
  for (const m of [h.average, h.min, h.max, h.resting]) if (m.kind === 'absent') return m.reason;
  return 'no_samples';
}

/** 1440 -> «24 h», altrimenti «9 h 40 min»: la giornata intera non si scrive «24 h 00 min». */
const duration = (min: number, ui: 'it' | 'en') => (min === DAY_MIN ? '24 h' : fmtMinutes(min, ui));

function LegendSwatch({ kind }: { kind: 'resting' | 'workout' | 'future' }) {
  return (
    <svg width="18" height="14" viewBox="0 0 18 14" aria-hidden="true" className="shrink-0">
      {kind === 'resting' ? <path d="M1 7h16" stroke={CHART.resting} strokeWidth="1.5" /> : null}
      {kind === 'workout' ? (
        <>
          <rect x="3" y="2" width="12" height="10" fill={CHART.info} fillOpacity="0.16" />
          <path d="M3 2h12" stroke={CHART.info} strokeOpacity="0.8" strokeWidth="2" />
        </>
      ) : null}
      {kind === 'future' ? <rect x="2.5" y="2.5" width="13" height="9" fill="#FFFFFF" fillOpacity="0.05" stroke="#7F8AA3" strokeOpacity="0.6" strokeDasharray="3 2.5" /> : null}
    </svg>
  );
}

/** Barra delle 24 ore: dove ci sono campioni (pieno) e dove no (tratteggio). Decorativa: il testo sotto dice lo stesso. */
function CoverageStrip({ analysis }: { analysis: SeriesAnalysis }) {
  return (
    <div aria-hidden="true" className="mt-3 flex h-2 w-full overflow-hidden rounded-pill bg-white/5">
      {analysis.runs.map((r) => (
        <span
          key={r.fromMin}
          data-coverage-run={r.state}
          style={{
            width: `${((r.toMin - r.fromMin) / DAY_MIN) * 100}%`,
            ...(r.state === 'value' ? { background: CHART.heart } : r.state === 'gap' ? { backgroundImage: HATCH } : {}),
          }}
        />
      ))}
    </div>
  );
}

function StatRow({ data, lc, copy, t }: Pick<ScreenProps, 'data' | 'lc' | 'copy'> & { t: HeartCopy }) {
  const h = data.heart;
  const tiles: Record<TileKey, { m: Measure<number>; dot: string; unit: string }> = {
    resting: { m: h.resting, dot: CHART.resting, unit: copy.units.bpm },
    average: { m: h.average, dot: CHART.heart, unit: copy.units.bpm },
    min: { m: h.min, dot: CHART.heart, unit: copy.units.bpm },
    max: { m: h.max, dot: CHART.heart, unit: copy.units.bpm },
    hrv: { m: h.hrvMs, dot: CHART.sleep, unit: copy.units.ms },
  };
  return (
    <section aria-labelledby="heart-stats-title">
      <SectionLabel id="heart-stats-title">{t.statsTitle}</SectionLabel>
      <div className={`mt-3 ${STAT_GRID}`}>
        {TILE_ORDER.map((k) => (
          <div key={k} className={`${TILE_SPAN[k]} ${TILE_WRAP}`} data-heart-tile={k}>
            <MetricTile label={t.tiles[k].label} dot={tiles[k].dot} footer={t.tiles[k].hint}>
              <MeasureValue m={tiles[k].m} unit={tiles[k].unit} locale={lc} copy={copy} />
            </MetricTile>
          </div>
        ))}
      </div>
    </section>
  );
}

function EmptyChart({ lc, copy, t, href, reason }: Pick<ScreenProps, 'lc' | 'copy' | 'href'> & { t: HeartCopy; reason: AbsentReason }) {
  const link =
    reason === 'no_data_received'
      ? { href: `/${lc}/app/devices`, label: t.linkDevices, icon: 'plug' as const }
      : { href: href('sources'), label: copy.nav.sources, icon: 'sources' as const };
  return (
    <Card aria-labelledby="heart-day-title">
      <SectionLabel id="heart-day-title">{t.chartTitle}</SectionLabel>
      <div
        data-heart-empty
        data-absent-reason={reason}
        className="mt-4 flex min-h-[16rem] flex-col items-start justify-center gap-3 rounded border border-dashed border-text-muted/50 p-6 sm:items-center sm:text-center"
      >
        <AbsentMark className="text-text-muted" />
        <p className="font-display text-base font-semibold text-text-primary">{t.emptyTitle}</p>
        <Chip tone="neutral">{copy.measure.absent[reason]}</Chip>
        <p className="max-w-[44ch] text-sm text-text-secondary">{t.emptyBody[reason]}</p>
        <a
          href={link.href}
          className={`inline-flex min-h-[44px] items-center gap-2 rounded-pill border border-divider px-4 py-2 text-sm font-semibold text-text-primary hover:bg-white/5 ${focusRing}`}
        >
          <Icon name={link.icon} size={16} />
          {link.label}
        </a>
      </div>
    </Card>
  );
}

export function HeartScreen({ data, lc, ui, copy, href }: ScreenProps) {
  const t = heartCopy(ui);
  const h = data.heart;
  const nowMinute = nowMinuteFor(data.date);
  const analysis = analyzeSeries(h.series, nowMinute);
  const overlay = workoutOverlay(data.workouts.sessions, data.date, nowMinute);

  let chart: ReactNode;
  if (analysis.samples === 0) {
    chart = <EmptyChart lc={lc} copy={copy} t={t} href={href} reason={emptyReason(h)} />;
  } else {
    const resting = h.resting.kind === 'absent' ? null : h.resting.value;
    const axis = niceAxis([analysis.min as number, analysis.max as number, ...(resting === null ? [] : [resting])]);
    const windows = overlay.kind === 'list' ? overlay.windows : [];
    const drawnWorkouts = windows.some((w) => w.endMin !== null && w.endMin > w.startMin);

    // Le frasi di copertura servono sia alla riga visibile sia al riassunto per chi non vede il grafico.
    const listFmt = new Intl.ListFormat(ui, { style: 'long', type: 'conjunction' });
    const gapList = analysis.gaps.map((g) => t.timeRange(hhmm(g.fromMin), hhmm(g.toMin)));
    const samplesSentence = t.samplesSentence(
      fmtInt(analysis.samples, lc),
      fmtInt(analysis.expected, lc),
      duration(analysis.coveredMin, ui),
      duration(analysis.expected * 10, ui),
    );
    const gapsSentence = gapList.length > 0 ? t.gapsSentence(listFmt.format(gapList)) : t.noGapsSentence;
    const futureSentence = analysis.futureFromMin === null ? null : t.futureSentence(hhmm(analysis.futureFromMin));
    const summary = [
      `${t.chartTitle}.`,
      t.rangeSentence(fmtInt(analysis.min as number, lc), fmtInt(analysis.max as number, lc)),
      samplesSentence,
      gapsSentence,
      futureSentence,
    ]
      .filter(Boolean)
      .join(' ');

    // Nella legenda «Nessun campione» compare UNA volta: e' il nome del buco, non un'etichetta per banda.
    const legendCopy = { ...copy, legend: { ...copy.legend, absent: copy.measure.absent.no_samples } };

    chart = (
      <ChartFrame
        id="heart-day"
        title={t.chartTitle}
        subtitle={t.chartSubtitle}
        summary={summary}
        aside={h.source ? <div className="shrink-0"><Chip tone="neutral">{t.source(h.source.label)}</Chip></div> : undefined}
        tableLabel={t.tableLabel}
        table={<HeartTables lc={lc} rows={hourRows(analysis.slots)} windows={windows} copy={copy} t={t} />}
        legend={
          <div className="space-y-4">
            <div className="flex flex-wrap gap-x-4 gap-y-1.5">
              <StateLegend copy={legendCopy} color={CHART.heart} show={['measured', 'absent']} />
              <ul aria-label={t.legendLabel} className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-text-secondary">
                {resting !== null ? (
                  <li className="inline-flex items-center gap-1.5"><LegendSwatch kind="resting" />{t.legend.resting}</li>
                ) : null}
                {drawnWorkouts ? (
                  <li className="inline-flex items-center gap-1.5"><LegendSwatch kind="workout" />{t.legend.workout}</li>
                ) : null}
                {analysis.futureFromMin !== null ? (
                  <li className="inline-flex items-center gap-1.5"><LegendSwatch kind="future" />{copy.measure.absent.not_yet}</li>
                ) : null}
              </ul>
            </div>

            {overlay.kind === 'absent' ? (
              <p data-heart-workouts-note="absent" className="flex items-start gap-2 text-xs text-text-muted">
                <AbsentMark className="mt-0.5 shrink-0" />
                <span>{t.workoutsHidden} {copy.measure.absent[overlay.reason]}.</span>
              </p>
            ) : null}
            {overlay.kind === 'list' && overlay.partial ? (
              <p data-heart-workouts-note="partial" className="text-xs text-text-muted">
                {t.workoutsPartial} {copy.measure.partial[overlay.partial]}.
              </p>
            ) : null}

            <div data-heart-coverage className="rounded border border-divider bg-bg-elevated/60 p-4">
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-text-muted">{t.coverageLabel}</h3>
                <p className="font-display text-xl font-semibold text-text-primary">{fmtPercent(analysis.coverage, lc)}</p>
              </div>
              <CoverageStrip analysis={analysis} />
              <p className="mt-3 text-sm text-text-secondary">{samplesSentence}</p>
              <p className="mt-1 text-sm text-text-secondary">{gapsSentence}</p>
              {futureSentence ? <p className="mt-1 text-sm text-text-secondary">{futureSentence}</p> : null}
            </div>
          </div>
        }
      >
        <HeartChart
          lc={lc}
          analysis={analysis}
          axis={axis}
          resting={resting}
          windows={windows}
          t={t}
          absentLabel={copy.measure.absent.no_samples}
          notYetLabel={copy.measure.absent.not_yet}
        />
      </ChartFrame>
    );
  }

  return (
    <div className="space-y-8" data-screen="heart">
      <StatRow data={data} lc={lc} copy={copy} t={t} />
      {chart}
      <p className="text-xs text-text-muted">{t.disclaimer}</p>
    </div>
  );
}

/** Scheletro: stessa griglia dei cinque valori e un blocco alto come il grafico con legenda e copertura. */
export function HeartLoading() {
  return (
    <div className="space-y-8" data-screen-loading="heart">
      <div className={STAT_GRID}>
        {TILE_ORDER.map((k) => (
          <SkeletonBlock key={k} className={`${TILE_SPAN[k]} h-36`} />
        ))}
      </div>
      <SkeletonBlock className="h-[36rem] lg:h-[39rem]" />
    </div>
  );
}
