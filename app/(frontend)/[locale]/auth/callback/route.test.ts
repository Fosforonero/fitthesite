import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Callback del login (magic link / PKCE): dopo lo scambio del codice rimanda a `next`.
 * `next` arriva dall'esterno: deve restare un percorso INTERNO dello stesso sito.
 * Un redirect verso un altro dominio dopo un login valido e' un open redirect
 * (phishing con la fiducia del dominio FitMesh).
 */

const exchange = vi.fn();
vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({ auth: { exchangeCodeForSession: exchange } }),
}));

import { GET } from './route';

const ORIGINE = 'https://www.fitmesh.fit';

async function chiama(query: string, locale = 'it') {
  const req = new NextRequest(`${ORIGINE}/${locale}/auth/callback?${query}`);
  return GET(req, { params: Promise.resolve({ locale }) });
}

function destinazione(res: Response): URL {
  const loc = res.headers.get('location');
  expect(loc, 'manca Location').not.toBeNull();
  return new URL(loc as string, ORIGINE);
}

beforeEach(() => {
  exchange.mockReset();
  exchange.mockResolvedValue({ error: null });
});

describe('callback di login: next resta un percorso interno', () => {
  // Valori ostili, gia' codificati come arrivano nell'URL. `searchParams.get` li decodifica.
  const ostili: Array<[string, string]> = [
    ['doppio slash (//dominio)', '//x.invalid'],
    ['doppio slash codificato', '%2F%2Fx.invalid'],
    ['tre slash', '///x.invalid'],
    ['slash + backslash', '/%5Cx.invalid'],
    ['slash + backslash + slash', '/%5C/x.invalid'],
    ['solo backslash', '%5C%5Cx.invalid'],
    ['tabulazione fra gli slash (i browser la tolgono)', '/%09/x.invalid'],
    ['a capo fra gli slash', '/%0A/x.invalid'],
    ['carattere di controllo', '/%00/x.invalid'],
    ['URL assoluto https', 'https://x.invalid/phish'],
    ['URL assoluto http', 'http://x.invalid'],
    ['URL con schema relativo e credenziali', '//user:pass@x.invalid'],
    ['dominio nudo', 'x.invalid'],
    ['javascript:', 'javascript:alert(1)'],
    ['data:', 'data:text/html,x'],
    ['http con backslash', 'http:%5C%5Cx.invalid'],
  ];

  it.each(ostili)('%s -> /it/app sullo stesso sito', async (_nome, next) => {
    const res = await chiama(`code=abc&next=${next}`);
    const d = destinazione(res);
    expect(d.origin).toBe(ORIGINE);
    expect(d.pathname).toBe('/it/app');
    expect(d.search).toBe('');
  });

  it('un percorso interno legittimo resta invariato (percorso e query)', async () => {
    const d = destinazione(await chiama('code=abc&next=/it/app/dashboard%3Fx%3D1'));
    expect(d.origin).toBe(ORIGINE);
    expect(d.pathname).toBe('/it/app/dashboard');
    expect(d.search).toBe('?x=1');
  });

  it('un altro locale interno resta invariato', async () => {
    const d = destinazione(await chiama('code=abc&next=/en/app', 'en'));
    expect(d.pathname).toBe('/en/app');
  });

  it('senza next va alla propria area nel locale della richiesta', async () => {
    const d = destinazione(await chiama('code=abc', 'de'));
    expect(d.origin).toBe(ORIGINE);
    expect(d.pathname).toBe('/de/app');
  });

  it('un locale che non esiste ricade su it, anche con next ostile', async () => {
    const d = destinazione(await chiama('code=abc&next=//x.invalid', 'zz'));
    expect(d.origin).toBe(ORIGINE);
    expect(d.pathname).toBe('/it/app');
  });
});

describe('callback di login: gli altri esiti non cambiano', () => {
  it('senza code va al login con missing_code', async () => {
    const d = destinazione(await chiama('next=//x.invalid'));
    expect(d.origin).toBe(ORIGINE);
    expect(d.pathname).toBe('/it/auth/login');
    expect(d.searchParams.get('error')).toBe('missing_code');
    expect(exchange).not.toHaveBeenCalled();
  });

  it('errore dello scambio: login con il messaggio, mai verso next', async () => {
    exchange.mockResolvedValue({ error: { message: 'codice scaduto' } });
    const d = destinazione(await chiama('code=abc&next=//x.invalid'));
    expect(d.origin).toBe(ORIGINE);
    expect(d.pathname).toBe('/it/auth/login');
    expect(d.searchParams.get('error')).toBe('codice scaduto');
  });

  it('error_description del provider: login, senza scambiare il codice', async () => {
    const d = destinazione(await chiama('error_description=access_denied&code=abc&next=//x.invalid'));
    expect(d.pathname).toBe('/it/auth/login');
    expect(exchange).not.toHaveBeenCalled();
  });
});
