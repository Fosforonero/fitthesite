import { describe, expect, it } from 'vitest';

import { LINGUE_DASHBOARD, TESTI_DASHBOARD, TESTI_PASSI, testiPassiPer } from './testi';

const CONTI = { ricevuti: 1, ambigui: 2, nonDeterminabili: 1, segnaposto: 2, assenti: 1, nonDisponibili: 2 };

function tuttiITesti(l: 'it' | 'en'): string[] {
  const t = TESTI_PASSI[l];
  return [
    t.titolo,
    t.finestra('2026-03-05', '2026-03-11')!,
    t.finestra('2026-12-29', '2027-01-04')!,
    t.giorniConclusi,
    t.completezzaNonVerificata,
    ...Object.values(t.etichette),
    ...Object.values(t.valori),
    ...Object.values(t.spiegazioni),
    t.graficoNonDisponibile,
    t.nessunDatoRicevuto,
    t.letturaNonVerificata,
    t.graficoNonMostrato,
    t.passi(1), t.passi(2), t.passi(12345),
    t.giorni(1), t.giorni(7),
    t.riepilogo(CONTI),
    t.riepilogo({ ...CONTI, ricevuti: 3, nonDisponibili: 1 }),
  ];
}

describe('testi del grafico passi', () => {
  it('it e en hanno le stesse chiavi, ad ogni livello', () => {
    const [a, b] = LINGUE_DASHBOARD.map((l) => TESTI_PASSI[l]);
    expect(Object.keys(b).sort()).toEqual(Object.keys(a).sort());
    for (const k of ['etichette', 'valori', 'spiegazioni'] as const) {
      expect(Object.keys(b[k]).sort()).toEqual(Object.keys(a[k]).sort());
    }
    expect(Object.keys(a.etichette).sort()).toEqual(
      ['absent', 'ambiguous', 'error', 'measured', 'measured-zero', 'partial', 'placeholder', 'received', 'undetermined'],
    );
  });

  it('nessun testo vuoto, nessuna lineetta lunga, nessuna percentuale, nessuna «copertura»', () => {
    for (const l of LINGUE_DASHBOARD) {
      for (const s of tuttiITesti(l)) {
        expect(s.trim()).not.toBe('');
        expect(s).not.toContain('—');
        expect(s).not.toContain('%');
        expect(s).not.toMatch(/copertur|coverage/i);
      }
    }
  });

  it('mai «ieri» / «yesterday» / «fino a» in nessun testo, per nessun giorno della finestra', () => {
    for (const l of LINGUE_DASHBOARD) {
      for (const s of tuttiITesti(l)) {
        expect(s).not.toMatch(/\bieri\b|yesterday|fino\s+a\b|\buntil\b|\bup\s+to\b/i);
      }
    }
  });

  it('l ambiguita non dice «nessun dato dal dispositivo»', () => {
    for (const l of LINGUE_DASHBOARD) {
      expect(TESTI_PASSI[l].spiegazioni.ambiguous).not.toMatch(/nessun\s+dato|no\s+data/i);
      expect(TESTI_PASSI[l].valori.ambiguous).not.toMatch(/nessun\s+dato|no\s+data/i);
    }
    expect(TESTI_PASSI.it.spiegazioni.ambiguous).toContain('non scegliamo per te');
  });

  it('l ambiguita dice che fra le righe possono esserci fonti che non forniscono i passi, senza nominare sorgenti (D1)', () => {
    expect(TESTI_PASSI.it.spiegazioni.ambiguous).toContain('fonti che non forniscono i passi');
    expect(TESTI_PASSI.en.spiegazioni.ambiguous).toContain('sources that do not provide steps');
    for (const l of LINGUE_DASHBOARD) {
      expect(TESTI_PASSI[l].spiegazioni.ambiguous).not.toMatch(/strava|oura|health/i);
    }
  });

  it('singolare e plurale: 1 passo / 2 passi, 1 step / 2 steps, 1 giorno / N giorni', () => {
    expect(TESTI_PASSI.it.passi(1)).toBe('1 passo');
    expect(TESTI_PASSI.it.passi(0)).toBe('0 passi');
    expect(TESTI_PASSI.it.passi(2)).toBe('2 passi');
    expect(TESTI_PASSI.it.passi(12345)).toBe('12.345 passi');
    expect(TESTI_PASSI.en.passi(1)).toBe('1 step');
    expect(TESTI_PASSI.en.passi(2)).toBe('2 steps');
    expect(TESTI_PASSI.en.passi(12345)).toBe('12,345 steps');
    expect(TESTI_PASSI.it.giorni(1)).toBe('1 giorno');
    expect(TESTI_PASSI.it.giorni(7)).toBe('7 giorni');
    expect(TESTI_PASSI.en.giorni(1)).toBe('1 day');
    expect(TESTI_PASSI.en.giorni(7)).toBe('7 days');
    for (const s of tuttiITesti('it')) expect(s).not.toMatch(/(?<![\d.,])1\s*passi(?![a-z])/);
    for (const s of tuttiITesti('en')) expect(s).not.toMatch(/(?<![\d.,])1\s*steps(?![a-z])/);
  });

  it('riepilogo: singolare/plurale e nessuna voce a zero', () => {
    expect(TESTI_PASSI.it.riepilogo({ ...CONTI, ricevuti: 1, ambigui: 0, nonDeterminabili: 0, segnaposto: 0, assenti: 0, nonDisponibili: 1 }))
      .toBe('1 giorno con valore ricevuto; 1 giorno non disponibile.');
    expect(TESTI_PASSI.en.riepilogo({ ...CONTI, ricevuti: 0, ambigui: 2, nonDeterminabili: 0, segnaposto: 0, assenti: 0, nonDisponibili: 0 }))
      .toBe('2 days with several rows.');
    expect(TESTI_PASSI.it.riepilogo({ ricevuti: 0, ambigui: 0, nonDeterminabili: 0, segnaposto: 0, assenti: 0, nonDisponibili: 0 })).toBe('');
  });

  it('date effettive: stesso mese, mese diverso, anno diverso, bisestile, elisioni', () => {
    const it = TESTI_PASSI.it;
    const en = TESTI_PASSI.en;
    expect(it.intervallo('2026-03-05', '2026-03-11')).toBe('dal 5 all’11 marzo');
    expect(it.finestra('2026-03-05', '2026-03-11')).toBe('Passi, dal 5 all’11 marzo');
    expect(it.intervallo('2026-02-28', '2026-03-06')).toBe('dal 28 febbraio al 6 marzo');
    expect(it.intervallo('2026-12-29', '2027-01-04')).toBe('dal 29 dicembre 2026 al 4 gennaio 2027');
    expect(it.intervallo('2028-02-24', '2028-03-01')).toBe('dal 24 febbraio al 1° marzo');
    expect(it.intervallo('2028-02-23', '2028-02-29')).toBe('dal 23 al 29 febbraio');
    expect(it.intervallo('2026-03-08', '2026-03-14')).toBe('dall’8 al 14 marzo');
    // B3e F3: diciotto NON si elide (prima il test fissava «all’18», forma sbagliata).
    expect(it.intervallo('2026-03-12', '2026-03-18')).toBe('dal 12 al 18 marzo');
    expect(it.intervallo('2026-03-18', '2026-03-24')).toBe('dal 18 al 24 marzo');
    expect(en.intervallo('2026-03-05', '2026-03-11')).toBe('5 to 11 March');
    expect(en.intervallo('2026-02-28', '2026-03-06')).toBe('28 February to 6 March');
    expect(en.intervallo('2026-12-29', '2027-01-04')).toBe('29 December 2026 to 4 January 2027');
    expect(en.finestra('2028-02-23', '2028-02-29')).toBe('Steps, 23 to 29 February');
  });

  it('B3e F3: elisione italiana solo per 8 e 11; 1 resta «1°»; 18, 28, 29, 30, 31 non elidono', () => {
    const it = TESTI_PASSI.it;
    expect(it.intervallo('2026-03-08', '2026-03-14')).toBe('dall’8 al 14 marzo');
    expect(it.intervallo('2026-03-11', '2026-03-17')).toBe('dall’11 al 17 marzo');
    expect(it.intervallo('2026-03-02', '2026-03-08')).toBe('dal 2 all’8 marzo');
    expect(it.intervallo('2026-03-05', '2026-03-11')).toBe('dal 5 all’11 marzo');
    expect(it.intervallo('2026-03-01', '2026-03-07')).toBe('dal 1° al 7 marzo');
    expect(it.intervallo('2026-03-12', '2026-03-18')).toBe('dal 12 al 18 marzo');
    expect(it.intervallo('2026-03-18', '2026-03-24')).toBe('dal 18 al 24 marzo');
    expect(it.intervallo('2026-03-22', '2026-03-28')).toBe('dal 22 al 28 marzo');
    expect(it.intervallo('2026-03-28', '2026-04-03')).toBe('dal 28 marzo al 3 aprile');
    expect(it.intervallo('2026-03-29', '2026-04-04')).toBe('dal 29 marzo al 4 aprile');
    expect(it.intervallo('2026-03-30', '2026-04-05')).toBe('dal 30 marzo al 5 aprile');
    expect(it.intervallo('2026-03-31', '2026-04-06')).toBe('dal 31 marzo al 6 aprile');
    expect(it.intervallo('2026-03-25', '2026-03-31')).toBe('dal 25 al 31 marzo');
    expect(it.intervallo('2026-03-18', '2026-04-08')).toBe('dal 18 marzo all’8 aprile');
  });

  it('B3e F1: un giorno senza valore dei passi non dice «non ricevuto» (riga assente o steps null)', () => {
    for (const l of LINGUE_DASHBOARD) {
      const t = TESTI_PASSI[l];
      const testi = [
        t.etichette.absent, t.valori.absent, t.spiegazioni.absent, t.nessunDatoRicevuto,
        t.riepilogo({ ricevuti: 0, ambigui: 0, nonDeterminabili: 0, segnaposto: 0, assenti: 3, nonDisponibili: 0 }),
      ];
      for (const s of testi) {
        expect(s).not.toMatch(/ricevut|received|\bzero\b|\b0\b/i);
      }
    }
    expect(TESTI_PASSI.it.spiegazioni.absent).toBe('Nessun valore dei passi per questo giorno.');
    expect(TESTI_PASSI.en.spiegazioni.absent).toBe('No step value for this day.');
    expect(TESTI_PASSI.it.nessunDatoRicevuto).toBe('Nessun valore dei passi per questi sette giorni.');
    expect(TESTI_PASSI.en.nessunDatoRicevuto).toBe('No step value for these seven days.');
    expect(TESTI_PASSI.it.riepilogo({ ricevuti: 0, ambigui: 0, nonDeterminabili: 0, segnaposto: 0, assenti: 2, nonDisponibili: 0 }))
      .toBe('2 giorni senza valore dei passi.');
    expect(TESTI_PASSI.en.riepilogo({ ricevuti: 0, ambigui: 0, nonDeterminabili: 0, segnaposto: 0, assenti: 1, nonDisponibili: 0 }))
      .toBe('1 day with no step value.');
  });

  it('date non valide: null, mai una data inventata', () => {
    for (const l of LINGUE_DASHBOARD) {
      const t = TESTI_PASSI[l];
      expect(t.finestra('2026-02-30', '2026-03-06')).toBeNull();
      expect(t.finestra('2027-02-29', '2027-03-06')).toBeNull();
      expect(t.finestra('2026-13-01', '2026-03-06')).toBeNull();
      expect(t.finestra('2026-03-05', 'ieri')).toBeNull();
      expect(t.intervallo('', '')).toBeNull();
    }
  });

  it('le date non dipendono dal fuso del processo', () => {
    const prima = process.env.TZ;
    try {
      for (const tz of ['Pacific/Kiritimati', 'Pacific/Pago_Pago', 'UTC']) {
        process.env.TZ = tz;
        expect(TESTI_PASSI.it.intervallo('2026-03-29', '2026-04-04')).toBe('dal 29 marzo al 4 aprile');
      }
    } finally {
      if (prima === undefined) delete process.env.TZ;
      else process.env.TZ = prima;
    }
  });

  it('la lettura non verificata riusa il paragrafo della pagina, non una copia', () => {
    for (const l of LINGUE_DASHBOARD) {
      expect(TESTI_PASSI[l].letturaNonVerificata).toBe(TESTI_DASHBOARD[l].conteggioParziale);
    }
  });

  it('lingua senza traduzione rivista: nessun testo', () => {
    expect(testiPassiPer('it')).not.toBeNull();
    expect(testiPassiPer('en')).not.toBeNull();
    expect(testiPassiPer('es')).toBeNull();
  });
});
