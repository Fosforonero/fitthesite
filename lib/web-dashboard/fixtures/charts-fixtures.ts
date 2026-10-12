import type { ChartDataPoint, ChartPeriod } from '@/components/web-dashboard/charts/types';

/**
 * Metadati e specifiche del dataset sintetico per i grafici della dashboard.
 *
 * NOTE TECNICHE:
 *  - Fuso orario: Europe/Rome (UTC+2 in ora legale estiva di settembre).
 *  - Timestamp di ancoraggio: 2026-09-24T09:40:00+02:00.
 *  - Unita' dichiarate:
 *      * passi: conteggio intero giornaliero;
 *      * frequenza cardiaca: battiti al minuto (bpm), serie a riposo/media;
 *      * sonno: durata notturna totale in minuti (presentata in ore e minuti).
 *  - I dati sono puramente dimostrativi e generati algoritmicamente senza
 *    alcuna connessione a dispositivi reali o a Supabase.
 */
export const CHARTS_FIXTURE_METADATA = {
  timezone: 'Europe/Rome',
  anchorDate: '2026-09-24',
  generatedAt: '2026-09-24T09:40:00+02:00',
  isDemo: true,
  disclaimer: 'Dati dimostrativi: dataset sintetico isolato per prototipo locale',
  units: {
    steps: 'passi',
    heartRate: 'bpm',
    sleepDuration: 'minuti',
  },
} as const;

export type ChartScenario = 'complete' | 'zeros' | 'partial' | 'empty' | 'error';

function addDaysIso(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + days);
  return dt.toISOString().slice(0, 10);
}

function getDayList(anchor: string, count: number): string[] {
  const res: string[] = [];
  for (let i = count - 1; i >= 0; i--) {
    res.push(addDaysIso(anchor, -i));
  }
  return res;
}

// Passi giornalieri

export function getStepsFixture(period: ChartPeriod, scenario: ChartScenario): ChartDataPoint[] {
  const dates = getDayList(CHARTS_FIXTURE_METADATA.anchorDate, period);

  return dates.map((date, idx) => {
    if (scenario === 'empty') {
      return {
        date,
        value: null,
        state: 'absent',
        absentReason: 'Nessun dato ricevuto',
      };
    }

    if (scenario === 'error') {
      return {
        date,
        value: null,
        state: 'error',
        absentReason: 'Errore di lettura sensore',
      };
    }

    if (scenario === 'zeros') {
      // Alcuni giorni hanno 0 misurato (il wearable ha contato 0 passi), altri assenti
      if (idx % 3 === 0) {
        return {
          date,
          value: 0,
          state: 'measured-zero',
        };
      }
      if (idx % 5 === 0) {
        return {
          date,
          value: null,
          state: 'absent',
          absentReason: 'Nessun campione',
        };
      }
      return {
        date,
        value: 4000 + ((idx * 839) % 6000),
        state: 'measured',
      };
    }

    if (scenario === 'partial') {
      // Presenza di buchi temporali (assenti) e dati con finestra corta (parziali)
      if (idx % 4 === 1) {
        return {
          date,
          value: null,
          state: 'absent',
          absentReason: 'Nessun campione',
        };
      }
      if (idx % 4 === 2) {
        return {
          date,
          value: 3800,
          state: 'partial',
          coverage: 0.55,
          partialNote: 'Finestra incompleta',
        };
      }
      return {
        date,
        value: 7500 + ((idx * 541) % 4500),
        state: 'measured',
      };
    }

    // complete
    return {
      date,
      value: 6500 + ((idx * 947) % 6500),
      state: 'measured',
    };
  });
}

// ── Frequenza cardiaca (bpm) ──────────────────────────────────────────────────

export function getHeartRateFixture(period: ChartPeriod, scenario: ChartScenario): ChartDataPoint[] {
  const dates = getDayList(CHARTS_FIXTURE_METADATA.anchorDate, period);

  return dates.map((date, idx) => {
    if (scenario === 'empty') {
      return {
        date,
        value: null,
        state: 'absent',
        absentReason: 'Nessun dato ricevuto',
      };
    }

    if (scenario === 'error') {
      return {
        date,
        value: null,
        state: 'error',
        absentReason: 'Errore di acquisizione battito',
      };
    }

    if (scenario === 'zeros') {
      // In scenari estremi o anomalie di lettura
      if (idx === 2) {
        return {
          date,
          value: 0,
          state: 'measured-zero',
        };
      }
      if (idx % 4 === 0) {
        return {
          date,
          value: null,
          state: 'absent',
          absentReason: 'Nessun campione',
        };
      }
      return {
        date,
        value: 54 + (idx % 8),
        state: 'measured',
      };
    }

    if (scenario === 'partial') {
      // Importante: buchi di dato non devono essere collegati da linee
      if (idx === 2 || idx === 3 || idx === 10) {
        return {
          date,
          value: null,
          state: 'absent',
          absentReason: 'Nessun campione',
        };
      }
      if (idx === 5) {
        return {
          date,
          value: 58,
          state: 'partial',
          coverage: 0.6,
          partialNote: 'Copertura sensore incompleta',
        };
      }
      return {
        date,
        value: 52 + ((idx * 3) % 11),
        state: 'measured',
      };
    }

    // complete
    return {
      date,
      value: 53 + ((idx * 7) % 10),
      state: 'measured',
    };
  });
}

// ── Durata del sonno (minuti) ─────────────────────────────────────────────────

export function getSleepFixture(period: ChartPeriod, scenario: ChartScenario): ChartDataPoint[] {
  const dates = getDayList(CHARTS_FIXTURE_METADATA.anchorDate, period);

  return dates.map((date, idx) => {
    if (scenario === 'empty') {
      return {
        date,
        value: null,
        state: 'absent',
        absentReason: 'Nessun dato ricevuto',
      };
    }

    if (scenario === 'error') {
      return {
        date,
        value: null,
        state: 'error',
        absentReason: 'Errore nel tracciamento del sonno',
      };
    }

    if (scenario === 'zeros') {
      if (idx === 1) {
        return {
          date,
          value: 0,
          state: 'measured-zero',
        };
      }
      if (idx % 4 === 0) {
        return {
          date,
          value: null,
          state: 'absent',
          absentReason: 'Nessuna notte rilevata',
        };
      }
      return {
        date,
        value: 420 + ((idx * 31) % 120),
        state: 'measured',
      };
    }

    if (scenario === 'partial') {
      if (idx % 5 === 1) {
        return {
          date,
          value: null,
          state: 'absent',
          absentReason: 'Nessuna notte rilevata',
        };
      }
      if (idx % 5 === 3) {
        return {
          date,
          value: 210, // 3h 30m
          state: 'partial',
          coverage: 0.5,
          partialNote: 'Monitoraggio interrotto',
        };
      }
      return {
        date,
        value: 430 + ((idx * 23) % 90),
        state: 'measured',
      };
    }

    // complete
    return {
      date,
      value: 410 + ((idx * 43) % 110), // ~7h to ~8h40m
      state: 'measured',
    };
  });
}
