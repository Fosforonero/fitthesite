import type { SharedCopy } from '@/lib/web-dashboard/copy';
import type { Measure } from '@/lib/web-dashboard/measure';
import type { DashboardData, Workout } from '@/lib/web-dashboard/model';

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
  const st = listState(data.workouts.sessions);
  /**
   * Il totale di durata/calorie e' «parziale per quota di sessioni» se almeno una sessione non ha il
   * campo pieno: allora la percentuale sarebbe sessioni piene / sessioni, non una copertura temporale.
   * Si mostra «Dati incompleti» senza percentuale e, SEMPRE, il conteggio delle sessioni complete
   * nel piede della scheda («N su M sessioni complete»). Se il campo e' ASSENTE in qualche sessione
   * il piede dice gia' «Somma delle sessioni con dato: P su M»: il conteggio delle complete si
   * aggiunge solo quando differisce da P (campo parziale, non assente).
   */
  const incompleteChip = { chip: copy.measure.partial.incomplete_coverage };
  const incompleteIn = (pick: (w: Workout) => Measure<number>) =>
    st.kind === 'sessions' && st.sessions.some((w) => pick(w).kind !== 'value');
  const quota = (pick: (w: Workout) => Measure<number>) => (incompleteIn(pick) ? { partialDisplay: incompleteChip } : {});
  /** Piede della scheda: somma sulle sessioni con dato (campo assente) e/o conteggio delle complete. */
  const footerFor = (pick: (w: Workout) => Measure<number>, c: Coverage | null) => {
    const sum = c ? t.summary.sumOf(c.present, c.total) : undefined;
    if (st.kind !== 'sessions' || !incompleteIn(pick)) return sum;
    const complete = st.sessions.filter((w) => pick(w).kind === 'value').length;
    if (c && c.present === complete) return sum;
    const done = t.summary.completeOf(complete, st.sessions.length);
    return sum ? `${sum} ${done}` : done;
  };
  const tiles = [
    { key: 'sessions', label: t.summary.sessions, dot: CHART.steps, m: s.count, footer: undefined, props: {} },
    {
      key: 'duration',
      label: t.summary.duration,
      dot: CHART.resting,
      m: s.duration,
      footer: footerFor((w) => w.durationMin, s.durationCover),
      props: { unit: copy.units.min, format: (n: number) => durationParts(n, lc), ...quota((w) => w.durationMin) },
    },
    { key: 'calories', label: t.summary.calories, dot: CHART.calories, m: s.calories, footer: footerFor((w) => w.caloriesKcal, s.caloriesCover), props: { unit: copy.units.kcal, ...quota((w) => w.caloriesKcal) } },
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
