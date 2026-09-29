import type { SharedCopy } from '@/lib/web-dashboard/copy';
import { fmtDateTime, type UiLocale } from '@/lib/web-dashboard/format';
import type { AbsentReason } from '@/lib/web-dashboard/measure';
import type { ReceiptStatus } from '@/lib/web-dashboard/model';

import { Icon } from '../../Icon';
import { AbsentMark, Card, SectionLabel } from '../../primitives';
import type { SourcesCopy } from '../SourcesScreen.copy';

import { actionsFor, fmtAgeLong, isStaleAge, receivedAge } from './helpers';

const labelCls = 'text-[11px] font-semibold uppercase tracking-[0.16em] text-text-muted';

/**
 * Ultimo dato ricevuto: l'ETA' e' il numero grande, la data esatta le sta sotto.
 * Quando e' vecchio (oltre 48 ore) l'eta' diventa ambra e la frase sotto dice che
 * cio' che viene dopo NON e' arrivato: non e' zero. Se non e' mai arrivato nulla
 * non si scrive una data ne' «0 minuti fa»: trattino tratteggiato e motivo.
 */
function LastReceived({
  receipt,
  stale,
  c,
  copy,
  ui,
}: {
  receipt: ReceiptStatus;
  stale: boolean;
  c: SourcesCopy;
  copy: SharedCopy;
  ui: UiLocale;
}) {
  const age = receivedAge(receipt);

  if (receipt.lastReceivedAt === null && age === null) {
    // Il server conosce le sorgenti solo attraverso le righe che ha ricevuto (ognuna porta
    // `received_at`): senza righe non sa se una sorgente sia collegata o no. Un solo motivo.
    const reason: AbsentReason = 'no_data_received';
    return (
      <dd className="mt-2 text-text-muted" data-slot="received-age" data-slot-state="absent" data-absent-reason={reason}>
        <div className="flex h-[2.25rem] items-center">
          <AbsentMark />
          <span className="sr-only">{copy.measure.noData}</span>
        </div>
        <p className="mt-1 text-sm">{copy.measure.absent[reason]}</p>
      </dd>
    );
  }

  const big = age !== null ? fmtAgeLong(age, ui) : fmtDateTime(receipt.lastReceivedAt as string, ui);
  return (
    <dd className="mt-2" data-slot="received-age" data-slot-state={stale ? 'stale' : 'measured'}>
      <p className={`font-display text-metric font-semibold tracking-tightest ${stale ? 'text-warning' : 'text-text-primary'}`}>{big}</p>
      {age !== null && receipt.lastReceivedAt ? (
        <p className="mt-1 text-sm text-text-secondary">
          <time dateTime={receipt.lastReceivedAt}>{fmtDateTime(receipt.lastReceivedAt, ui)}</time>
        </p>
      ) : null}
      {stale ? (
        <p className="mt-3 text-sm text-text-secondary" data-slot="stale-note">
          {c.status.staleNote}
        </p>
      ) : null}
    </dd>
  );
}

/**
 * Intestazione della schermata: quando e' arrivato l'ultimo dato e cosa puo' fare
 * la persona. Il server non conosce l'esito dei singoli sync: qui non c'e' nessun
 * «riuscito», «parziale» o «non riuscito», e la frase lo dice.
 */
export function StatusCard({
  receipt,
  hasSources,
  c,
  copy,
  ui,
}: {
  receipt: ReceiptStatus;
  hasSources: boolean;
  c: SourcesCopy;
  copy: SharedCopy;
  ui: UiLocale;
}) {
  const stale = isStaleAge(receivedAge(receipt));
  const actions = actionsFor(receipt, hasSources);
  const never = receipt.lastReceivedAt === null && receipt.ageMinutes === null;
  const body = never ? c.status.never : c.status.scope;

  return (
    <Card aria-labelledby="sources-received-title" className="sm:p-6">
      <div data-slot="received-status" data-stale={stale ? 'true' : 'false'}>
        <SectionLabel id="sources-received-title">{c.status.title}</SectionLabel>

        <div className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-8">
          <dl>
            <dt className={labelCls}>{copy.received.label}</dt>
            <LastReceived receipt={receipt} stale={stale} c={c} copy={copy} ui={ui} />
          </dl>

          <div className="border-t border-divider pt-5 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
            <p className={labelCls}>{c.status.aboutTitle}</p>
            <p className="mt-2 max-w-[40rem] text-sm text-text-primary" data-slot="received-about">
              {body}
            </p>

            {actions.length > 0 ? (
              <div className="mt-5" data-slot="received-actions">
                <p className={labelCls}>{c.status.actionsTitle}</p>
                <ol className="mt-2 max-w-[40rem] list-decimal space-y-1.5 pl-5 text-sm text-text-secondary marker:text-text-muted">
                  {actions.map((k) => (
                    <li key={k} data-action={k}>
                      {c.status.actions[k]}
                    </li>
                  ))}
                </ol>
              </div>
            ) : null}
          </div>
        </div>

        <p className="mt-6 flex items-start gap-2 border-t border-divider pt-4 text-xs text-text-muted" data-slot="web-note">
          <Icon name="info" size={16} className="mt-px shrink-0" />
          {c.status.webNote}
        </p>
      </div>
    </Card>
  );
}
