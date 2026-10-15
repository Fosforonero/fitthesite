import type { ReactNode } from 'react';

import { Icon, type IconName } from './Icon';

/**
 * Mattoni visivi neutri dei grafici (sede condivisa `components/charts`): nessun testo,
 * nessun modello, nessun dato di prova e nessun import dall'anteprima.
 */

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
