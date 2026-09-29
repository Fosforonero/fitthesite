import type { SharedCopy } from '@/lib/web-dashboard/copy';
import { fmtDateTime, fmtInt, fmtPercent } from '@/lib/web-dashboard/format';
import { presentNumber } from '@/lib/web-dashboard/measure';
import type { ActivityDay, DashboardData } from '@/lib/web-dashboard/model';

import { Icon } from '../Icon';
import { AbsentMark, CHART, Card, Chip, MeasureValue, MetricTile, SectionLabel, SkeletonBlock } from '../primitives';
import type { ScreenProps } from '../screen-types';
import { activityCopy, type ActivityCopy } from './ActivityScreen.copy';
import { GoalRing } from './activity/GoalRing';
import { HourlyCard } from './activity/HourlyCard';
import { WeekCard } from './activity/WeekCard';
import { lastSevenDays, toHourSlots, type SlotState } from './activity/derive';

const focusRing = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-aqua';
const linkCls = `inline-flex min-h-[44px] items-center gap-2 rounded-pill border border-divider px-4 text-sm font-semibold text-text-primary hover:bg-white/5 ${focusRing}`;

/**
 * Passi e attivita' del giorno.
 *
 * Zero, parziale e assente restano tre cose diverse in ogni blocco:
 *  - eroe e schede: `MeasureValue` (cifra, cifra con copertura, trattino + motivo);
 *  - grafico orario e ultimi 7 giorni: barra, tacca sulla base, righe ambra,
 *    riquadro tratteggiato (vedi chart-kit.tsx);
 *  - fonte: nomina la fonte scelta oppure dice che non ce n'e'.
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

      <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <WeekCard days={week} goal={a.goalSteps} lc={lc} copy={copy} t={t} href={(date) => href('activity', { day: date })} />
        <SourceCard data={data} lc={lc} copy={copy} t={t} sourcesHref={href('sources')} />
      </div>
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
function SecondaryMetrics({ a, lc, copy, t }: { a: ActivityDay; lc: string; copy: SharedCopy; t: ActivityCopy }) {
  const tiles = [
    { key: 'distance', label: t.tiles.distance, dot: CHART.steps, m: a.distanceKm, unit: copy.units.km, decimals: 1 },
    { key: 'activeMinutes', label: t.tiles.activeMinutes, dot: CHART.resting, m: a.activeMinutes, unit: copy.units.min, decimals: 0 },
    { key: 'floors', label: t.tiles.floors, dot: CHART.rem, m: a.floors, unit: copy.units.floors, decimals: 0 },
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

// ── fonte dei passi ─────────────────────────────────────────────────────────
function SourceCard({ data, lc, copy, t, sourcesHref }: { data: DashboardData; lc: string; copy: SharedCopy; t: ActivityCopy; sourcesHref: string }) {
  const a = data.activity;
  const src = a.stepsSource;
  const row = src ? data.sources.find((r) => r.ref.id === src.id) : undefined;
  // Altre fonti che hanno passi per lo stesso giorno: FitMesh non le somma, e qui si vede.
  const others = src ? data.sources.filter((r) => r.ref.id !== src.id && r.types.some((x) => x.type === 'steps' && x.status === 'ok')) : [];
  const stepsAbsent = a.steps.kind === 'absent' ? a.steps.reason : null;

  return (
    <Card aria-labelledby="act-source-title" data-card="steps-source" data-source-state={src ? 'named' : 'absent'} className="flex flex-col">
      <SectionLabel id="act-source-title">{t.source.title}</SectionLabel>

      {src ? (
        <>
          <div className="mt-4 flex items-center gap-3">
            <span aria-hidden="true" className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/5 text-text-secondary">
              <Icon name="sources" size={20} />
            </span>
            <div className="min-w-0">
              <p data-source-name className="font-display text-lg font-semibold text-text-primary">{src.label}</p>
              <p className="text-sm text-text-secondary">{`${t.source.kind[src.kind]} · ${t.source.via[src.via]}`}</p>
            </div>
          </div>
          <p className="mt-4 text-sm text-text-secondary">{t.source.rule}</p>
          {others.length > 0 ? (
            <p data-not-added className="mt-3 rounded-[14px] border border-divider bg-bg-elevated/60 p-3 text-xs text-text-secondary">
              {t.source.notAdded(others.map((r) => r.ref.label).join(', '))}
            </p>
          ) : null}
          {stepsAbsent ? (
            <p data-source-absent className="mt-3 flex items-center gap-2 text-xs text-text-muted">
              <AbsentMark />
              <span>{copy.measure.absent[stepsAbsent]}</span>
            </p>
          ) : null}
          {row?.lastSyncAt ? (
            <p className="mt-3 text-xs text-text-muted">{`${copy.sync.label}: ${fmtDateTime(row.lastSyncAt, lc)}`}</p>
          ) : null}
          <div className="mt-auto pt-4">
            <a href={sourcesHref} className={linkCls}>{copy.nav.sources}</a>
          </div>
        </>
      ) : (
        <>
          <div data-source-empty className="mt-4 rounded-[14px] border border-dashed border-text-muted/50 p-4">
            <p className="flex items-center gap-2 text-sm font-semibold text-text-primary">
              <Icon name="plug" size={20} className="text-text-secondary" />
              {copy.measure.absent.no_source}
            </p>
            <p className="mt-2 text-sm text-text-secondary">{t.source.noSourceBody}</p>
          </div>
          <p className="mt-4 text-sm text-text-secondary">{t.source.rule}</p>
          <div className="mt-auto pt-4">
            {/* Rotta reale dell'area privata: qui si abbina il dispositivo. */}
            <a href={`/${lc}/app/devices`} className={linkCls}>
              <Icon name="plug" size={16} />
              {t.source.connect}
            </a>
          </div>
        </>
      )}
    </Card>
  );
}

// ── scheletro ───────────────────────────────────────────────────────────────
/** Stessa griglia della schermata vera: eroe + quattro schede, grafico orario, sette giorni + fonte. */
export function ActivityLoading() {
  return (
    <div className="space-y-6" data-screen="activity-loading">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <SkeletonBlock className="h-[212px]" />
        <div className="grid grid-cols-1 gap-4 min-[420px]:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <SkeletonBlock key={i} className="h-[112px]" />
          ))}
        </div>
      </div>
      <SkeletonBlock className="h-[380px]" />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <SkeletonBlock className="h-[380px]" />
        <SkeletonBlock className="h-[300px]" />
      </div>
    </div>
  );
}
