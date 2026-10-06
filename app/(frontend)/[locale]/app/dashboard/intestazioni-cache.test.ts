/**
 * Ritorno con la cache del browser, parte HTTP: quali intestazioni di cache ricevono le pagine sotto
 * /[locale]/app/* (la dashboard reale e le sue sorelle), e da dove vengono.
 *
 * Tre posti possono scrivere Cache-Control o Vary su queste pagine: next.config.mjs (`headers()`),
 * vercel.json (`headers`/`routes`) e middleware.ts. Nessuno dei tre lo fa oggi: il Cache-Control lo
 * scrive Next stesso, dalla configurazione del segmento (`revalidate = 0` / `force-dynamic`), e vale
 * `private, no-cache, no-store, max-age=0, must-revalidate`. Qui si prova:
 *
 *   1. la pagina e il layout di /app dichiarano un segmento dinamico, e la funzione di Next che ne ricava
 *      l'intestazione (getCacheControlHeader, la stessa usata dal server) da' `private ... no-store`;
 *   2. le regole VERE di next.config.mjs (il modulo importato ed eseguito, non il testo), applicate a
 *      ogni percorso /app con il matcher di percorsi di Next, non impostano alcuna intestazione di cache
 *      pubblica, ne' per browser ne' per CDN;
 *   3. vercel.json non ha intestazioni ne' route che tocchino /app;
 *   4. il middleware, ESEGUITO con una NextRequest finta (Supabase finto), sulle pagine /app non aggiunge
 *      intestazioni di cache, ne' con la sessione, ne' con i cookie rinnovati, ne' nel redirect al login.
 *
 * Il test cade se un cambio in uno di questi posti rende cacheabile da browser o CDN una pagina /app.
 * Cosa NON si prova qui: la risposta HTTP reale di `next start` o di Vercel (servono build e server), e
 * il comportamento della bfcache, che ignora `no-store` in alcuni browser (vedi BackForwardGuard).
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';

import { getCacheControlHeader } from 'next/dist/server/lib/cache-control';
import { getPathMatch } from 'next/dist/shared/lib/router/utils/path-match';
import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const sessione = vi.hoisted(() => ({
  utente: null as null | { id: string; email: string },
  rinnovaCookie: false,
}));

vi.mock('@supabase/ssr', () => ({
  createServerClient: (
    _url: string,
    _chiave: string,
    opzioni: { cookies: { setAll: (c: { name: string; value: string; options: object }[]) => void } },
  ) => ({
    auth: {
      getUser: async () => {
        if (sessione.rinnovaCookie) {
          opzioni.cookies.setAll([
            { name: 'sb-finto-auth-token', value: 'rinnovato', options: { path: '/', httpOnly: true, sameSite: 'lax' } },
          ]);
        }
        return { data: { user: sessione.utente }, error: null };
      },
    },
  }),
}));
vi.mock('next/navigation', () => ({ notFound: vi.fn(), redirect: vi.fn() }));
vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn() }));

import nextConfig from '../../../../../next.config.mjs';
import { config as configMiddleware, middleware } from '../../../../../middleware';

import * as layoutApp from '../layout';
import * as pagina from './page';

const RADICE = path.resolve(__dirname, '../../../../..');

/** Pagine autenticate sotto /[locale]/app: la dashboard in piu' lingue e le sorelle. */
const PERCORSI_APP = [
  '/it/app/dashboard',
  '/en/app/dashboard',
  '/de/app/dashboard',
  '/it/app',
  '/it/app/settings',
  '/it/app/devices',
  '/it/app/export',
];

/** Intestazioni che rendono una risposta conservabile da un browser o da una CDN. */
const INTESTAZIONI_DI_CACHE = [
  'cache-control',
  'cdn-cache-control',
  'vercel-cdn-cache-control',
  'surrogate-control',
  'expires',
  'pragma',
  'vary',
];

/**
 * Un valore di Cache-Control che non lascia conservare niente: `no-store` e `private`, e niente che lo
 * riapra per una CDN (`public`, `s-maxage`, `stale-while-revalidate`, `immutable`).
 */
function nonConservabile(valore: string): boolean {
  const v = valore.toLowerCase();
  return (
    /\bno-store\b/.test(v) &&
    /\bprivate\b/.test(v) &&
    !/\bpublic\b|\bs-maxage\b|stale-while-revalidate|\bimmutable\b/.test(v)
  );
}

type Regola = {
  source: string;
  headers: { key: string; value: string }[];
  has?: unknown[];
  missing?: unknown[];
  basePath?: false;
  locale?: false;
};

/**
 * Le intestazioni che next.config applica a `percorso`, nell'ordine di Next (le regole si sommano,
 * a parita' di chiave vince l'ultima). Una regola con `has`/`missing` si considera applicata: e' il
 * caso peggiore, e qui si cerca proprio il peggiore.
 */
function intestazioniDaConfig(regole: Regola[], percorso: string): Map<string, { valore: string; fonte: string }> {
  const out = new Map<string, { valore: string; fonte: string }>();
  for (const r of regole) {
    const combacia = getPathMatch(r.source, { removeUnnamedParams: true, strict: true })(percorso);
    if (combacia === false) continue;
    for (const h of r.headers) out.set(h.key.toLowerCase(), { valore: h.value, fonte: r.source });
  }
  return out;
}

/** Il giudizio sulle intestazioni di cache di una risposta: vuoto = nessun problema. */
function problemiDiCache(intestazioni: Map<string, string>, dove: string): string[] {
  const problemi: string[] = [];
  for (const [chiave, valore] of intestazioni) {
    if (!INTESTAZIONI_DI_CACHE.includes(chiave)) continue;
    if (chiave === 'cache-control' && nonConservabile(valore)) continue;
    problemi.push(`${dove}: ${chiave}: ${valore}`);
  }
  return problemi;
}

// ── 1. Il segmento: e' Next a scrivere Cache-Control, e scrive private/no-store ───────────────────────

describe('cache 1: la pagina e il layout di /app sono dinamici, e Next li serve private/no-store', () => {
  it('la pagina della dashboard dichiara revalidate 0, force-dynamic e force-no-store', () => {
    expect(pagina.dynamic).toBe('force-dynamic');
    expect(pagina.revalidate).toBe(0);
    expect(pagina.fetchCache).toBe('force-no-store');
  });

  it('il layout di /app e dinamico', () => {
    expect(layoutApp.dynamic).toBe('force-dynamic');
    // un revalidate positivo sul layout renderebbe statico il segmento: oggi non c'e'
    expect((layoutApp as { revalidate?: unknown }).revalidate ?? 0).toBe(0);
  });

  it('con revalidate 0 il server di Next scrive «private, no-cache, no-store, max-age=0, must-revalidate»', () => {
    const valore = getCacheControlHeader({ revalidate: pagina.revalidate, expire: undefined });
    expect(valore).toBe('private, no-cache, no-store, max-age=0, must-revalidate');
    expect(nonConservabile(valore)).toBe(true);
  });

  it('controprova: con un revalidate positivo Next scriverebbe un s-maxage, e il giudizio lo boccia', () => {
    const valore = getCacheControlHeader({ revalidate: 60, expire: 31536000 });
    expect(valore).toMatch(/^s-maxage=60/);
    expect(nonConservabile(valore)).toBe(false);
  });
});

// ── 2. next.config.mjs: le regole vere, eseguite ────────────────────────────────────────────────────

describe('cache 2: next.config.mjs non rende cacheabile nessuna pagina /app', () => {
  it('controprova: il matcher applica davvero le regole (reset-password riceve no-store, /app no)', async () => {
    const regole = (await nextConfig.headers()) as Regola[];
    expect(intestazioniDaConfig(regole, '/it/auth/reset-password').get('cache-control')?.valore).toBe('no-store');
    expect(intestazioniDaConfig(regole, '/it/app/dashboard').has('x-frame-options')).toBe(true);
  });

  it('controprova: il giudizio boccia una regola pubblica su /app', () => {
    const regole: Regola[] = [
      { source: '/:locale/app/:path*', headers: [{ key: 'Cache-Control', value: 'public, max-age=300' }] },
    ];
    const trovate = new Map([...intestazioniDaConfig(regole, '/it/app/dashboard')].map(([k, v]) => [k, v.valore]));
    expect(problemiDiCache(trovate, 'x')).toHaveLength(1);
    expect(problemiDiCache(new Map([['vary', 'Accept-Language']]), 'x')).toHaveLength(1);
  });

  it.each(PERCORSI_APP)('%s: nessuna intestazione di cache dalla configurazione', async (percorso) => {
    const regole = (await nextConfig.headers()) as Regola[];
    const trovate = intestazioniDaConfig(regole, percorso);
    const piatte = new Map([...trovate].map(([k, v]) => [k, v.valore]));
    expect(problemiDiCache(piatte, percorso)).toEqual([]);
  });

  it('nessuna regola di next.config imposta intestazioni di cache fuori da reset-password', async () => {
    const regole = (await nextConfig.headers()) as Regola[];
    const conCache = regole
      .filter((r) => r.headers.some((h) => INTESTAZIONI_DI_CACHE.includes(h.key.toLowerCase())))
      .map((r) => r.source);
    expect(conCache).toEqual(['/:locale/auth/reset-password']);
  });
});

// ── 3. vercel.json ──────────────────────────────────────────────────────────────────────────────────

describe('cache 3: vercel.json non tocca le pagine /app', () => {
  const vercel = JSON.parse(readFileSync(path.join(RADICE, 'vercel.json'), 'utf8')) as Record<string, unknown>;

  it('nessuna regola headers o routes che combaci con /app imposta intestazioni di cache', () => {
    const regole = [
      ...((vercel.headers as Regola[] | undefined) ?? []),
      ...(((vercel.routes as { src?: string; headers?: Record<string, string> }[] | undefined) ?? [])
        .filter((r) => r.headers)
        .map((r) => ({
          source: r.src ?? '/(.*)',
          headers: Object.entries(r.headers ?? {}).map(([key, value]) => ({ key, value })),
        }))),
    ];
    for (const percorso of PERCORSI_APP) {
      const piatte = new Map([...intestazioniDaConfig(regole, percorso)].map(([k, v]) => [k, v.valore]));
      expect(problemiDiCache(piatte, `vercel.json ${percorso}`)).toEqual([]);
    }
  });

  it('oggi vercel.json non ha ne headers ne routes (se compaiono, la prova sopra le giudica)', () => {
    expect(vercel.headers).toBeUndefined();
    expect(vercel.routes).toBeUndefined();
  });
});

// ── 4. middleware.ts, eseguito ──────────────────────────────────────────────────────────────────────

describe('cache 4: il middleware, eseguito, non aggiunge intestazioni di cache alle pagine /app', () => {
  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://finto.supabase.invalid');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'chiave-finta');
    sessione.utente = null;
    sessione.rinnovaCookie = false;
  });
  afterEach(() => vi.unstubAllEnvs());

  const richiesta = (percorso: string) =>
    new NextRequest(`https://www.fitmesh.fit${percorso}`, {
      headers: { host: 'www.fitmesh.fit', cookie: 'sb-finto-auth-token=vecchio' },
    });

  const intestazioni = (r: Response) => new Map([...r.headers.entries()].map(([k, v]) => [k.toLowerCase(), v]));

  it('il matcher del middleware copre le pagine /app (altrimenti le prove sotto non direbbero niente)', () => {
    const protette = configMiddleware.matcher.find((m) => m.includes('(?:app|admin)'));
    expect(protette).toBeDefined();
    for (const p of PERCORSI_APP) expect(getPathMatch(protette!, { strict: true })(p), p).not.toBe(false);
  });

  it.each(PERCORSI_APP)('%s con sessione: passa oltre senza intestazioni di cache', async (percorso) => {
    sessione.utente = { id: 'uid-finto', email: 'finto@example.invalid' };
    const r = await middleware(richiesta(percorso));
    expect(r.status).toBe(200);
    expect(r.headers.get('x-middleware-next')).toBe('1');
    expect(problemiDiCache(intestazioni(r), percorso)).toEqual([]);
  });

  it('con i cookie di sessione rinnovati: la risposta che li porta non ha intestazioni di cache', async () => {
    sessione.utente = { id: 'uid-finto', email: 'finto@example.invalid' };
    sessione.rinnovaCookie = true;
    const r = await middleware(richiesta('/it/app/dashboard'));
    expect(r.headers.get('set-cookie')).toContain('sb-finto-auth-token=rinnovato');
    expect(problemiDiCache(intestazioni(r), 'rinnovo')).toEqual([]);
  });

  it('senza sessione (dopo il logout): redirect al login, senza intestazioni di cache', async () => {
    const r = await middleware(richiesta('/it/app/dashboard'));
    expect(r.status).toBe(307);
    expect(r.headers.get('location')).toBe('https://www.fitmesh.fit/it/auth/login?next=%2Fit%2Fapp%2Fdashboard');
    expect(problemiDiCache(intestazioni(r), 'redirect')).toEqual([]);
  });
});
