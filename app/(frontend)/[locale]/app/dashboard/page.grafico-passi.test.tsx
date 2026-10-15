/**
 * La catena reale pagina -> reader -> qualificazione -> grafico (DASHBOARD-REAL-02, B3c-2).
 *
 * Confine sostituito: SOLO createClient di lib/supabase/server. Sotto girano il verdetto, il reader, il
 * vero supabase-js/postgrest-js e il doppio fedele di PostgREST (max_rows, conteggio, iniezioni).
 * Orologio fisso con vi.setSystemTime: la finestra e' quella di finestra.ts, ricalcolata qui in modo
 * indipendente (aritmetica sui millisecondi) per orologi a cavallo di mezzogiorno UTC, mezzanotte,
 * mese e anno.
 *
 * Lo stato del grafico si legge dalle righe della tabella alternativa del kit
 * (`<tr data-date=... data-slot-state=...>`): una per giorno, nell'ordine della finestra.
 */
import { isValidElement, type ReactElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { DailyStepsChart } from '@/components/charts/DailyStepsChart';
import {
  clienteDiSessione,
  creaDoppioPostgrest,
  type OpzioniDoppio,
  type RigaTabella,
} from '@/lib/dashboard/postgrest-fedele.fixture';
import { testiPassiPer, testiPer } from '@/lib/dashboard/testi';
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
const FONTE_SENTINELLA = 'fonte-sentinella-zq8';
const NOME_DISPOSITIVO = 'iPhone di Mario Rossi';
const GLICEMIA = 978613.5;
const SERVER_DIAGNOSTIC = 'diagnostica sintetica privata';
const ORA_DI_BASE = '2026-10-15T12:00:00Z';

beforeEach(() => {
  vi.stubEnv('NODE_ENV', 'test');
  vi.stubEnv('VERCEL_ENV', '');
  vi.stubEnv('FITMESH_WEB_DASHBOARD', '1');
  vi.useFakeTimers();
  vi.setSystemTime(ORA_DI_BASE);
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

function riga(giorno: string, steps: unknown, source = 'phone', uid = OWNER, extra: RigaTabella = {}): RigaTabella {
  return {
    id: Math.floor(Math.random() * 1e9), user_id: uid, local_day_key: giorno, window_start_ms: 1, window_end_ms: 2,
    source, steps, distance_meters: 1, active_calories_kcal: 1, calories_kcal: 1, sleep_minutes: 1,
    heart_rate_bpm: 60, resting_heart_rate_bpm: 50, hrv_rmssd: 40, received_at: 't',
    source_device: NOME_DISPOSITIVO, device_id: 'dev-sentinella', blood_glucose_mgdl: GLICEMIA, ...extra,
  };
}

type Opzioni = Omit<OpzioniDoppio, 'tabelle'> & {
  fitness_metrics?: RigaTabella[];
  utente?: { id: string; email?: string } | null;
};

async function rendi(locale: 'it' | 'en', opzioni: Opzioni = {}) {
  const { fitness_metrics, utente, ...resto } = opzioni;
  const doppio = creaDoppioPostgrest({ tabelle: { fitness_metrics: fitness_metrics ?? [] }, ...resto });
  const sessione = utente === undefined ? { id: OWNER, email: 'sintetico@example.invalid' } : utente;
  vi.mocked(createClient).mockResolvedValueOnce(clienteDiSessione(doppio, sessione) as never);
  const html = renderToStaticMarkup(await DashboardWebPage({ params: Promise.resolve({ locale }) }));
  return { html, doppio };
}

/** Date e stati della tabella alternativa, nell'ordine del documento. */
function statiDelGrafico(html: string): Array<[string, string]> {
  return [...html.matchAll(/<tr[^>]*data-date="(\d{4}-\d{2}-\d{2})"[^>]*data-slot-state="([a-z-]+)"/g)].map(
    (m) => [m[1], m[2]],
  );
}

/** Un numero di passi, con o senza separatore, non preceduto ne' seguito da altre cifre (le coordinate SVG hanno molte cifre). */
const numero = (n: number) => {
  const c = String(n);
  const sep = c.length > 3 ? `${c.slice(0, -3)}[.,]?${c.slice(-3)}` : c;
  return new RegExp(`(?<![\\d.,])${sep}(?![\\d])`);
};

const testoVisibile = (html: string) => html.replace(/<[^>]*>/g, ' ');

const GIORNO_MS = 86_400_000;
/** Ricalcolo indipendente: ultimo giorno concluso in ogni fuso, dato un istante. */
function finestraAttesa(isoNow: string): string[] {
  const ms = Date.parse(isoNow);
  const ultimo = Math.floor((ms - 12 * 3_600_000) / GIORNO_MS) - 1;
  return Array.from({ length: 7 }, (_, i) => new Date((ultimo - 6 + i) * GIORNO_MS).toISOString().slice(0, 10));
}

const FINESTRA_BASE = finestraAttesa(ORA_DI_BASE); // 2026-10-08 .. 2026-10-14

describe.each(['it', 'en'] as const)('pagina reale: il grafico dei passi (%s)', (locale) => {
  const t = testiPer(locale)!;
  const tp = testiPassiPer(locale)!;

  it('finestra di base: sette date conclusi, 08..14 ottobre', () => {
    expect(FINESTRA_BASE[0]).toBe('2026-10-08');
    expect(FINESTRA_BASE[6]).toBe('2026-10-14');
  });

  it('dati disponibili: UN valore ricevuto, mai misurato; il numero e\' quello della riga', async () => {
    const { html } = await rendi(locale, { fitness_metrics: [riga('2026-10-14', 12345)] });
    const stati = statiDelGrafico(html);
    expect(stati).toHaveLength(7);
    expect(stati[6]).toEqual(['2026-10-14', 'received']);
    expect(stati.slice(0, 6).every(([, s]) => s === 'absent')).toBe(true);
    expect(html).toMatch(numero(12345));
    expect(html).toContain(tp.etichette.received);
  });

  it('assenza: nessuna riga, sette giorni senza dati e il paragrafo dedicato; nessuno zero', async () => {
    const { html } = await rendi(locale, { fitness_metrics: [] });
    expect(statiDelGrafico(html).map(([, s]) => s)).toEqual(Array(7).fill('absent'));
    expect(html).toContain(tp.nessunDatoRicevuto);
    expect(html).toContain(tp.valori.absent);
  });

  it('ambiguita\': due righe nello stesso giorno, anche una a zero: nessun valore scelto ne\' sommato', async () => {
    const { html } = await rendi(locale, {
      fitness_metrics: [riga('2026-10-13', 7777, 'phone'), riga('2026-10-13', 0, 'ring')],
    });
    expect(statiDelGrafico(html)[5]).toEqual(['2026-10-13', 'ambiguous']);
    expect(html).not.toMatch(numero(7777));
    expect(html).toContain(tp.valori.ambiguous);
  });

  it('zero non determinabile: una riga a zero da una sorgente senza prova', async () => {
    const { html } = await rendi(locale, { fitness_metrics: [riga('2026-10-12', 0, 'phone')] });
    expect(statiDelGrafico(html)[4]).toEqual(['2026-10-12', 'undetermined']);
    expect(html).toContain(tp.valori.undetermined);
  });

  it('segnaposto: una riga a zero da strava_oauth', async () => {
    const { html } = await rendi(locale, { fitness_metrics: [riga('2026-10-11', 0, 'strava_oauth')] });
    expect(statiDelGrafico(html)[3]).toEqual(['2026-10-11', 'placeholder']);
    expect(html).toContain(tp.valori.placeholder);
  });

  it('valore non valido (negativo): non disponibile, con la sua etichetta; nessun numero', async () => {
    const { html } = await rendi(locale, { fitness_metrics: [riga('2026-10-10', -4242)] });
    expect(statiDelGrafico(html)[2]).toEqual(['2026-10-10', 'error']);
    expect(html).not.toContain('4242');
    expect(html).toContain(tp.valori.error);
  });

  it('mix di tutti gli stati su sette giorni', async () => {
    const { html } = await rendi(locale, {
      fitness_metrics: [
        riga('2026-10-08', 5000),
        riga('2026-10-10', 111, 'phone'),
        riga('2026-10-10', 222, 'ring'),
        riga('2026-10-11', 0, 'phone'),
        riga('2026-10-12', 0, 'strava_oauth'),
        riga('2026-10-13', 1.5),
        riga('2026-10-14', 8000),
      ],
    });
    expect(statiDelGrafico(html)).toEqual([
      ['2026-10-08', 'received'],
      ['2026-10-09', 'absent'],
      ['2026-10-10', 'ambiguous'],
      ['2026-10-11', 'undetermined'],
      ['2026-10-12', 'placeholder'],
      ['2026-10-13', 'error'],
      ['2026-10-14', 'received'],
    ]);
    expect(html).not.toMatch(numero(111));
    expect(html).not.toMatch(numero(222));
  });

  it.each([
    ['limite delle pagine (max_rows 20, 40 pagine)', { maxRows: 20 }, 28, 40],
    ['conteggio con asterisco', { maxRows: 1000, conteggio: 'asterisco' }, 28, 2],
    ['conteggio assente', { maxRows: 1000, conteggio: 'assente' }, 28, 2],
    ['conteggio malformato (NaN)', { maxRows: 1000, conteggio: 'malformato' }, 28, 2],
    [
      'conteggio incoerente fra le pagine',
      { maxRows: 20, conteggio: (i: number, tot: number) => String(i === 0 ? tot : tot + 1) },
      28,
      2,
    ],
  ] as const)('lettura non completa, %s: nessun grafico, nessun numero di passi, avviso', async (_n, opz, giorni, perGiorno) => {
    const rows: RigaTabella[] = [];
    for (let g = 0; g < giorni; g++) {
      const giorno = new Date(Date.UTC(2026, 9, 14 - (giorni - 1 - g))).toISOString().slice(0, 10);
      for (let k = 0; k < perGiorno; k++) rows.push(riga(giorno, 978613, `s${k}`));
    }
    const { html } = await rendi(locale, { ...(opz as Partial<Opzioni>), fitness_metrics: rows });
    expect(html).toContain(t.conteggioParziale);
    expect(html).toContain(tp.graficoNonMostrato);
    expect(html).not.toContain('data-chart-wrapper');
    expect(html).not.toContain('data-slot-state');
    expect(html).not.toContain('<table');
    expect(html).not.toMatch(numero(978613));
    expect(html).not.toContain('data-esito');
  });

  it('max_rows basso ma conteggio provato: la lettura e\' completa e il grafico c\'e\'', async () => {
    const { html } = await rendi(locale, { maxRows: 20, fitness_metrics: [riga('2026-10-14', 9001)] });
    expect(statiDelGrafico(html)[6]).toEqual(['2026-10-14', 'received']);
    expect(html).not.toContain(t.conteggioParziale);
  });

  it.each([
    ['errore del server su una pagina successiva', { erroreAOffset: { offset: 20, status: 500, code: 'XX000' } }],
    ['riga altrui su una pagina successiva', { rigaAltruiAOffset: { offset: 20, riga: riga('2026-10-14', 5, 'phone', OTHER) } }],
  ] as const)('%s: non disponibile, senza diniego ne\' paywall, nessun grafico', async (_n, iniezioni) => {
    const rows: RigaTabella[] = [];
    for (let g = 0; g < 28; g++) {
      rows.push(riga(new Date(Date.UTC(2026, 9, 14 - g)).toISOString().slice(0, 10), 4321), riga('2026-10-01', 1, 'x'));
    }
    const { html } = await rendi(locale, { maxRows: 20, fitness_metrics: rows, iniezioni: iniezioni as OpzioniDoppio['iniezioni'] });
    expect(html).toContain('data-esito="non_disponibile"');
    expect(html).not.toContain('data-esito="negato"');
    expect(html).not.toContain(t.richiesta);
    expect(html).not.toContain(t.acquisti);
    expect(html).not.toContain('data-chart-wrapper');
    expect(html).not.toContain(SERVER_DIAGNOSTIC);
  });

  it('accesso negato: nessuna lettura di fitness_metrics, nessun grafico', async () => {
    const { html, doppio } = await rendi(locale, {
      fitness_metrics: [riga('2026-10-14', 5000, 'phone', OTHER)],
      utente: { id: OTHER, email: 'b@example.invalid' },
      verdetto: { data: { contractVersion: 1, granted: false, titles: [], denialReason: 'trial_only' } },
    });
    expect(html).toContain('data-esito="negato"');
    expect(doppio.richiesteSu('fitness_metrics')).toHaveLength(0);
    expect(html).not.toContain('data-chart-wrapper');
  });

  it('verdetto non disponibile: nessuna lettura di fitness_metrics, nessun grafico', async () => {
    const { html, doppio } = await rendi(locale, {
      fitness_metrics: [riga('2026-10-14', 5000)],
      verdetto: { errore: { status: 500, code: 'XX000' } },
    });
    expect(html).toContain('data-esito="non_disponibile"');
    expect(doppio.richiesteSu('fitness_metrics')).toHaveLength(0);
    expect(html).not.toContain('data-chart-wrapper');
  });

  it('sessione non valida: login, nessuna lettura', async () => {
    const doppio = creaDoppioPostgrest({ tabelle: { fitness_metrics: [riga('2026-10-14', 5000)] } });
    vi.mocked(createClient).mockResolvedValueOnce(clienteDiSessione(doppio, null) as never);
    await expect(DashboardWebPage({ params: Promise.resolve({ locale }) })).rejects.toThrow(/^REDIRECT:.*\/auth\/login/);
    expect(doppio.richieste).toHaveLength(0);
  });

  it('cancello chiuso: 404 prima di aprire una sessione o leggere', async () => {
    vi.stubEnv('FITMESH_WEB_DASHBOARD', '');
    await expect(DashboardWebPage({ params: Promise.resolve({ locale }) })).rejects.toThrow('NOT_FOUND');
    expect(createClient).not.toHaveBeenCalled();
  });

  it('mai misurato / zero misurato / parziale nel markup reale, mai testi dimostrativi', async () => {
    const { html } = await rendi(locale, {
      fitness_metrics: [
        riga('2026-10-14', 8000), riga('2026-10-13', 0), riga('2026-10-12', 0, 'oura_oauth'),
        riga('2026-10-11', 3), riga('2026-10-10', 2, 'a'), riga('2026-10-10', 2, 'b'),
      ],
    });
    expect(html).not.toMatch(/data-slot-state="(measured|measured-zero|partial)"/);
    for (const vietato of ['Dati dimostrativi', 'Demo data', 'Obiettivo di esempio', 'Example goal']) {
      expect(html).not.toContain(vietato);
    }
    expect(html).toContain('<table');
  });

  it('intestazione: le date effettive della finestra, mai «ieri»; testo senza frasi vietate', async () => {
    const { html } = await rendi(locale, { fitness_metrics: [riga('2026-10-14', 6000)] });
    const attesa = tp.finestra('2026-10-08', '2026-10-14')!;
    expect(html).toContain(attesa);
    expect(html).toContain(tp.giorniConclusi);
    expect(html).toContain(tp.completezzaNonVerificata);
    const testo = testoVisibile(html);
    expect(testo).not.toMatch(/\bieri\b|yesterday|fino a ieri|until yesterday/i);
    expect(testo).not.toMatch(/copertura|coverage|%/i);
    expect(testo).not.toMatch(/\bmedia\b|average|\bTotale\b|\bTotal\b/i);
  });

  it('nessuna riga fuori finestra influenza il grafico', async () => {
    const { html } = await rendi(locale, {
      fitness_metrics: [
        riga('2026-10-07', 31337), // il giorno prima del primo
        riga('2026-10-15', 42424), // oggi UTC: non concluso
        riga('2026-10-12', 2500),
      ],
    });
    expect(statiDelGrafico(html).map(([, s]) => s)).toEqual([
      'absent', 'absent', 'absent', 'absent', 'received', 'absent', 'absent',
    ]);
    expect(html).not.toMatch(numero(31337));
    expect(html).not.toMatch(numero(42424));
  });

  it('chiave giorno malformata adiacente: quel giorno non disponibile, mai ricevuto ne\' nessun dato', async () => {
    const { html } = await rendi(locale, {
      fitness_metrics: [riga('2026-10-12 ', 9999), riga('2026-10-14', 3000)],
    });
    const stati = statiDelGrafico(html);
    expect(stati[4]).toEqual(['2026-10-12', 'error']);
    expect(stati[6]).toEqual(['2026-10-14', 'received']);
    expect(html).not.toMatch(numero(9999));
  });
});

describe('pagina reale: la finestra mostrata e\' dentro l\'intervallo letto', () => {
  const ORE = [
    '2026-10-15T11:59:59Z', // un secondo prima di mezzogiorno UTC
    '2026-10-15T12:00:00Z',
    '2026-10-15T00:00:00Z', // mezzanotte
    '2026-10-14T23:59:59Z',
    '2026-03-01T05:00:00Z', // inizio mese
    '2026-02-28T23:59:59Z', // fine mese
    '2027-01-01T03:00:00Z', // inizio anno
    '2026-12-31T23:59:59Z', // fine anno
    '2028-03-01T11:00:00Z', // dopo un 29 febbraio
  ];
  it.each(ORE)('orologio %s', async (iso) => {
    vi.setSystemTime(iso);
    const { html, doppio } = await rendi('it', { fitness_metrics: [] });
    const attese = finestraAttesa(iso);
    expect(statiDelGrafico(html).map(([d]) => d)).toEqual(attese);
    const richieste = doppio.richiesteSu('fitness_metrics');
    expect(richieste.length).toBeGreaterThan(0);
    for (const r of richieste) {
      const gte = r.params.find(([k, v]) => k === 'local_day_key' && v.startsWith('gte.'))![1].slice(4);
      const lte = r.params.find(([k, v]) => k === 'local_day_key' && v.startsWith('lte.'))![1].slice(4);
      expect(attese[0] >= gte).toBe(true);
      expect(attese[6] <= lte).toBe(true);
      // l'ultimo giorno e' strettamente prima del giorno UTC corrente: concluso
      expect(attese[6] < new Date(iso).toISOString().slice(0, 10)).toBe(true);
    }
    const t = testiPassiPer('it')!;
    expect(html).toContain(t.finestra(attese[0], attese[6])!);
  });
});

describe('pagina reale: il payload verso il client e\' minimo', () => {
  /** Espande i componenti della pagina (funzioni senza hook) e si ferma al grafico client. */
  function trovaGrafico(nodo: unknown): Record<string, unknown> | null {
    if (Array.isArray(nodo)) {
      for (const n of nodo) {
        const r = trovaGrafico(n);
        if (r) return r;
      }
      return null;
    }
    if (!isValidElement(nodo)) return null;
    const { type, props } = nodo as ReactElement<Record<string, unknown>>;
    if (type === DailyStepsChart) return props;
    if (typeof type === 'function') return trovaGrafico((type as (p: unknown) => unknown)(props));
    return trovaGrafico(props.children);
  }

  it('solo data, valore, stato ed etichette; nessuna sentinella, colonna fuori whitelist, user_id o id', async () => {
    const doppio = creaDoppioPostgrest({
      tabelle: {
        fitness_metrics: [
          riga('2026-10-14', 8123, FONTE_SENTINELLA),
          riga('2026-10-13', 0, 'strava_oauth'),
          riga('2026-10-12', 5, 'a'),
          riga('2026-10-12', 6, 'b'),
          // zero non determinabile ed errore: anche questi non portano mai un numero al client
          riga('2026-10-11', 0, 'phone'),
          riga('2026-10-10', -1),
        ],
      },
    });
    vi.mocked(createClient).mockResolvedValueOnce(
      clienteDiSessione(doppio, { id: OWNER, email: 'sintetico@example.invalid' }) as never,
    );
    const albero = await DashboardWebPage({ params: Promise.resolve({ locale: 'it' }) });
    const props = trovaGrafico(albero);
    expect(props).not.toBeNull();
    expect(Object.keys(props!).sort()).toEqual(
      ['id', 'isDemo', 'locale', 'period', 'points', 'stateLabels', 'subtitle', 'summaryText', 'title', 'valueLabels'].sort(),
    );
    expect(props!.isDemo).toBe(false);
    const punti = props!.points as Array<Record<string, unknown>>;
    expect(punti).toHaveLength(7);
    for (const p of punti) {
      expect(Object.keys(p).sort()).toEqual(['date', 'state', 'value']);
      expect(['received', 'absent', 'error', 'ambiguous', 'undetermined', 'placeholder']).toContain(p.state);
      expect(p.value === null || typeof p.value === 'number').toBe(true);
      if (p.state !== 'received') expect(p.value).toBeNull();
    }
    expect(punti.map((p) => p.state)).toEqual([
      'absent', 'absent', 'error', 'undetermined', 'ambiguous', 'placeholder', 'received',
    ]);
    const serializzato = JSON.stringify(props);
    for (const vietato of [
      FONTE_SENTINELLA, 'strava_oauth', OWNER, OTHER, NOME_DISPOSITIVO, 'dev-sentinella', 'user_id', 'source',
      'blood_glucose', 'device', String(GLICEMIA), 'sintetico@example.invalid',
    ]) {
      expect(serializzato, vietato).not.toContain(vietato);
    }
  });
});
