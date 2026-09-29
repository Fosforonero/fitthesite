import { SkeletonBlock } from '../primitives';
import type { ScreenProps } from '../screen-types';

import { overviewCopy } from './OverviewScreen.copy';
import { HourlyStrip } from './overview/HourlyStrip';
import { KpiGrid } from './overview/KpiGrid';
import { MissingCard } from './overview/MissingCard';
import { SleepSummary } from './overview/SleepSummary';
import { SourcesCard } from './overview/SourcesCard';
import { WeekCard } from './overview/WeekCard';
import type { OverviewCtx } from './overview/parts';

/**
 * Panoramica: cosa conta oggi a colpo d'occhio e da dove vengono i dati.
 *
 * Ordine di lettura: (1) cinque schede KPI, (2) il giorno nel dettaglio (passi
 * ora per ora + notte) affiancato agli ultimi 7 giorni, (3) da dove vengono i
 * dati e (4) cosa manca. Le quattro parti mostrano lo stesso giorno con lo
 * stesso linguaggio: misurato pieno, zero misurato = tacca, parziale = righe
 * ambra, assente = tratteggio con il motivo scritto.
 *
 * Senza sorgenti la card «Da dove vengono i tuoi dati» sale in cima: e' l'unica
 * cosa su cui chi guarda puo' agire, e il resto della pagina resta com'e' per
 * mostrare, in ogni riquadro, che cosa manca e perche'.
 */
export function OverviewScreen({ data, lc, ui, copy, href }: ScreenProps) {
  const ctx: OverviewCtx = { data, lc, ui, copy, oc: overviewCopy(ui), href };
  const hasSources = data.sources.length > 0;
  const sources = <SourcesCard ctx={ctx} />;

  return (
    <div data-screen="overview" className="space-y-6 lg:space-y-8">
      {/* senza sorgenti la card dei dispositivi sale in cima */}
      {hasSources ? null : sources}

      <KpiGrid ctx={ctx} />

      {/* il dettaglio del giorno e gli ultimi 7 giorni: affiancati da 1024 px, impilati sotto */}
      <div className="grid gap-4 lg:grid-cols-2 lg:items-start lg:gap-5">
        <div className="space-y-4 lg:space-y-5">
          <HourlyStrip ctx={ctx} />
          <SleepSummary ctx={ctx} />
        </div>
        <WeekCard ctx={ctx} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 sm:items-start lg:gap-5">
        {hasSources ? sources : null}
        <MissingCard ctx={ctx} className={hasSources ? '' : 'sm:col-span-2'} />
      </div>
    </div>
  );
}

/**
 * Scheletro: stessa griglia e blocchi delle dimensioni reali (schede KPI,
 * colonna dettaglio, 7 giorni, sorgenti, cosa manca), cosi' nulla salta
 * quando arrivano i dati.
 */
export function OverviewLoading() {
  return (
    <div data-screen="overview-loading" className="space-y-6 lg:space-y-8">
      <div>
        <SkeletonBlock className="h-3 w-40" />
        <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-6 lg:gap-5">
          <SkeletonBlock className="h-[9.5rem] lg:col-span-2" />
          <SkeletonBlock className="h-[9.5rem] lg:col-span-2" />
          <SkeletonBlock className="h-[9.5rem] lg:col-span-2" />
          <SkeletonBlock className="h-[8.5rem] lg:col-span-3" />
          <SkeletonBlock className="h-[8.5rem] sm:col-span-2 lg:col-span-3" />
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-2 lg:items-start lg:gap-5">
        <div className="space-y-4 lg:space-y-5">
          <SkeletonBlock className="h-72" />
          <SkeletonBlock className="h-80" />
        </div>
        <SkeletonBlock className="h-[40rem]" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 sm:items-start lg:gap-5">
        <SkeletonBlock className="h-[28rem]" />
        <SkeletonBlock className="h-72" />
      </div>
    </div>
  );
}
