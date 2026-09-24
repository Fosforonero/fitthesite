import { describe, expect, it } from 'vitest';

import {
  eAccessoConcesso,
  leggiVerdettoDashboard,
  type ClientVerdetto,
  type VerdettoDashboard,
} from './verdetto';

const UID = 'da5b0000-0000-4000-8000-000000000002';

type Risposta = { data: unknown; error: { code?: string; message?: string } | null };

/** Un client che risponde come PostgREST, oppure solleva, oppure non risponde mai. */
function client(comportamento: Risposta | 'solleva' | 'mai'): ClientVerdetto & { chiamate: string[] } {
  const chiamate: string[] = [];
  return {
    chiamate,
    rpc(fn) {
      chiamate.push(fn);
      return {
        abortSignal(signal: AbortSignal) {
          if (comportamento === 'solleva') return Promise.reject(new TypeError('fetch failed'));
          if (comportamento === 'mai') {
            return new Promise((_, rifiuta) => {
              signal.addEventListener('abort', () => rifiuta(new DOMException('aborted', 'AbortError')));
            });
          }
          return Promise.resolve(comportamento);
        },
      };
    },
  };
}

const concesso = (titles: string[]) => ({ contractVersion: 1, granted: true, titles, denialReason: null, serverNow: 'x' });
const negato = (denialReason: string) => ({ contractVersion: 1, granted: false, titles: [], denialReason, serverNow: 'x' });

describe('verdetto dashboard web: il server decide, qui si traduce', () => {
  it('concesso: porta i titoli e l uid della sessione, e passa il controllo delle letture', async () => {
    const c = client({ data: concesso(['lifetime_purchase', 'timed_grant']), error: null });
    const v = await leggiVerdettoDashboard(c, UID);
    expect(v.esito).toBe('concesso');
    expect(c.chiamate).toEqual(['get_web_dashboard_access']);
    if (v.esito !== 'concesso') throw new Error('atteso concesso');
    expect(v.uid).toBe(UID);
    expect(v.titoli).toEqual(['lifetime_purchase', 'timed_grant']);
    expect(eAccessoConcesso(v)).toBe(true);
  });

  it.each(['trial_only', 'subscription_inactive', 'purchase_revoked', 'purchase_pending', 'no_entitlement'])(
    'negato con il motivo del server: %s',
    async (motivo) => {
      const v = await leggiVerdettoDashboard(client({ data: negato(motivo), error: null }), UID);
      expect(v).toEqual({ esito: 'negato', motivo });
      expect(eAccessoConcesso(v)).toBe(false);
    },
  );

  it('un motivo che non conosce resta un diniego del server, non un guasto', async () => {
    const v = await leggiVerdettoDashboard(client({ data: negato('motivo_futuro'), error: null }), UID);
    expect(v).toEqual({ esito: 'negato', motivo: 'altro' });
  });

  it('42501 vuol dire sessione non valida per il database: login, non paywall', async () => {
    const v = await leggiVerdettoDashboard(client({ data: null, error: { code: '42501' } }), UID);
    expect(v).toEqual({ esito: 'non_autenticato' });
  });
});

describe('verdetto dashboard web: un guasto non diventa mai un diniego', () => {
  const casi: Array<[string, () => Promise<VerdettoDashboard>, string]> = [
    ['funzione non ancora applicata (PGRST202)', () => leggiVerdettoDashboard(client({ data: null, error: { code: 'PGRST202' } }), UID), 'verdetto_assente'],
    ['funzione assente in Postgres (42883)', () => leggiVerdettoDashboard(client({ data: null, error: { code: '42883' } }), UID), 'verdetto_assente'],
    ['errore del server (500)', () => leggiVerdettoDashboard(client({ data: null, error: { code: 'XX000', message: 'boom' } }), UID), 'errore_server'],
    ['rete assente', () => leggiVerdettoDashboard(client('solleva'), UID), 'errore_rete'],
    ['server che non risponde', () => leggiVerdettoDashboard(client('mai'), UID, 20), 'tempo_scaduto'],
    ['risposta nulla', () => leggiVerdettoDashboard(client({ data: null, error: null }), UID), 'risposta_illeggibile'],
    ['contratto di un altra versione', () => leggiVerdettoDashboard(client({ data: { ...concesso(['founder']), contractVersion: 2 }, error: null }), UID), 'risposta_illeggibile'],
    ['granted non booleano', () => leggiVerdettoDashboard(client({ data: { ...concesso(['founder']), granted: 'true' }, error: null }), UID), 'risposta_illeggibile'],
    ['titoli non in un array', () => leggiVerdettoDashboard(client({ data: { ...concesso([]), titles: 'founder' }, error: null }), UID), 'risposta_illeggibile'],
    ['concesso senza titoli', () => leggiVerdettoDashboard(client({ data: concesso([]), error: null }), UID), 'risposta_illeggibile'],
    ['concesso con un motivo di diniego', () => leggiVerdettoDashboard(client({ data: { ...concesso(['founder']), denialReason: 'trial_only' }, error: null }), UID), 'risposta_illeggibile'],
    ['negato ma con titoli', () => leggiVerdettoDashboard(client({ data: { ...negato('no_entitlement'), titles: ['founder'] }, error: null }), UID), 'risposta_illeggibile'],
    ['utente non trovato dal database', () => leggiVerdettoDashboard(client({ data: negato('user_not_found'), error: null }), UID), 'utente_assente'],
    ['uid della sessione non valido', () => leggiVerdettoDashboard(client({ data: concesso(['founder']), error: null }), 'non-un-uuid'), 'utente_assente'],
  ];

  it.each(casi)('%s -> non disponibile', async (_nome, esegui, guasto) => {
    const v = await esegui();
    expect(v).toEqual({ esito: 'non_disponibile', guasto });
    expect(v.esito).not.toBe('negato');
    expect(eAccessoConcesso(v)).toBe(false);
  });
});

describe('accesso concesso: solo il verdetto lo fabbrica', () => {
  it('un oggetto con la stessa forma ma senza il marchio non e un accesso', () => {
    const falso = { esito: 'concesso', uid: UID, titoli: ['founder'] };
    expect(eAccessoConcesso(falso)).toBe(false);
  });
});
