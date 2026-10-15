import { describe, expect, it } from 'vitest';

import { LINGUE_DASHBOARD, TESTI_PASSI } from '../dashboard/testi';
import {
  FORBIDDEN_PAYWALL,
  FORBIDDEN_SYNC_NAMES,
  FORBIDDEN_VITALS,
  FORBIDDEN_WINNING_SOURCE_AND_DEVICE_KIND,
} from './regression-patterns';

// Il ramo lib/dashboard non puo' nominare lib/web-dashboard (regression.test.ts): la prova dei
// guardrail testuali sui testi del grafico passi sta qui, dal lato che puo' importare entrambi.
const CONTI = { ricevuti: 1, ambigui: 2, nonDeterminabili: 1, segnaposto: 2, assenti: 1, nonDisponibili: 2 };

function tutti(l: 'it' | 'en'): string[] {
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
    t.passi(1), t.passi(2), t.giorni(1), t.giorni(7),
    t.riepilogo(CONTI),
  ];
}

describe('testi del grafico passi: guardrail testuali', () => {
  it('nessuna frase vietata dai guardrail testuali del repository', () => {
    const elenchi = [
      ...FORBIDDEN_SYNC_NAMES,
      ...FORBIDDEN_WINNING_SOURCE_AND_DEVICE_KIND,
      ...FORBIDDEN_VITALS,
      ...FORBIDDEN_PAYWALL,
    ];
    for (const l of LINGUE_DASHBOARD) {
      for (const s of tutti(l)) {
        for (const { name, re } of elenchi) {
          expect(re.test(s), `${l}: «${s}» viola ${name}`).toBe(false);
        }
      }
    }
  });

});
