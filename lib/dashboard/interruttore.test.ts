import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Due cancelli DISTINTI, da non confondere:
 *  - il PROTOTIPO (dati sintetici, flag.ts nella cartella del prototipo): solo in locale, chiuso su ogni
 *    ambiente Vercel e in ogni build di produzione, qualunque variabile si imposti;
 *  - la dashboard REALE (questo file): in una build di produzione (Vercel o auto-ospitata) la
 *    decide lo stato dichiarato nel codice di rilascio (CAPABILITY_STATUS.webDashboard), non una
 *    variabile d'ambiente (condizione 1 della nota di CAPABILITY_STATUS.webDashboard). La
 *    variabile, in produzione, puo' solo SPEGNERLA (kill switch operativo), mai accenderla.
 *    Fuori dalla produzione (sviluppo, test) basta FITMESH_WEB_DASHBOARD=1.
 */

const disponibile = vi.fn();
vi.mock('@/lib/feature-status', () => ({ isFeatureAvailable: (k: string) => disponibile(k) }));

import { dashboardWebAttiva } from './interruttore';

type Env = Record<string, string | undefined>;
const produzione = (extra: Env = {}): Env => ({ NODE_ENV: 'production', ...extra });
const vercel = (ambiente: string, extra: Env = {}): Env => ({ NODE_ENV: 'production', VERCEL_ENV: ambiente, ...extra });

beforeEach(() => {
  disponibile.mockReset();
  disponibile.mockReturnValue(false); // CAPABILITY_STATUS.webDashboard = in_development (oggi)
});

describe('dashboard reale: fuori dalla produzione basta la variabile', () => {
  it.each([
    ['sviluppo con la variabile a 1', { NODE_ENV: 'development', FITMESH_WEB_DASHBOARD: '1' }, true],
    ['test con la variabile a 1', { NODE_ENV: 'test', FITMESH_WEB_DASHBOARD: '1' }, true],
    ['sviluppo senza variabile', { NODE_ENV: 'development' }, false],
    ['sviluppo con valore diverso da 1', { NODE_ENV: 'development', FITMESH_WEB_DASHBOARD: 'true' }, false],
    ['sviluppo con 1 e uno spazio', { NODE_ENV: 'development', FITMESH_WEB_DASHBOARD: '1 ' }, false],
    ['sviluppo con stringa vuota', { NODE_ENV: 'development', FITMESH_WEB_DASHBOARD: '' }, false],
  ])('%s', (_nome, env, atteso) => {
    expect(dashboardWebAttiva(env as Env)).toBe(atteso);
  });
});

describe('dashboard reale: in produzione la variabile da sola NON accende (stato nel codice = in sviluppo)', () => {
  it.each([
    ['build di produzione (next start) con la variabile a 1', produzione({ FITMESH_WEB_DASHBOARD: '1' })],
    ['Vercel production con la variabile a 1', vercel('production', { FITMESH_WEB_DASHBOARD: '1' })],
    ['Vercel preview con la variabile a 1', vercel('preview', { FITMESH_WEB_DASHBOARD: '1' })],
    ['Vercel con un valore di VERCEL_ENV sconosciuto e la variabile a 1', vercel('qualcosa', { FITMESH_WEB_DASHBOARD: '1' })],
    ['VERCEL_ENV senza NODE_ENV e la variabile a 1', { VERCEL_ENV: 'production', FITMESH_WEB_DASHBOARD: '1' }],
    ['produzione senza variabile', produzione()],
    // Fail-closed: la produzione NON si riconosce per esclusione. Solo development e test sono sviluppo locale;
    // qualunque altro valore, o l'assenza di NODE_ENV, e' trattato come produzione.
    ['senza NODE_ENV e la variabile a 1', { FITMESH_WEB_DASHBOARD: '1' }],
    ['NODE_ENV non standard (staging) e la variabile a 1', { NODE_ENV: 'staging', FITMESH_WEB_DASHBOARD: '1' }],
    ['NODE_ENV con maiuscole (Development) e la variabile a 1', { NODE_ENV: 'Development', FITMESH_WEB_DASHBOARD: '1' }],
    ['sviluppo ma su Vercel (vercel dev) e la variabile a 1', { NODE_ENV: 'development', VERCEL_ENV: 'development', FITMESH_WEB_DASHBOARD: '1' }],
  ])('%s -> chiusa', (_nome, env) => {
    expect(dashboardWebAttiva(env)).toBe(false);
  });
});

describe('dashboard reale: dopo il release gate (stato promosso nel codice) si attiva senza variabile', () => {
  beforeEach(() => disponibile.mockReturnValue(true));

  it.each([
    ['build di produzione', produzione()],
    ['Vercel production', vercel('production')],
    ['Vercel preview', vercel('preview')],
    ['NODE_ENV assente', {}],
  ])('%s -> aperta dal solo stato nel codice', (_nome, env) => {
    expect(dashboardWebAttiva(env)).toBe(true);
    expect(disponibile).toHaveBeenCalledWith('webDashboard');
  });

  it('la variabile a 0 la spegne comunque (kill switch operativo)', () => {
    expect(dashboardWebAttiva(vercel('production', { FITMESH_WEB_DASHBOARD: '0' }))).toBe(false);
  });

  it('la variabile a 1 non cambia nulla in produzione: decide il codice', () => {
    expect(dashboardWebAttiva(vercel('production', { FITMESH_WEB_DASHBOARD: '1' }))).toBe(true);
    disponibile.mockReturnValue(false);
    expect(dashboardWebAttiva(vercel('production', { FITMESH_WEB_DASHBOARD: '1' }))).toBe(false);
  });
});

describe('dashboard reale: il prototipo resta un cancello separato', () => {
  it('WEB_DASHBOARD_PROTOTYPE non apre la dashboard reale, in nessun ambiente', () => {
    for (const env of [
      { NODE_ENV: 'development', WEB_DASHBOARD_PROTOTYPE: '1' },
      produzione({ WEB_DASHBOARD_PROTOTYPE: '1' }),
      vercel('production', { WEB_DASHBOARD_PROTOTYPE: '1' }),
    ]) {
      expect(dashboardWebAttiva(env as Env)).toBe(false);
    }
  });
});
