import type { SharedCopy } from '@/lib/web-dashboard/copy';
import { fmtInt, fmtPercent } from '@/lib/web-dashboard/format';
import { presentNumber } from '@/lib/web-dashboard/measure';
import type { ActivityDay } from '@/lib/web-dashboard/model';

import { CHART, Card, Chip, MeasureValue, MetricTile, SectionLabel, SkeletonBlock } from '../primitives';
import type { ScreenProps } from '../screen-types';
import { activityCopy, type ActivityCopy } from './ActivityScreen.copy';
import { GoalRing } from './activity/GoalRing';
import { HourlyCard } from './activity/HourlyCard';
import { WeekCard } from './activity/WeekCard';
import { lastSevenDays, toHourSlots, type SlotState } from './activity/derive';

/**
 * Passi e attivita' del giorno.
 *
 * Zero, parziale e assente restano tre cose diverse in ogni blocco:
 *  - eroe e schede: `MeasureValue` (cifra, cifra con copertura, trattino + motivo);
 *  - grafico orario e ultimi 7 giorni: barra, tacca sulla base, righe ambra,
 *    riquadro tratteggiato (vedi chart-kit.tsx);
 * Solo componenti server: l'interazione e' fatta di link costruiti con `href()`.
 */
export function ActivityScreen({ data, lc, ui, copy, href }: ScreenProps) {
  const t = activityCopy(ui);
  const a = data.activity;
  const hourSlots = toHourSlots(a.hourlySteps);
  const week = lastSevenDays(data);

  return (
    <div className="space-y-6" data-screen="activity">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <Hero a={a} lc={lc} copy={copy} t={t} />
        <SecondaryMetrics a={a} lc={lc} copy={copy} t={t} />
      </div>

      <HourlyCard slots={hourSlots} lc={lc} copy={copy} t={t} />

      <WeekCard days={week} goal={a.goalSteps} lc={lc} copy={copy} t={t} href={(date) => href('activity', { day: date })} />
    </div>
  );
}

// ── eroe: passi del giorno e obiettivo ──────────────────────────────────────
function Hero({ a, lc, copy, t }: { a: ActivityDay; lc: string; copy: SharedCopy; t: ActivityCopy }) {
  const p = presentNumber(a.steps);
  const goal = a.goalSteps;
  const hasGoal = goal > 0;
  const goalText = fmtInt(goal, lc);
  const value = p.state === 'absent' ? null : p.value;
  // Senza obiettivo o senza dato non c'e' un progresso da calcolare: l'anello resta tratteggiato.
  const ringState: SlotState = !hasGoal ? 'absent' : p.state;
  const fraction = value !== null && hasGoal ? value / goal : 0;
  const pct = fmtPercent(fraction, lc);
  const met = value !== null && hasGoal && fraction >= 1;

  let caption: string;
  if (p.state === 'absent' || !hasGoal) caption = t.hero.goalAbsent(goalText);
  else if (p.state === 'partial') caption = t.hero.goalPartial[p.note](pct, goalText);
  else caption = t.hero.goalOf(pct, goalText);

  return (
    <Card aria-labelledby="act-hero-title" data-hero="steps" data-goal-state={ringState}>
      <div className="flex items-center justify-between">
        <SectionLabel id="act-hero-title">{t.hero.title}</SectionLabel>
        <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full" style={{ background: CHART.steps }} />
      </div>
      <div className="mt-4 flex items-center gap-5">
        <GoalRing state={ringState} fraction={fraction} pctLabel={value !== null && hasGoal ? pct : null} copy={copy} />
        <div className="min-w-0 space-y-2">
          <MeasureValue m={a.steps} unit={copy.units.steps} locale={lc} copy={copy} />
          <p data-goal-caption className="text-sm text-text-secondary">{caption}</p>
          {met ? (
            <Chip tone="success" icon="check">{t.hero.goalMet}</Chip>
          ) : value !== null && hasGoal && p.state !== 'partial' ? (
            <p className="text-xs text-text-muted">{t.hero.remaining(fmtInt(goal - value, lc))}</p>
          ) : null}
        </div>
      </div>
    </Card>
  );
}

// ── schede secondarie ───────────────────────────────────────────────────────
// I piani non hanno un riquadro: `floors_climbed` e' fuori whitelist (nessuna fonte verificata).
function SecondaryMetrics({ a, lc, copy, t }: { a: ActivityDay; lc: string; copy: SharedCopy; t: ActivityCopy }) {
  const tiles = [
    { key: 'distance', label: t.tiles.distance, dot: CHART.steps, m: a.distanceKm, unit: copy.units.km, decimals: 1 },
    { key: 'caloriesActive', label: t.tiles.caloriesActive, dot: CHART.info, m: a.caloriesActive, unit: copy.units.kcal, decimals: 0 },
  ] as const;
  return (
    <section aria-labelledby="act-tiles-title" className="min-w-0">
      <h2 id="act-tiles-title" className="sr-only">{t.tiles.aria}</h2>
      {/* Una colonna sotto i 420 px: l'etichetta maiuscola di una scheda a meta' larghezza andrebbe a capo. */}
      <div className="grid h-full grid-cols-1 gap-4 min-[420px]:grid-cols-2">
        {tiles.map((x) => (
          <div key={x.key} data-metric={x.key} className="[&>*]:h-full">
            <MetricTile label={x.label} dot={x.dot}>
              <MeasureValue m={x.m} unit={x.unit} decimals={x.decimals} locale={lc} copy={copy} />
            </MetricTile>
          </div>
        ))}
      </div>
    </section>
  );
}

// ── scheletro ───────────────────────────────────────────────────────────────
/** Stessa griglia della schermata vera: eroe + tre schede, grafico orario, sette giorni. */
export function ActivityLoading() {
  return (
    <div className="space-y-6" data-screen="activity-loading">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <SkeletonBlock className="h-[212px]" />
        <div className="grid grid-cols-1 gap-4 min-[420px]:grid-cols-2">
          {[0, 1, 2].map((i) => (
            <SkeletonBlock key={i} className="h-[112px]" />
          ))}
        </div>
      </div>
      <SkeletonBlock className="h-[380px]" />
      <SkeletonBlock className="h-[380px]" />
    </div>
  );
}
