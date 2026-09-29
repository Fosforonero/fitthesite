import type { SharedCopy } from '@/lib/web-dashboard/copy';
import { fmtDayLong, fmtDayShort, fmtMinutes, fmtPercent, type UiLocale } from '@/lib/web-dashboard/format';
import { absent, partial, type AbsentReason, type Measure } from '@/lib/web-dashboard/measure';
import type { SleepNight } from '@/lib/web-dashboard/model';

import { ChartFrame, StateLegend } from '../chart-kit';
import { Icon } from '../Icon';
import { CHART, Card, Chip, MeasureValue, SectionLabel, SkeletonBlock } from '../primitives';
import type { ScreenProps } from '../screen-types';

import { fill, sleepCopy, type SleepCopy } from './SleepScreen.copy';
import { HypnogramFigure, HypnogramPlaceholder, HypnogramTable, hypnogramSummary } from './sleep/Hypnogram';
import { NightsChart } from './sleep/NightsChart';
import { StageTiles } from './sleep/StageTiles';
import { layoutHypnogram, localParts } from './sleep/helpers';

/**
 * Sonno: la notte che finisce nel giorno selezionato.
 *
 * Tre casi che devono somigliarsi il meno possibile:
 *  (a) notte con fasi: totale, ipnogramma, quattro fasi;
 *  (b) totale noto, fasi assenti: il totale c'e', al posto dell'ipnogramma un
 *      riquadro tratteggiato con il motivo (mai un grafico vuoto o «tutto sveglio»);
 *  (c) notte assente: solo una scheda che spiega perche', con un trattino al posto
 *      della durata. Mai «0 h 00 min»: non aver dormito e non aver dati sono cose
 *      diverse, e qui la fonte ci dice solo la seconda.
 * Gli ultimi 7 giorni restano sempre visibili: una notte assente non cancella la settimana.
 */
export function SleepScreen({ data, lc, ui, copy, href }: ScreenProps) {
  const c = sleepCopy(ui);
  const night = data.sleep.night;
  const dayLong = fmtDayLong(data.date, ui);
  const trend = data.trends.find((t) => t.metric === 'sleepMinutes');

  return (
    <div className="space-y-6">
      {night.kind === 'absent' ? (
        <AbsentNight reason={night.reason} c={c} copy={copy} lc={lc} ui={ui} dayLong={dayLong} />
      ) : (
        <NightBlocks night={night} c={c} copy={copy} ui={ui} dayLong={dayLong} />
      )}

      {trend ? <NightsChart days={trend.days} date={data.date} selected={selectedNightMeasure(night)} c={c} copy={copy} ui={ui} href={href} /> : null}
    </div>
  );
}

/** La durata della notte selezionata come Measure, con lo stesso stato dell'intestazione. */
function selectedNightMeasure(night: Measure<SleepNight>): Measure<number> {
  if (night.kind === 'absent') return absent(night.reason);
  const total = night.value.totalMinutes;
  if (night.kind === 'partial' && total.kind === 'value') return partial(total.value, night.coverage, night.note);
  return total;
}

/** Intestazione comune ai tre casi: cosa stiamo guardando (h2 + giorno in cui finisce la notte). */
function NightHeading({ c, dayLong }: { c: SleepCopy; dayLong: string }) {
  return (
    <div className="min-w-0">
      <SectionLabel id="sleep-night-title">{c.night.label}</SectionLabel>
      <p className="mt-1 text-sm text-text-secondary">{fill(c.night.subtitle, { day: dayLong })}</p>
    </div>
  );
}

// ── (c) notte assente ───────────────────────────────────────────────────────
function AbsentNight({
  reason,
  c,
  copy,
  lc,
  ui,
  dayLong,
}: {
  reason: AbsentReason;
  c: SleepCopy;
  copy: SharedCopy;
  lc: string;
  ui: UiLocale;
  dayLong: string;
}) {
  return (
    <div data-slot="night" data-slot-state="absent" data-absent-reason={reason}>
      <section
        aria-labelledby="sleep-night-title"
        className="rounded-card border border-dashed border-text-muted/60 bg-bg-card/60 p-5"
      >
        <NightHeading c={c} dayLong={dayLong} />
        <dl className="mt-5">
          <dt className="text-[11px] font-semibold uppercase tracking-[0.16em] text-text-muted">{c.night.total}</dt>
          <dd className="mt-3">
            {/* la durata e' assente: trattino e motivo, esattamente come ogni altro valore assente */}
            <MeasureValue m={{ kind: 'absent', reason }} locale={ui} copy={copy} />
          </dd>
        </dl>
        <div className="mt-5 max-w-[40rem] border-t border-divider pt-4">
          <p className="font-display text-base font-semibold text-text-primary">{c.night.absentTitle}</p>
          <p className="mt-1 text-sm text-text-secondary">{c.absentBody[reason]}</p>
          <p className="mt-2 text-sm text-text-secondary">{c.night.notZero}</p>
          {reason === 'no_source' ? (
            <a
              href={`/${lc}/app/devices`}
              className="mt-4 inline-flex min-h-[44px] items-center gap-2 rounded-pill border border-divider px-4 py-2 text-sm font-semibold text-text-primary hover:bg-white/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-aqua"
            >
              <Icon name="plug" size={16} />
              {c.devicesLink}
            </a>
          ) : null}
        </div>
      </section>
    </div>
  );
}

// ── (a) e (b): la notte esiste ──────────────────────────────────────────────
function NightBlocks({
  night,
  c,
  copy,
  ui,
  dayLong,
}: {
  night: Exclude<Measure<SleepNight>, { kind: 'absent' }>;
  c: SleepCopy;
  copy: SharedCopy;
  ui: UiLocale;
  dayLong: string;
}) {
  const n = night.value;
  const bed = localParts(n.bedtime);
  const wake = localParts(n.wakeup);
  const hh = (p: { h: number; m: number }) => `${String(p.h).padStart(2, '0')}:${String(p.m).padStart(2, '0')}`;
  const totalMinutes = n.totalMinutes.kind === 'absent' ? null : n.totalMinutes.value;

  return (
    <>
      <div data-slot="night" data-slot-state={night.kind === 'partial' ? 'partial' : 'measured'}>
        <Card aria-labelledby="sleep-night-title">
          <div className="flex items-start justify-between gap-4">
            <NightHeading c={c} dayLong={dayLong} />
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/5" style={{ color: CHART.sleep }}>
              <Icon name="sleep" size={20} />
            </span>
          </div>

          {night.kind === 'partial' ? (
            <p className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
              <Chip tone="warning" title={copy.measure.partial[night.note]}>
                {copy.measure.partialLabel} {fmtPercent(night.coverage, ui)}
              </Chip>
              <span className="text-text-muted">{copy.measure.partial[night.note]}</span>
            </p>
          ) : null}

          <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-5 lg:grid-cols-[minmax(0,1.5fr)_repeat(3,minmax(0,1fr))]">
            <div className="col-span-2 lg:col-span-1">
              <dt className="text-[11px] font-semibold uppercase tracking-[0.16em] text-text-muted">{c.night.total}</dt>
              <dd className="mt-2">
                <MeasureValue m={n.totalMinutes} locale={ui} copy={copy} format={(v) => fmtMinutes(v, ui)} />
              </dd>
            </div>
            <div>
              <dt className="text-[11px] font-semibold uppercase tracking-[0.16em] text-text-muted">{c.night.bedtime}</dt>
              <dd className="mt-2">
                <p className="font-display text-xl font-semibold tabular-nums tracking-tightest text-text-primary">{hh(bed)}</p>
                <p className="mt-1 text-xs text-text-muted">{fmtDayShort(bed.date, ui)}</p>
              </dd>
            </div>
            <div>
              <dt className="text-[11px] font-semibold uppercase tracking-[0.16em] text-text-muted">{c.night.wakeup}</dt>
              <dd className="mt-2">
                <p className="font-display text-xl font-semibold tabular-nums tracking-tightest text-text-primary">{hh(wake)}</p>
                <p className="mt-1 text-xs text-text-muted">{fmtDayShort(wake.date, ui)}</p>
              </dd>
            </div>
            <div className="col-span-2 lg:col-span-1">
              <dt className="text-[11px] font-semibold uppercase tracking-[0.16em] text-text-muted">{c.night.source}</dt>
              <dd className="mt-2">
                <p className="font-display text-xl font-semibold tracking-tightest text-text-primary">{n.source.label}</p>
                <p className="mt-1 text-xs text-text-muted">{c.via[n.source.via]}</p>
              </dd>
            </div>
          </dl>
        </Card>
      </div>

      <HypnogramCard night={n} totalMinutes={totalMinutes} c={c} copy={copy} ui={ui} />
      <StageTiles stageMinutes={n.stageMinutes} c={c} copy={copy} ui={ui} />
    </>
  );
}

/** Ipnogramma se ci sono le fasi, riquadro tratteggiato con il motivo se mancano. */
function HypnogramCard({
  night,
  totalMinutes,
  c,
  copy,
  ui,
}: {
  night: SleepNight;
  totalMinutes: number | null;
  c: SleepCopy;
  copy: SharedCopy;
  ui: UiLocale;
}) {
  const stages = night.stages;

  // `value: []` non e' «nessuna fase»: e' una lista che non dice niente della notte.
  const noStageData = stages.kind !== 'absent' && stages.value.length === 0;

  if (stages.kind === 'absent' || noStageData) {
    const reason: AbsentReason = stages.kind === 'absent' ? stages.reason : 'no_samples';
    return (
      <ChartFrame
        id="sleep-hypnogram"
        title={c.hypnogram.title}
        subtitle={c.hypnogram.subtitle}
        summary={fill(c.hypnogram.summaryUnavailable, { reason: copy.measure.absent[reason] })}
      >
        <HypnogramPlaceholder reason={reason} c={c} copy={copy} />
      </ChartFrame>
    );
  }

  const layout = layoutHypnogram(stages.value, totalMinutes, night.bedtime, night.wakeup);
  return (
    <ChartFrame
      id="sleep-hypnogram"
      title={c.hypnogram.title}
      subtitle={c.hypnogram.subtitle}
      summary={hypnogramSummary(layout, night.bedtime, night.wakeup, c, ui)}
      aside={
        stages.kind === 'partial' ? (
          <Chip tone="warning" title={copy.measure.partial[stages.note]}>
            {copy.measure.partialLabel} {fmtPercent(stages.coverage, ui)}
          </Chip>
        ) : undefined
      }
      legend={
        layout.gaps.length > 0 || stages.kind === 'partial' ? (
          <div className="space-y-1">
            <StateLegend copy={copy} color={CHART.sleep} show={['absent']} />
            <p className="text-xs text-text-muted">
              {stages.kind === 'partial' ? copy.measure.partial[stages.note] : c.hypnogram.gapNote}
            </p>
          </div>
        ) : undefined
      }
      tableLabel={c.hypnogram.tableLabel}
      table={<HypnogramTable layout={layout} bedtime={night.bedtime} c={c} ui={ui} />}
    >
      <HypnogramFigure layout={layout} bedtime={night.bedtime} c={c} ui={ui} />
    </ChartFrame>
  );
}

/** Scheletro: stessa griglia e stessi ingombri della schermata vera (intestazione, ipnogramma, fasi, 7 notti). */
export function SleepLoading() {
  return (
    <div className="space-y-6">
      <SkeletonBlock className="h-[340px] lg:h-[176px]" />
      <SkeletonBlock className="h-[312px]" />
      <div>
        <SkeletonBlock className="h-3 w-32 rounded" />
        <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <SkeletonBlock className="h-[142px]" />
          <SkeletonBlock className="h-[142px]" />
          <SkeletonBlock className="h-[142px]" />
          <SkeletonBlock className="h-[142px]" />
        </div>
      </div>
      <SkeletonBlock className="h-[450px]" />
    </div>
  );
}
