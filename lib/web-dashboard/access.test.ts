import fs from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { TITOLI_DASHBOARD } from '@/lib/dashboard/verdetto';
import {
  APP_AREAS,
  SYNTHETIC_VIEWERS,
  isPaywallApplicable,
  resolveDashboardAccess,
} from './access';

const ROOT = path.join(__dirname, '../..');

describe('resolveDashboardAccess', () => {
  it('senza sessione: login', () => {
    expect(resolveDashboardAccess({ session: 'anonymous' })).toEqual({ decision: 'login' });
  });

  it('accede chi ha un titolo valido in TITOLI_DASHBOARD (tutti i 9 titoli, inclusi admin e manual_payment)', () => {
    expect(TITOLI_DASHBOARD).toHaveLength(9);
    for (const via of TITOLI_DASHBOARD) {
      const r = resolveDashboardAccess({
        session: 'verified',
        entitlement: { contractVersion: 1, titoli: [via], trialStatus: 'expired' },
      });
      expect(r, via).toEqual({ decision: 'granted', via });
    }
  });

  it('la sola prova (nessun titolo valido, prova attiva) NON apre la dashboard', () => {
    expect(resolveDashboardAccess(SYNTHETIC_VIEWERS.trial)).toEqual({ decision: 'paywall', reason: 'trial' });
    const trialSolo = resolveDashboardAccess({
      session: 'verified',
      entitlement: { contractVersion: 1, titoli: [], trialStatus: 'active' },
    });
    expect(trialSolo).toEqual({ decision: 'paywall', reason: 'trial' });
  });

  it('titoli sconosciuti non aprono la dashboard e vengono ignorati', () => {
    const sconosciuti = resolveDashboardAccess({
      session: 'verified',
      entitlement: { contractVersion: 1, titoli: ['titolo_inventato', 'pro_plus'], trialStatus: 'expired' },
    });
    expect(sconosciuti).toEqual({ decision: 'paywall', reason: 'expired' });

    // Varianti vicine ai titoli veri (case, spazi, prefissi/suffissi, vuoto): devono dare paywall
    const vicini = [
      'FOUNDER',
      'Founder',
      ' founder',
      'founder ',
      'lifetime',
      'lifetime_revoked',
      'subscription_inactive',
      '',
    ];
    for (const vicino of vicini) {
      const r = resolveDashboardAccess({
        session: 'verified',
        entitlement: { contractVersion: 1, titoli: [vicino], trialStatus: 'expired' },
      });
      expect(r, vicino).toEqual({ decision: 'paywall', reason: 'expired' });
    }

    // Se ci sono titoli sconosciuti ma c e anche un titolo valido, il titolo valido apre
    const misto = resolveDashboardAccess({
      session: 'verified',
      entitlement: { contractVersion: 1, titoli: ['titolo_inventato', 'founder'], trialStatus: 'expired' },
    });
    expect(misto).toEqual({ decision: 'granted', via: 'founder' });
  });

  it('input malformato con titoli non-array: fail-closed paywall invece di lanciare', () => {
    const malformatoNull = resolveDashboardAccess({
      session: 'verified',
      // @ts-expect-error test di robustezza a runtime per input malformato
      entitlement: { contractVersion: 1, titoli: null, trialStatus: 'expired' },
    });
    expect(malformatoNull).toEqual({ decision: 'paywall', reason: 'expired' });

    const malformatoString = resolveDashboardAccess({
      session: 'verified',
      // @ts-expect-error test di robustezza a runtime per input malformato
      entitlement: { contractVersion: 1, titoli: 'founder', trialStatus: 'expired' },
    });
    expect(malformatoString).toEqual({ decision: 'paywall', reason: 'expired' });
  });

  it('nessun titolo con prova scaduta: paywall expired; con prova non attiva: none', () => {
    expect(resolveDashboardAccess(SYNTHETIC_VIEWERS.expired)).toEqual({ decision: 'paywall', reason: 'expired' });
    const expired = resolveDashboardAccess({
      session: 'verified',
      entitlement: { contractVersion: 1, titoli: [], trialStatus: 'expired' },
    });
    expect(expired).toEqual({ decision: 'paywall', reason: 'expired' });
    // Ramo difensivo none: trialStatus non attivo ne' scaduto (es. none o valore non valido a runtime)
    const none = resolveDashboardAccess({
      session: 'verified',
      entitlement: { contractVersion: 1, titoli: [], trialStatus: 'none' as any },
    });
    expect(none).toEqual({ decision: 'paywall', reason: 'none' });
  });

  it('l account di revisione dello store accede (DECISIONI 2), la prova non accede mai (DECISIONI 3)', () => {
    const review = resolveDashboardAccess({
      session: 'verified',
      entitlement: { contractVersion: 1, titoli: ['app_review'], trialStatus: 'expired' },
    });
    expect(review).toEqual({ decision: 'granted', via: 'app_review' });
    for (const trialStatus of ['active', 'expired'] as const) {
      const trial = resolveDashboardAccess({
        session: 'verified',
        entitlement: { contractVersion: 1, titoli: [], trialStatus },
      });
      expect(trial.decision, trialStatus).toBe('paywall');
    }
  });

  it('un abbonamento prevale su una prova scaduta (priorita gia risolta)', () => {
    expect(resolveDashboardAccess(SYNTHETIC_VIEWERS.subscriber)).toEqual({ decision: 'granted', via: 'subscription' });
    expect(resolveDashboardAccess(SYNTHETIC_VIEWERS.lifetime)).toEqual({ decision: 'granted', via: 'lifetime_purchase' });
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
      entitlement: { contractVersion: 2, titoli: ['lifetime_purchase'], trialStatus: 'expired' },
    });
    expect(r).toEqual({ decision: 'verification_required', reason: 'unknown_contract_version' });
  });

  it('fonte unica a runtime: resolveDashboardAccess usa effettivamente TITOLI_DASHBOARD da verdetto.ts (W-R3)', async () => {
    const { vi } = await import('vitest');
    try {
      vi.resetModules();
      vi.doMock('@/lib/dashboard/verdetto', () => ({
        TITOLI_DASHBOARD: ['solo_questo'],
      }));
      const dynamicAccess = await import('./access');
      const granted = dynamicAccess.resolveDashboardAccess({
        session: 'verified',
        entitlement: { contractVersion: 1, titoli: ['solo_questo'], trialStatus: 'expired' },
      });
      expect(granted).toEqual({ decision: 'granted', via: 'solo_questo' });

      const denied = dynamicAccess.resolveDashboardAccess({
        session: 'verified',
        entitlement: { contractVersion: 1, titoli: ['founder'], trialStatus: 'expired' },
      });
      expect(denied).toEqual({ decision: 'paywall', reason: 'expired' });
    } finally {
      vi.doUnmock('@/lib/dashboard/verdetto');
      vi.resetModules();
    }
  });
});

describe('il paywall riguarda solo la dashboard', () => {
  it('nessuna area diversa dalla dashboard e soggetta al paywall', () => {
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
