/**
 * Il cancello delle rotte di anteprima: con la porta chiusa rispondono 404 e non
 * costruiscono, leggono ne' restituiscono nessun dato. Si prova sulle funzioni
 * vere delle pagine (layout, indice, schermata), con `notFound` che lancia come
 * in Next, e con spie sui tre punti da cui uscirebbero i dati: lo scenario
 * (`buildDashboardResult`), l'accesso sintetico (`resolveDashboardAccess`) e la
 * lettura dei parametri dell'URL (`parsePreviewParams`).
 */
import type { ReactElement } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { BackForwardGuard } from '@/components/BackForwardGuard';

const NOT_FOUND = 'NEXT_NOT_FOUND';

vi.mock('next/navigation', () => ({
  notFound: () => {
    throw new Error('NEXT_NOT_FOUND');
  },
  redirect: (to: string) => {
    throw new Error(`NEXT_REDIRECT:${to}`);
  },
}));

vi.mock('@/lib/web-dashboard/synthetic', async (orig) => {
  const m = await orig<typeof import('@/lib/web-dashboard/synthetic')>();
  return { ...m, buildDashboardResult: vi.fn(m.buildDashboardResult), buildDashboardData: vi.fn(m.buildDashboardData) };
});
vi.mock('@/lib/web-dashboard/access', async (orig) => {
  const m = await orig<typeof import('@/lib/web-dashboard/access')>();
  return { ...m, resolveDashboardAccess: vi.fn(m.resolveDashboardAccess) };
});
vi.mock('@/lib/web-dashboard/params', async (orig) => {
  const m = await orig<typeof import('@/lib/web-dashboard/params')>();
  return { ...m, parsePreviewParams: vi.fn(m.parsePreviewParams) };
});

import { resolveDashboardAccess } from '@/lib/web-dashboard/access';
import { parsePreviewParams } from '@/lib/web-dashboard/params';
import { buildDashboardData, buildDashboardResult } from '@/lib/web-dashboard/synthetic';

import DashboardPreviewIndex from './page';
import DashboardPreviewLayout, { generateMetadata } from './layout';
import DashboardPreviewScreen from './[screen]/page';

/** Ambienti in cui la porta DEVE restare chiusa, con la variabile accesa o no. */
const CLOSED: Array<{ name: string; env: Record<string, string | undefined> }> = [
  { name: 'variabile assente', env: {} },
  { name: 'variabile assente in sviluppo', env: { NODE_ENV: 'development' } },
  { name: 'variabile a 0', env: { WEB_DASHBOARD_PROTOTYPE: '0' } },
  { name: 'produzione Vercel con la variabile accesa', env: { WEB_DASHBOARD_PROTOTYPE: '1', VERCEL_ENV: 'production', NODE_ENV: 'production' } },
  { name: 'produzione Vercel con la variabile accesa e NODE_ENV di sviluppo', env: { WEB_DASHBOARD_PROTOTYPE: '1', VERCEL_ENV: 'production', NODE_ENV: 'development' } },
  { name: 'produzione fuori da Vercel con la variabile accesa', env: { WEB_DASHBOARD_PROTOTYPE: '1', NODE_ENV: 'production' } },
  { name: 'anteprima Vercel con la variabile accesa', env: { WEB_DASHBOARD_PROTOTYPE: '1', VERCEL_ENV: 'preview', NODE_ENV: 'production' } },
  { name: 'anteprima Vercel con la variabile accesa e NODE_ENV assente', env: { WEB_DASHBOARD_PROTOTYPE: '1', VERCEL_ENV: 'preview' } },
  { name: 'ambiente Vercel sconosciuto con la variabile accesa', env: { WEB_DASHBOARD_PROTOTYPE: '1', VERCEL_ENV: 'staging' } },
];

const OPEN_ENV = { WEB_DASHBOARD_PROTOTYPE: '1', NODE_ENV: 'development' };

function setEnv(env: Record<string, string | undefined>) {
  vi.unstubAllEnvs();
  // base neutra: nessun segnale ereditato dalla macchina che esegue il test
  for (const k of ['WEB_DASHBOARD_PROTOTYPE', 'VERCEL_ENV', 'NODE_ENV']) vi.stubEnv(k, undefined as unknown as string);
  for (const [k, v] of Object.entries(env)) vi.stubEnv(k, v as string);
}

const screenArgs = (query: Record<string, string> = {}, screen = 'overview') => ({
  params: Promise.resolve({ locale: 'it', screen }),
  searchParams: Promise.resolve(query),
});

/** I parametri di scenario e di spettatore piu' invitanti per chi volesse forzare i dati. */
const PROBES: Array<Record<string, string>> = [
  {},
  { as: 'subscriber' },
  { as: 'lifetime', state: 'ok', chrome: '0' },
  { as: 'subscriber', state: 'partial', day: '2026-09-20', range: '90', chrome: '0' },
];

beforeEach(() => vi.clearAllMocks());
afterEach(() => vi.unstubAllEnvs());

describe('anteprima con la porta chiusa: 404 e nessun dato', () => {
  for (const { name, env } of CLOSED) {
    it(`${name}: layout, indice e ogni schermata rispondono 404`, async () => {
      setEnv(env);
      expect(() => DashboardPreviewLayout({ children: null })).toThrow(NOT_FOUND);
      await expect(DashboardPreviewIndex({ params: Promise.resolve({ locale: 'it' }) })).rejects.toThrow(NOT_FOUND);
      for (const q of PROBES) {
        for (const screen of ['overview', 'sources', 'sleep', 'login', '..']) {
          await expect(DashboardPreviewScreen(screenArgs(q, screen)), `${screen} ${JSON.stringify(q)}`).rejects.toThrow(NOT_FOUND);
        }
      }
    });

    it(`${name}: nessuna spia dei dati viene toccata (nessuno scenario, nessun accesso sintetico, nessun parametro letto)`, async () => {
      setEnv(env);
      for (const q of PROBES) await DashboardPreviewScreen(screenArgs(q)).catch(() => undefined);
      expect(buildDashboardResult).not.toHaveBeenCalled();
      expect(buildDashboardData).not.toHaveBeenCalled();
      expect(resolveDashboardAccess).not.toHaveBeenCalled();
      expect(parsePreviewParams).not.toHaveBeenCalled();
    });
  }

  it('i parametri dell URL non aprono la porta: as=subscriber non e una chiave', async () => {
    setEnv({ WEB_DASHBOARD_PROTOTYPE: '1', VERCEL_ENV: 'production' });
    await expect(DashboardPreviewScreen(screenArgs({ as: 'subscriber', state: 'ok', chrome: '0', WEB_DASHBOARD_PROTOTYPE: '1' }))).rejects.toThrow(NOT_FOUND);
  });
});

describe('anteprima con la porta aperta (controprova: il test sa distinguere)', () => {
  it('il layout passa i figli e la schermata costruisce dati sintetici', async () => {
    setEnv(OPEN_ENV);
    const child = { marker: 'figlio' };
    // i figli passano dentro la guardia del tasto indietro (BackForwardGuard), intatti
    const avvolto = DashboardPreviewLayout({ children: child as never }) as unknown as ReactElement<{ children: unknown }>;
    expect(avvolto.type).toBe(BackForwardGuard);
    expect(avvolto.props.children).toBe(child);
    const out = await DashboardPreviewScreen(screenArgs({ as: 'subscriber' }));
    expect(out).not.toBeNull();
    expect(parsePreviewParams).toHaveBeenCalledTimes(1);
    expect(resolveDashboardAccess).toHaveBeenCalledTimes(1);
    expect(buildDashboardResult).toHaveBeenCalledTimes(1);
  });

  it('in anteprima Vercel (NODE_ENV=production, VERCEL_ENV=preview) la porta e chiusa: 404 e nessun dato', async () => {
    setEnv({ WEB_DASHBOARD_PROTOTYPE: '1', VERCEL_ENV: 'preview', NODE_ENV: 'production' });
    await expect(DashboardPreviewScreen(screenArgs())).rejects.toThrow(NOT_FOUND);
    expect(buildDashboardResult).not.toHaveBeenCalled();
  });

  it('una schermata fuori elenco e 404 anche con la porta aperta, senza dati', async () => {
    setEnv(OPEN_ENV);
    await expect(DashboardPreviewScreen(screenArgs({}, 'qualunque'))).rejects.toThrow(NOT_FOUND);
    expect(buildDashboardResult).not.toHaveBeenCalled();
  });

  it('senza sessione (as=anonymous) non si costruiscono i dati: solo il login', async () => {
    setEnv(OPEN_ENV);
    await DashboardPreviewScreen(screenArgs({ as: 'anonymous' }));
    expect(buildDashboardResult).not.toHaveBeenCalled();
  });

  it('l indice porta alla panoramica solo a porta aperta', async () => {
    setEnv(OPEN_ENV);
    await expect(DashboardPreviewIndex({ params: Promise.resolve({ locale: 'en' }) })).rejects.toThrow('NEXT_REDIRECT:/en/dashboard-preview/overview');
  });
});

describe('metadati: mai indicizzabile', () => {
  it('a porta aperta: noindex, nessun canonical, nessun hreflang', () => {
    setEnv(OPEN_ENV);
    const m = generateMetadata();
    expect(m.robots).toMatchObject({ index: false, follow: false });
    expect(m.alternates).toEqual({});
  });

  it('a porta chiusa i metadati sono neutri: niente «Anteprima interna» ne «Prototipo interno», solo noindex', () => {
    for (const { name, env } of CLOSED) {
      setEnv(env);
      const m = generateMetadata();
      const dump = JSON.stringify(m);
      expect(dump, name).not.toMatch(/Anteprima interna|Prototipo interno|dati sintetici|Internal preview|synthetic/i);
      expect(m.title, name).toBeUndefined();
      expect(m.description, name).toBeUndefined();
      expect(m.openGraph, name).toBeUndefined();
      expect(m.robots, name).toMatchObject({ index: false, follow: false });
      expect(m.alternates, name).toEqual({});
    }
  });
});
