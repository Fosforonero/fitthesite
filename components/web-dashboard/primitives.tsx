import type { ReactNode } from 'react';

import type { SharedCopy } from '@/lib/web-dashboard/copy';
import { fmtDec, fmtInt, fmtPercent } from '@/lib/web-dashboard/format';
import { presentNumber, type Measure } from '@/lib/web-dashboard/measure';

import { Icon, type IconName } from './Icon';

/**
 * Colori dei grafici: SOLO la palette di BRAND.md sez. 10. Nessun altro colore.
 */
export const CHART = {
  steps: '#1DA1FF',
  heart: '#FF5C7A',
  calories: '#FFB547',
  sleep: '#21E6C1',
  goal: '#7CFF5B',
  rem: '#A78BFA',
  info: '#38BDF8',
  resting: '#31E981',
  sleepDeep: '#1DA1FF',
  sleepRem: '#A78BFA',
  sleepLight: '#60A5FA',
  sleepAwake: '#FF5C7A',
} as const;

export function Card({
  children,
  className = '',
  as: Tag = 'section',
  ...rest
}: { children: ReactNode; className?: string; as?: 'section' | 'div' | 'article'; 'aria-label'?: string; 'aria-labelledby'?: string }) {
  return (
    <Tag className={`rounded-card border border-divider bg-bg-card p-5 shadow-card ${className}`} {...rest}>
      {children}
    </Tag>
  );
}

export function SectionLabel({ children, id }: { children: ReactNode; id?: string }) {
  return (
    <h2 id={id} className="text-[11px] uppercase tracking-[0.16em] text-text-muted font-semibold">
      {children}
    </h2>
  );
}

export function Chip({
  tone = 'neutral',
  icon,
  children,
  title,
}: {
  tone?: 'neutral' | 'success' | 'warning' | 'error' | 'info';
  icon?: IconName;
  children: ReactNode;
  title?: string;
}) {
  const tones = {
    neutral: 'bg-white/5 text-text-secondary',
    success: 'bg-success/15 text-success',
    warning: 'bg-warning/15 text-warning',
    error: 'bg-error/15 text-error',
    info: 'bg-info/15 text-info',
  } as const;
  return (
    <span title={title} className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-pill text-[11px] font-medium ${tones[tone]}`}>
      {icon ? <Icon name={icon} size={16} className="shrink-0" /> : null}
      {children}
    </span>
  );
}

/** Segno «nessun dato»: un trattino tratteggiato, mai una cifra e mai «0». */
export function AbsentMark({ className = '' }: { className?: string }) {
  return (
    <svg width="28" height="10" viewBox="0 0 28 10" aria-hidden="true" className={className}>
      <path d="M1 5h6M11 5h6M21 5h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/**
 * Un valore numerico con la sua semantica:
 *  - misurato: la cifra;
 *  - zero misurato: «0» come dato, con l'etichetta «Zero misurato»;
 *  - parziale: la cifra + chip «Parziale» + copertura (mai una cifra piena);
 *  - assente: trattino tratteggiato + motivo. Mai «0».
 * `data-measure-state` esiste per i test e per chi controlla il DOM.
 */
export function MeasureValue({
  m,
  unit,
  locale,
  copy,
  decimals = 0,
  size = 'lg',
  format,
}: {
  m: Measure<number>;
  unit?: string;
  locale: string;
  copy: SharedCopy;
  decimals?: number;
  size?: 'md' | 'lg';
  format?: (n: number) => string;
}) {
  const p = presentNumber(m);
  const numClass = size === 'lg' ? 'font-display text-metric font-semibold tracking-tightest' : 'font-display text-xl font-semibold tracking-tightest';
  const fmt = format ?? ((n: number) => (decimals > 0 ? fmtDec(n, locale, decimals) : fmtInt(n, locale)));

  if (p.state === 'absent') {
    return (
      <div data-measure-state="absent" className="text-text-muted">
        <div className={`flex items-center ${size === 'lg' ? 'h-[2.25rem]' : 'h-7'}`}>
          <AbsentMark />
          <span className="sr-only">{copy.measure.noData}</span>
        </div>
        <p className="mt-1 text-xs">{copy.measure.absent[p.reason]}</p>
      </div>
    );
  }

  return (
    <div data-measure-state={p.state}>
      <p className={`${numClass} text-text-primary`}>
        {fmt(p.value)}
        {unit ? <span className="ml-1.5 text-sm font-medium tracking-normal text-text-muted">{unit}</span> : null}
      </p>
      {p.state === 'measured-zero' ? (
        <p className="mt-1 inline-flex items-center gap-1 text-xs text-text-secondary">
          <Icon name="check" size={16} className="text-success" />
          {copy.measure.zeroMeasured}
        </p>
      ) : null}
      {p.state === 'partial' ? (
        <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
          <Chip tone="warning" title={copy.measure.partial[p.note]}>
            {copy.measure.partialLabel} {fmtPercent(p.coverage, locale)}
          </Chip>
          <span className="text-text-muted">{copy.measure.partial[p.note]}</span>
        </p>
      ) : null}
    </div>
  );
}

/** Scheda KPI (BRAND.md sez. 9). */
export function MetricTile({
  label,
  dot,
  children,
  footer,
  href,
  icon,
}: {
  label: string;
  dot: string;
  children: ReactNode;
  footer?: ReactNode;
  href?: string;
  icon?: IconName;
}) {
  const body = (
    <>
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-text-muted font-semibold">
          {icon ? <Icon name={icon} size={16} /> : null}
          {label}
        </span>
        <span aria-hidden="true" className="w-2.5 h-2.5 rounded-full" style={{ background: dot }} />
      </div>
      <div className="mt-3">{children}</div>
      {footer ? <div className="mt-3 text-xs text-text-muted">{footer}</div> : null}
    </>
  );
  const cls = 'block rounded-card border border-divider bg-bg-elevated/80 p-5 shadow-card';
  return href ? (
    <a href={href} className={`${cls} transition hover:border-brand-aqua/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-aqua`}>
      {body}
    </a>
  ) : (
    <div className={cls}>{body}</div>
  );
}

type NoticeTone = 'empty' | 'error' | 'stale' | 'partial' | 'info';

export function StateNotice({
  tone,
  title,
  children,
  action,
}: {
  tone: NoticeTone;
  title: string;
  children?: ReactNode;
  action?: { href: string; label: string };
}) {
  const map: Record<NoticeTone, { icon: IconName; ring: string; iconCls: string }> = {
    empty: { icon: 'plug', ring: 'border-divider', iconCls: 'text-text-secondary bg-white/5' },
    error: { icon: 'alert', ring: 'border-error/40', iconCls: 'text-error bg-error/15' },
    stale: { icon: 'clock', ring: 'border-warning/40', iconCls: 'text-warning bg-warning/15' },
    partial: { icon: 'info', ring: 'border-warning/40', iconCls: 'text-warning bg-warning/15' },
    info: { icon: 'info', ring: 'border-info/40', iconCls: 'text-info bg-info/15' },
  };
  const t = map[tone];
  return (
    <div role={tone === 'error' ? 'alert' : 'status'} data-notice={tone} className={`flex gap-4 rounded-card border ${t.ring} bg-bg-card p-5`}>
      <span className={`shrink-0 grid place-items-center w-10 h-10 rounded-full ${t.iconCls}`}>
        <Icon name={t.icon} size={20} />
      </span>
      <div className="min-w-0">
        <p className="font-display text-base font-semibold text-text-primary">{title}</p>
        {children ? <div className="mt-1 text-sm text-text-secondary">{children}</div> : null}
        {action ? (
          <a
            href={action.href}
            className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-pill border border-divider text-sm font-semibold text-text-primary hover:bg-white/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-aqua min-h-[44px]"
          >
            <Icon name="sync" size={16} />
            {action.label}
          </a>
        ) : null}
      </div>
    </div>
  );
}

export function SkeletonBlock({ className = '' }: { className?: string }) {
  return <div aria-hidden="true" className={`rounded-card bg-white/5 motion-safe:animate-pulse ${className}`} />;
}
