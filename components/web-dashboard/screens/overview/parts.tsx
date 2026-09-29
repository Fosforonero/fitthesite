import type { ReactNode } from 'react';

import type { SharedCopy } from '@/lib/web-dashboard/copy';
import type { UiLocale } from '@/lib/web-dashboard/format';
import type { DashboardData } from '@/lib/web-dashboard/model';

import { Icon } from '../../Icon';
import { AbsentMark } from '../../primitives';
import type { ScreenProps } from '../../screen-types';
import type { OverviewCopy } from '../OverviewScreen.copy';

/** Tutto cio' che servono alle card della Panoramica: una sola forma, passata a ognuna. */
export interface OverviewCtx {
  data: DashboardData;
  /** Segmento di lingua dell'URL: serve solo per i link reali (/{lc}/app/devices). */
  lc: string;
  /** Lingua della copy (it/en): anche per numeri e date, cosi' testo e cifre concordano. */
  ui: UiLocale;
  copy: SharedCopy;
  oc: OverviewCopy;
  href: ScreenProps['href'];
}

export const focusRing = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-aqua';

/**
 * Link «Dettaglio» nell'angolo di una card. Area di tocco 44 px; il margine
 * negativo riporta il TESTO sull'allineamento della card, non il bordo del
 * pulsante. `context` e' letto dallo screen reader: «Dettaglio Passi ora per ora».
 */
export function DetailLink({ href, label, context }: { href: string; label: string; context?: string }) {
  return (
    <a
      href={href}
      className={`-mr-3 -mt-3 inline-flex min-h-[44px] shrink-0 items-center gap-1 rounded-pill px-3 text-xs font-semibold text-brand-aqua hover:bg-white/5 ${focusRing}`}
    >
      {label}
      {context ? <span className="sr-only"> {context}</span> : null}
      <Icon name="chevronRight" size={16} />
    </a>
  );
}

/**
 * Riquadro tratteggiato «qui non c'e' dato»: e' il segno grafico dell'assente
 * quando un intero grafico non ha nulla da disegnare. Dice il perche', e non
 * contiene mai una cifra.
 */
export function AbsentPanel({
  title,
  reason,
  className = '',
  compact = false,
  children,
}: {
  title: string;
  reason: string;
  className?: string;
  /** Riga sottile (sparkline): meno respiro verticale. */
  compact?: boolean;
  children?: ReactNode;
}) {
  return (
    <div
      data-slot-state="absent"
      className={`flex items-center justify-center rounded border border-dashed border-text-muted/50 px-4 text-center ${
        compact ? 'flex-row flex-wrap gap-x-3 gap-y-1 py-4' : 'flex-col gap-1.5 py-5'
      } ${className}`}
    >
      <AbsentMark className="shrink-0 text-text-muted" />
      <p className="text-sm font-medium text-text-primary">{title}</p>
      <p className="text-xs text-text-secondary">{reason}</p>
      {children}
    </div>
  );
}
