import type { ChartPeriod, PeriodSelectorProps } from './types';

const PERIOD_LABELS: Record<'it' | 'en', Record<ChartPeriod, string>> = {
  it: {
    7: '7 giorni',
    30: '30 giorni',
  },
  en: {
    7: '7 days',
    30: '30 days',
  },
};

const PERIODS: readonly ChartPeriod[] = [7, 30];

export function PeriodSelector({
  currentPeriod,
  onSelectPeriod,
  locale,
  className = '',
  hrefForPeriod,
}: PeriodSelectorProps) {
  const isIt = locale === 'it';
  const labels = isIt ? PERIOD_LABELS.it : PERIOD_LABELS.en;
  const navAriaLabel = isIt ? 'Selezione periodo temporale' : 'Time period selection';

  return (
    <nav aria-label={navAriaLabel} data-period-selector className={className}>
      <ul className="inline-flex gap-1 rounded-pill border border-divider bg-bg-card p-1">
        {PERIODS.map((period) => {
          const active = currentPeriod === period;
          const label = labels[period];
          const activeClass = active
            ? 'bg-brand-aqua/15 text-brand-aqua font-semibold'
            : 'text-text-secondary hover:bg-white/5 hover:text-text-primary';
          const focusClass =
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-aqua focus-visible:ring-offset-2 focus-visible:ring-offset-bg-card';

          return (
            <li key={period}>
              {hrefForPeriod ? (
                <a
                  href={hrefForPeriod(period)}
                  data-period={period}
                  aria-current={active ? 'page' : undefined}
                  className={`inline-flex min-h-[44px] min-w-[44px] items-center justify-center whitespace-nowrap rounded-pill px-4 text-sm font-medium transition sm:px-5 ${activeClass} ${focusClass}`}
                >
                  {label}
                </a>
              ) : (
                <button
                  type="button"
                  data-period={period}
                  aria-pressed={active}
                  onClick={() => onSelectPeriod?.(period)}
                  className={`inline-flex min-h-[44px] min-w-[44px] items-center justify-center whitespace-nowrap rounded-pill px-4 text-sm font-medium transition sm:px-5 ${activeClass} ${focusClass}`}
                >
                  {label}
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
