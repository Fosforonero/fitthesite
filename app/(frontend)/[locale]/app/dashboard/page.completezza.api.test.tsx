/**
 * La pagina REALE (page.tsx) sulla catena reale: createClient di lib/supabase/server e' l'unico
 * confine sostituito; sotto ci sono il verdetto, il reader, il vero supabase-js, il vero postgrest-js
 * e il doppio fedele di PostgREST con max_rows configurabile (lib/dashboard/postgrest-fedele.fixture.ts).
 *
 * Il difetto provato qui: con max_rows < 500 la pagina mostrava «10 giorni» invece di 28, senza alcun
 * avviso, perche' il reader dichiarava completa una lettura troncata in silenzio.
 */
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { COLONNE_METRICHE } from '@/lib/dashboard/letture-titolare';
import {
  clienteDiSessione,
  creaDoppioPostgrest,
  type OpzioniDoppio,
  type RigaTabella,
} from '@/lib/dashboard/postgrest-fedele.fixture';
import { testiPer } from '@/lib/dashboard/testi';
import { createClient } from '@/lib/supabase/server';

import DashboardWebPage from './page';

vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn() }));
vi.mock('next/navigation', () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
  notFound: vi.fn(() => {
    throw new Error('NOT_FOUND');
  }),
}));

const OWNER = 'dd000000-0000-4000-8000-000000000002';
const OTHER = 'dd000000-0000-4000-8000-000000000004';
const RAW_SENTINEL = 978613;
const SERVER_DIAGNOSTIC = 'diagnostica sintetica privata';
const SENTINELLA_NOME = 'iPhone di Mario Rossi';

beforeEach(() => {
  vi.stubEnv('NODE_ENV', 'test');
  vi.stubEnv('VERCEL_ENV', '');
  vi.stubEnv('FITMESH_WEB_DASHBOARD', '1');
  vi.useFakeTimers();
  vi.setSystemTime('2026-10-15T12:00:00Z');
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

/** `giorni` giornate consecutive terminanti il 2026-10-14, `perGiorno` righe ciascuna. */
function righe(uid: string, giorni: number, perGiorno: number, primoId = 1): RigaTabella[] {
  const out: RigaTabella[] = [];
  let id = primoId;
  for (let g = 0; g < giorni; g++) {
    const giorno = new Date(Date.UTC(2026, 9, 14 - (giorni - 1 - g))).toISOString().slice(0, 10);
    for (let k = 0; k < perGiorno; k++) {
      out.push({
        id: id++, user_id: uid, local_day_key: giorno, window_start_ms: 1, window_end_ms: 2, source: `s${k}`,
        steps: RAW_SENTINEL, distance_meters: 1, active_calories_kcal: 1, calories_kcal: 1, sleep_minutes: 1,
        heart_rate_bpm: 60, resting_heart_rate_bpm: 50, hrv_rmssd: 40, received_at: 't',
        source_device: SENTINELLA_NOME, blood_glucose_mgdl: 978613.5,
      });
    }
  }
  return out;
}

async function rendi(
  locale: 'it' | 'en',
  opzioni: Omit<OpzioniDoppio, 'tabelle'> & { fitness_metrics?: RigaTabella[]; utente?: { id: string; email?: string } | null },
) {
  const { fitness_metrics, utente, ...resto } = opzioni;
  const doppio = creaDoppioPostgrest({ tabelle: { fitness_metrics: fitness_metrics ?? [] }, ...resto });
  const sessione = utente === undefined ? { id: OWNER, email: 'sintetico@example.invalid' } : utente;
  vi.mocked(createClient).mockResolvedValueOnce(clienteDiSessione(doppio, sessione) as never);
  const html = renderToStaticMarkup(await DashboardWebPage({ params: Promise.resolve({ locale }) }));
  return { html, doppio };
}

function senzaPerdite(html: string, doppio: ReturnType<typeof creaDoppioPostgrest>) {
  for (const vietato of [OWNER, OTHER, String(RAW_SENTINEL), SERVER_DIAGNOSTIC, SENTINELLA_NOME]) {
    expect(html, vietato).not.toContain(vietato);
  }
  for (const r of doppio.richiesteSu('fitness_metrics')) {
    for (const vietato of ['blood_glucose', 'source_device', 'hr_source_name', 'device_id', 'notes', 'intraday', 'sleep_stages', '*']) {
      expect(r.select, vietato).not.toContain(vietato);
    }
    expect(r.select).toBe(COLONNE_METRICHE.join(','));
  }
}

describe.each(['it', 'en'] as const)('dashboard: completezza della lettura sulla catena reale (%s)', (locale) => {
  const t = testiPer(locale)!;

  it('P1 max_rows 20 e 56 righe su 28 giorni: 28 giorni, nessun avviso, tre richieste', async () => {
    const { html, doppio } = await rendi(locale, { maxRows: 20, fitness_metrics: righe(OWNER, 28, 2) });
    expect(html).toContain(t.giorniConDati(28));
    expect(html).not.toContain(t.conteggioParziale);
    expect(html).not.toContain('data-esito');
    expect(doppio.richiesteSu('fitness_metrics').map((r) => r.offset)).toEqual([0, 20, 40]);
    senzaPerdite(html, doppio);
  });

  it.each(['asterisco', 'assente', 'malformato'] as const)(
    'P2 conteggio %s: il numero c e, con l avviso di conteggio parziale, e nessun marcatore di guasto',
    async (conteggio) => {
      const { html, doppio } = await rendi(locale, { maxRows: 1000, conteggio, fitness_metrics: righe(OWNER, 28, 2) });
      expect(html).toContain(t.giorniConDati(28));
      expect(html).toContain(t.conteggioParziale);
      expect(html).not.toContain('data-esito');
      senzaPerdite(html, doppio);
    },
  );

  it('P3 limite delle pagine con max_rows 20: avviso parziale, nessun guasto, 40 richieste', async () => {
    const { html, doppio } = await rendi(locale, { maxRows: 20, fitness_metrics: righe(OWNER, 28, 40) });
    expect(doppio.richiesteSu('fitness_metrics')).toHaveLength(40);
    expect(html).toContain(t.conteggioParziale);
    expect(html).not.toContain('data-esito');
    // 800 righe lette = i primi 20 giorni (40 righe al giorno)
    expect(html).toContain(t.giorniConDati(20));
    senzaPerdite(html, doppio);
  });

  it.each([
    ['errore del server a offset 20', { erroreAOffset: { offset: 20, status: 500, code: 'XX000' } }],
    ['riga altrui a offset 20', { rigaAltruiAOffset: { offset: 20, riga: righe(OTHER, 1, 1, 9999)[0] } }],
  ] as const)('P4 %s con max_rows 20: non disponibile, non negato, nessun valore delle pagine precedenti', async (_n, iniezioni) => {
    const { html, doppio } = await rendi(locale, {
      maxRows: 20, fitness_metrics: righe(OWNER, 28, 2), iniezioni: iniezioni as OpzioniDoppio['iniezioni'],
    });
    expect(html).toContain('data-esito="non_disponibile"');
    expect(html).not.toContain('data-esito="negato"');
    for (let n = 0; n <= 30; n++) expect(html).not.toContain(t.giorniConDati(n));
    expect(html).not.toContain(t.conteggioParziale);
    expect(doppio.richiesteSu('fitness_metrics').map((r) => r.offset)).toEqual([0, 20]);
    senzaPerdite(html, doppio);
  });

  it('P5a account B (prova gratuita): negato e nessuna lettura di fitness_metrics', async () => {
    const { html, doppio } = await rendi(locale, {
      fitness_metrics: righe(OTHER, 5, 1),
      utente: { id: OTHER, email: 'b@example.invalid' },
      verdetto: { data: { contractVersion: 1, granted: false, titles: [], denialReason: 'trial_only' } },
    });
    expect(html).toContain('data-esito="negato"');
    expect(doppio.richiesteSu('fitness_metrics')).toHaveLength(0);
    expect(doppio.richieste.filter((r) => r.rpc === 'get_web_dashboard_access')).toHaveLength(1);
    expect(html).not.toContain(String(RAW_SENTINEL));
  });

  it('P5b utente senza riga nel verdetto, o errore del verdetto: non disponibile, mai diniego, nessuna lettura', async () => {
    const casi: OpzioniDoppio['verdetto'][] = [
      { data: { contractVersion: 1, granted: false, titles: [], denialReason: 'user_not_found' } },
      { errore: { status: 500, code: 'XX000' } },
    ];
    for (const verdetto of casi) {
      const { html, doppio } = await rendi(locale, { fitness_metrics: righe(OWNER, 5, 1), verdetto });
      expect(html).toContain('data-esito="non_disponibile"');
      expect(html).not.toContain('data-esito="negato"');
      expect(doppio.richiesteSu('fitness_metrics')).toHaveLength(0);
      expect(html).not.toContain(SERVER_DIAGNOSTIC);
    }
  });

  it('P5c nessuna sessione (utente nullo) o sessione non valida per il database (42501): login, nessuna lettura', async () => {
    const senzaSessione = creaDoppioPostgrest({ tabelle: { fitness_metrics: righe(OWNER, 5, 1) } });
    vi.mocked(createClient).mockResolvedValueOnce(clienteDiSessione(senzaSessione, null) as never);
    await expect(DashboardWebPage({ params: Promise.resolve({ locale }) })).rejects.toThrow(/^REDIRECT:.*\/auth\/login/);
    expect(senzaSessione.richieste).toHaveLength(0);

    const scaduta = creaDoppioPostgrest({
      tabelle: { fitness_metrics: righe(OWNER, 5, 1) }, verdetto: { errore: { status: 401, code: '42501' } },
    });
    vi.mocked(createClient).mockResolvedValueOnce(clienteDiSessione(scaduta, { id: OWNER }) as never);
    await expect(DashboardWebPage({ params: Promise.resolve({ locale }) })).rejects.toThrow(/^REDIRECT:.*\/auth\/login/);
    expect(scaduta.richiesteSu('fitness_metrics')).toHaveLength(0);
  });

  it('P6 nessuna perdita: ne uid, ne sentinelle, ne diagnostica nell html, nelle select e nei console.*', async () => {
    const console_ = (['log', 'info', 'warn', 'error', 'debug'] as const).map((m) => vi.spyOn(console, m).mockImplementation(() => {}));
    const percorsi: OpzioniDoppio[] = [
      { maxRows: 20, fitness_metrics: righe(OWNER, 28, 2) },
      { maxRows: 20, fitness_metrics: righe(OWNER, 28, 2), iniezioni: { erroreAOffset: { offset: 20 } } },
      { maxRows: 20, fitness_metrics: righe(OWNER, 28, 2), iniezioni: { rigaAltruiAOffset: { offset: 20, riga: righe(OTHER, 1, 1, 9999)[0] } } },
      { maxRows: 1000, conteggio: 'asterisco', fitness_metrics: righe(OWNER, 28, 2) },
    ] as never;
    for (const p of percorsi) {
      const { fitness_metrics, ...resto } = p as unknown as { fitness_metrics: RigaTabella[] } & Omit<OpzioniDoppio, 'tabelle'>;
      const { html, doppio } = await rendi(locale, { ...resto, fitness_metrics });
      senzaPerdite(html, doppio);
    }
    const scritto = JSON.stringify(console_.flatMap((s) => s.mock.calls));
    for (const vietato of [OWNER, OTHER, String(RAW_SENTINEL), SERVER_DIAGNOSTIC, SENTINELLA_NOME]) {
      expect(scritto, vietato).not.toContain(vietato);
    }
  });
});
