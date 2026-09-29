import { SkeletonBlock } from '../primitives';
import type { ScreenProps } from '../screen-types';

import { sourcesCopy } from './SourcesScreen.copy';
import { HistoryCard } from './sources/History';
import { SourcesSection } from './sources/SourceCards';
import { StatusCard } from './sources/StatusCard';
import { isStaleAge, syncAge } from './sources/helpers';

/**
 * Sorgenti e sync: da dove arrivano i dati e come sono andati gli ultimi sync.
 *
 * Tre blocchi, dall'alto: (1) lo stato dell'ultimo sync, con il motivo in parole
 * semplici e cosa puo' fare la persona; (2) una scheda per sorgente, con i tipi
 * di dato che fornisce e quale sorgente vince per ciascuno; (3) la cronologia.
 *
 * Il web NON puo' avviare un sync: qui non c'e' nessun pulsante che finga di farlo,
 * si dice di aprire l'app. E i tre stati non si confondono:
 *  - misurato (anche 0): un conteggio a zero e' un dato («0 non riusciti»);
 *  - assente: nessun sync, durata non registrata, tipo non fornito o senza permesso
 *    sono trattini e riquadri tratteggiati con il loro motivo, mai «0»;
 *  - vecchio: oltre 48 ore l'eta' diventa il fatto principale e si dice che cio' che
 *    viene dopo non e' arrivato (non e' zero).
 */
export function SourcesScreen({ data, lc, ui, copy }: ScreenProps) {
  const c = sourcesCopy(ui);
  const hasSources = data.sources.length > 0;
  const staleSince = isStaleAge(syncAge(data.sync)) ? data.sync.lastSyncAt : null;

  return (
    <div className="space-y-8">
      <StatusCard sync={data.sync} hasSources={hasSources} c={c} copy={copy} ui={ui} />
      <SourcesSection rows={data.sources} lc={lc} c={c} copy={copy} ui={ui} />
      <HistoryCard log={data.syncLog} staleSince={staleSince} c={c} copy={copy} ui={ui} />
    </div>
  );
}

/** Scheletro: stessa griglia e stessi ingombri della schermata vera (stato del sync, due sorgenti, cronologia). */
export function SourcesLoading() {
  return (
    <div className="space-y-8">
      <SkeletonBlock className="h-[420px] lg:h-[288px]" />
      <div>
        <SkeletonBlock className="h-3 w-32 rounded" />
        <SkeletonBlock className="mt-3 h-4 w-full max-w-[44rem] rounded" />
        <div className="mt-4 space-y-4">
          <SkeletonBlock className="h-[1100px] sm:h-[600px] lg:h-[440px]" />
          <SkeletonBlock className="h-[520px] sm:h-[330px] lg:h-[260px]" />
        </div>
      </div>
      <SkeletonBlock className="h-[900px] sm:h-[560px]" />
    </div>
  );
}
