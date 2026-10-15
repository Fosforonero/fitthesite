/**
 * La finestra dei sette giorni CONCLUSI della dashboard (DASHBOARD-REAL-02, B3a).
 *
 * Regola: il giorno D e' concluso in ogni fuso se D < data di `now` in UTC-12.
 * ultimo = data(now - 12 h, in UTC) - 1 giorno; primo = ultimo - 6.
 * `local_day_key` resta l'etichetta: nessuna conversione, nessun ?tz, nessun Europe/Rome.
 *
 * L'orologio e' quello di sistema (vi.setSystemTime): la funzione non ha un parametro `now`.
 * L'oracolo dei test NON usa Date per calcolare le date: numero di giorni dall'epoca e
 * algoritmo civile (Hinnant), indipendente dall'implementazione.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';

import { afterEach, describe, expect, it, vi } from 'vitest';

import { eFinestraConclusaValida, finestraSetteGiorni, GIORNI_FINESTRA } from './finestra';

const GIORNO_MS = 86_400_000;
const ORA_MS = 3_600_000;

const due = (n: number) => String(n).padStart(2, '0');

/** Giorni dall'epoca -> AAAA-MM-GG, senza Date (algoritmo civil_from_days di Hinnant). */
function civileDaGiorni(zIn: number): string {
  const z = zIn + 719468;
  const era = Math.floor(z / 146097);
  const doe = z - era * 146097;
  const yoe = Math.floor((doe - Math.floor(doe / 1460) + Math.floor(doe / 36524) - Math.floor(doe / 146096)) / 365);
  const doy = doe - (365 * yoe + Math.floor(yoe / 4) - Math.floor(yoe / 100));
  const mp = Math.floor((5 * doy + 2) / 153);
  const d = doy - Math.floor((153 * mp + 2) / 5) + 1;
  const m = mp < 10 ? mp + 3 : mp - 9;
  const y = yoe + era * 400 + (m <= 2 ? 1 : 0);
  return `${y}-${due(m)}-${due(d)}`;
}

/** L'oracolo: sette date concluse rispetto a UTC-12 per l'istante `ms`. */
function attesa(ms: number): string[] {
  const giornoInUtcMeno12 = Math.floor((ms - 12 * ORA_MS) / GIORNO_MS);
  const ultimo = giornoInUtcMeno12 - 1;
  return Array.from({ length: 7 }, (_, i) => civileDaGiorni(ultimo - 6 + i));
}

const alle = (iso: string) => {
  vi.setSystemTime(new Date(iso));
  return finestraSetteGiorni();
};

afterEach(() => {
  vi.useRealTimers();
});

describe('finestraSetteGiorni: confini fissi (valori scritti a mano)', () => {
  it('prima delle 12:00 UTC l ultimo giorno conta ancora un giorno di piu: ultimo = D(UTC-12) - 1', () => {
    vi.useFakeTimers();
    const f = alle('2026-10-15T11:59:59.999Z');
    // now - 12 h = 2026-10-14T23:59:59.999Z -> D = 14 ottobre -> ultimo = 13 ottobre
    expect(f.ultimo).toBe('2026-10-13');
    expect(f.primo).toBe('2026-10-07');
  });

  it('dalle 12:00 UTC l ultimo giorno e ieri (UTC)', () => {
    vi.useFakeTimers();
    const f = alle('2026-10-15T12:00:00.000Z');
    expect(f.ultimo).toBe('2026-10-14');
    expect(f.primo).toBe('2026-10-08');
    expect(f.giorni).toEqual([
      '2026-10-08', '2026-10-09', '2026-10-10', '2026-10-11', '2026-10-12', '2026-10-13', '2026-10-14',
    ]);
  });

  it('confine di mese: 1 marzo 2026', () => {
    vi.useFakeTimers();
    const f = alle('2026-03-01T12:00:00.000Z');
    expect(f.ultimo).toBe('2026-02-28');
    expect(f.primo).toBe('2026-02-22');
    expect(alle('2026-03-01T11:59:59.999Z').ultimo).toBe('2026-02-27');
  });

  it('confine di anno: la finestra attraversa il 31 dicembre', () => {
    vi.useFakeTimers();
    const a = alle('2027-01-02T12:00:00.000Z');
    expect(a.ultimo).toBe('2027-01-01');
    expect(a.primo).toBe('2026-12-26');
    expect(a.giorni).toContain('2026-12-31');
    const b = alle('2027-01-01T12:00:00.000Z');
    expect(b.ultimo).toBe('2026-12-31');
    expect(b.primo).toBe('2026-12-25');
    const c = alle('2027-01-01T11:59:59.999Z');
    expect(c.ultimo).toBe('2026-12-30');
    expect(c.primo).toBe('2026-12-24');
  });

  it('anno bisestile: il 29 febbraio 2028 esiste, il 29 febbraio 2027 no', () => {
    vi.useFakeTimers();
    const a = alle('2028-03-01T12:00:00.000Z');
    expect(a.ultimo).toBe('2028-02-29');
    expect(a.primo).toBe('2028-02-23');
    expect(a.giorni).toEqual([
      '2028-02-23', '2028-02-24', '2028-02-25', '2028-02-26', '2028-02-27', '2028-02-28', '2028-02-29',
    ]);
    expect(alle('2028-03-01T11:59:59.999Z').ultimo).toBe('2028-02-28');
    const b = alle('2027-03-01T12:00:00.000Z');
    expect(b.ultimo).toBe('2027-02-28');
    expect(b.giorni).not.toContain('2027-02-29');
    expect(alle('2027-03-05T12:00:00.000Z').giorni).toEqual([
      '2027-02-26', '2027-02-27', '2027-02-28', '2027-03-01', '2027-03-02', '2027-03-03', '2027-03-04',
    ]);
  });
});

describe('finestraSetteGiorni: forma del risultato', () => {
  it('sette date YYYY-MM-DD crescenti e consecutive, primo e ultimo coerenti, congelata', () => {
    vi.useFakeTimers();
    const f = alle('2026-10-15T12:00:00.000Z');
    expect(GIORNI_FINESTRA).toBe(7);
    expect(f.giorni).toHaveLength(7);
    expect(f.giorni[0]).toBe(f.primo);
    expect(f.giorni[6]).toBe(f.ultimo);
    for (const g of f.giorni) expect(g).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(Object.isFrozen(f)).toBe(true);
    expect(Object.isFrozen(f.giorni)).toBe(true);
    expect(() => (f.giorni as string[]).push('2026-10-16')).toThrow();
  });

  it('nessuna memoria fra chiamate: due istanti diversi danno due finestre diverse', () => {
    vi.useFakeTimers();
    const a = alle('2026-10-15T12:00:00.000Z');
    const b = alle('2026-10-16T12:00:00.000Z');
    expect(a.ultimo).toBe('2026-10-14');
    expect(b.ultimo).toBe('2026-10-15');
    expect(a).not.toBe(b);
    // tornando indietro nel tempo la finestra torna quella di prima
    expect(alle('2026-10-15T12:00:00.000Z').giorni).toEqual(a.giorni);
  });
});

describe('finestraSetteGiorni: esaustiva sulle 24 ore, tre anni di giorni, contro l oracolo', () => {
  it('ogni ora, a :00:00.000 e a :59:59.999, dal 2026-01-01 al 2029-01-01', () => {
    vi.useFakeTimers();
    const inizio = Date.UTC(2026, 0, 1);
    const fine = Date.UTC(2029, 0, 1);
    let controllati = 0;
    for (let giorno = inizio; giorno < fine; giorno += GIORNO_MS) {
      for (let h = 0; h < 24; h++) {
        for (const extra of [0, ORA_MS - 1]) {
          const ms = giorno + h * ORA_MS + extra;
          vi.setSystemTime(ms);
          const f = finestraSetteGiorni();
          const att = attesa(ms);
          if (f.giorni.join() !== att.join()) {
            throw new Error(`a ${new Date(ms).toISOString()}: ${f.giorni.join()} != ${att.join()}`);
          }
          controllati++;
        }
      }
    }
    expect(controllati).toBe(1096 * 48);
  });
});

describe('finestraSetteGiorni: sempre dentro la lettura di 30 giorni della pagina', () => {
  /**
   * La lettura della pagina (page.tsx): daGiorno = data UTC di (now - 29 * 86_400_000),
   * aGiorno = data UTC di now. Qui la stessa formula, e un test statico sotto fa cadere
   * questa prova se la pagina la cambia.
   */
  const lettura = (ms: number) => ({
    da: new Date(ms - 29 * GIORNO_MS).toISOString().slice(0, 10),
    a: new Date(ms).toISOString().slice(0, 10),
  });

  it('primo >= daGiorno e ultimo <= aGiorno per ogni ora, offset fino a 3 anni, anche ai bordi', () => {
    vi.useFakeTimers();
    const inizio = Date.UTC(2026, 0, 1);
    const fine = Date.UTC(2029, 0, 1);
    for (let giorno = inizio; giorno < fine; giorno += GIORNO_MS) {
      for (let h = 0; h < 24; h++) {
        for (const extra of [0, ORA_MS - 1]) {
          const ms = giorno + h * ORA_MS + extra;
          vi.setSystemTime(ms);
          const f = finestraSetteGiorni();
          const { da, a } = lettura(ms);
          if (!(f.primo >= da && f.ultimo <= a)) {
            throw new Error(`a ${new Date(ms).toISOString()}: finestra ${f.primo}..${f.ultimo} fuori da ${da}..${a}`);
          }
        }
      }
    }
  });

  it('la pagina calcola ancora la lettura come la prova assume (se cambia, questa prova va riscritta)', () => {
    const sorgente = readFileSync(
      path.resolve(__dirname, '../../app/(frontend)/[locale]/app/dashboard/page.tsx'),
      'utf8',
    );
    expect(sorgente).toMatch(/const GIORNI_RIEPILOGO = 30;/);
    expect(sorgente).toMatch(/new Date\(oggi\.getTime\(\) - \(GIORNI_RIEPILOGO - 1\) \* 86_400_000\)/);
    expect(sorgente).toMatch(/d\.toISOString\(\)\.slice\(0, 10\)/);
    expect(sorgente).toMatch(/daGiorno: giornoLocale\(inizio\), aGiorno: giornoLocale\(oggi\)/);
  });
});

describe('finestraSetteGiorni: indipendente dal fuso del processo e dal cambio d ora', () => {
  const TZ_ORIGINALE = process.env.TZ;
  afterEach(() => {
    if (TZ_ORIGINALE === undefined) delete process.env.TZ;
    else process.env.TZ = TZ_ORIGINALE;
  });

  // Passaggi all ora legale/solare: Europa 29/03 e 25/10/2026, USA 08/03 e 01/11/2026, e Kiritimati (UTC+14).
  const ISTANTI = [
    '2026-03-29T00:30:00.000Z', '2026-03-29T01:00:00.000Z', '2026-03-29T12:00:00.000Z',
    '2026-10-25T00:30:00.000Z', '2026-10-25T01:00:00.000Z', '2026-10-25T12:00:00.000Z',
    '2026-03-08T07:00:00.000Z', '2026-03-08T12:00:00.000Z', '2026-11-01T06:00:00.000Z', '2026-11-01T12:00:00.000Z',
    '2026-12-31T23:59:59.999Z', '2027-01-01T00:00:00.000Z',
  ];
  const FUSI = ['UTC', 'Europe/Rome', 'America/Los_Angeles', 'Pacific/Kiritimati', 'Pacific/Pago_Pago', 'Asia/Kolkata'];

  it.each(FUSI)('fuso del processo %s: stessa finestra dell oracolo', (tz) => {
    vi.useFakeTimers();
    process.env.TZ = tz;
    for (const iso of ISTANTI) {
      const ms = Date.parse(iso);
      vi.setSystemTime(ms);
      expect(finestraSetteGiorni().giorni, `${tz} ${iso}`).toEqual(attesa(ms));
    }
  });
});

describe('eFinestraConclusaValida', () => {
  const buona = ['2026-10-08', '2026-10-09', '2026-10-10', '2026-10-11', '2026-10-12', '2026-10-13', '2026-10-14'];
  const ok = (giorni: string[]) => ({ primo: giorni[0], ultimo: giorni[giorni.length - 1], giorni });

  it('accetta la finestra di oggi e una piu vecchia, rifiuta il resto', () => {
    vi.useFakeTimers();
    vi.setSystemTime(Date.parse('2026-10-15T12:00:00.000Z'));
    expect(eFinestraConclusaValida(finestraSetteGiorni())).toBe(true);
    expect(eFinestraConclusaValida(ok(buona))).toBe(true);
    // una finestra vecchia resta valida: un giorno concluso non torna aperto
    expect(eFinestraConclusaValida(ok(buona.map((g) => g.replace('2026-10', '2026-09'))))).toBe(true);
  });

  it('rifiuta un giorno non concluso rispetto a UTC-12 (data di now in UTC-12 e oltre)', () => {
    vi.useFakeTimers();
    // 11:59 UTC del 15: in UTC-12 e ancora il 14 -> il 14 NON e concluso
    vi.setSystemTime(Date.parse('2026-10-15T11:59:59.999Z'));
    expect(eFinestraConclusaValida(ok(buona))).toBe(false);
    vi.setSystemTime(Date.parse('2026-10-15T12:00:00.000Z'));
    expect(eFinestraConclusaValida(ok(buona))).toBe(true);
    const avanti = ['2026-10-09', '2026-10-10', '2026-10-11', '2026-10-12', '2026-10-13', '2026-10-14', '2026-10-15'];
    expect(eFinestraConclusaValida(ok(avanti))).toBe(false);
  });

  it.each([
    ['null', null],
    ['stringa', '2026-10-14'],
    ['array', []],
    ['senza giorni', { primo: 'a', ultimo: 'b' }],
    ['sei giorni', ok(buona.slice(0, 6))],
    ['otto giorni', ok([...buona, '2026-10-15'])],
    ['non consecutivi', ok([...buona.slice(0, 3), '2026-10-12', ...buona.slice(4)])],
    ['ordine invertito', ok([...buona].reverse())],
    ['data impossibile', ok(['2026-02-24', '2026-02-25', '2026-02-26', '2026-02-27', '2026-02-28', '2026-02-29', '2026-03-01'])],
    ['formato errato', ok(buona.map((g) => g.replace(/-/g, '/')))],
    ['primo non coincide', { ...ok(buona), primo: '2026-10-07' }],
    ['ultimo non coincide', { ...ok(buona), ultimo: '2026-10-15' }],
    ['elemento non stringa', { primo: buona[0], ultimo: buona[6], giorni: [...buona.slice(0, 6), 20261014] }],
  ])('rifiuta: %s', (_nome, valore) => {
    vi.useFakeTimers();
    vi.setSystemTime(Date.parse('2026-10-20T12:00:00.000Z'));
    expect(eFinestraConclusaValida(valore)).toBe(false);
  });
});

describe('finestra.ts: perimetro del sorgente (analisi statica, controprova inclusa)', () => {
  const senzaCommenti = (src: string) =>
    src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
  const VIETATI: [string, RegExp][] = [
    // il testo del nome e' spezzato: un guardrail del repository vieta la parola intera in lib/dashboard
    ['import dall anteprima', new RegExp('from\\s+[\'"][^\'"]*web' + '-dashboard[^\'"]*[\'"]')],
    ['import dai componenti', /from\s+['"][^'"]*components\/[^'"]*['"]/],
    ['Europe/Rome', /Europe\/Rome/],
    ['Intl', /\bIntl\b/],
    ['timeZone', /timeZone/i],
    ['parametro tz', /\btz\b|\?tz|searchParams/],
    ['getter in fuso locale', /\.(getHours|getDate|getDay|getMonth|getFullYear|getTimezoneOffset|toLocale\w*|toDateString|toString)\s*\(/],
    ['setter in fuso locale', /\.(setHours|setDate|setMonth|setFullYear)\s*\(/],
    ['variabile di modulo', /^(export\s+)?(let|var)\s/m],
    ['Map o Set di modulo', /^(export\s+)?const\s+\w+\s*(:[^=]+)?=\s*new\s+(Map|Set|WeakMap)\b/m],
    ['cache', /unstable_cache|['"]use cache['"]/],
  ];
  const trova = (src: string) => VIETATI.filter(([, re]) => re.test(senzaCommenti(src))).map(([n]) => n);

  it('controprova: il rilevatore vede cio che deve', () => {
    expect(trova(`import { x } from '@/lib/web` + `-dashboard/format';`)).toContain('import dall anteprima');
    expect(trova(`const f = new Intl.DateTimeFormat('it', { timeZone: 'Europe/Rome' });`)).toEqual(
      expect.arrayContaining(['Intl', 'timeZone', 'Europe/Rome']),
    );
    expect(trova(`const d = new Date(); d.getHours();`)).toContain('getter in fuso locale');
    expect(trova(`let ultimo = null;`)).toContain('variabile di modulo');
    expect(trova(`// Europe/Rome, Intl, getHours()\nconst a = 1;`)).toEqual([]);
  });

  it('finestra.ts non ha nessuno di questi difetti', () => {
    const sorgente = readFileSync(path.resolve(__dirname, 'finestra.ts'), 'utf8');
    expect(trova(sorgente)).toEqual([]);
  });

  it('finestra.ts non ha parametri `now` e non importa altro che nulla', () => {
    const c = senzaCommenti(readFileSync(path.resolve(__dirname, 'finestra.ts'), 'utf8'));
    expect(c).not.toMatch(/\bnow\s*[:?]/);
    expect(c).not.toMatch(/^\s*import\s/m);
  });
});
