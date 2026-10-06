import { describe, expect, it } from 'vitest';

import { LINGUE_DASHBOARD, TESTI_DASHBOARD, testiPer } from './testi';
import { MOTIVI_DINIEGO } from './verdetto';

describe('testi della dashboard web', () => {
  it('le due lingue hanno le stesse chiavi e lo stesso insieme di motivi: una chiave mancante fa fallire', () => {
    const [sorgente, ...derivate] = LINGUE_DASHBOARD.map((l) => TESTI_DASHBOARD[l]);
    for (const d of derivate) {
      expect(Object.keys(d).sort()).toEqual(Object.keys(sorgente).sort());
      expect(Object.keys(d.motivi).sort()).toEqual(Object.keys(sorgente.motivi).sort());
    }
    for (const l of LINGUE_DASHBOARD) {
      expect(Object.keys(TESTI_DASHBOARD[l].motivi).sort()).toEqual([...MOTIVI_DINIEGO, 'altro'].sort());
    }
  });

  it('ogni motivo che ha un testo in una lingua lo ha anche nell altra', () => {
    for (const m of [...MOTIVI_DINIEGO, 'altro'] as const) {
      const presenti = LINGUE_DASHBOARD.map((l) => TESTI_DASHBOARD[l].motivi[m] !== null);
      expect(new Set(presenti).size).toBe(1);
    }
  });

  it('nessuna lineetta lunga nel testo (EDITORIAL-CORE 8)', () => {
    for (const l of LINGUE_DASHBOARD) {
      const t = TESTI_DASHBOARD[l];
      const tutto = [
        t.titolo, t.concessoPer('x@y.z'), t.giorniConDati(3), t.conteggioParziale, t.richiesta,
        ...Object.values(t.motivi).filter((v): v is string => v !== null),
        t.sessione('x@y.z'), t.acquisti, t.nonDisponibile, t.riprova,
      ].join('\n');
      expect(tutto).not.toContain('—');
    }
  });

  it('una lingua senza traduzione rivista non ha testi, non ne prende in prestito', () => {
    expect(testiPer('it')).not.toBeNull();
    expect(testiPer('en')).not.toBeNull();
    for (const l of ['es', 'de', 'pt', 'fr', 'pl', 'tr', 'nl', 'ja', 'ko', 'sv', 'da', 'no', 'fi']) {
      expect(testiPer(l)).toBeNull();
    }
  });
});
