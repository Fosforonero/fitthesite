import { describe, expect, it } from 'vitest';

import { isWebDashboardPrototypeEnabled } from './flag';

const ON = { WEB_DASHBOARD_PROTOTYPE: '1' } as const;

describe('isWebDashboardPrototypeEnabled', () => {
  it('spento senza la variabile', () => {
    expect(isWebDashboardPrototypeEnabled({})).toBe(false);
  });

  it('acceso solo con WEB_DASHBOARD_PROTOTYPE=1', () => {
    expect(isWebDashboardPrototypeEnabled({ WEB_DASHBOARD_PROTOTYPE: '1' })).toBe(true);
    for (const v of ['0', 'true', 'yes', '', ' 1']) {
      expect(isWebDashboardPrototypeEnabled({ WEB_DASHBOARD_PROTOTYPE: v }), `"${v}"`).toBe(false);
    }
  });

  it('mai su nessun ambiente Vercel, nemmeno con la variabile impostata (decisioni 28 e 36: solo locale)', () => {
    // production, preview, development e un valore sconosciuto: chiude qualunque VERCEL_ENV non vuoto
    for (const VERCEL_ENV of ['production', 'preview', 'development', 'staging']) {
      // qualunque valore di NODE_ENV: il segnale di Vercel basta a chiudere
      for (const NODE_ENV of ['production', 'development', 'test', undefined]) {
        expect(isWebDashboardPrototypeEnabled({ ...ON, VERCEL_ENV, NODE_ENV }), `${VERCEL_ENV} ${String(NODE_ENV)}`).toBe(false);
      }
    }
  });

  it('anteprima Vercel: chiuso, con NODE_ENV=production (come la imposta Next) e senza', () => {
    expect(isWebDashboardPrototypeEnabled({ ...ON, VERCEL_ENV: 'preview' })).toBe(false);
    expect(isWebDashboardPrototypeEnabled({ ...ON, VERCEL_ENV: 'preview', NODE_ENV: 'production' })).toBe(false);
  });

  it('mai con NODE_ENV=production fuori da Vercel (un server di produzione qualunque)', () => {
    expect(isWebDashboardPrototypeEnabled({ ...ON, NODE_ENV: 'production' })).toBe(false);
    expect(isWebDashboardPrototypeEnabled({ ...ON, NODE_ENV: 'production', VERCEL_ENV: undefined })).toBe(false);
    // un VERCEL_ENV vuoto vale come assente: NODE_ENV=production chiude comunque
    expect(isWebDashboardPrototypeEnabled({ ...ON, NODE_ENV: 'production', VERCEL_ENV: '' })).toBe(false);
  });

  it('senza la variabile resta chiuso in ogni ambiente, anche fuori dalla produzione', () => {
    for (const env of [{}, { NODE_ENV: 'development' }, { VERCEL_ENV: 'preview', NODE_ENV: 'production' }, { VERCEL_ENV: 'development' }]) {
      expect(isWebDashboardPrototypeEnabled(env), JSON.stringify(env)).toBe(false);
    }
  });

  it('acceso solo in locale: sviluppo e test, con VERCEL_ENV assente o vuoto', () => {
    expect(isWebDashboardPrototypeEnabled({ ...ON, VERCEL_ENV: '', NODE_ENV: 'development' })).toBe(true);
    expect(isWebDashboardPrototypeEnabled({ ...ON })).toBe(true);
    expect(isWebDashboardPrototypeEnabled({ ...ON, NODE_ENV: 'development' })).toBe(true);
    expect(isWebDashboardPrototypeEnabled({ ...ON, NODE_ENV: 'test' })).toBe(true);
  });

  it('legge process.env quando non riceve un ambiente', () => {
    const before = { ...process.env };
    try {
      process.env.WEB_DASHBOARD_PROTOTYPE = '1';
      process.env.VERCEL_ENV = 'production';
      expect(isWebDashboardPrototypeEnabled()).toBe(false);
      delete process.env.VERCEL_ENV;
      (process.env as Record<string, string>).NODE_ENV = 'production';
      expect(isWebDashboardPrototypeEnabled()).toBe(false);
    } finally {
      for (const k of ['WEB_DASHBOARD_PROTOTYPE', 'VERCEL_ENV', 'NODE_ENV']) {
        if (before[k] === undefined) delete process.env[k];
        else (process.env as Record<string, string>)[k] = before[k] as string;
      }
    }
  });
});
