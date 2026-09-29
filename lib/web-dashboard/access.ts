/**
 * Chi puo' vedere la dashboard web: login, paywall, verifica, accesso.
 *
 * REGOLA (mandato di Matteo, 24/09): accede chi ha un abbonamento valido
 * (periodo di grazia incluso se il backend mantiene il servizio), un Lifetime
 * acquistato o un Lifetime concesso a mano / Founder. NON accede chi e' in
 * prova, chi non ha niente, chi e' scaduto o rimborsato. Se il controllo non
 * risponde: errore e «riprova», mai un falso paywall.
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
 * L'input e' la forma del contratto entitlement v1 (docs/architecture/
 * entitlement-contract-v1.md): `entitlementKind` decide, `evaluationReason` no.
 * In questo prototipo l'istantanea e' SINTETICA: nessuna chiamata a
 * get_entitlement_status, nessun collegamento a Supabase o alla fatturazione.
 */

export const SUPPORTED_ENTITLEMENT_CONTRACT_VERSION = 1;

export type EntitlementKind =
  | 'founder'
  | 'grandfather'
  | 'lifetime'
  | 'subscription'
  | 'appReview'
  | 'trial'
  | 'none';

export interface EntitlementSnapshot {
  contractVersion: number;
  entitlementKind: EntitlementKind;
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
  | { decision: 'granted'; via: EntitlementKind };

/**
 * Tipi di entitlement che aprono la dashboard. `trial` NON e' qui: la prova
 * copre l'app, non la dashboard web. `appReview` (account demo dello store) non
 * e' nell'elenco deciso e quindi non concede: se serve, e' una decisione a parte.
 */
const GRANTING_KINDS: readonly EntitlementKind[] = ['founder', 'grandfather', 'lifetime', 'subscription'];

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
  if (GRANTING_KINDS.includes(e.entitlementKind)) {
    return { decision: 'granted', via: e.entitlementKind };
  }
  if (e.entitlementKind === 'trial') return { decision: 'paywall', reason: 'trial' };
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
    entitlement: { contractVersion: 1, entitlementKind: 'trial', trialStatus: 'active' },
  },
  lifetime: {
    session: 'verified',
    entitlement: { contractVersion: 1, entitlementKind: 'lifetime', trialStatus: 'expired' },
  },
  subscriber: {
    session: 'verified',
    entitlement: { contractVersion: 1, entitlementKind: 'subscription', trialStatus: 'expired' },
  },
  expired: {
    session: 'verified',
    entitlement: { contractVersion: 1, entitlementKind: 'none', trialStatus: 'expired' },
  },
  unverifiable: { session: 'unverifiable', reason: 'read_failed' },
} as const satisfies Record<string, AccessInput>;

export type SyntheticViewer = keyof typeof SYNTHETIC_VIEWERS;
