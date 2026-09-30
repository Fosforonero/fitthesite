/**
 * Copy della schermata Sonno (PROTOTIPO, dati sintetici). IT e EN; ogni altra
 * lingua usa l'EN. Le parole di fasi e sorgenti sono quelle dell'app al tag
 * v3.10.0+191 (sleepStageAwake/Light/Deep/Rem, sourceSectionTitle,
 * sleepStageBreakdownUnavailable, weeklyAvgSleep, stepsHourlyAverageUnavailable,
 * metricEnableExtraSleep). Dove l'app non ha una stringa la frase e' neutra.
 *
 * Le etichette dei motivi di assenza («Nessun campione», «Non fornito dalla
 * fonte»...) NON stanno qui: sono in lib/web-dashboard/copy.ts e si riusano
 * cosi' come sono. Qui c'e' solo la spiegazione piu' lunga, specifica del sonno.
 *
 * Regole: niente em dash, niente promesse di disponibilita' o di date, niente
 * linguaggio promozionale. Testo PLACEHOLDER da approvare (SITE-WRITING).
 */
import type { UiLocale } from '@/lib/web-dashboard/format';
import type { AbsentReason } from '@/lib/web-dashboard/measure';
import type { SleepStage } from '@/lib/web-dashboard/model';

export interface SleepCopy {
  night: {
    label: string;
    /** «{day}» = giorno in cui finisce la notte. */
    subtitle: string;
    total: string;
    bedtime: string;
    wakeup: string;
    /** Frase fissa nella scheda «notte assente»: assente non e' zero. */
    notZero: string;
    absentTitle: string;
  };
  stage: Record<SleepStage, string>;
  hypnogram: {
    title: string;
    subtitle: string;
    unavailableTitle: string;
    unavailableBody: string;
    gapNote: string;
    tableLabel: string;
    colStage: string;
    colFrom: string;
    colTo: string;
    colDuration: string;
    /** «{bed}», «{wake}», «{list}» = elenco «Fase durata, ...». */
    summary: string;
    summaryUnavailable: string;
    axisNote: string;
  };
  totals: {
    title: string;
    /** «{pct}» = percentuale. */
    share: string;
    shareRecorded: string;
  };
  nights: {
    title: string;
    /** «{day}» = ultimo giorno mostrato. */
    subtitle: string;
    average: string;
    averageNone: string;
    /** «{n}» notti complete su «{total}». */
    averageBasis: string;
    reference: string;
    referenceAxis: string;
    selected: string;
    tableLabel: string;
    colNight: string;
    colDuration: string;
    colState: string;
    emptyTitle: string;
    /** «{counts}» = «N con dato, N parziali, N senza dato». */
    summary: string;
    countMeasured: string;
    countPartial: string;
    countAbsent: string;
  };
  /** Spiegazione lunga per ogni motivo per cui la notte manca. */
  absentBody: Record<AbsentReason, string>;
  devicesLink: string;
}

const IT: SleepCopy = {
  night: {
    label: 'Notte',
    subtitle: 'La notte che finisce {day}',
    total: 'Sonno totale',
    bedtime: 'A letto',
    wakeup: 'Risveglio',
    notZero: 'Una notte senza dati non è una notte a zero ore.',
    absentTitle: 'Nessuna notte da mostrare',
  },
  stage: { awake: 'Svegli', rem: 'REM', light: 'Leggero', deep: 'Profondo' },
  hypnogram: {
    title: 'Fasi della notte',
    subtitle: 'Dal momento in cui sei andato a letto al risveglio.',
    unavailableTitle: 'Ripartizione per fase non disponibile',
    unavailableBody:
      'La durata della notte è nota, le fasi no. Non è una notte senza sonno profondo o REM: manca il dato.',
    gapNote: 'Nessun dato sulle fasi in questo intervallo',
    tableLabel: 'Tabella dei dati',
    colStage: 'Fase',
    colFrom: 'Dalle',
    colTo: 'Alle',
    colDuration: 'Durata',
    summary: 'Fasi della notte dalle {bed} alle {wake}. {list}.',
    summaryUnavailable: 'Fasi della notte non disponibili: {reason}.',
    axisNote: 'Ore',
  },
  totals: {
    title: 'Durata per fase',
    share: '{pct} della notte',
    shareRecorded: '{pct} della parte registrata',
  },
  nights: {
    title: 'Ultime 7 notti',
    subtitle: 'Durata del sonno, fino alla notte che finisce {day}.',
    average: 'Media sonno',
    averageNone: 'Media non disponibile',
    averageBasis: '{n} notti complete su {total}',
    reference: 'Riferimento 7 h: un punto di confronto, non un obiettivo medico',
    referenceAxis: 'riferimento',
    selected: 'notte selezionata',
    tableLabel: 'Tabella dei dati',
    colNight: 'Notte che finisce il',
    colDuration: 'Durata',
    colState: 'Stato',
    emptyTitle: 'Nessuna notte con dato in questi 7 giorni',
    summary: 'Durata del sonno nelle ultime 7 notti: {counts}. Linea di riferimento a 7 ore.',
    countMeasured: '{n} con dato',
    countPartial: '{n} parziali',
    countAbsent: '{n} senza dato',
  },
  absentBody: {
    no_data_received:
      'Non è arrivato nessun dato per questo account, quindi non c’è una notte da mostrare. Apri l’app FitMesh, controlla che un dispositivo sia collegato e sincronizza.',
    not_synced_yet:
      'La notte che finisce in questo giorno non è ancora arrivata. Non significa che tu non abbia dormito.',
    source_lacks_type: 'La fonte collegata non registra il sonno.',
    no_samples:
      'Per questa notte non sono arrivati dati di sonno. Indossa il dispositivo anche di notte perché registri il sonno.',
    not_yet: 'Questa notte non è ancora terminata, quindi non c’è una durata da mostrare.',
  },
  devicesLink: 'Collega un dispositivo',
};

const EN: SleepCopy = {
  night: {
    label: 'Night',
    subtitle: 'The night ending {day}',
    total: 'Total sleep',
    bedtime: 'Bedtime',
    wakeup: 'Wake-up',
    notZero: 'A night without data is not a night of zero hours.',
    absentTitle: 'No night to show',
  },
  stage: { awake: 'Awake', rem: 'REM', light: 'Light', deep: 'Deep' },
  hypnogram: {
    title: 'Night stages',
    subtitle: 'From the moment you went to bed to wake-up.',
    unavailableTitle: 'Stage breakdown unavailable',
    unavailableBody:
      'The length of the night is known, the stages are not. This is not a night without deep sleep or REM: the data is missing.',
    gapNote: 'No stage data in this interval',
    tableLabel: 'Data table',
    colStage: 'Stage',
    colFrom: 'From',
    colTo: 'To',
    colDuration: 'Duration',
    summary: 'Night stages from {bed} to {wake}. {list}.',
    summaryUnavailable: 'Night stages unavailable: {reason}.',
    axisNote: 'Hours',
  },
  totals: {
    title: 'Time in each stage',
    share: '{pct} of the night',
    shareRecorded: '{pct} of the recorded part',
  },
  nights: {
    title: 'Last 7 nights',
    subtitle: 'Sleep duration, up to the night ending {day}.',
    average: 'Avg sleep',
    averageNone: 'Average not available',
    averageBasis: '{n} complete nights of {total}',
    reference: '7 h reference: a point of comparison, not a medical target',
    referenceAxis: 'reference',
    selected: 'selected night',
    tableLabel: 'Data table',
    colNight: 'Night ending on',
    colDuration: 'Duration',
    colState: 'State',
    emptyTitle: 'No night with data in these 7 days',
    summary: 'Sleep duration over the last 7 nights: {counts}. Reference line at 7 hours.',
    countMeasured: '{n} with data',
    countPartial: '{n} partial',
    countAbsent: '{n} without data',
  },
  absentBody: {
    no_data_received:
      'No data has arrived for this account, so there is no night to show. Open the FitMesh app, check that a device is connected and sync.',
    not_synced_yet:
      'The night ending on this day has not arrived yet. It does not mean you did not sleep.',
    source_lacks_type: 'The connected source does not record sleep.',
    no_samples:
      'No sleep data has arrived for this night. Wear the device at night too so it records sleep.',
    not_yet: 'This night is not over yet, so there is no duration to show.',
  },
  devicesLink: 'Connect a device',
};

export function sleepCopy(l: UiLocale): SleepCopy {
  return l === 'it' ? IT : EN;
}

/** Sostituisce i segnaposto {nome} di una frase. */
export function fill(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? ''));
}
