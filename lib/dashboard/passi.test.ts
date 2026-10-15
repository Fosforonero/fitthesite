/**
 * La qualificazione dei passi per giorno (DASHBOARD-REAL-02, B3a).
 *
 * Regole del primo grafico, verificate qui giorno per giorno:
 *   nessuna riga                      -> nessun_dato (mai zero)
 *   piu righe nello stesso giorno     -> ambiguo (qualunque valore, anche uno zero)
 *   una riga, steps null              -> nessun_dato
 *   una riga, negativo/NaN/testo/...  -> non_disponibile (non corretto, non azzerato)
 *   una riga, steps > 0               -> ricevuto (nessuna copertura, nessun «completo»)
 *   una riga, steps = 0, strava/oura  -> segnaposto (zero PROVATAMENTE letterale nell app)
 *   una riga, steps = 0, altro        -> non_determinabile (zero misurato: mai assegnato)
 *
 * Tutte le date e i valori qui sono FITTIZI.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { finestraSetteGiorni, type FinestraGiorni } from './finestra';
import { qualificaPassi, SORGENTI_CON_ZERO_SEGNAPOSTO, type GiornoPassi } from './passi';

const ADESSO = '2026-10-15T12:00:00.000Z';
const GIORNI = ['2026-10-08', '2026-10-09', '2026-10-10', '2026-10-11', '2026-10-12', '2026-10-13', '2026-10-14'];

let FINESTRA: FinestraGiorni;
beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(Date.parse(ADESSO));
  FINESTRA = finestraSetteGiorni();
});
afterEach(() => {
  vi.useRealTimers();
});

const SENTINELLA = 'SENTINELLA-7731-NON-DEVE-USCIRE';

/** Una riga con la forma del reader (senza user_id) e un valore sensibile nelle colonne fuori dal calcolo. */
function riga(giorno: unknown, steps: unknown, source: unknown = 'health_connect', extra: Record<string, unknown> = {}) {
  return {
    local_day_key: giorno,
    window_start_ms: 1,
    window_end_ms: 2,
    source,
    steps,
    distance_meters: SENTINELLA,
    active_calories_kcal: 10,
    calories_kcal: 20,
    sleep_minutes: 400,
    heart_rate_bpm: 60,
    resting_heart_rate_bpm: 50,
    hrv_rmssd: 40,
    received_at: SENTINELLA,
    ...extra,
  };
}

const primo = GIORNI[0];
const secondo = GIORNI[1];

/** Lo stato del solo `giorno`. */
function statoDi(righe: unknown[], giorno = primo): GiornoPassi {
  const r = qualificaPassi(righe as never, FINESTRA).find((g) => g.giorno === giorno);
  if (!r) throw new Error('giorno assente dal risultato');
  return r;
}

describe('forma del risultato', () => {
  it('sette giorni nell ordine della finestra, tutti nessun_dato su una lettura vuota', () => {
    const r = qualificaPassi([], FINESTRA);
    expect(r.map((g) => g.giorno)).toEqual(GIORNI);
    expect(r.map((g) => g.stato)).toEqual(Array(7).fill('nessun_dato'));
    for (const g of r) expect(g).not.toHaveProperty('passi');
  });

  it('i tipi esposti sono sei stati, nessuno chiamato «misurato» o «zero»', () => {
    const letti = new Set<string>();
    const casi: unknown[][] = [
      [], [riga(primo, 5)], [riga(primo, 0)], [riga(primo, 0, 'strava_oauth')], [riga(primo, -1)],
      [riga(primo, 1), riga(primo, 2)], [riga(primo, null)],
    ];
    for (const c of casi) for (const g of qualificaPassi(c as never, FINESTRA)) letti.add(g.stato);
    expect([...letti].sort()).toEqual(
      ['ambiguo', 'non_determinabile', 'non_disponibile', 'nessun_dato', 'ricevuto', 'segnaposto'].sort(),
    );
  });

  it('il risultato e congelato', () => {
    const r = qualificaPassi([riga(primo, 5)], FINESTRA);
    expect(Object.isFrozen(r)).toBe(true);
    expect(Object.isFrozen(r[0])).toBe(true);
    expect(() => ((r[0] as unknown) as { stato: string }).stato = 'x').toThrow();
  });
});

describe('nessuna riga: nessun dato ricevuto, MAI zero', () => {
  it('righe solo di altri giorni lasciano nessun_dato i giorni scoperti', () => {
    const r = qualificaPassi([riga(secondo, 8000)] as never, FINESTRA);
    expect(r[0]).toEqual({ giorno: primo, stato: 'nessun_dato' });
    expect(r[1]).toEqual({ giorno: secondo, stato: 'ricevuto', passi: 8000 });
    expect(r.filter((g) => g.stato === 'nessun_dato')).toHaveLength(6);
    expect(JSON.stringify(r)).not.toMatch(/"passi":0/);
  });
});

describe('una riga con steps > 0: valore ricevuto, senza copertura', () => {
  it.each([1, 7, 8000, 45_123, 1_000_000])('steps = %i', (n) => {
    expect(statoDi([riga(primo, n)])).toEqual({ giorno: primo, stato: 'ricevuto', passi: n });
  });

  it.each(['health_connect', 'healthkit', 'apple_health', 'colmi_ble', 'suunto_oauth', 'strava_oauth', 'oura_oauth', null, undefined, '', 'altro'])(
    'qualunque sorgente (%s) con un valore positivo: ricevuto, sorgente non nel risultato',
    (src) => {
      const g = statoDi([riga(primo, 4321, src)]);
      expect(g).toEqual({ giorno: primo, stato: 'ricevuto', passi: 4321 });
      expect(Object.keys(g).sort()).toEqual(['giorno', 'passi', 'stato']);
    },
  );

  it('nessun campo di copertura, completezza o «partial»', () => {
    const j = JSON.stringify(statoDi([riga(primo, 100)]));
    expect(j).not.toMatch(/partial|parziale|copert|complet|percent/i);
  });
});

describe('una riga con steps = 0', () => {
  it.each(['strava_oauth', 'oura_oauth'])('%s: segnaposto (zero letterale scritto dall app)', (src) => {
    expect(statoDi([riga(primo, 0, src)])).toEqual({ giorno: primo, stato: 'segnaposto' });
  });

  it.each([
    'health_connect', 'healthkit', 'apple_health', 'colmi_ble', 'suunto_oauth', 'garmin', 'garmin_oauth',
    'withings', 'fitbit', 'manual', 'altro', '', null, undefined, 42, {}, [],
    // testo non identico: non e provato segnaposto, quindi non lo diventa
    'Strava_OAuth', 'STRAVA_OAUTH', ' strava_oauth', 'strava_oauth ', 'strava', 'oura', 'oura_oauth2',
  ])('sorgente %j: non_determinabile, mai zero misurato', (src) => {
    expect(statoDi([riga(primo, 0, src)])).toEqual({ giorno: primo, stato: 'non_determinabile' });
  });

  it('proprieta: nessuna combinazione sorgente x valore produce mai «ricevuto» con 0 passi', () => {
    const sorgenti = ['health_connect', 'strava_oauth', 'oura_oauth', null, 'altro'];
    const valori = [0, -0, 0.0, null, undefined, -1, NaN, '0', false, 1];
    for (const s of sorgenti) {
      for (const v of valori) {
        const g = statoDi([riga(primo, v, s)]);
        if (g.stato === 'ricevuto') expect(g.passi).toBeGreaterThan(0);
      }
    }
  });

  it('la lista dei segnaposto e esattamente strava_oauth e oura_oauth', () => {
    expect([...SORGENTI_CON_ZERO_SEGNAPOSTO].sort()).toEqual(['oura_oauth', 'strava_oauth']);
  });
});

describe('una riga con steps null o assente: nessun dato', () => {
  it.each([
    ['null', riga(primo, null)],
    ['undefined', riga(primo, undefined)],
    ['colonna assente', (() => { const r: Record<string, unknown> = riga(primo, 1); delete r.steps; return r; })()],
    ['null su una sorgente segnaposto', riga(primo, null, 'strava_oauth')],
  ])('%s', (_n, r) => {
    expect(statoDi([r])).toEqual({ giorno: primo, stato: 'nessun_dato' });
  });
});

describe('valore non valido: non disponibile (mai corretto, mai azzerato)', () => {
  it.each<[string, unknown]>([
    ['negativo', -1], ['negativo grande', -8000], ['NaN', NaN], ['+Infinity', Infinity], ['-Infinity', -Infinity],
    ['testo numerico', '8000'], ['testo zero', '0'], ['testo', 'molti'], ['booleano true', true], ['booleano false', false],
    ['oggetto', {}], ['array', []], ['array con un numero', [5]], ['decimale', 1.5], ['decimale piccolo', 0.5],
    ['oltre i interi sicuri', 2 ** 53], ['notazione scientifica enorme', 1e21], ['bigint', BigInt(5)], ['funzione', () => 5],
  ])('%s', (_n, v) => {
    const g = statoDi([riga(primo, v)]);
    expect(g).toEqual({ giorno: primo, stato: 'non_disponibile' });
    expect(g).not.toHaveProperty('passi');
  });

  it('un valore non valido su una sorgente segnaposto resta non disponibile (non diventa segnaposto)', () => {
    expect(statoDi([riga(primo, -5, 'strava_oauth')])).toEqual({ giorno: primo, stato: 'non_disponibile' });
  });
});

describe('piu righe nello stesso giorno: ambiguita dichiarata, nessuna somma, scelta o precedenza', () => {
  it.each<[string, unknown[]]>([
    ['due valori positivi', [riga(primo, 5000), riga(primo, 8000, 'healthkit')]],
    ['stessa sorgente, stessi valori', [riga(primo, 5000), riga(primo, 5000)]],
    ['un valore e uno zero', [riga(primo, 8000), riga(primo, 0)]],
    ['due zeri', [riga(primo, 0), riga(primo, 0, 'colmi_ble')]],
    ['valore e segnaposto Strava', [riga(primo, 8000), riga(primo, 0, 'strava_oauth')]],
    ['due segnaposto', [riga(primo, 0, 'strava_oauth'), riga(primo, 0, 'oura_oauth')]],
    ['valore e null', [riga(primo, 8000), riga(primo, null)]],
    ['valore e non valido', [riga(primo, 8000), riga(primo, -3)]],
    ['due null', [riga(primo, null), riga(primo, undefined)]],
    ['tre righe', [riga(primo, 1), riga(primo, 2), riga(primo, 3)]],
  ])('%s', (_n, righe) => {
    const g = statoDi(righe);
    expect(g).toEqual({ giorno: primo, stato: 'ambiguo' });
    expect(g).not.toHaveProperty('passi');
  });

  it('l ambiguita di un giorno non contamina i vicini', () => {
    const r = qualificaPassi([riga(primo, 5000), riga(primo, 6000), riga(secondo, 7000)] as never, FINESTRA);
    expect(r[0].stato).toBe('ambiguo');
    expect(r[1]).toEqual({ giorno: secondo, stato: 'ricevuto', passi: 7000 });
  });
});

describe('righe fuori finestra e giorno non concluso', () => {
  it('righe di giorni precedenti o successivi alla finestra sono ignorate, anche se numerose', () => {
    const fuori = [
      riga('2026-10-07', 9000), riga('2026-10-07', 1), riga('2026-10-15', 4000), riga('2026-10-16', 5),
      riga('2025-10-08', 77),
    ];
    const r = qualificaPassi([...fuori, riga(primo, 1234)] as never, FINESTRA);
    expect(r[0]).toEqual({ giorno: primo, stato: 'ricevuto', passi: 1234 });
    expect(r.slice(1).map((g) => g.stato)).toEqual(Array(6).fill('nessun_dato'));
  });

  it('il giorno di oggi (non concluso) non compare mai nel risultato, nemmeno se la lettura ha una sua riga', () => {
    const r = qualificaPassi([riga('2026-10-15', 99_999)] as never, FINESTRA);
    expect(r.map((g) => g.giorno)).not.toContain('2026-10-15');
    expect(JSON.stringify(r)).not.toContain('99999');
  });

  it('una finestra che contiene un giorno non concluso viene rifiutata, non valutata', () => {
    const conOggi: FinestraGiorni = {
      primo: '2026-10-09',
      ultimo: '2026-10-15',
      giorni: ['2026-10-09', '2026-10-10', '2026-10-11', '2026-10-12', '2026-10-13', '2026-10-14', '2026-10-15'],
    };
    expect(() => qualificaPassi([riga('2026-10-15', 5)] as never, conOggi)).toThrow(RangeError);
  });

  it('il confine e quello di UTC-12: alle 11:59:59.999 UTC l ultimo giorno della finestra di ieri non e concluso', () => {
    expect(FINESTRA.ultimo).toBe('2026-10-14');
    expect(() => qualificaPassi([] as never, FINESTRA)).not.toThrow();
    vi.setSystemTime(Date.parse('2026-10-15T11:59:59.999Z'));
    expect(() => qualificaPassi([] as never, FINESTRA)).toThrow(RangeError);
    // la finestra calcolata a quell istante e invece valida
    expect(() => qualificaPassi([] as never, finestraSetteGiorni())).not.toThrow();
  });

  it.each([
    ['sei giorni', { primo: GIORNI[0], ultimo: GIORNI[5], giorni: GIORNI.slice(0, 6) }],
    ['non consecutivi', { primo: GIORNI[0], ultimo: GIORNI[6], giorni: [...GIORNI.slice(0, 3), '2026-10-12', ...GIORNI.slice(4)] }],
    ['data impossibile', { primo: '2026-02-24', ultimo: '2026-03-02', giorni: ['2026-02-24', '2026-02-25', '2026-02-26', '2026-02-27', '2026-02-28', '2026-02-29', '2026-03-01'] }],
  ])('una finestra malformata (%s) viene rifiutata', (_n, f) => {
    expect(() => qualificaPassi([] as never, f as never)).toThrow(RangeError);
  });

  it('local_day_key che non e esattamente una data della finestra non attribuisce nulla', () => {
    const strane = [
      // B3e N1: riga(' 2026-10-08', 222) non e' piu' qui: con gli spazi tolti coincide con il primo giorno e lo
      // rende non disponibile (passi.hardening.test.ts). Test cambiato e dichiarato nel commit.
      riga('2026-10-01T00:00:00Z', 111), riga('2026-10-15 ', 333), riga('20261008', 444),
      riga('ieri', 555), riga(null, 666), riga(undefined, 777), riga(20261008, 888), riga('', 999),
    ];
    const r = qualificaPassi(strane as never, FINESTRA);
    expect(r.map((g) => g.stato)).toEqual(Array(7).fill('nessun_dato'));
    expect(JSON.stringify(r)).not.toMatch(/111|333|444|555|666|777|888|999/);
  });

  it('elementi che non sono oggetti vengono ignorati, la lettura non si rompe', () => {
    const r = qualificaPassi([null, undefined, 5, 'x', [], riga(primo, 10)] as never, FINESTRA);
    expect(r[0]).toEqual({ giorno: primo, stato: 'ricevuto', passi: 10 });
  });

  it('righe che non e un array: errore, non «nessun dato»', () => {
    expect(() => qualificaPassi(undefined as never, FINESTRA)).toThrow(TypeError);
    expect(() => qualificaPassi({ righe: [] } as never, FINESTRA)).toThrow(TypeError);
  });
});

describe('indipendenza dall ordine e immutabilita dell input', () => {
  const permutazioni = <T,>(a: T[]): T[][] =>
    a.length <= 1 ? [a] : a.flatMap((x, i) => permutazioni([...a.slice(0, i), ...a.slice(i + 1)]).map((p) => [x, ...p]));

  const INSIEMI: [string, unknown[]][] = [
    ['misto su piu giorni', [riga(primo, 5000), riga(secondo, 0, 'strava_oauth'), riga(secondo, 7000, 'healthkit'), riga(GIORNI[2], 0), riga(GIORNI[3], -2), riga(GIORNI[4], null), riga('2026-10-01', 9)]],
    ['stesso giorno, tre righe', [riga(primo, 1, 'a'), riga(primo, 0, 'strava_oauth'), riga(primo, null, 'b')]],
    ['giorni singoli diversi', [riga(primo, 10), riga(secondo, 20), riga(GIORNI[2], 0, 'oura_oauth'), riga(GIORNI[3], 0, 'x')]],
  ];

  it.each(INSIEMI)('%s: ogni permutazione da lo stesso risultato', (_n, righe) => {
    const base = JSON.stringify(qualificaPassi(righe as never, FINESTRA));
    for (const p of permutazioni(righe)) expect(JSON.stringify(qualificaPassi(p as never, FINESTRA))).toBe(base);
  });

  it('input congelato in profondita: nessuna mutazione, nessuna eccezione, input invariato', () => {
    const righe = [riga(primo, 5000), riga(secondo, 0, 'strava_oauth'), riga(GIORNI[2], 1), riga(GIORNI[2], 2)];
    const profondo = (o: unknown): void => {
      if (o && typeof o === 'object') {
        Object.freeze(o);
        for (const v of Object.values(o)) profondo(v);
      }
    };
    profondo(righe);
    const prima = JSON.stringify(righe);
    const r = qualificaPassi(righe as never, Object.freeze({ ...FINESTRA }) as never);
    expect(JSON.stringify(righe)).toBe(prima);
    expect(r[0]).toEqual({ giorno: primo, stato: 'ricevuto', passi: 5000 });
  });

  it('due chiamate di fila sullo stesso input danno lo stesso risultato (nessuna memoria)', () => {
    const righe = [riga(primo, 5000)];
    expect(qualificaPassi(righe as never, FINESTRA)).toEqual(qualificaPassi(righe as never, FINESTRA));
    expect(qualificaPassi([] as never, FINESTRA)[0].stato).toBe('nessun_dato');
  });
});

describe('nessuna fuga: sentinelle fuori whitelist e campo source', () => {
  it('un valore sensibile in source e nelle colonne non usate non compare nel risultato serializzato', () => {
    const righe = [
      riga(primo, 5000, `${SENTINELLA}-source`),
      riga(secondo, 0, `${SENTINELLA}-source-zero`),
      riga(GIORNI[2], 0, 'strava_oauth'),
      riga(GIORNI[3], 10, 'oura_oauth', { user_id: SENTINELLA, id: SENTINELLA, notes: SENTINELLA, device_id: SENTINELLA }),
      riga(GIORNI[4], 1, 'x'), riga(GIORNI[4], 2, `${SENTINELLA}-due`),
    ];
    const j = JSON.stringify(qualificaPassi(righe as never, FINESTRA));
    expect(j).not.toContain('SENTINELLA');
    expect(j).not.toMatch(/strava|oura|health_connect|healthkit/i);
  });

  it('le chiavi di ogni giorno sono solo giorno, stato e (per ricevuto) passi', () => {
    const casi = [
      [], [riga(primo, 5)], [riga(primo, 0)], [riga(primo, 0, 'strava_oauth')], [riga(primo, -1)], [riga(primo, 1), riga(primo, 2)],
    ];
    for (const c of casi) {
      for (const g of qualificaPassi(c as never, FINESTRA)) {
        const attese = g.stato === 'ricevuto' ? ['giorno', 'passi', 'stato'] : ['giorno', 'stato'];
        expect(Object.keys(g).sort()).toEqual(attese);
      }
    }
  });
});

describe('passi.ts: perimetro del sorgente (analisi statica, controprova inclusa)', () => {
  const senzaCommenti = (src: string) =>
    src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
  const VIETATI: [string, RegExp][] = [
    ['import dall anteprima', new RegExp('from\\s+[\'"][^\'"]*web' + '-dashboard[^\'"]*[\'"]')],
    ['import del kit o dei componenti', /from\s+['"][^'"]*(components|charts)[^'"]*['"]/],
    ['Europe/Rome', /Europe\/Rome/],
    ['Intl', /\bIntl\b/],
    ['timeZone', /timeZone/i],
    ['parametro tz', /\btz\b|\?tz|searchParams/],
    ['fuso locale', /\.(getHours|getDate|getDay|getMonth|getFullYear|getTimezoneOffset|toLocale\w*)\s*\(/],
    ['variabile di modulo', /^(export\s+)?(let|var)\s/m],
    ['Map o Set di modulo', /^(export\s+)?const\s+\w+\s*(:[^=]+)?=\s*new\s+(Map|Set|WeakMap)\b/m],
    ['cache', /unstable_cache|['"]use cache['"]/],
    ['somma o aggregazione', /\.reduce\s*\(|Math\.(max|min)\s*\(/],
  ];
  const trova = (src: string) => VIETATI.filter(([, re]) => re.test(senzaCommenti(src))).map(([n]) => n);
  const SORGENTE = () => readFileSync(path.resolve(__dirname, 'passi.ts'), 'utf8');

  it('controprova: il rilevatore vede cio che deve', () => {
    expect(trova(`import { C } from '@/components/charts/DailyStepsChart';`)).toContain('import del kit o dei componenti');
    expect(trova(`const t = righe.reduce((a, r) => a + r.steps, 0);`)).toContain('somma o aggregazione');
    expect(trova(`const m = Math.max(...v);`)).toContain('somma o aggregazione');
    expect(trova(`let memo = new Map();`)).toContain('variabile di modulo');
    expect(trova(`// reduce( Intl Europe/Rome\nconst a = 1;`)).toEqual([]);
  });

  it('passi.ts non ha nessuno di questi difetti', () => {
    expect(trova(SORGENTE())).toEqual([]);
  });

  it('gli unici import sono la finestra e il TIPO delle righe del reader', () => {
    const imp = [...senzaCommenti(SORGENTE()).matchAll(/^\s*import\s+(type\s+)?[^;]*?from\s+['"]([^'"]+)['"]/gm)].map((m) => `${m[1] ? 'type ' : ''}${m[2]}`);
    expect(imp.sort()).toEqual(['./finestra', 'type ./letture-titolare'].sort());
  });

  it('il tipo del risultato non ha campi di sorgente, copertura o fuso', () => {
    const c = senzaCommenti(SORGENTE());
    const tipo = /export type GiornoPassi[\s\S]*?;\n/.exec(c)?.[0] ?? '';
    expect(tipo.length).toBeGreaterThan(20);
    expect(tipo).not.toMatch(/source|sorgente|fuso|copertura|percent|coverage/i);
  });
});
