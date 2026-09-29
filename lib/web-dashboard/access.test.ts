import fs from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  APP_AREAS,
  SYNTHETIC_VIEWERS,
  isPaywallApplicable,
  resolveDashboardAccess,
  type EntitlementKind,
} from './access';

const ROOT = path.join(__dirname, '../..');

describe('resolveDashboardAccess', () => {
  it('senza sessione: login', () => {
    expect(resolveDashboardAccess({ session: 'anonymous' })).toEqual({ decision: 'login' });
  });

  it('accede chi ha Founder, Lifetime concesso, Lifetime acquistato, abbonamento valido o account di revisione', () => {
    const kinds: EntitlementKind[] = ['founder', 'grandfather', 'lifetime', 'subscription', 'appReview'];
    for (const entitlementKind of kinds) {
      const r = resolveDashboardAccess({
        session: 'verified',
        entitlement: { contractVersion: 1, entitlementKind, trialStatus: 'expired' },
      });
      expect(r, entitlementKind).toEqual({ decision: 'granted', via: entitlementKind });
    }
  });

  it('la prova NON apre la dashboard, nemmeno se attiva', () => {
    expect(resolveDashboardAccess(SYNTHETIC_VIEWERS.trial)).toEqual({ decision: 'paywall', reason: 'trial' });
  });

  it('nessun entitlement o prova scaduta: paywall, con il motivo giusto', () => {
    expect(resolveDashboardAccess(SYNTHETIC_VIEWERS.expired)).toEqual({ decision: 'paywall', reason: 'expired' });
    const none = resolveDashboardAccess({
      session: 'verified',
      entitlement: { contractVersion: 1, entitlementKind: 'none', trialStatus: 'active' },
    });
    expect(none).toEqual({ decision: 'paywall', reason: 'none' });
  });

  it('l\'account di revisione dello store accede (DECISIONI 2), la prova non accede mai (DECISIONI 3)', () => {
    const review = resolveDashboardAccess({
      session: 'verified',
      entitlement: { contractVersion: 1, entitlementKind: 'appReview', trialStatus: 'expired' },
    });
    expect(review).toEqual({ decision: 'granted', via: 'appReview' });
    for (const trialStatus of ['active', 'expired'] as const) {
      const trial = resolveDashboardAccess({
        session: 'verified',
        entitlement: { contractVersion: 1, entitlementKind: 'trial', trialStatus },
      });
      expect(trial.decision, trialStatus).toBe('paywall');
    }
  });

  it('un abbonamento prevale su una prova scaduta (priorita\' gia\' risolta dal server)', () => {
    expect(resolveDashboardAccess(SYNTHETIC_VIEWERS.subscriber)).toEqual({ decision: 'granted', via: 'subscription' });
    expect(resolveDashboardAccess(SYNTHETIC_VIEWERS.lifetime)).toEqual({ decision: 'granted', via: 'lifetime' });
  });

  it('entitlement non letto: errore e riprova, mai un falso paywall e mai un accesso', () => {
    expect(resolveDashboardAccess(SYNTHETIC_VIEWERS.unverifiable)).toEqual({
      decision: 'verification_required',
      reason: 'read_failed',
    });
  });

  it('versione di contratto sconosciuta: verifica richiesta, mai accesso', () => {
    const r = resolveDashboardAccess({
      session: 'verified',
      entitlement: { contractVersion: 2, entitlementKind: 'lifetime', trialStatus: 'expired' },
    });
    expect(r).toEqual({ decision: 'verification_required', reason: 'unknown_contract_version' });
  });
});

describe('il paywall riguarda solo la dashboard', () => {
  it('nessuna area diversa dalla dashboard e\' soggetta al paywall', () => {
    for (const area of APP_AREAS) {
      expect(isPaywallApplicable(area), area).toBe(area === 'dashboard');
    }
    for (const area of ['settings', 'export', 'delete-account', 'devices'] as const) {
      expect(isPaywallApplicable(area)).toBe(false);
    }
  });

  it('le pagine di impostazioni, export, cancellazione e dispositivi non importano il codice della dashboard', () => {
    const files = [
      'app/(frontend)/[locale]/app/settings/page.tsx',
      'app/(frontend)/[locale]/app/settings/DeleteAccountSection.tsx',
      'app/(frontend)/[locale]/app/export/page.tsx',
      'app/(frontend)/[locale]/app/export/ExportDataClient.tsx',
      'app/(frontend)/[locale]/app/devices/page.tsx',
      'app/(frontend)/[locale]/app/layout.tsx',
      'components/DeleteAccountView.tsx',
    ];
    for (const f of files) {
      const src = fs.readFileSync(path.join(ROOT, f), 'utf8');
      expect(src, f).not.toMatch(/web-dashboard/);
    }
  });
});
