import { SkeletonBlock } from '../primitives';
import type { ScreenProps } from '../screen-types';

import { sourcesCopy } from './SourcesScreen.copy';
import { SourcesSection } from './sources/SourceCards';
import { StatusCard } from './sources/StatusCard';

/**
 * Sorgenti dei dati: da dove arrivano i dati e quando e' arrivato l'ultimo dato di ognuna.
 *
 * Due blocchi, dall'alto: (1) l'ultimo dato ricevuto e cosa puo' fare la persona;
 * (2) una scheda per sorgente, con l'ultimo dato ricevuto, i tipi di dato che
 * fornisce e quale sorgente vince per ciascuno.
 *
 * Il server conosce QUANDO e' arrivato l'ULTIMO dato di una sorgente (`received_at`
 * e' sovrascritto a ogni invio), non come e' andato ogni sync sul telefono e non
 * ha una cronologia delle ricezioni: nessun esito, nessuna durata, nessun conteggio
 * di sync, nessun elenco di ricezioni passate. Per questo la schermata non si chiama
 * «sync» e non ha una cronologia.
 * Il web NON puo' avviare un sync: qui non c'e' nessun pulsante che finga di farlo,
 * si dice di aprire l'app. Gli stati descrivono la COPERTURA del dato e non si confondono:
 *  - misurato (anche 0): un valore a zero e' un dato;
 *  - assente: nessun dato ricevuto, tipo non fornito dalla fonte sono
 *    trattini e riquadri tratteggiati con il loro motivo, mai «0»;
 *  - vecchio: oltre 48 ore l'eta' diventa il fatto principale e si dice che cio' che
 *    viene dopo non e' arrivato (non e' zero).
 */
export function SourcesScreen({ data, lc, ui, copy }: ScreenProps) {
  const c = sourcesCopy(ui);
  const hasSources = data.sources.length > 0;

  return (
    <div className="space-y-8">
      <StatusCard receipt={data.receipt} hasSources={hasSources} c={c} copy={copy} ui={ui} />
      <SourcesSection rows={data.sources} lc={lc} c={c} copy={copy} ui={ui} />
    </div>
  );
}

/** Scheletro: stessa griglia e stessi ingombri della schermata vera (ultimo dato ricevuto, due sorgenti). */
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
    </div>
  );
}
