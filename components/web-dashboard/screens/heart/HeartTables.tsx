import type { SharedCopy } from '@/lib/web-dashboard/copy';
import { fmtInt } from '@/lib/web-dashboard/format';
import { presentNumber } from '@/lib/web-dashboard/measure';

import { AbsentMark, Chip } from '../../primitives';
import type { HeartCopy } from '../HeartScreen.copy';
import { hhmm, type HourRow, type WorkoutWindow } from './series';

/**
 * Alternativa testuale al grafico, dentro il <details> del ChartFrame.
 *
 * Ogni ora e' misurata (6 campioni su 6), parziale (alcuni campioni) o assente
 * (nessun campione, oppure non ancora trascorsa): lo stato sta sulla riga come
 * `data-slot-state`, e una riga assente non stampa nessun numero.
 */

const th = 'py-2 pr-4 text-left text-[11px] font-semibold uppercase tracking-[0.16em] text-text-muted';
const td = 'py-2 pr-4 tabular-nums text-text-primary';

export function HeartTables({
  lc,
  rows,
  windows,
  copy,
  t,
}: {
  lc: string;
  rows: HourRow[];
  windows: WorkoutWindow[];
  copy: SharedCopy;
  t: HeartCopy;
}) {
  return (
    <div className="space-y-6">
      <table className="w-full min-w-[26rem] border-collapse text-sm" data-heart-table="hours">
        <caption className="sr-only">{t.hourCaption}</caption>
        <thead>
          <tr className="border-b border-divider">
            <th scope="col" className={th}>{t.cols.hour}</th>
            <th scope="col" className={th}>{t.cols.min}</th>
            <th scope="col" className={th}>{t.cols.avg}</th>
            <th scope="col" className={th}>{t.cols.max}</th>
            <th scope="col" className={th}>{t.cols.samples}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.hour} data-slot-state={r.state} data-hour={r.hour} className="border-b border-divider/60">
              <th scope="row" className="py-2 pr-4 text-left font-medium tabular-nums text-text-secondary">{hhmm(r.hour * 60)}</th>
              {r.state === 'absent' ? (
                <td colSpan={4} data-absent-reason={r.reason} className="py-2 pr-4 text-text-muted">
                  <span className="inline-flex items-center gap-2">
                    <AbsentMark />
                    {copy.measure.absent[r.reason === 'not_yet' ? 'not_yet' : 'no_samples']}
                  </span>
                </td>
              ) : (
                <>
                  <td className={td}>{fmtInt(r.min as number, lc)}</td>
                  <td className={td}>{fmtInt(r.avg as number, lc)}</td>
                  <td className={td}>{fmtInt(r.max as number, lc)}</td>
                  <td className="py-2 pr-4 text-text-secondary">
                    {r.state === 'partial' ? (
                      <Chip tone="warning" title={t.samplesOf(r.samples, r.expected)}>
                        {t.samplesOf(r.samples, r.expected)}
                      </Chip>
                    ) : (
                      t.samplesOf(r.samples, r.expected)
                    )}
                  </td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>

      {windows.length > 0 ? (
        <table className="w-full min-w-[26rem] border-collapse text-sm" data-heart-table="workouts">
          <caption className="sr-only">{t.workoutCaption}</caption>
          <thead>
            <tr className="border-b border-divider">
              <th scope="col" className={th}>{t.workoutCols.title}</th>
              <th scope="col" className={th}>{t.workoutCols.from}</th>
              <th scope="col" className={th}>{t.workoutCols.to}</th>
            </tr>
          </thead>
          <tbody>
            {windows.map((w) => {
              const p = presentNumber(w.duration);
              return (
                <tr key={w.id} data-workout-id={w.id} className="border-b border-divider/60">
                  <th scope="row" className="py-2 pr-4 text-left font-medium text-text-primary">{t.workoutTypes[w.type]}</th>
                  <td className={td}>{hhmm(w.startMin)}</td>
                  {p.state === 'absent' || w.endMin === null ? (
                    <td data-slot-state="absent" className="py-2 pr-4 text-text-muted">
                      <span className="inline-flex items-center gap-2">
                        <AbsentMark />
                        {p.state === 'absent' ? copy.measure.absent[p.reason] : copy.measure.noData}
                      </span>
                    </td>
                  ) : (
                    <td className={td}>{hhmm(w.endMin)}</td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      ) : null}
    </div>
  );
}
