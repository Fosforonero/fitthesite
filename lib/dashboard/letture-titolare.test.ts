import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  COLONNE_ALLENAMENTI,
  COLONNE_METRICHE,
  COLONNE_SERIE_DEL_GIORNO,
  ErroreLettura,
  RIGHE_PER_PAGINA,
  leggiAllenamentiDelTitolare,
  leggiMetricheDelTitolare,
  leggiSerieDelGiorno,
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

/**
 * Cio' che NON deve mai stare in una lista di colonne. Ogni voce ha il suo motivo (vedi il commento di
 * testa di letture-titolare.ts): glicemia e pressione per decisione 10; piani per somma senza dedup di
 * origine; sleep_start/end perche' le righe vecchie sono incoerenti con gli stadi; hrv_sdnn e' un'altra
 * metrica; i nomi e gli identificativi di dispositivo possono contenere il nome di una persona; il titolo
 * libero, la FC massima e le note non hanno fonte verificata.
 */
const VIETATE = [
  'blood_glucose_mgdl', 'blood_pressure_systolic', 'blood_pressure_diastolic',
  'floors_climbed', 'sleep_start_ms', 'sleep_end_ms', 'hrv_sdnn', 'intraday_calories', 'exercise_sessions',
  'source_device', 'source_package', 'hr_source_name', 'hr_source_quality', 'device_id',
  'title', 'notes', 'hr_max',
];

describe('whitelist estesa: cosa entra e cosa resta fuori', () => {
  it('nessuna colonna vietata in nessuna delle tre liste', () => {
    for (const lista of [COLONNE_METRICHE, COLONNE_SERIE_DEL_GIORNO, COLONNE_ALLENAMENTI] as readonly (readonly string[])[]) {
      expect(lista.filter((c) => VIETATE.includes(c))).toEqual([]);
    }
  });

  it('entrano solo hrv_rmssd (scalare) e le tre serie, e ogni serie sta SOLO nella lista di un giorno', () => {
    expect(COLONNE_METRICHE).toContain('hrv_rmssd');
    for (const serie of ['intraday_steps', 'intraday_hr', 'sleep_stages']) {
      expect(COLONNE_SERIE_DEL_GIORNO, serie).toContain(serie);
      expect(COLONNE_METRICHE as readonly string[], `${serie} non va nella lettura a intervallo (egress)`).not.toContain(serie);
    }
  });

  it('la lettura a intervallo non porta mai un JSONB, nemmeno se la riga ne ha', async () => {
    const riga = { ...metrica(IO, 1), intraday_steps: [{ hour: 0, steps: 1 }], intraday_hr: [{ ts: 1, bpm: 60 }], sleep_stages: [] };
    const { client, registro } = finto({ fitness_metrics: [riga] });
    const { righe } = await leggiMetricheDelTitolare(client, await accessoDi(IO), { daGiorno: '2026-09-01', aGiorno: '2026-09-30' });
    expect(registro[0].select).not.toMatch(/intraday|sleep_stages/);
    expect(Object.keys(righe[0])).not.toContain('intraday_steps');
  });

  it('un nome di dispositivo con un nome di persona non arriva: source_device non e in whitelist', async () => {
    const riga = { ...metrica(IO, 1), source_device: 'iPhone di Mario Rossi', hr_source_name: 'Mario Rossi' };
    const { client } = finto({ fitness_metrics: [riga] });
    const { righe } = await leggiMetricheDelTitolare(client, await accessoDi(IO), { daGiorno: '2026-09-01', aGiorno: '2026-09-30' });
    expect(JSON.stringify(righe)).not.toContain('Mario');
  });
});

describe('leggiSerieDelGiorno: un giorno, solo il titolare', () => {
  const serie = (uid: string, i: number, giorno = '2026-09-23'): Riga => ({
    id: i, user_id: uid, local_day_key: giorno, source: 'health_connect', steps: 5000,
    intraday_steps: [{ hour: 8, steps: 100 }], intraday_hr: [{ ts: 1_790_000_000_000, bpm: 61 }], sleep_stages: [],
    source_device: 'iPhone di Mario Rossi', floors_climbed: 9, sleep_start_ms: 1, blood_glucose_mgdl: 999.9,
  });

  it('filtra sul proprietario E sul giorno, chiede la lista dedicata e mai *', async () => {
    const { client, registro } = finto({ fitness_metrics: [serie(IO, 1), serie(IO, 2, '2026-09-22'), serie(ALTRO, 3)] });
    const { righe, completo } = await leggiSerieDelGiorno(client, await accessoDi(IO), '2026-09-23');
    expect(righe).toHaveLength(1);
    expect(completo).toBe(true);
    expect(registro[0].tabella).toBe('fitness_metrics');
    expect(registro[0].select).toBe(COLONNE_SERIE_DEL_GIORNO.join(','));
    expect(registro[0].select).not.toContain('*');
    expect(registro[0].filtri).toEqual(expect.arrayContaining(['eq:user_id', 'eq:local_day_key']));
  });

  it('le colonne fuori whitelist non escono, anche se la riga le ha', async () => {
    const { client } = finto({ fitness_metrics: [serie(IO, 1)] });
    const { righe } = await leggiSerieDelGiorno(client, await accessoDi(IO), '2026-09-23');
    const testo = JSON.stringify(righe);
    for (const vietata of ['source_device', 'floors_climbed', 'sleep_start_ms', 'blood_glucose_mgdl', 'Mario']) {
      expect(testo, vietata).not.toContain(vietata);
    }
    expect(righe[0]).not.toHaveProperty('user_id');
  });

  it('una riga di un altro proprietario ferma la lettura, non viene scartata in silenzio', async () => {
    const { client } = finto({ fitness_metrics: [serie(IO, 1), serie(ALTRO, 2)] }, { ignoraFiltroProprietario: true });
    await expect(leggiSerieDelGiorno(client, await accessoDi(IO), '2026-09-23')).rejects.toMatchObject({ codice: 'riga_altrui' });
  });

  it('senza verdetto o con un giorno scritto male: niente query', async () => {
    const { client, registro } = finto({ fitness_metrics: [serie(IO, 1)] });
    const falso = { esito: 'concesso', uid: IO, titoli: ['founder'] } as unknown as AccessoConcesso;
    await expect(leggiSerieDelGiorno(client, falso, '2026-09-23')).rejects.toMatchObject({ codice: 'accesso_non_concesso' });
    await expect(leggiSerieDelGiorno(client, await accessoDi(IO), '23/09/2026')).rejects.toMatchObject({ codice: 'intervallo_non_valido' });
    await expect(leggiSerieDelGiorno(client, await accessoDi(IO), "2026-09-23' or '1'='1")).rejects.toBeInstanceOf(ErroreLettura);
    expect(registro).toHaveLength(0);
  });

  it('un errore del server esce con il codice, mai con i valori', async () => {
    const { client } = finto({ fitness_metrics: [] }, { errore: 'XX000' });
    const errore = await leggiSerieDelGiorno(client, await accessoDi(IO), '2026-09-23').catch((e) => e);
    expect(errore).toMatchObject({ codice: 'errore_server' });
    expect(String(errore.message)).not.toContain('dettaglio con valori');
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
  it('serie di un giorno', () => expect(lista('colonne_serie')).toBe(COLONNE_SERIE_DEL_GIORNO.join(',')));
  it('le colonne vietate del test SQL includono quelle vietate qui', () => {
    const vietate = /vietate constant text\[\] := array\[([^\]]+)\]/.exec(sql)?.[1] ?? '';
    const sqlVietate = [...vietate.matchAll(/'([a-z_]+)'/g)].map((m) => m[1]);
    expect(VIETATE.filter((c) => !sqlVietate.includes(c))).toEqual([]);
  });
  it('allenamenti', () => expect(lista('colonne_allenamenti')).toBe(COLONNE_ALLENAMENTI.join(',')));
  it('il test SQL legge la lista delle serie come la legge il codice: proprietario E un giorno', () => {
    const riga = /array\['fitness_metrics',\s*colonne_serie,\s*'([^\]]*)'\]/.exec(sql);
    if (!riga) throw new Error('la riga delle serie nel test SQL non porta un filtro sul giorno');
    expect(riga[1]).toMatch(/local_day_key\s*=/);
    expect(riga[1]).not.toMatch(/>|<|between/i);
    // e il filtro della tabella entra davvero nella query eseguita
    expect(sql).toMatch(/tabelle\[i\]\[3\]/);
  });
});

/**
 * Whitelist congelata. Gli elenchi qui sotto sono scritti a mano APPOSTA: non si importano da
 * letture-titolare.ts, cosi' una colonna aggiunta alla lista (e magari anche al test SQL 18) fa cadere
 * questo test. OGNI AGGIUNTA richiede prima una fonte verificata sul percorso di scrittura, registrata in
 * .claude/stato-lavoro/dashboard-mesh/RICERCA-FATTI-WHITELIST-29set.json (regola di Matteo del 29/09),
 * e solo dopo si aggiorna l'elenco qui.
 */
const METRICHE_APPROVATE = [
  'user_id', 'local_day_key', 'window_start_ms', 'window_end_ms', 'source', 'steps', 'distance_meters',
  'active_calories_kcal', 'calories_kcal', 'sleep_minutes', 'heart_rate_bpm', 'resting_heart_rate_bpm',
  'hrv_rmssd', 'received_at',
];
const SERIE_APPROVATE = ['user_id', 'local_day_key', 'source', 'steps', 'intraday_steps', 'intraday_hr', 'sleep_stages'];
const ALLENAMENTI_APPROVATI = [
  'user_id', 'id', 'start_ms', 'end_ms', 'type', 'duration_min', 'distance_meters', 'calories_kcal', 'hr_avg',
];

/**
 * Colonne che la sync scrive ma che la dashboard non legge, oltre a VIETATE: nessuna fonte verificata
 * (diverse sono dati sanitari) o metadati di trasporto. Una colonna nuova nella sync deve finire qui o,
 * con una fonte, nella whitelist: finche' non e' classificata il test cade.
 */
const ESCLUSE_SENZA_FONTE = [
  'schema_version', 'collected_at_ms', 'spo2_percent', 'stress_avg', 'vo2_max', 'elevation_gained_meters',
  'skin_temperature_c', 'weight_kg', 'height_cm', 'bmi', 'water_ml', 'respiratory_rate_bpm',
  'nutrition_kcal_in', 'sleep_apnea_detected',
  // allenamenti
  'hr_min', 'pace_sec_per_km',
];

describe('whitelist congelata: una colonna nuova deve essere classificata', () => {
  it('le tre liste sono esattamente quelle approvate, nello stesso ordine', () => {
    expect([...COLONNE_METRICHE]).toEqual(METRICHE_APPROVATE);
    expect([...COLONNE_SERIE_DEL_GIORNO]).toEqual(SERIE_APPROVATE);
    expect([...COLONNE_ALLENAMENTI]).toEqual(ALLENAMENTI_APPROVATI);
  });

  it('ogni chiave che la sync scrive in fitness_metrics e in whitelist oppure esclusa', async () => {
    const { buildFitnessMetricsRow } = await import('@/app/api/v1/sync/schema');
    // Un payload minimo: interessano i NOMI delle chiavi, non i valori.
    const riga = buildFitnessMetricsRow(
      { schemaVersion: 1, windowStartMillis: 0, windowEndMillis: 1, collectedAtMillis: 1 } as never,
      { userId: 'u', deviceId: 'd' },
    );
    const classificate = new Set([...METRICHE_APPROVATE, ...SERIE_APPROVATE, ...VIETATE, ...ESCLUSE_SENZA_FONTE]);
    expect(Object.keys(riga).filter((k) => !classificate.has(k))).toEqual([]);
    // e nessuna esclusa e' finita in whitelist
    const inLettura = new Set<string>([...COLONNE_METRICHE, ...COLONNE_SERIE_DEL_GIORNO]);
    expect(ESCLUSE_SENZA_FONTE.filter((c) => inLettura.has(c))).toEqual([]);
  });

  it('ogni chiave che la sync scrive in workouts e in whitelist oppure esclusa', () => {
    const route = readFileSync(path.resolve(__dirname, '../../app/api/v1/sync/route.ts'), 'utf8');
    const blocco = /upsert_workouts_v189",\s*\{\s*p_row:\s*\{([\s\S]*?)\n\s*\},\s*\n\s*\}\)/.exec(route)?.[1];
    if (!blocco) throw new Error('p_row di upsert_workouts_v189 non trovato in route.ts');
    const chiavi = [...blocco.matchAll(/^\s*([a-z_]+):/gm)].map((m) => m[1]);
    expect(chiavi.length).toBeGreaterThan(5);
    const classificate = new Set([...ALLENAMENTI_APPROVATI, ...VIETATE, ...ESCLUSE_SENZA_FONTE]);
    expect(chiavi.filter((k) => !classificate.has(k))).toEqual([]);
    expect(ESCLUSE_SENZA_FONTE.filter((c) => (COLONNE_ALLENAMENTI as readonly string[]).includes(c))).toEqual([]);
  });
});

/**
 * «I JSONB si leggono un giorno per volta» non vale solo dentro leggiSerieDelGiorno: vale per tutto il
 * sorgente. Una funzione nuova che usa COLONNE_SERIE_DEL_GIORNO con gte/lte, o un select scritto a mano
 * con 'intraday_hr', fa cadere questo test.
 */
describe('i tre JSONB si leggono solo in letture-titolare.ts e solo per un giorno', () => {
  const RADICE = path.resolve(__dirname, '../..');
  const SERIE = ['intraday_steps', 'intraday_hr', 'sleep_stages'];
  const QUI = 'lib/dashboard/letture-titolare.ts';
  /** File dove un nome coincide per caso, con il motivo. Lista chiusa. */
  const OMONIMI: Record<string, string> = {
    'lib/providers/models.ts': "'sleep_stages' e' un tipo di dato dei provider, non una colonna letta",
    'app/api/v1/migrate/route.ts': 'chiavi del payload in ingresso della migrazione (scrittura con insert), non una lettura',
  };

  function sorgenti(dir: string, out: string[] = []): string[] {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      if (e.name === 'node_modules' || e.name.startsWith('.')) continue;
      const pieno = path.join(dir, e.name);
      if (e.isDirectory()) sorgenti(pieno, out);
      else if (/\.(ts|tsx|js|mjs|cjs)$/.test(e.name) && !/\.test\.(ts|tsx)$/.test(e.name)) out.push(pieno);
    }
    return out;
  }
  const senzaCommenti = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/.*$/gm, '$1');
  const file = ['app', 'lib', 'components'].flatMap((d) => sorgenti(path.join(RADICE, d)))
    .map((f) => path.relative(RADICE, f).split(path.sep).join('/'));
  const testo = (f: string) => senzaCommenti(readFileSync(path.join(RADICE, f), 'utf8'));
  const letterale = new RegExp(`['"\`][^'"\`\\n]*\\b(${SERIE.join('|')})\\b[^'"\`\\n]*['"\`]`);

  it('la scansione vede i sorgenti (controprova)', () => {
    expect(file).toContain(QUI);
    expect(file).toContain('app/api/v1/sync/route.ts');
    expect(file.some((f) => f.endsWith('.test.ts'))).toBe(false);
  });

  it('COLONNE_SERIE_DEL_GIORNO compare solo in letture-titolare.ts', () => {
    expect(file.filter((f) => f !== QUI && /\bCOLONNE_SERIE_DEL_GIORNO\b/.test(testo(f)))).toEqual([]);
  });

  it('i tre nomi come stringa compaiono solo in letture-titolare.ts (e negli omonimi dichiarati)', () => {
    const fuori = file.filter((f) => f !== QUI && !(f in OMONIMI) && letterale.test(testo(f)));
    expect(fuori).toEqual([]);
    // la controprova: il rilevatore riconosce un select scritto a mano
    expect(letterale.test(".select('user_id,intraday_hr')")).toBe(true);
    expect(letterale.test('row.intraday_hr')).toBe(false);
  });

  it('dentro letture-titolare.ts: i nomi stanno solo nella lista, e ogni lettura della lista e su un giorno', () => {
    const s = testo(QUI);
    const lista = /export const COLONNE_SERIE_DEL_GIORNO = \[([\s\S]*?)\] as const;/.exec(s);
    if (!lista) throw new Error('COLONNE_SERIE_DEL_GIORNO non trovata');
    expect(letterale.test(s.replace(lista[0], ''))).toBe(false);
    const catene = [...s.matchAll(/\.from\([^)]*\)([\s\S]*?)\.range\(/g)].map((m) => m[0]);
    const conSerie = catene.filter((c) => /COLONNE_SERIE_DEL_GIORNO/.test(c));
    expect(conSerie).toHaveLength(1);
    for (const c of conSerie) {
      expect(c).toMatch(/\.eq\(\s*'local_day_key'/);
      expect(c).not.toMatch(/\.(gte|lte|lt|gt|in|or|filter|match)\(/);
    }
    // nessun uso della lista fuori da una catena from...range (per esempio passata a un'altra funzione);
    // il tipo della riga (`typeof COLONNE_SERIE_DEL_GIORNO`) non legge niente e non si conta
    const usi = (s.match(/(?<!typeof )\bCOLONNE_SERIE_DEL_GIORNO\b/g) ?? []).length;
    expect(usi).toBe(1 + conSerie.length);
  });
});
