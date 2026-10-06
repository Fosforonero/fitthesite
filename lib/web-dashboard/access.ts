/**
 * Chi puo' vedere la dashboard web: login, paywall, verifica, accesso.
 *
 * REGOLA (DECISIONI.md, punti 1-6 e 8): accede chi ha un titolo Pro valido nella
 * fonte server degli entitlement: abbonamento attivo, Pro lifetime acquistato,
 * Founder, tester con grant Pro valido, e gli altri titoli Pro validi (grant a
 * tempo, pagamento registrato a mano, grandfather, admin, account di
 * revisione dello store). NON accede mai chi e' solo in prova gratuita, chi non ha
 * niente, chi e' scaduto, rimborsato o revocato. Se il controllo non risponde:
 * errore e «riprova», mai un falso paywall.
 *
 * Questo file e' la MAPPA PER LA SCHERMATA del prototipo. Il verdetto vero e'
 * server-side e unico (filone WEB-DASHBOARD-FOUNDATION): quando arriva, prende il
 * posto di `resolveDashboardAccess`; la UI consuma solo `DashboardAccess`.
 *
 * Il paywall riguarda SOLO la dashboard. Impostazioni, export dei dati e
 * cancellazione dell'account non passano mai da qui e restano raggiungibili
 * anche senza entitlement (vedi APP_AREAS e access.test.ts, che lo verifica
 * anche sui sorgenti di quelle pagine).
 *
 * In questo prototipo l'istantanea e' SINTETICA: i viewer sintetici portano
 * una lista di titoli stringa (`titoli: readonly string[]`) e la decisione
 * verifica se almeno un titolo appartiene a `TITOLI_DASHBOARD`.
 */

import { TITOLI_DASHBOARD, type TitoloDashboard } from '@/lib/dashboard/verdetto';

export const SUPPORTED_ENTITLEMENT_CONTRACT_VERSION = 1;

export interface EntitlementSnapshot {
  contractVersion: number;
  titoli: readonly string[];
  trialStatus: 'active' | 'expired';
}

/**
 * Sessione e entitlement come li vede il server quando decide:
 *  - `anonymous`: nessun utente;
 *  - `unverifiable`: utente noto, ma l'entitlement non e' stato letto (errore di
 *    rete, RPC assente) o la versione del contratto e' sconosciuta;
 *  - `verified`: utente noto, entitlement letto.
 */
export type AccessInput =
  | { session: 'anonymous' }
  | { session: 'unverifiable'; reason: 'read_failed' | 'unknown_contract_version' }
  | { session: 'verified'; entitlement: EntitlementSnapshot };

export type DashboardAccess =
  | { decision: 'login' }
  | { decision: 'verification_required'; reason: 'read_failed' | 'unknown_contract_version' }
  | { decision: 'paywall'; reason: 'trial' | 'expired' | 'none' }
  | { decision: 'granted'; via: TitoloDashboard };

export function resolveDashboardAccess(input: AccessInput): DashboardAccess {
  if (input.session === 'anonymous') return { decision: 'login' };
  if (input.session === 'unverifiable') {
    // Mai concedere e mai dichiarare «scaduto» o «senza abbonamento» senza averlo letto.
    return { decision: 'verification_required', reason: input.reason };
  }
  const e = input.entitlement;
  if (e.contractVersion > SUPPORTED_ENTITLEMENT_CONTRACT_VERSION) {
    return { decision: 'verification_required', reason: 'unknown_contract_version' };
  }

  // Cerca il primo titolo concesso che appartiene all'elenco unico TITOLI_DASHBOARD
  const primoTitoloConcesso = e.titoli.find((t): t is TitoloDashboard =>
    (TITOLI_DASHBOARD as readonly string[]).includes(t)
  );

  if (primoTitoloConcesso) {
    return { decision: 'granted', via: primoTitoloConcesso };
  }

  // Nessun titolo concesso valido: verifica se ha prova attiva
  if (e.trialStatus === 'active') {
    return { decision: 'paywall', reason: 'trial' };
  }

  return { decision: 'paywall', reason: e.trialStatus === 'expired' ? 'expired' : 'none' };
}

/** Aree dell'area privata web. Solo `dashboard` e' soggetta al paywall. */
export const APP_AREAS = ['dashboard', 'settings', 'export', 'delete-account', 'devices'] as const;
export type AppArea = (typeof APP_AREAS)[number];

export function isPaywallApplicable(area: AppArea): boolean {
  return area === 'dashboard';
}

/** Persone sintetiche per l'anteprima: ognuna produce una decisione diversa. */
export const SYNTHETIC_VIEWERS = {
  anonymous: { session: 'anonymous' },
  trial: {
    session: 'verified',
    entitlement: { contractVersion: 1, titoli: [], trialStatus: 'active' },
  },
  lifetime: {
    session: 'verified',
    entitlement: { contractVersion: 1, titoli: ['lifetime_purchase'], trialStatus: 'expired' },
  },
  subscriber: {
    session: 'verified',
    entitlement: { contractVersion: 1, titoli: ['subscription'], trialStatus: 'expired' },
  },
  expired: {
    session: 'verified',
    entitlement: { contractVersion: 1, titoli: [], trialStatus: 'expired' },
  },
  unverifiable: { session: 'unverifiable', reason: 'read_failed' },
} as const satisfies Record<string, AccessInput>;

export type SyntheticViewer = keyof typeof SYNTHETIC_VIEWERS;
