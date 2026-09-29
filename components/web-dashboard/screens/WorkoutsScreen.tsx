import type { SharedCopy } from '@/lib/web-dashboard/copy';
import type { DashboardData } from '@/lib/web-dashboard/model';

import { CHART, MeasureValue, MetricTile, SkeletonBlock } from '../primitives';
import type { ScreenProps } from '../screen-types';
import { workoutsCopy, type WorkoutsCopy } from './WorkoutsScreen.copy';
import { SessionList } from './workouts/SessionList';
import { WeekStrip } from './workouts/WeekStrip';
import { durationParts, listState, summarize, workoutsWeek, type Coverage } from './workouts/derive';

/**
 * Gli allenamenti del giorno.
 *
 * Zero, parziale e assente restano cose diverse in ogni blocco:
 *  - riepilogo: `MeasureValue` (cifra, cifra con copertura, trattino + motivo).
 *    Se l'elenco e' ASSENTE nessuno dei tre scrive una cifra. Non esiste
 *    «zero allenamenti» misurato: senza righe il server non prova nulla;
 *  - elenco: due casi con frasi e forma diverse (sessioni, assente + motivo);
 *  - settimana: durata e numero di allenamenti per giorno, derivati dalle sole
 *    righe di `workouts`; tacca sulla base, righe ambra, riquadro tratteggiato
 *    (vedi chart-kit.tsx).
 * Solo componenti server: l'interazione e' fatta di link costruiti con `href()`.
 */
export function WorkoutsScreen({ data, lc, ui, copy, href }: ScreenProps) {
  const t = workoutsCopy(ui);
  const state = listState(data.workouts.sessions);
  const week = workoutsWeek(data.workouts, data.date);

  return (
    <div className="space-y-6" data-screen="workouts">
      <Summary data={data} lc={lc} copy={copy} t={t} />
      <SessionList state={state} lc={lc} copy={copy} t={t} />
      <WeekStrip days={week} lc={lc} copy={copy} t={t} href={(date) => href('workouts', { day: date })} />
    </div>
  );
}

// ── riepilogo: sessioni, durata totale, calorie ─────────────────────────────
function Summary({ data, lc, copy, t }: { data: DashboardData; lc: string; copy: SharedCopy; t: WorkoutsCopy }) {
  const s = summarize(data.workouts.sessions);
  /** Se manca il campo in qualche sessione il totale e' parziale: si dice su quante e' calcolato. */
  const sumNote = (c: Coverage | null) => (c ? t.summary.sumOf(c.present, c.total) : undefined);
  const tiles = [
    { key: 'sessions', label: t.summary.sessions, dot: CHART.steps, m: s.count, footer: undefined, props: {} },
    {
      key: 'duration',
      label: t.summary.duration,
      dot: CHART.resting,
      m: s.duration,
      footer: sumNote(s.durationCover),
      props: { unit: copy.units.min, format: (n: number) => durationParts(n, lc) },
    },
    { key: 'calories', label: t.summary.calories, dot: CHART.calories, m: s.calories, footer: sumNote(s.caloriesCover), props: { unit: copy.units.kcal } },
  ];
  return (
    <section aria-labelledby="wk-summary-title">
      <h2 id="wk-summary-title" className="sr-only">
        {t.summary.aria}
      </h2>
      {/* Due colonne su telefono (la terza scheda occupa la riga), tre da 560 px. */}
      <div className="grid grid-cols-2 gap-4 min-[560px]:grid-cols-3">
        {tiles.map((x) => (
          <div key={x.key} data-metric={x.key} className={`[&>*]:h-full ${x.key === 'calories' ? 'col-span-2 min-[560px]:col-span-1' : ''}`}>
            <MetricTile label={x.label} dot={x.dot} footer={x.footer}>
              <MeasureValue m={x.m} locale={lc} copy={copy} {...x.props} />
            </MetricTile>
          </div>
        ))}
      </div>
    </section>
  );
}

// ── scheletro ───────────────────────────────────────────────────────────────
/** Stessa griglia della schermata vera: tre schede di riepilogo, elenco, settimana. */
export function WorkoutsLoading() {
  return (
    <div className="space-y-6" data-screen="workouts-loading">
      <div className="grid grid-cols-2 gap-4 min-[560px]:grid-cols-3">
        <SkeletonBlock className="h-[112px]" />
        <SkeletonBlock className="h-[112px]" />
        <SkeletonBlock className="col-span-2 h-[112px] min-[560px]:col-span-1" />
      </div>
      <SkeletonBlock className="h-[360px]" />
      <SkeletonBlock className="h-[380px]" />
    </div>
  );
}
