import type { ReactNode } from 'react';

import type { SharedCopy } from '@/lib/web-dashboard/copy';

import { CHART, Card, SectionLabel } from './primitives';

/**
 * Attrezzi comuni ai grafici (SVG inline, nessuna libreria).
 *
 * Linguaggio visivo dei tre stati, uguale in tutti i grafici:
 *  - misurato: riempimento pieno nel colore della serie;
 *  - zero misurato: una TACCA sulla linea di base (il dato c'e', vale zero);
 *  - parziale: riempimento a righe ambra (il dato c'e' ma e' incompleto);
 *  - assente: nessuna barra, un riquadro tratteggiato (il dato NON c'e').
 * Un grafico non disegna mai una barra a zero per un dato assente, e non
 * unisce con una linea due punti separati da un buco.
 */

export function niceMax(max: number, steps = 4): number {
  if (max <= 0) return steps;
  const rough = max / steps;
  const pow = Math.pow(10, Math.floor(Math.log10(rough)));
  const f = rough / pow;
  const nice = f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10;
  return nice * pow * steps;
}

export function scale(domain: [number, number], range: [number, number]) {
  const [d0, d1] = domain;
  const [r0, r1] = range;
  const k = d1 === d0 ? 0 : (r1 - r0) / (d1 - d0);
  return (v: number) => r0 + (v - d0) * k;
}

/** Definizioni dei motivi: `prefix` rende gli id unici quando ci sono piu' grafici nella pagina. */
export function PatternDefs({ prefix, color }: { prefix: string; color: string }) {
  return (
    <defs>
      <pattern id={`${prefix}-partial`} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <rect width="6" height="6" fill={CHART.calories} fillOpacity="0.10" />
        <line x1="0" y1="0" x2="0" y2="6" stroke={CHART.calories} strokeWidth="2.5" />
      </pattern>
      <pattern id={`${prefix}-absent`} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <line x1="0" y1="0" x2="0" y2="6" stroke="#7F8AA3" strokeOpacity="0.35" strokeWidth="1" />
      </pattern>
      <linearGradient id={`${prefix}-fade`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={color} stopOpacity="0.28" />
        <stop offset="1" stopColor={color} stopOpacity="0" />
      </linearGradient>
    </defs>
  );
}

function Swatch({ kind, color }: { kind: 'measured' | 'zero' | 'partial' | 'absent' | 'goal'; color: string }) {
  return (
    <svg width="18" height="14" viewBox="0 0 18 14" aria-hidden="true" className="shrink-0">
      {kind === 'measured' ? <rect x="2" y="2" width="14" height="10" rx="3" fill={color} /> : null}
      {kind === 'zero' ? <path d="M2 12h14" stroke={color} strokeWidth="3" strokeLinecap="round" /> : null}
      {kind === 'partial' ? (
        <>
          <rect x="2" y="2" width="14" height="10" rx="3" fill={CHART.calories} fillOpacity="0.14" />
          <path d="M5 12L11 2M9 12l6-10" stroke={CHART.calories} strokeWidth="2" />
        </>
      ) : null}
      {kind === 'absent' ? <rect x="2.5" y="2.5" width="13" height="9" rx="3" fill="none" stroke="#7F8AA3" strokeWidth="1.5" strokeDasharray="3 2.5" /> : null}
      {kind === 'goal' ? <path d="M1 7h16" stroke={CHART.goal} strokeWidth="1.5" strokeDasharray="4 3" /> : null}
    </svg>
  );
}

/** Legenda dei tre stati (e, se serve, dell'obiettivo). Mostra solo le voci usate dal grafico. */
export function StateLegend({
  copy,
  color,
  show = ['measured', 'zero', 'partial', 'absent'],
}: {
  copy: SharedCopy;
  color: string;
  show?: Array<'measured' | 'zero' | 'partial' | 'absent' | 'goal'>;
}) {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-text-secondary" aria-label="Legenda">
      {show.map((k) => (
        <li key={k} className="inline-flex items-center gap-1.5">
          <Swatch kind={k} color={color} />
          {copy.legend[k]}
        </li>
      ))}
    </ul>
  );
}

/**
 * Cornice di un grafico: titolo, sommario testuale (per chi non vede il
 * grafico), figura, legenda e, a richiesta, la tabella dei dati.
 */
export function ChartFrame({
  id,
  title,
  subtitle,
  summary,
  legend,
  children,
  table,
  tableLabel,
  aside,
}: {
  id: string;
  title: string;
  subtitle?: string;
  /** Frase che dice cosa mostra il grafico, letta dagli screen reader. */
  summary: string;
  legend?: ReactNode;
  children: ReactNode;
  table?: ReactNode;
  tableLabel?: string;
  aside?: ReactNode;
}) {
  return (
    <Card aria-labelledby={`${id}-title`}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <SectionLabel id={`${id}-title`}>{title}</SectionLabel>
          {subtitle ? <p className="mt-1 text-sm text-text-secondary">{subtitle}</p> : null}
        </div>
        {aside}
      </div>
      <figure className="mt-4" role="group" aria-describedby={`${id}-summary`}>
        <div role="img" aria-label={summary}>
          {children}
        </div>
        <figcaption id={`${id}-summary`} className="sr-only">
          {summary}
        </figcaption>
      </figure>
      {legend ? <div className="mt-3">{legend}</div> : null}
      {table ? (
        <details className="mt-3 group">
          <summary className="cursor-pointer text-xs text-text-muted hover:text-text-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-aqua rounded">
            {tableLabel ?? 'Data'}
          </summary>
          <div className="mt-2 overflow-x-auto">{table}</div>
        </details>
      ) : null}
    </Card>
  );
}
