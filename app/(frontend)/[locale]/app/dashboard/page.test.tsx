import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({
  notFound: vi.fn(() => {
    throw new Error('NEXT_NOT_FOUND');
  }),
  redirect: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT ${url}`);
  }),
}));
vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn() }));

import { createClient } from '@/lib/supabase/server';

import DashboardWebPage, * as modulo from './page';

const UID = 'dd000000-0000-4000-8000-000000000002';
const EMAIL = 'sintetico@example.invalid';

type Rpc = { data: unknown; error: { code?: string } | null } | 'solleva';

/** Un finto client Supabase: sessione, verdetto e una tabella di metriche. */
function supabaseFinto(opzioni: { utente?: boolean; rpc: Rpc; metriche?: Record<string, unknown>[] | 'errore' }) {
  const registro = { rpc: 0, eq: [] as string[] };
  const client = {
    auth: {
      getUser: async () => ({ data: { user: opzioni.utente === false ? null : { id: UID, email: EMAIL } } }),
    },
    rpc: () => ({
      abortSignal: () => {
        registro.rpc++;
        return opzioni.rpc === 'solleva' ? Promise.reject(new TypeError('fetch failed')) : Promise.resolve(opzioni.rpc);
      },
    }),
    from: () => {
      let righe = opzioni.metriche === 'errore' ? [] : [...(opzioni.metriche ?? [])];
      const f = {
        select: () => f,
        eq: (c: string, v: string) => {
          registro.eq.push(`${c}=${v}`);
          righe = righe.filter((r) => r[c] === v);
          return f;
        },
        gte: () => f,
        lte: () => f,
        lt: () => f,
        order: () => f,
        range: () =>
          Promise.resolve(
            opzioni.metriche === 'errore'
              ? { data: null, error: { code: 'XX000' } }
              : { data: righe, error: null },
          ),
      };
      return f;
    },
  };
  return { client, registro };
}

const concesso = { contractVersion: 1, granted: true, titles: ['founder'], denialReason: null };
const negato = (motivo: string) => ({ contractVersion: 1, granted: false, titles: [], denialReason: motivo });

async function rendi(locale: string, finto: ReturnType<typeof supabaseFinto>) {
  vi.mocked(createClient).mockResolvedValue(finto.client as never);
  return renderToStaticMarkup(await DashboardWebPage({ params: Promise.resolve({ locale }) }));
}

beforeEach(() => {
  vi.stubEnv('FITMESH_WEB_DASHBOARD', '1');
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.mocked(createClient).mockReset();
});

describe('dashboard web: l interruttore e le lingue', () => {
  it('spenta per impostazione: 404, senza nemmeno aprire una sessione', async () => {
    vi.stubEnv('FITMESH_WEB_DASHBOARD', '');
    await expect(rendi('it', supabaseFinto({ rpc: { data: concesso, error: null } }))).rejects.toThrow('NEXT_NOT_FOUND');
    expect(createClient).not.toHaveBeenCalled();
  });

  // Solo il valore esatto «1» accende la pagina: variabile assente, «0», «true», «yes» o con spazi la lasciano
  // spenta (404), anche con sessione valida e verdetto concesso, e senza aprire una sessione. E' la prova di
  // pagina dell'interruttore spento: da fuori, senza sessione, il middleware risponde 307 verso il login PRIMA
  // che la pagina decida, quindi la prova HTTP non puo' vederlo.
  it.each<[string, string | undefined]>([
    ['variabile assente', undefined],
    ['0', '0'],
    ['true', 'true'],
    ['yes', 'yes'],
    ['1 con lo spazio', ' 1'],
    ['01', '01'],
  ])('interruttore spento (%s): 404 e nessuna sessione aperta', async (_nome, valore) => {
    vi.stubEnv('FITMESH_WEB_DASHBOARD', valore as string);
    await expect(rendi('it', supabaseFinto({ rpc: { data: concesso, error: null } }))).rejects.toThrow('NEXT_NOT_FOUND');
    await expect(rendi('en', supabaseFinto({ rpc: { data: concesso, error: null } }))).rejects.toThrow('NEXT_NOT_FOUND');
    expect(createClient).not.toHaveBeenCalled();
  });

  it('una lingua senza traduzione rivista: 404, non testo di un altra lingua', async () => {
    await expect(rendi('de', supabaseFinto({ rpc: { data: concesso, error: null } }))).rejects.toThrow('NEXT_NOT_FOUND');
  });

  it('senza sessione: login', async () => {
    await expect(rendi('it', supabaseFinto({ utente: false, rpc: { data: concesso, error: null } }))).rejects.toThrow(
      'NEXT_REDIRECT /it/auth/login?next=/it/app/dashboard',
    );
  });

  it('42501 dal database: login, non paywall', async () => {
    await expect(rendi('it', supabaseFinto({ rpc: { data: null, error: { code: '42501' } } }))).rejects.toThrow(
      'NEXT_REDIRECT /it/auth/login',
    );
  });
});

describe('dashboard web: i tre esiti', () => {
  it('concesso: riepilogo dei soli dati del titolare, client senza cache', async () => {
    const finto = supabaseFinto({
      rpc: { data: concesso, error: null },
      metriche: [
        { user_id: UID, local_day_key: '2026-09-20' },
        { user_id: UID, local_day_key: '2026-09-21' },
        { user_id: 'dd000000-0000-4000-8000-000000000004', local_day_key: '2026-09-22' },
      ],
    });
    const html = await rendi('it', finto);
    expect(html).toContain(`Accesso confermato per ${EMAIL}.`);
    expect(html).toContain('Giorni con dati negli ultimi 30 giorni: 2.');
    expect(finto.registro.eq).toContain(`user_id=${UID}`);
    expect(createClient).toHaveBeenCalledWith({ senzaCache: true });
  });

  it('negato: dice il motivo, l account della sessione e dove si acquista', async () => {
    const html = await rendi('it', supabaseFinto({ rpc: { data: negato('trial_only'), error: null } }));
    expect(html).toContain('data-esito="negato"');
    expect(html).toContain('La prova gratuita non comprende la dashboard web.');
    expect(html).toContain(EMAIL);
    expect(html).not.toContain('Accesso confermato');
  });

  it('negato in inglese', async () => {
    const html = await rendi('en', supabaseFinto({ rpc: { data: negato('subscription_inactive'), error: null } }));
    expect(html).toContain('Your subscription does not show as active.');
  });

  it.each<[string, Rpc]>([
    ['rete assente', 'solleva'],
    ['funzione non applicata', { data: null, error: { code: 'PGRST202' } }],
    ['errore del server', { data: null, error: { code: 'XX000' } }],
    ['risposta illeggibile', { data: { granted: 'forse' }, error: null }],
  ])('%s: errore e riprova, mai un paywall', async (_n, rpc) => {
    const html = await rendi('it', supabaseFinto({ rpc }));
    expect(html).toContain('data-esito="non_disponibile"');
    expect(html).toContain('Non riusciamo a verificare il tuo accesso in questo momento.');
    expect(html).toContain('href="/it/app/dashboard"');
    expect(html).not.toContain('data-esito="negato"');
    expect(html).not.toContain('richiede un abbonamento');
  });

  it('concesso ma la lettura dei dati non riesce: errore e riprova, non un diniego', async () => {
    const html = await rendi('it', supabaseFinto({ rpc: { data: concesso, error: null }, metriche: 'errore' }));
    expect(html).toContain('data-esito="non_disponibile"');
    expect(html).not.toContain('richiede un abbonamento');
  });
});

describe('dashboard web: niente cache e niente indicizzazione', () => {
  it('la pagina e dinamica, non si rivalida e non conserva fetch', () => {
    expect(modulo.dynamic).toBe('force-dynamic');
    expect(modulo.revalidate).toBe(0);
    expect(modulo.fetchCache).toBe('force-no-store');
  });

  it('noindex', () => {
    expect(modulo.metadata.robots).toEqual({ index: false, follow: false });
  });
});
