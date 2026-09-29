import type { ReactNode } from 'react';

import type { SharedCopy } from '@/lib/web-dashboard/copy';
import { fmtPercent } from '@/lib/web-dashboard/format';

import { AbsentMark, CHART } from '../../primitives';
import type { Slot } from './derive';

/** Lunghezze SVG in percentuale: il grafico si adatta alla larghezza senza viewBox, il testo resta a dimensione fissa. */
export const pc = (n: number) => `${Number(n.toFixed(3))}%`;

/** Larghezza della colonna dell'asse Y (px). */
export const Y_AXIS_W = 44;

/** Asse Y: solo le etichette dei tick, alla stessa altezza delle linee guida del grafico. */
export function YAxis({ height, ticks, y, format }: { height: number; ticks: number[]; y: (v: number) => number; format: (n: number) => string }) {
  return (
    <svg width={Y_AXIS_W} height={height} aria-hidden="true" focusable="false" className="shrink-0">
      {ticks.map((t) => (
        <text key={t} x={Y_AXIS_W - 6} y={y(t) + 4} textAnchor="end" fontSize="11" className="fill-text-muted">
          {format(t)}
        </text>
      ))}
    </svg>
  );
}

/** Miniatura dello stato, uguale a quella della legenda: tratteggiato = assente, righe ambra = parziale. */
export function NoteSwatch({ kind }: { kind: 'absent' | 'partial' }) {
  return (
    <svg width="18" height="14" viewBox="0 0 18 14" aria-hidden="true" className="mt-0.5 shrink-0" focusable="false">
      {kind === 'absent' ? (
        <rect x="2.5" y="2.5" width="13" height="9" rx="3" fill="none" strokeWidth="1.5" strokeDasharray="3 2.5" className="stroke-text-muted" />
      ) : (
        <>
          <rect x="2" y="2" width="14" height="10" rx="3" fill={CHART.calories} fillOpacity="0.14" />
          <path d="M5 12L11 2M9 12l6-10" stroke={CHART.calories} strokeWidth="2" />
        </>
      )}
    </svg>
  );
}

export interface NoteItem {
  key: string;
  /** Posizione dello slot (ora o giorno): le note escono in ordine di tempo, non in ordine di tipo. */
  order: number;
  kind: 'absent' | 'partial';
  /** Ora, intervallo o giorno a cui si riferisce la nota. */
  label: string;
  text: string;
}

/**
 * Elenco «dove e perche' manca qualcosa», fuori dall'immagine del grafico: chi
 * usa uno screen reader lo legge come testo, e chi guarda trova il motivo
 * accanto al riquadro tratteggiato senza indovinarlo.
 */
export function ChartNotes({ title, items: unsorted }: { title: string; items: NoteItem[] }) {
  if (unsorted.length === 0) return null;
  const items = [...unsorted].sort((a, b) => a.order - b.order);
  return (
    <ul aria-label={title} data-chart-notes className="mt-3 space-y-1.5 text-xs text-text-secondary">
      {items.map((n) => (
        <li key={n.key} data-note={n.kind} className="flex items-start gap-2">
          <NoteSwatch kind={n.kind} />
          <span>
            <span className="font-medium text-text-primary">{n.label}</span>
            <span className="text-text-muted">{' · '}</span>
            {n.text}
          </span>
        </li>
      ))}
    </ul>
  );
}

/** Testo della colonna «Stato» delle tabelle: una riga per slot, con il motivo per gli assenti e la copertura per i parziali. */
export function slotStateText(s: Slot, copy: SharedCopy, locale: string): ReactNode {
  if (s.state === 'absent') return s.reason ? copy.measure.absent[s.reason] : copy.legend.absent;
  if (s.state === 'partial') {
    return `${copy.measure.partialLabel} ${fmtPercent(s.coverage ?? 0, locale)}${s.note ? `. ${copy.measure.partial[s.note]}` : ''}`;
  }
  return s.state === 'measured-zero' ? copy.measure.zeroMeasured : copy.legend.measured;
}

/** Cella «Passi» della tabella: la cifra per i dati, il trattino tratteggiato (mai «0») per l'assente. */
export function SlotStepsCell({ s, copy, format }: { s: Slot; copy: SharedCopy; format: (n: number) => string }) {
  if (s.state === 'absent' || s.value === null) {
    return (
      <td data-cell="steps" className={`${tableCls.td} text-text-muted`}>
        <AbsentMark className="inline-block" />
        <span className="sr-only">{copy.measure.noData}</span>
      </td>
    );
  }
  return (
    <td data-cell="steps" className={`${tableCls.td} tabular-nums text-text-primary`}>
      {format(s.value)}
    </td>
  );
}

export const tableCls = {
  wrap: 'max-h-72 overflow-auto rounded-[14px] border border-divider',
  table: 'w-full min-w-[18rem] border-collapse text-left text-xs',
  th: 'sticky top-0 bg-bg-elevated px-3 py-2 font-medium text-text-muted',
  td: 'border-t border-divider px-3 py-2',
} as const;
