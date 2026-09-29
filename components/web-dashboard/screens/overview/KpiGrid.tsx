import type { ReactNode } from 'react';

import { fmtInt, fmtMinutes, fmtPercent, fmtTime } from '@/lib/web-dashboard/format';
import { absent, partial, presentNumber, sumMeasures, value, type Measure } from '@/lib/web-dashboard/measure';

import { Icon } from '../../Icon';
import { CHART, MeasureValue, MetricTile, SectionLabel } from '../../primitives';
import { PatternDefs } from '../../chart-kit';

import { sleepTotal } from './derive';
import type { OverviewCtx } from './parts';

/**
 * Avanzamento verso l'obiettivo passi. Esiste SOLO se c'e' un dato: per un
 * assente non si disegna neppure la pista vuota, perche' una barra vuota
 * direbbe «zero passi» a chi semplicemente non ha dati.
 *  - misurato: barra piena; raggiunto = colore dell'obiettivo;
 *  - zero misurato: pista vuota con una tacca all'inizio (il dato c'e', vale 0);
 *  - parziale: barra a righe ambra e testo «almeno», perche' il totale e' un minimo.
 */
function stepsGoalFooter(ctx: OverviewCtx): ReactNode | undefined {
  const { data, ui, oc } = ctx;
  const goal = data.activity.goalSteps;
  const p = presentNumber(data.activity.steps);
  if (p.state === 'absent' || goal <= 0) return undefined;

  const frac = p.value / goal;
  const reached = p.value >= goal;
  const width = Math.min(100, frac * 100);
  // arrotondato per difetto: «100%» prima di aver raggiunto l'obiettivo sarebbe falso
  const pct = fmtPercent(Math.floor(frac * 100) / 100, ui);
  const goalText = fmtInt(goal, ui);

  let text: string;
  if (p.state === 'partial') text = reached ? oc.goal.reachedPartial : oc.goal.atLeast(pct, goalText);
  else text = reached ? oc.goal.reached : oc.goal.percent(pct, goalText);

  return (
    <div data-goal-progress={p.state} className="space-y-2">
      <svg aria-hidden="true" width="100%" height="8" className="block">
        <PatternDefs prefix="ov-goal" color={CHART.steps} />
        <rect width="100%" height="8" rx="4" className="fill-white/10" />
        {p.state === 'partial' ? (
          <rect width={`${width}%`} height="8" rx="4" fill="url(#ov-goal-partial)" stroke={CHART.calories} strokeWidth="1" />
        ) : p.state === 'measured-zero' ? (
          <rect width="8" height="8" rx="4" fill={CHART.steps} />
        ) : (
          <rect width={`${width}%`} height="8" rx="4" fill={reached ? CHART.goal : CHART.steps} />
        )}
      </svg>
      <p className="flex items-center gap-1.5 text-xs text-text-secondary">
        {reached && p.state !== 'partial' ? <Icon name="check" size={16} className="shrink-0 text-success" /> : null}
        {text}
      </p>
    </div>
  );
}

/** Il footer FC: la media del giorno, con la sua parzialita' se c'e'; niente se assente. */
function hrFooter(ctx: OverviewCtx): ReactNode | undefined {
  const { data, ui, oc } = ctx;
  const avg = data.heart.average;
  if (avg.kind === 'absent') return undefined;
  const v = fmtInt(avg.value, ui);
  return <p className="text-text-secondary">{avg.kind === 'partial' ? oc.hrTile.avgPartial(v) : oc.hrTile.avg(v)}</p>;
}

function WorkoutsTile({ ctx }: { ctx: OverviewCtx }) {
  const { data, ui, copy, oc, href } = ctx;
  const sessions = data.workouts.sessions;
  const link = href('workouts');

  // «non so se ce ne sono stati»: non esiste «nessuno» misurato, senza righe il giorno e' assente
  if (sessions.kind === 'absent' || sessions.value.length === 0) {
    return (
      <MetricTile label={oc.tiles.workouts} dot={CHART.info} icon="workouts" href={link}>
        <MeasureValue m={sessions.kind === 'absent' ? sessions : absent('no_samples')} locale={ui} copy={copy} />
      </MetricTile>
    );
  }

  const list = sessions.value;
  const count: Measure<number> = sessions.kind === 'partial' ? partial(list.length, sessions.coverage, sessions.note) : value(list.length);
  const total = sumMeasures(list.map((w) => w.durationMin));
  const footer: ReactNode =
    total.kind === 'absent' ? (
      <p className="text-text-secondary">{oc.workoutsTile.durationUnknown}</p>
    ) : (
      <p className="text-text-secondary">
        {total.kind === 'partial' ? oc.workoutsTile.totalDurationPartial(fmtMinutes(total.value, ui)) : oc.workoutsTile.totalDuration(fmtMinutes(total.value, ui))}
      </p>
    );
  return (
    <MetricTile label={oc.tiles.workouts} dot={CHART.info} icon="workouts" href={link} footer={footer}>
      <MeasureValue m={count} unit={list.length === 1 ? oc.workoutsTile.singular : oc.workoutsTile.plural} locale={ui} copy={copy} />
    </MetricTile>
  );
}

/**
 * Le cinque schede KPI. Griglia a 6 colonne da 1024 px: tre schede da 2 sopra,
 * due da 3 sotto (l'ultima riga resta piena). Da 640 a 1023 px sono due colonne
 * e l'ultima scheda occupa entrambe.
 */
export function KpiGrid({ ctx }: { ctx: OverviewCtx }) {
  const { data, ui, copy, oc, href } = ctx;
  const night = data.sleep.night;
  const sleepMeasure = sleepTotal(data);

  const cell = 'lg:col-span-2 [&>*]:h-full';
  return (
    <section aria-labelledby="ov-kpi-title">
      <SectionLabel id="ov-kpi-title">{oc.kpiTitle}</SectionLabel>
      <ul className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-6 lg:gap-5">
        <li data-kpi="steps" className={cell}>
          <MetricTile label={oc.tiles.steps} dot={CHART.steps} icon="steps" href={href('activity')} footer={stepsGoalFooter(ctx)}>
            <MeasureValue m={data.activity.steps} unit={copy.units.steps} locale={ui} copy={copy} />
          </MetricTile>
        </li>

        <li data-kpi="sleep" className={cell}>
          <MetricTile
            label={oc.tiles.sleep}
            dot={CHART.sleep}
            icon="sleep"
            href={href('sleep')}
            footer={
              night.kind === 'absent' ? undefined : (
                <p className="text-text-secondary">
                  {oc.sleepTile.bedtime} {fmtTime(night.value.bedtime, ui)} · {oc.sleepTile.wakeup} {fmtTime(night.value.wakeup, ui)}
                </p>
              )
            }
          >
            <MeasureValue m={sleepMeasure} locale={ui} copy={copy} format={(n) => fmtMinutes(n, ui)} />
          </MetricTile>
        </li>

        <li data-kpi="resting-hr" className={cell}>
          <MetricTile label={oc.tiles.restingHr} dot={CHART.resting} icon="heart" href={href('heart')} footer={hrFooter(ctx)}>
            <MeasureValue m={data.heart.resting} unit={copy.units.bpm} locale={ui} copy={copy} />
          </MetricTile>
        </li>

        <li data-kpi="workouts" className="lg:col-span-3 [&>*]:h-full">
          <WorkoutsTile ctx={ctx} />
        </li>

        <li data-kpi="calories" className="sm:col-span-2 lg:col-span-3 [&>*]:h-full">
          <MetricTile label={oc.tiles.calories} dot={CHART.calories} icon="flame" href={href('activity')}>
            <MeasureValue m={data.activity.caloriesActive} unit={copy.units.kcal} locale={ui} copy={copy} />
          </MetricTile>
        </li>
      </ul>
    </section>
  );
}
