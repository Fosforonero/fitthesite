/**
 * Il verdetto di accesso alla dashboard web, letto dal server.
 *
 * La decisione NON si prende qui: la prende `public.get_web_dashboard_access()`
 * (migration 20260924120000), legata all'account della sessione. Qui si
 * traduce la risposta in tre esiti, e la cosa che conta e' la terza:
 *
 *   concesso         il server ha trovato almeno un titolo valido
 *   negato           il server ha risposto e non ne ha trovati
 *   non_disponibile  il server non ha risposto, o ha risposto qualcosa che
 *                    non si sa leggere
 *
 * Un guasto non diventa mai «negato»: un cliente pagante che vede un paywall
 * perche' la rete e' caduta e' il falso paywall che il mandato esclude. Il
 * quarto esito, `non_autenticato`, e' il 42501 della funzione: la sessione non
 * vale piu' per il database, e la risposta giusta e' il login.
 *
 * Nessuna cache, di nessun tipo: il verdetto si chiede a ogni richiesta. Un
 * verdetto conservato sopravviverebbe a una scadenza o a un rimborso.
 *
 * Solo lato server. Non importarlo da un componente 'use client'
 * (lo verifica lib/dashboard/cache-e-confini.test.ts).
 */

export const TITOLI_DASHBOARD = [
  'app_review',
  'founder',
  'grandfather',
  'lifetime_grant',
  'timed_grant',
  'lifetime_purchase',
  'subscription',
  'admin',
  'manual_payment',
] as const;
export type TitoloDashboard = (typeof TITOLI_DASHBOARD)[number];

export const MOTIVI_DINIEGO = [
  'trial_only',
  'subscription_inactive',
  'purchase_revoked',
  'purchase_pending',
  'no_entitlement',
] as const;
export type MotivoDiniego = (typeof MOTIVI_DINIEGO)[number] | 'altro';

export type GuastoVerdetto =
  | 'verdetto_assente'
  | 'tempo_scaduto'
  | 'errore_server'
  | 'errore_rete'
  | 'risposta_illeggibile'
  | 'utente_assente';

const MARCHIO: unique symbol = Symbol('accesso-concesso');

/**
 * Un accesso concesso si ottiene SOLO da `leggiVerdettoDashboard`: il marchio
 * non e' esportato, quindi nessun altro modulo puo' costruirne uno. Le letture
 * dei dati premium lo pretendono come argomento.
 */
export type AccessoConcesso = {
  readonly esito: 'concesso';
  readonly uid: string;
  readonly titoli: readonly TitoloDashboard[];
  readonly [MARCHIO]: true;
};

export type VerdettoDashboard =
  | AccessoConcesso
  | { readonly esito: 'negato'; readonly motivo: MotivoDiniego }
  | { readonly esito: 'non_disponibile'; readonly guasto: GuastoVerdetto }
  | { readonly esito: 'non_autenticato' };

/** La sola parte del client Supabase che serve: facile da sostituire nelle prove. */
export type ClientVerdetto = {
  rpc(fn: 'get_web_dashboard_access'): {
    abortSignal(signal: AbortSignal): PromiseLike<{
      data: unknown;
      error: { code?: string | null; message?: string | null } | null;
    }>;
  };
};

export const LIMITE_VERDETTO_MS = 8000;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function nonDisponibile(guasto: GuastoVerdetto): VerdettoDashboard {
  return { esito: 'non_disponibile', guasto };
}

/**
 * @param uid l'id dell'utente della STESSA sessione con cui il client chiama la
 *   funzione (da `auth.getUser()`). Non decide niente: il server usa
 *   auth.uid(). Serve alle letture, che filtrano su di lui.
 */
export async function leggiVerdettoDashboard(
  client: ClientVerdetto,
  uid: string,
  limiteMs: number = LIMITE_VERDETTO_MS,
): Promise<VerdettoDashboard> {
  if (!UUID.test(uid)) return nonDisponibile('utente_assente');

  const controllo = new AbortController();
  const timer = setTimeout(() => controllo.abort(), limiteMs);
  let risposta: Awaited<ReturnType<ReturnType<ClientVerdetto['rpc']>['abortSignal']>>;
  try {
    risposta = await client.rpc('get_web_dashboard_access').abortSignal(controllo.signal);
  } catch {
    return nonDisponibile(controllo.signal.aborted ? 'tempo_scaduto' : 'errore_rete');
  } finally {
    clearTimeout(timer);
  }

  const { data, error } = risposta;
  if (error) {
    if (controllo.signal.aborted) return nonDisponibile('tempo_scaduto');
    if (error.code === '42501') return { esito: 'non_autenticato' };
    // Funzione non ancora applicata: PostgREST risponde PGRST202, Postgres 42883.
    if (error.code === 'PGRST202' || error.code === '42883') return nonDisponibile('verdetto_assente');
    return nonDisponibile('errore_server');
  }

  return interpreta(data, uid);
}

function interpreta(data: unknown, uid: string): VerdettoDashboard {
  if (data === null || typeof data !== 'object' || Array.isArray(data)) {
    return nonDisponibile('risposta_illeggibile');
  }
  const v = data as Record<string, unknown>;
  if (v.contractVersion !== 1 || typeof v.granted !== 'boolean' || !Array.isArray(v.titles)) {
    return nonDisponibile('risposta_illeggibile');
  }
  if (!v.titles.every((t) => typeof t === 'string')) return nonDisponibile('risposta_illeggibile');
  const titoli = v.titles as string[];

  if (v.granted) {
    // Concesso senza titoli, o con un motivo di diniego, e' una risposta che si
    // contraddice: non la si indovina.
    if (titoli.length === 0 || (v.denialReason !== null && v.denialReason !== undefined)) {
      return nonDisponibile('risposta_illeggibile');
    }
    const noti = titoli.filter((t): t is TitoloDashboard =>
      (TITOLI_DASHBOARD as readonly string[]).includes(t),
    );
    return { esito: 'concesso', uid, titoli: noti, [MARCHIO]: true };
  }

  if (titoli.length > 0) return nonDisponibile('risposta_illeggibile');
  if (v.denialReason === 'user_not_found' || v.denialReason === 'no_user') {
    return nonDisponibile('utente_assente');
  }
  const motivo = (MOTIVI_DINIEGO as readonly unknown[]).includes(v.denialReason)
    ? (v.denialReason as MotivoDiniego)
    : 'altro';
  return { esito: 'negato', motivo };
}

/** Per le letture: rifiuta tutto cio' che non viene da `leggiVerdettoDashboard`. */
export function eAccessoConcesso(v: unknown): v is AccessoConcesso {
  return (
    typeof v === 'object' &&
    v !== null &&
    (v as { esito?: unknown }).esito === 'concesso' &&
    (v as Record<symbol, unknown>)[MARCHIO] === true &&
    typeof (v as { uid?: unknown }).uid === 'string' &&
    UUID.test((v as { uid: string }).uid)
  );
}
