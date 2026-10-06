import { fmtAge, fmtDateTime } from '@/lib/web-dashboard/format';

import { Icon } from '../../Icon';
import { Card, SectionLabel } from '../../primitives';
import { minutesSince } from '../sources/helpers';

import { DetailLink, focusRing, type OverviewCtx } from './parts';

/**
 * «Da dove vengono i tuoi dati»: le sorgenti da cui e' arrivato qualcosa, ognuna con il nome del
 * vocabolario chiuso e l'ultimo dato ricevuto. Niente sorgente scelta per un tipo, niente genere del dispositivo
 * (il server non li sa: vedi lib/web-dashboard/model.ts), niente elenco dei tipi per sorgente.
 * Senza sorgenti diventa la spiegazione + il link alla pagina dei dispositivi
 * (rotta reale /{lc}/app/devices): e' l'unica cosa utile che si puo' fare.
 */
export function SourcesCard({ ctx }: { ctx: OverviewCtx }) {
  const { lc, ui, copy, oc, href } = ctx;
  const { receipt, sources } = ctx.data;
  const empty = sources.length === 0;

  const age = receipt.ageMinutes === null ? null : fmtAge(receipt.ageMinutes, ui);

  return (
    <div data-overview-card="sources" data-sources-count={sources.length}>
      <Card aria-labelledby="ov-sources-title">
        <div className="flex items-start justify-between gap-4">
          <SectionLabel id="ov-sources-title">{oc.sources.title}</SectionLabel>
          <DetailLink href={href('sources')} label={oc.detail} context={copy.nav.sources} />
        </div>

        {empty ? (
          <div className="mt-4 flex gap-4">
            <span aria-hidden="true" className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/5 text-text-secondary">
              <Icon name="plug" size={20} />
            </span>
            <div className="min-w-0">
              <p className="font-display text-base font-semibold text-text-primary">{oc.sources.empty.title}</p>
              <p className="mt-1 text-sm text-text-secondary">{oc.sources.empty.body}</p>
              <a
                href={`/${lc}/app/devices`}
                data-devices-link=""
                className={`mt-3 inline-flex min-h-[44px] items-center gap-2 rounded-pill border border-divider px-4 text-sm font-semibold text-text-primary hover:bg-white/5 ${focusRing}`}
              >
                <Icon name="plug" size={16} />
                {oc.sources.empty.cta}
              </a>
            </div>
          </div>
        ) : (
          <ul className="mt-4 divide-y divide-divider">
            {sources.map((row) => {
              const rowAge = row.lastReceivedAt ? minutesSince(row.lastReceivedAt) : null;
              return (
                <li key={row.ref.id} data-source={row.ref.id} className="py-3 first:pt-0">
                  <p className="text-sm font-semibold text-text-primary">{copy.sourceNames[row.ref.id]}</p>
                  <p data-slot="source-last-received" className="mt-0.5 text-xs text-text-secondary">
                    {row.lastReceivedAt
                      ? `${copy.received.label}: ${rowAge !== null ? `${fmtAge(rowAge, ui)} · ` : ''}${fmtDateTime(row.lastReceivedAt, ui)}`
                      : copy.received.never}
                  </p>
                </li>
              );
            })}
          </ul>
        )}

        <div data-slot="last-received" className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-divider pt-4">
          {receipt.lastReceivedAt && age ? (
            <p className="text-xs text-text-secondary">
              {copy.received.label}: {age} · {fmtDateTime(receipt.lastReceivedAt, ui)}
            </p>
          ) : (
            <p className="text-xs text-text-muted">{copy.received.never}</p>
          )}
        </div>
      </Card>
    </div>
  );
}
