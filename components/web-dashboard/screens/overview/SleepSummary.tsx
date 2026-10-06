import type { ReactNode } from 'react';

import { fmtMinutes, fmtPercent, fmtTime } from '@/lib/web-dashboard/format';
import type { SleepStage } from '@/lib/web-dashboard/model';

import { CHART, Card, Chip, MeasureValue, SectionLabel } from '../../primitives';

import { sleepTotal } from './derive';
import { AbsentPanel, DetailLink, type OverviewCtx } from './parts';

// Ordine e colori delle fasi come nell'app: Svegli, Leggero, Profondo, REM (BRAND.md sez. 10).
const STAGE_ORDER: SleepStage[] = ['awake', 'light', 'deep', 'rem'];
const STAGE_COLOR: Record<SleepStage, string> = {
  awake: CHART.sleepAwake,
  light: CHART.sleepLight,
  deep: CHART.sleepDeep,
  rem: CHART.sleepRem,
};

/**
 * Sintesi compatta della notte.
 *  - fasi presenti: barra proporzionale + minuti e quota di ogni fase; il totale
 *    NON si ripete (sta gia' nella scheda KPI);
 *  - fasi assenti: il totale, e al posto della barra un riquadro tratteggiato che
 *    dice perche' la ripartizione manca;
 *  - notte assente: solo il riquadro con il motivo. Mai «0 ore».
 */
export function SleepSummary({ ctx }: { ctx: OverviewCtx }) {
  const { data, ui, copy, oc, href } = ctx;
  const night = data.sleep.night;

  const header = (
    <div className="flex items-start justify-between gap-4">
      <SectionLabel id="ov-sleep-title">{oc.sleep.title}</SectionLabel>
      <DetailLink href={href('sleep')} label={oc.detail} context={oc.sleep.title} />
    </div>
  );

  if (night.kind === 'absent') {
    return (
      <div data-overview-card="sleep" data-measure-state="absent">
        <Card aria-labelledby="ov-sleep-title">
          {header}
          <div className="mt-4">
            <AbsentPanel title={oc.sleep.noNight} reason={copy.measure.absent[night.reason]} />
          </div>
        </Card>
      </div>
    );
  }

  const n = night.value;
  const minutes = n.stageMinutes;

  let stages: ReactNode;
  if (minutes.kind === 'absent') {
    stages = (
      <div className="mt-5">
        <p className="text-xs text-text-muted">{oc.sleep.total}</p>
        <div className="mt-1">
          <MeasureValue m={sleepTotal(data)} locale={ui} copy={copy} size="md" format={(v) => fmtMinutes(v, ui)} />
        </div>
        <AbsentPanel className="mt-4" title={oc.sleep.stagesUnavailable} reason={copy.measure.absent[minutes.reason]} />
      </div>
    );
  } else {
    const rec = minutes.value;
    const sum = STAGE_ORDER.reduce((s, k) => s + rec[k], 0);
    let cursor = 0;
    const segments = STAGE_ORDER.filter((k) => rec[k] > 0).map((k) => {
      const w = (rec[k] / sum) * 100;
      const seg = { stage: k, x: cursor, w };
      cursor += w;
      return seg;
    });
    const label = oc.sleep.stageBarLabel(STAGE_ORDER.map((k) => `${oc.sleep.stages[k]} ${fmtMinutes(rec[k], ui)}`).join(', '));
    stages = (
      <div className="mt-5" data-measure-state={minutes.kind === 'partial' ? 'partial' : 'measured'}>
        <svg data-stage-bar="" role="img" aria-label={label} width="100%" height="16" className="block rounded-pill text-bg-card">
          <rect width="100%" height="16" className="fill-white/10" />
          {segments.map((s) => (
            <rect key={s.stage} data-stage-segment={s.stage} x={`${s.x}%`} width={`${s.w}%`} height="16" fill={STAGE_COLOR[s.stage]} stroke="currentColor" strokeWidth="2" />
          ))}
        </svg>
        {minutes.kind === 'partial' ? (
          <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
            <Chip tone="warning">
              {copy.measure.partialLabel} {fmtPercent(minutes.coverage, ui)}
            </Chip>
            <span className="text-text-muted">{copy.measure.partial[minutes.note]}</span>
          </p>
        ) : null}
        <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-4">
          {STAGE_ORDER.map((k) => (
            <li key={k} data-stage={k} data-stage-state={rec[k] === 0 ? 'zero' : 'value'}>
              <p className="flex items-center gap-2 text-xs text-text-secondary">
                <span aria-hidden="true" className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: STAGE_COLOR[k] }} />
                {oc.sleep.stages[k]}
              </p>
              <p className="mt-1 text-sm text-text-primary">
                {fmtMinutes(rec[k], ui)}
                <span className="text-text-muted"> · {fmtPercent(sum > 0 ? rec[k] / sum : 0, ui)}</span>
              </p>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div data-overview-card="sleep" data-measure-state={night.kind === 'partial' ? 'partial' : 'measured'}>
      <Card aria-labelledby="ov-sleep-title">
        {header}
        <dl className="mt-4 grid grid-cols-2 gap-4">
          <div>
            <dt className="text-xs text-text-muted">{oc.sleep.bedtime}</dt>
            <dd className="mt-0.5 font-display text-xl font-semibold tracking-tightest text-text-primary">{fmtTime(n.bedtime, ui)}</dd>
          </div>
          <div>
            <dt className="text-xs text-text-muted">{oc.sleep.wakeup}</dt>
            <dd className="mt-0.5 font-display text-xl font-semibold tracking-tightest text-text-primary">{fmtTime(n.wakeup, ui)}</dd>
          </div>
        </dl>
        {night.kind === 'partial' ? (
          <p className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
            <Chip tone="warning">
              {copy.measure.partialLabel} {fmtPercent(night.coverage, ui)}
            </Chip>
            <span className="text-text-muted">{copy.measure.partial[night.note]}</span>
          </p>
        ) : null}
        {stages}
      </Card>
    </div>
  );
}
