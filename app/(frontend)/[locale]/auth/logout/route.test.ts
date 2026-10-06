import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Logout della sessione web (decisione 52: logout, cambio account e ritorno dalla cache
 * del browser non devono far ricomparire il payload sanitario del primo account).
 * Qui si prova la ROUTE: chiude la sessione sul server e rimanda alla home del locale.
 * Cookie veri e cache del browser restano prove da fare su un browser (non qui).
 */

const signOut = vi.fn();
vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({ auth: { signOut } }),
}));

import { GET, POST } from './route';

const ORIGINE = 'https://www.fitmesh.fit';
const richiesta = (locale: string, metodo: 'GET' | 'POST') =>
  new NextRequest(`${ORIGINE}/${locale}/auth/logout`, { method: metodo });

beforeEach(() => {
  signOut.mockReset();
  signOut.mockResolvedValue({ error: null });
});

describe('logout: POST dal form dell\'area riservata', () => {
  it('chiude la sessione sul server e rimanda alla home del locale', async () => {
    const res = await POST(richiesta('it', 'POST'), { params: Promise.resolve({ locale: 'it' }) });
    expect(signOut).toHaveBeenCalledTimes(1);
    expect(new URL(res.headers.get('location') as string).pathname).toBe('/it');
    expect(new URL(res.headers.get('location') as string).origin).toBe(ORIGINE);
  });

  it('risponde 303 See Other: il browser ripete la richiesta in GET, non rimanda il POST alla home', async () => {
    const res = await POST(richiesta('it', 'POST'), { params: Promise.resolve({ locale: 'it' }) });
    expect(res.status).toBe(303);
  });

  it('un locale che non esiste ricade su it (nessun redirect verso un percorso scelto da chi chiama)', async () => {
    const res = await POST(richiesta('zz', 'POST'), { params: Promise.resolve({ locale: '//x.invalid' }) });
    const d = new URL(res.headers.get('location') as string);
    expect(d.origin).toBe(ORIGINE);
    expect(d.pathname).toBe('/it');
  });

  it('la chiusura della sessione avviene PRIMA della risposta (nessun redirect senza signOut)', async () => {
    const ordine: string[] = [];
    signOut.mockImplementation(async () => {
      ordine.push('signOut');
      return { error: null };
    });
    const res = await POST(richiesta('en', 'POST'), { params: Promise.resolve({ locale: 'en' }) });
    ordine.push('risposta');
    expect(res.status).toBe(303);
    expect(ordine).toEqual(['signOut', 'risposta']);
  });
});

describe('logout: GET (DECISIONE APERTA sul logout via GET, voce 8 delle decisioni del referto 06/10: oggi accettato)', () => {
  // Caratterizzazione, non approvazione: un link di terzi puo' sloggare l'utente (CSRF di logout).
  // Quando la decisione sara' presa (solo POST) questo test va invertito: GET -> 405 e nessun signOut.
  it('oggi un GET chiude la sessione come un POST', async () => {
    const res = await GET(richiesta('it', 'GET'), { params: Promise.resolve({ locale: 'it' }) });
    expect(signOut).toHaveBeenCalledTimes(1);
    expect(new URL(res.headers.get('location') as string).pathname).toBe('/it');
  });
});

describe('logout: l\'unico chiamante nel repository usa POST', () => {
  it('il form del layout dell\'area riservata e\' method="post" verso /auth/logout', async () => {
    const fs = await import('node:fs');
    const path = await import('node:path');
    const layout = fs.readFileSync(path.join(__dirname, '../../app/layout.tsx'), 'utf8');
    expect(layout).toMatch(/action=\{`\/\$\{lc\}\/auth\/logout`\}\s+method="post"/);
  });
});
