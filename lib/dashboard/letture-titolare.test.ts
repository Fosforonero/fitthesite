import { readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  COLONNE_ALLENAMENTI,
  COLONNE_METRICHE,
  ErroreLettura,
  RIGHE_PER_PAGINA,
  leggiAllenamentiDelTitolare,
  leggiMetricheDelTitolare,
  type ClientLetture,
  type FiltroLetture,
} from './letture-titolare';
import { leggiVerdettoDashboard, type AccessoConcesso, type ClientVerdetto } from './verdetto';

const IO = 'dd000000-0000-4000-8000-000000000002';
const ALTRO = 'dd000000-0000-4000-8000-000000000004';

async function accessoDi(uid: string): Promise<AccessoConcesso> {
  const rpc: ClientVerdetto = {
    rpc: () => ({
      abortSignal: () =>
        Promise.resolve({ data: { contractVersion: 1, granted: true, titles: ['founder'], denialReason: null }, error: null }),
    }),
  };
  const v = await leggiVerdettoDashboard(rpc, uid);
  if (v.esito !== 'concesso') throw new Error('fixture rotta: verdetto non concesso');
  return v;
}

type Riga = Record<string, unknown>;

const confronta = (a: unknown, b: unknown): number => {
  const x = a as string | number;
  const y = b as string | number;
  return x === y ? 0 : x < y ? -1 : 1;
};

/**
 * Un finto PostgREST: applica davvero eq, gte, lte, lt, order e range sulla
 * tabella in memoria e registra la select. Con `ignoraFiltroProprietario`
 * simula una lettura che la RLS lascia passare anche per righe altrui.
 */
function finto(tabelle: Record<string, Riga[]>, opzioni: { ignoraFiltroProprietario?: boolean; errore?: string } = {}) {
  const registro: { tabella: string; select: string; filtri: string[] }[] = [];
  const client: ClientLetture = {
    from(tabella) {
      return {
        select(colonne: string) {
          const voce = { tabella, select: colonne, filtri: [] as string[] };
          registro.push(voce);
          let righe = [...(tabelle[tabella] ?? [])];
          const ordini: [string, boolean][] = [];
          const filtro: FiltroLetture = {
            eq(c, v) {
              voce.filtri.push(`eq:${c}`);
              if (!(opzioni.ignoraFiltroProprietario && c === 'user_id')) righe = righe.filter((r) => r[c] === v);
              return filtro;
            },
            gte(c, v) { voce.filtri.push(`gte:${c}`); righe = righe.filter((r) => confronta(r[c], v) >= 0); return filtro; },
            lte(c, v) { voce.filtri.push(`lte:${c}`); righe = righe.filter((r) => confronta(r[c], v) <= 0); return filtro; },
            lt(c, v) { voce.filtri.push(`lt:${c}`); righe = righe.filter((r) => confronta(r[c], v) < 0); return filtro; },
            order(c, { ascending }) { ordini.push([c, ascending]); return filtro; },
            range(da, a) {
              if (opzioni.errore) return Promise.resolve({ data: null, error: { code: opzioni.errore, message: 'dettaglio con valori' } });
              const ordinate = [...righe].sort((x, y) => {
                for (const [c, asc] of ordini) {
                  if (x[c] === y[c]) continue;
                  return confronta(x[c], y[c]) * (asc ? 1 : -1);
                }
                return 0;
              });
              const cols = colonne.split(',');
              const pagina = ordinate.slice(da, a + 1).map((r) => Object.fromEntries(cols.map((k) => [k, r[k]])));
              return Promise.resolve({ data: pagina, error: null });
            },
          };
          return filtro;
        },
      };
    },
  };
  return { client, registro };
}

function metrica(user_id: string, i: number, giorno = '2026-09-20'): Riga {
  return {
    id: i, user_id, local_day_key: giorno, window_start_ms: 1, window_end_ms: 2, source: 'health_connect',
    source_device: 'x', steps: 1000 + i, distance_meters: 1, active_calories_kcal: 1, calories_kcal: 1,
    sleep_minutes: 1, heart_rate_bpm: 60, resting_heart_rate_bpm: 50, received_at: 't',
    blood_glucose_mgdl: 999.9, blood_pressure_systolic: 199,
  };
}

describe('letture del titolare: la query', () => {
  it('filtra sul proprietario e chiede solo le colonne dichiarate, mai *', async () => {
    const { client, registro } = finto({ fitness_metrics: [metrica(IO, 1), metrica(ALTRO, 2)] });
    const { righe } = await leggiMetricheDelTitolare(client, await accessoDi(IO), { daGiorno: '2026-09-01', aGiorno: '2026-09-30' });
    expect(righe).toHaveLength(1);
    expect(registro[0].select).toBe(COLONNE_METRICHE.join(','));
    expect(registro[0].select).not.toContain('*');
    expect(registro[0].filtri).toContain('eq:user_id');
    expect(righe[0]).not.toHaveProperty('user_id');
    expect(righe[0]).not.toHaveProperty('blood_glucose_mgdl');
  });

  it('le righe altrui non arrivano mai: se la lettura ne porta una, si ferma', async () => {
    const { client } = finto({ fitness_metrics: [metrica(IO, 1), metrica(ALTRO, 2)] }, { ignoraFiltroProprietario: true });
    await expect(
      leggiMetricheDelTitolare(client, await accessoDi(IO), { daGiorno: '2026-09-01', aGiorno: '2026-09-30' }),
    ).rejects.toMatchObject({ codice: 'riga_altrui' });
  });

  it('allenamenti: stesso filtro, stesse regole', async () => {
    const allenamenti = [
      { id: 1, user_id: IO, start_ms: 10, end_ms: 20, type: 'run', duration_min: 1, distance_meters: 1, calories_kcal: 1, hr_avg: 1, title: 'T', notes: 'N' },
      { id: 2, user_id: ALTRO, start_ms: 10, end_ms: 20, type: 'run', duration_min: 1, distance_meters: 1, calories_kcal: 1, hr_avg: 1, title: 'T', notes: 'N' },
    ];
    const { client, registro } = finto({ workouts: allenamenti });
    const { righe } = await leggiAllenamentiDelTitolare(client, await accessoDi(IO), { daMs: 0, aMs: 100 });
    expect(righe).toHaveLength(1);
    expect(registro[0].select).toBe(COLONNE_ALLENAMENTI.join(','));
    expect(registro[0].filtri).toContain('eq:user_id');
    expect(righe[0]).not.toHaveProperty('notes');
    const permissivo = finto({ workouts: allenamenti }, { ignoraFiltroProprietario: true });
    await expect(
      leggiAllenamentiDelTitolare(permissivo.client, await accessoDi(IO), { daMs: 0, aMs: 100 }),
    ).rejects.toMatchObject({ codice: 'riga_altrui' });
  });
});

describe('letture del titolare: niente troncamento silenzioso', () => {
  it('oltre max_rows legge tutte le pagine', async () => {
    const tante = Array.from({ length: RIGHE_PER_PAGINA * 2 + 200 }, (_, i) => metrica(IO, i));
    const { client, registro } = finto({ fitness_metrics: tante });
    const { righe, completo } = await leggiMetricheDelTitolare(client, await accessoDi(IO), { daGiorno: '2026-09-01', aGiorno: '2026-09-30' });
    expect(righe).toHaveLength(tante.length);
    expect(completo).toBe(true);
    expect(registro).toHaveLength(3);
  });

  it('al limite delle pagine lo dice: completo = false', async () => {
    const tante = Array.from({ length: RIGHE_PER_PAGINA * 3 }, (_, i) => metrica(IO, i));
    const { client } = finto({ fitness_metrics: tante });
    const { righe, completo } = await leggiMetricheDelTitolare(client, await accessoDi(IO), { daGiorno: '2026-09-01', aGiorno: '2026-09-30' }, 2);
    expect(righe).toHaveLength(RIGHE_PER_PAGINA * 2);
    expect(completo).toBe(false);
  });
});

describe('letture del titolare: senza verdetto, niente', () => {
  it('un oggetto che somiglia a un accesso non basta', async () => {
    const { client, registro } = finto({ fitness_metrics: [metrica(IO, 1)] });
    const falso = { esito: 'concesso', uid: IO, titoli: ['founder'] } as unknown as AccessoConcesso;
    await expect(
      leggiMetricheDelTitolare(client, falso, { daGiorno: '2026-09-01', aGiorno: '2026-09-30' }),
    ).rejects.toMatchObject({ codice: 'accesso_non_concesso' });
    expect(registro).toHaveLength(0);
  });

  it('intervallo scritto male: si rifiuta prima di interrogare', async () => {
    const { client, registro } = finto({ fitness_metrics: [] });
    await expect(
      leggiMetricheDelTitolare(client, await accessoDi(IO), { daGiorno: '20/09/2026', aGiorno: '2026-09-30' }),
    ).rejects.toBeInstanceOf(ErroreLettura);
    expect(registro).toHaveLength(0);
  });

  it('un errore del server esce con il codice, mai con il messaggio', async () => {
    const { client } = finto({ fitness_metrics: [] }, { errore: 'XX000' });
    const errore = await leggiMetricheDelTitolare(client, await accessoDi(IO), { daGiorno: '2026-09-01', aGiorno: '2026-09-30' }).catch((e) => e);
    expect(errore).toMatchObject({ codice: 'errore_server' });
    expect(String(errore.message)).not.toContain('dettaglio con valori');
  });
});

describe('le colonne sono le stesse del test SQL 18', () => {
  const sql = readFileSync(
    path.resolve(__dirname, '../../supabase/tests/reset-pg17/18-test-letture-dashboard-titolare.sql'),
    'utf8',
  );
  const lista = (nome: string) => {
    const m = new RegExp(`${nome} constant text := '([^']+)'`).exec(sql);
    if (!m) throw new Error(`${nome} non trovata nel test SQL`);
    return m[1];
  };
  it('metriche', () => expect(lista('colonne_metriche')).toBe(COLONNE_METRICHE.join(',')));
  it('allenamenti', () => expect(lista('colonne_allenamenti')).toBe(COLONNE_ALLENAMENTI.join(',')));
});
