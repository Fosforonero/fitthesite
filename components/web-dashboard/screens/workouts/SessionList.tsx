import type { ReactNode } from 'react';

import type { SharedCopy } from '@/lib/web-dashboard/copy';
import { fmtPercent, fmtTime } from '@/lib/web-dashboard/format';
import type { AbsentReason } from '@/lib/web-dashboard/measure';
import type { Workout } from '@/lib/web-dashboard/model';

import { Icon, type IconName } from '../../Icon';
import { AbsentMark, Card, Chip, MeasureValue, SectionLabel } from '../../primitives';
import type { WorkoutsCopy } from '../WorkoutsScreen.copy';
import { TypeIcon } from './TypeIcon';
import { durationParts, type ListState } from './derive';

const focusRing = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-aqua';
const linkCls = `mt-4 inline-flex min-h-[44px] items-center gap-2 rounded-pill border border-divider px-4 text-sm font-semibold text-text-primary hover:bg-white/5 ${focusRing}`;
const labelCls = 'text-[11px] font-semibold uppercase tracking-[0.16em] text-text-muted';

/**
 * Colonne della tabella (da md in su). La riga di intestazione e ogni riga
 * usano la STESSA definizione, cosi' le colonne restano allineate.
 * Sotto md la stessa riga diventa una scheda impilata: un solo DOM, due layout.
 */
const COLS =
  'md:grid-cols-[minmax(160px,2fr)_56px_104px_96px_104px_80px_80px_minmax(96px,1fr)]';
const TABLE_MIN = 'md:min-w-[900px]';

/** Una cella con la sua etichetta: visibile nella scheda, solo per gli screen reader nella tabella (che ha l'intestazione). */
function Cell({ id, label, children, text = false }: { id: string; label: string; children: ReactNode; text?: boolean }) {
  // Nella tabella le cifre (28 px di riga) e il testo semplice (24 px) si centrano sulla riga da 40 px dell'icona.
  return (
    <div data-cell={id} className={`min-w-0 ${text ? 'md:pt-2' : 'md:pt-1.5'}`}>
      <p className={`${labelCls} mb-1 md:sr-only`}>{label}</p>
      {children}
    </div>
  );
}

function SessionRow({ w, lc, copy, t }: { w: Workout; lc: string; copy: SharedCopy; t: WorkoutsCopy }) {
  const c = t.list.cols;
  const typeLabel = t.list.types[w.type];
  // Il titolo e' il nome che la fonte da' alla sessione; il tipo si ripete solo se dice altro.
  const showType = w.title.trim().toLowerCase() !== typeLabel.toLowerCase();
  return (
    <li
      data-session={w.id}
      data-type={w.type}
      className={`rounded-card border border-divider bg-bg-elevated/60 p-4 md:grid md:items-start md:gap-x-3 md:rounded-none md:border-0 md:border-b md:bg-transparent md:px-4 md:py-3 md:last:border-b-0 ${COLS}`}
    >
      <div className="flex items-start justify-between gap-3 md:contents">
        <div className="flex min-w-0 items-center gap-3">
          <span aria-hidden="true" className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/5 text-text-secondary">
            <TypeIcon type={w.type} />
          </span>
          <div className="min-w-0">
            <h3 className="font-display text-base font-semibold leading-tight text-text-primary">{w.title}</h3>
            {showType ? <p className="mt-0.5 text-xs text-text-muted">{typeLabel}</p> : <p className="sr-only">{typeLabel}</p>}
          </div>
        </div>
        <div data-cell="start" className="shrink-0 md:pt-2">
          <p className="sr-only">{c.start}</p>
          <p className="text-sm font-medium tabular-nums text-text-secondary md:text-base">{fmtTime(w.startedAt, lc)}</p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-4 border-t border-divider pt-4 md:contents">
        <Cell id="duration" label={c.duration}>
          <MeasureValue m={w.durationMin} unit={copy.units.min} locale={lc} copy={copy} size="md" format={(n) => durationParts(n, lc)} />
        </Cell>
        <Cell id="distance" label={c.distance}>
          <MeasureValue m={w.distanceKm} unit={copy.units.km} locale={lc} copy={copy} size="md" decimals={1} />
        </Cell>
        <Cell id="calories" label={c.calories}>
          <MeasureValue m={w.caloriesKcal} unit={copy.units.kcal} locale={lc} copy={copy} size="md" />
        </Cell>
        <Cell id="hrAvg" label={c.hrAvg}>
          <MeasureValue m={w.hrAvg} unit={copy.units.bpm} locale={lc} copy={copy} size="md" />
        </Cell>
        <Cell id="hrMax" label={c.hrMax}>
          <MeasureValue m={w.hrMax} unit={copy.units.bpm} locale={lc} copy={copy} size="md" />
        </Cell>
        <Cell id="source" label={c.source} text>
          <p className="text-sm text-text-secondary">{w.source.label}</p>
        </Cell>
      </div>
    </li>
  );
}

function HeaderRow({ t }: { t: WorkoutsCopy }) {
  const c = t.list.cols;
  const cols = [c.session, c.start, c.duration, c.distance, c.calories, c.hrAvg, c.hrMax, c.source];
  return (
    <div aria-hidden="true" data-list-header className={`hidden border-b border-divider px-4 pb-2 md:grid md:gap-x-3 ${COLS}`}>
      {cols.map((x) => (
        <span key={x} className={labelCls}>
          {x}
        </span>
      ))}
    </div>
  );
}

/** Un'icona per motivo: dice a colpo d'occhio che cosa manca, senza sostituire il testo. */
const REASON_ICON: Record<AbsentReason, IconName> = {
  no_data_received: 'plug',
  not_synced_yet: 'clock',
  source_lacks_type: 'dash',
  no_samples: 'dash',
  not_yet: 'clock',
};

/** Non sappiamo se ce ne sono stati. Riquadro tratteggiato, mai la frase dello zero. */
function AbsentList({
  reason,
  lc,
  copy,
  t,
}: {
  reason: AbsentReason;
  lc: string;
  copy: SharedCopy;
  t: WorkoutsCopy;
}) {
  return (
    <div data-list-state="absent" data-reason={reason} className="mt-4 flex items-start gap-4 rounded border border-dashed border-text-muted/60 p-5">
      <span aria-hidden="true" className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/5 text-text-muted">
        <Icon name={REASON_ICON[reason]} size={20} />
      </span>
      <div className="min-w-0">
        <p className="font-display text-lg font-semibold text-text-primary">{t.list.absent.title}</p>
        <p data-absent-reason className="mt-2 flex items-center gap-2 text-xs text-text-muted">
          <AbsentMark />
          <span>{copy.measure.absent[reason]}</span>
        </p>
        <p className="mt-2 text-sm text-text-secondary">{t.list.absent.body[reason]}</p>
        {reason === 'no_data_received' ? (
          // Rotta reale dell'area privata: qui si abbina il dispositivo.
          <a href={`/${lc}/app/devices`} className={linkCls}>
            <Icon name="plug" size={16} />
            {t.list.absent.connect}
          </a>
        ) : null}
      </div>
    </div>
  );
}

/**
 * Le sessioni del giorno. Due casi che NON si confondono:
 *  - ci sono sessioni: tabella (da md) o schede impilate;
 *  - lista ASSENTE: «Non sappiamo se ci sono stati allenamenti» + il motivo.
 * Non c'e' un terzo caso «nessun allenamento»: senza righe il server non prova che
 * non ce ne siano stati, quindi il giorno e' assente.
 */
export function SessionList({
  state,
  lc,
  copy,
  t,
}: {
  state: ListState;
  lc: string;
  copy: SharedCopy;
  t: WorkoutsCopy;
}) {
  return (
    <Card aria-labelledby="wk-list-title" data-card="sessions">
      <SectionLabel id="wk-list-title">{t.list.title}</SectionLabel>

      {state.kind === 'absent' ? <AbsentList reason={state.reason} lc={lc} copy={copy} t={t} /> : null}

      {state.kind === 'sessions' ? (
        <>
          {state.partial ? (
            <div data-list-state="partial" className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 rounded border border-warning/40 bg-warning/10 p-4 text-sm text-text-secondary">
              <Chip tone="warning" title={copy.measure.partial[state.partial.note]}>
                {copy.measure.partialLabel} {fmtPercent(state.partial.coverage, lc)}
              </Chip>
              <span className="min-w-0 flex-1">
                <span className="font-semibold text-text-primary">{t.list.partialTitle}. </span>
                {t.list.partialBody} {copy.measure.partial[state.partial.note]}.
              </span>
            </div>
          ) : null}

          {/* Una tabella troppo larga scorre DENTRO la scheda: la pagina non scorre mai in orizzontale. */}
          <div
            role="region"
            aria-label={t.list.title}
            tabIndex={0}
            className={`mt-4 overflow-x-auto rounded ${focusRing}`}
            data-list-state="sessions"
          >
            <div className={TABLE_MIN}>
              <HeaderRow t={t} />
              <ol className="space-y-3 md:space-y-0">
                {state.sessions.map((w) => (
                  <SessionRow key={w.id} w={w} lc={lc} copy={copy} t={t} />
                ))}
              </ol>
            </div>
          </div>
        </>
      ) : null}
    </Card>
  );
}
