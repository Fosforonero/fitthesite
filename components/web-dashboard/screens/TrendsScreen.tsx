import { fmtDayShort } from '@/lib/web-dashboard/format';
import type { ScreenKey } from '@/lib/web-dashboard/model';
import type { PreviewParams, Range } from '@/lib/web-dashboard/params';

import { Icon } from '../Icon';
import { SkeletonBlock } from '../primitives';
import type { ScreenProps } from '../screen-types';

import { trendsCopy, type TrendsCopy } from './TrendsScreen.copy';
import { METRICS, TrendCard, prepare } from './trends/TrendCard';
import { windowOf } from './trends/derive';
import { TRENDS_GRID } from './trends/layout';

/**
 * Trend: 7, 30 o 90 giorni che finiscono nel giorno scelto.
 *
 * Solo informazione: nessun giudizio sull'andamento (il modello dati non ha
 * soglie ne' obiettivi per i trend e non spetta a questa schermata inventarli).
 *
 * Zero / parziale / assente, qui:
 *  - un giorno assente NON e' un giorno a zero: nel grafico e' un riquadro
 *    tratteggiato senza barra e senza punto, e la linea del battito a riposo si
 *    spezza; resta fuori da media, minimo e massimo e si conta a parte
 *    («N giorni su M con dato»);
 *  - un giorno a zero misurato e' un dato: una tacca sulla base e, nella
 *    tabella, «0» con «Zero misurato»;
 *  - un giorno parziale ha le righe ambra e porta la sua copertura; il totale
 *    dei passi (`sumMeasures`) diventa parziale appena manca un giorno;
 *  - con meno di 3 giorni con dato il grafico non si disegna: al suo posto una
 *    scheda dice quanti giorni ci sono e perche' gli altri mancano.
 */

const focusRing = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-aqua';
const RANGES: readonly Range[] = [7, 30, 90];

function RangeSelector({
  t,
  params,
  href,
}: {
  t: TrendsCopy;
  params: PreviewParams;
  href: (screen: ScreenKey, overrides?: Partial<PreviewParams>) => string;
}) {
  return (
    <nav aria-label={t.rangeLabel} data-trends-range>
      <ul className="inline-flex gap-1 rounded-pill border border-divider bg-bg-card p-1">
        {RANGES.map((r) => {
          const active = params.range === r;
          return (
            <li key={r}>
              <a
                href={href('trends', { range: r })}
                data-range={r}
                aria-current={active ? 'true' : undefined}
                className={`inline-flex min-h-[44px] min-w-[44px] items-center justify-center whitespace-nowrap rounded-pill px-4 text-sm font-medium sm:px-5 ${
                  active ? 'bg-brand-aqua/15 text-brand-aqua' : 'text-text-secondary hover:bg-white/5 hover:text-text-primary'
                } ${focusRing}`}
              >
                {t.ranges[r]}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function TrendsScreen({ data, lc, ui, copy, params, href }: ScreenProps) {
  const t = trendsCopy(ui);
  const prepared = METRICS.map((cfg) => prepare(cfg, windowOf(data.trends.find((s) => s.metric === cfg.metric), params.range)));

  // Il periodo si legge dalla prima serie che ha giorni: sono tutte 90 giorni che finiscono nel giorno scelto.
  const anyDays = prepared.find((p) => p.days.length > 0)?.days ?? [];
  const from = anyDays[0]?.date ?? data.date;
  const to = anyDays[anyDays.length - 1]?.date ?? data.date;

  // Nessuna fonte: tutte e quattro le serie sono vuote per lo stesso motivo. Una sola spiegazione, con il link per collegarla.
  const noSource = prepared.every((p) => p.stats.withData === 0 && p.stats.dominantReason === 'no_source');

  return (
    <div className="space-y-6" data-screen="trends">
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
        <RangeSelector t={t} params={params} href={href} />
        <p data-trends-period className="text-sm text-text-secondary">
          {t.period(fmtDayShort(from, ui), fmtDayShort(to, ui))}
        </p>
      </div>

      {noSource ? (
        <div data-trends-no-source className="flex gap-4 rounded-card border border-divider bg-bg-card p-5">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/5 text-text-secondary">
            <Icon name="plug" size={20} />
          </span>
          <div className="min-w-0">
            <p className="font-display text-base font-semibold text-text-primary">{t.noSource.title}</p>
            <p className="mt-1 max-w-[60ch] text-sm text-text-secondary">{t.noSource.body}</p>
            <a
              href={`/${lc}/app/devices`}
              className={`mt-3 inline-flex min-h-[44px] items-center gap-2 rounded-pill border border-divider px-4 py-2 text-sm font-semibold text-text-primary hover:bg-white/5 ${focusRing}`}
            >
              <Icon name="plug" size={16} />
              {t.noSource.link}
            </a>
          </div>
        </div>
      ) : null}

      <div className={TRENDS_GRID}>
        {prepared.map((p) => (
          <TrendCard key={p.cfg.metric} p={p} lc={lc} ui={ui} copy={copy} t={t} href={href} />
        ))}
      </div>
    </div>
  );
}

/** Scheletro: il selettore e la stessa griglia, con quattro blocchi alti come le schede reali. */
export function TrendsLoading() {
  return (
    <div className="space-y-6" data-screen-loading="trends">
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
        <SkeletonBlock className="h-[52px] w-[19.5rem] max-w-full !rounded-pill" />
        <SkeletonBlock className="h-5 w-64 max-w-full !rounded" />
      </div>
      <div className={TRENDS_GRID}>
        {METRICS.map((m) => (
          <SkeletonBlock key={m.metric} className="h-[38rem]" />
        ))}
      </div>
    </div>
  );
}
