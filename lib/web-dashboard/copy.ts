/**
 * Copy condivisa del prototipo (shell, misure, stati, accessi). IT e EN; ogni
 * altra lingua usa l'EN. I nomi delle metriche seguono le stringhe dell'app
 * (app_it.arb / app_en.arb al tag v3.10.0+191: dashboardNoData, statLabelSteps,
 * sleepStageDeep, syncNow, errorDataLoading, hrStatResting...).
 *
 * Regole: niente em dash, niente promesse di disponibilita' o di date. Ogni
 * testo qui e' PLACEHOLDER da approvare (SITE-WRITING) prima di qualunque uso
 * pubblico: il prototipo non e' raggiungibile da un visitatore.
 */
import type { AbsentReason, PartialNote } from './measure';
import type { UiLocale } from './format';
import type { ScenarioKey, ScreenKey } from './model';

export interface SharedCopy {
  previewBanner: string;
  previewBannerShort: string;
  brand: string;
  nav: Record<ScreenKey, string>;
  navAria: string;
  date: { prev: string; next: string; today: string; yesterday: string; pick: string };
  sync: { label: string; never: string; ok: string; partial: string; error: string; detail: string };
  measure: {
    noData: string;
    zeroMeasured: string;
    partialLabel: string;
    absent: Record<AbsentReason, string>;
    partial: Record<PartialNote, string>;
  };
  legend: { measured: string; zero: string; partial: string; absent: string; goal: string };
  states: {
    loading: string;
    errorTitle: string;
    errorBody: string;
    retry: string;
    emptyTitle: string;
    emptyBody: string;
    staleTitle: string;
    staleBody: string;
    partialTitle: string;
    partialBody: string;
  };
  preview: { scenarios: Record<ScenarioKey, string>; viewers: Record<string, string>; scenarioLabel: string; viewerLabel: string };
  units: { steps: string; km: string; kcal: string; bpm: string; ms: string; floors: string; min: string };
  gates: {
    login: { title: string; body: string; email: string; emailPlaceholder: string; captcha: string; submit: string; note: string; forgot: string };
    paywall: {
      title: Record<'trial' | 'expired' | 'none', string>;
      body: Record<'trial' | 'expired' | 'none', string>;
      whoTitle: string;
      whoItems: string[];
      cta: string;
      ctaNote: string;
      alwaysTitle: string;
      alwaysBody: string;
      settings: string;
      export: string;
      deleteAccount: string;
    };
    verification: { title: string; body: Record<'read_failed' | 'unknown_contract_version', string>; retry: string };
  };
}

const IT: SharedCopy = {
  previewBanner: 'Anteprima interna con dati sintetici. Nessuna metrica reale è collegata.',
  previewBannerShort: 'Anteprima interna · dati sintetici',
  brand: 'FitMesh',
  nav: {
    overview: 'Panoramica',
    activity: 'Passi e attività',
    sleep: 'Sonno',
    heart: 'Cuore',
    workouts: 'Allenamenti',
    trends: 'Trend',
    sources: 'Sorgenti e sync',
  },
  navAria: 'Sezioni della dashboard',
  date: { prev: 'Giorno precedente', next: 'Giorno successivo', today: 'Oggi', yesterday: 'Ieri', pick: 'Giorno' },
  sync: {
    label: 'Ultimo sync',
    never: 'Nessun sync',
    ok: 'Sync riuscito',
    partial: 'Sync parziale',
    error: 'Sync non riuscito',
    detail: 'Dettagli',
  },
  measure: {
    noData: 'Nessun dato',
    zeroMeasured: 'Zero misurato',
    partialLabel: 'Parziale',
    absent: {
      no_source: 'Nessuna fonte collegata',
      not_synced_yet: 'Non ancora sincronizzato',
      permission_missing: 'Permesso non concesso',
      source_lacks_type: 'Non fornito dalla fonte',
      no_samples: 'Nessun campione',
      not_yet: 'Non ancora trascorso',
      read_error: 'Lettura non riuscita',
    },
    partial: {
      device_off: 'Orologio non collegato per una parte del periodo',
      sync_incomplete: 'Sync incompleto',
      window_open: 'Giornata in corso',
    },
  },
  legend: { measured: 'Misurato', zero: 'Zero misurato', partial: 'Parziale', absent: 'Nessun dato', goal: 'Obiettivo' },
  states: {
    loading: 'Caricamento',
    errorTitle: 'Impossibile caricare i dati',
    errorBody: 'Non è stato possibile leggere i dati di questo giorno. Non significa che non ci siano dati.',
    retry: 'Riprova',
    emptyTitle: 'Nessun dato ancora',
    emptyBody: 'Nessuna sorgente è collegata a questo account. Collega un dispositivo dall’app FitMesh e sincronizza.',
    staleTitle: 'Dati non aggiornati',
    staleBody: 'L’ultimo sync risale a diversi giorni fa. Quello che segue non è ancora arrivato: non è zero.',
    partialTitle: 'Dati parziali',
    partialBody: 'Alcuni dati mancano o coprono solo una parte del periodo. I totali sono indicati come parziali.',
  },
  preview: {
    scenarioLabel: 'Stato dei dati',
    viewerLabel: 'Visto da',
    scenarios: {
      ok: 'Completo',
      partial: 'Parziale',
      zeros: 'Zero e assente',
      stale: 'Non aggiornato',
      empty: 'Vuoto',
      error: 'Errore',
      loading: 'Caricamento',
    },
    viewers: {
      subscriber: 'Abbonato',
      trial: 'In prova',
      expired: 'Scaduto',
      anonymous: 'Non connesso',
      unverifiable: 'Non verificabile',
      lifetime: 'Lifetime',
    },
  },
  units: { steps: 'passi', km: 'km', kcal: 'kcal', bpm: 'bpm', ms: 'ms', floors: 'piani', min: 'min' },
  gates: {
    login: {
      title: 'Accedi a FitMesh',
      body: 'Per vedere la dashboard accedi con il tuo account FitMesh: ti mandiamo un link via email.',
      email: 'Email',
      emailPlaceholder: 'tua@email.it',
      captcha: 'Verifica anti-bot (non attiva nell’anteprima)',
      submit: 'Inviami il link di accesso',
      note: 'Anteprima: il modulo non invia nulla.',
      forgot: 'Password dimenticata?',
    },
    paywall: {
      title: {
        trial: 'La dashboard richiede un abbonamento o Lifetime',
        expired: 'La dashboard richiede un abbonamento o Lifetime',
        none: 'La dashboard richiede un abbonamento o Lifetime',
      },
      body: {
        trial: 'La prova copre l’app. La dashboard su web è inclusa con un abbonamento valido o con Lifetime.',
        expired: 'La tua prova è terminata. La dashboard su web è inclusa con un abbonamento valido o con Lifetime.',
        none: 'Non risulta un abbonamento o un Lifetime su questo account. La dashboard su web li richiede.',
      },
      whoTitle: 'Chi accede alla dashboard',
      whoItems: ['Abbonamento valido', 'Lifetime acquistato', 'Lifetime concesso o Founder'],
      cta: 'Vedi le opzioni',
      ctaNote: 'Anteprima: il pulsante non è collegato alla fatturazione.',
      alwaysTitle: 'Sempre a tua disposizione',
      alwaysBody: 'Queste aree non dipendono dall’abbonamento.',
      settings: 'Impostazioni',
      export: 'Esporta i miei dati',
      deleteAccount: 'Elimina account',
    },
    verification: {
      title: 'Non riusciamo a verificare il tuo accesso',
      body: {
        read_failed: 'Il controllo non ha risposto. Non abbiamo concluso nulla sul tuo abbonamento: riprova tra poco.',
        unknown_contract_version: 'Non riusciamo a leggere lo stato del tuo accesso. Riprova tra poco.',
      },
      retry: 'Riprova',
    },
  },
};

const EN: SharedCopy = {
  previewBanner: 'Internal preview with synthetic data. No real metrics are connected.',
  previewBannerShort: 'Internal preview · synthetic data',
  brand: 'FitMesh',
  nav: {
    overview: 'Overview',
    activity: 'Steps and activity',
    sleep: 'Sleep',
    heart: 'Heart',
    workouts: 'Workouts',
    trends: 'Trends',
    sources: 'Sources and sync',
  },
  navAria: 'Dashboard sections',
  date: { prev: 'Previous day', next: 'Next day', today: 'Today', yesterday: 'Yesterday', pick: 'Day' },
  sync: {
    label: 'Last sync',
    never: 'No sync yet',
    ok: 'Sync complete',
    partial: 'Partial sync',
    error: 'Sync failed',
    detail: 'Details',
  },
  measure: {
    noData: 'No data',
    zeroMeasured: 'Measured zero',
    partialLabel: 'Partial',
    absent: {
      no_source: 'No source connected',
      not_synced_yet: 'Not synced yet',
      permission_missing: 'Permission not granted',
      source_lacks_type: 'Not provided by the source',
      no_samples: 'No samples',
      not_yet: 'Not yet elapsed',
      read_error: 'Read failed',
    },
    partial: {
      device_off: 'Watch not connected for part of the period',
      sync_incomplete: 'Incomplete sync',
      window_open: 'Day in progress',
    },
  },
  legend: { measured: 'Measured', zero: 'Measured zero', partial: 'Partial', absent: 'No data', goal: 'Goal' },
  states: {
    loading: 'Loading',
    errorTitle: 'Could not load data',
    errorBody: 'We could not read this day. That does not mean there is no data.',
    retry: 'Try again',
    emptyTitle: 'No data yet',
    emptyBody: 'No source is connected to this account. Connect a device from the FitMesh app and sync.',
    staleTitle: 'Data is not up to date',
    staleBody: 'The last sync was several days ago. What comes after it has not arrived yet: it is not zero.',
    partialTitle: 'Partial data',
    partialBody: 'Some data is missing or covers only part of the period. Totals are marked as partial.',
  },
  preview: {
    scenarioLabel: 'Data state',
    viewerLabel: 'Viewed as',
    scenarios: {
      ok: 'Complete',
      partial: 'Partial',
      zeros: 'Zero and missing',
      stale: 'Stale',
      empty: 'Empty',
      error: 'Error',
      loading: 'Loading',
    },
    viewers: {
      subscriber: 'Subscriber',
      trial: 'In trial',
      expired: 'Expired',
      anonymous: 'Signed out',
      unverifiable: 'Cannot verify',
      lifetime: 'Lifetime',
    },
  },
  units: { steps: 'steps', km: 'km', kcal: 'kcal', bpm: 'bpm', ms: 'ms', floors: 'floors', min: 'min' },
  gates: {
    login: {
      title: 'Sign in to FitMesh',
      body: 'To see the dashboard, sign in with your FitMesh account: we email you a link.',
      email: 'Email',
      emailPlaceholder: 'you@email.com',
      captcha: 'Anti-bot check (not active in the preview)',
      submit: 'Email me a sign-in link',
      note: 'Preview: the form sends nothing.',
      forgot: 'Forgot your password?',
    },
    paywall: {
      title: {
        trial: 'The dashboard needs a subscription or Lifetime',
        expired: 'The dashboard needs a subscription or Lifetime',
        none: 'The dashboard needs a subscription or Lifetime',
      },
      body: {
        trial: 'The trial covers the app. The web dashboard is included with a valid subscription or with Lifetime.',
        expired: 'Your trial has ended. The web dashboard is included with a valid subscription or with Lifetime.',
        none: 'This account has no subscription or Lifetime. The web dashboard requires one.',
      },
      whoTitle: 'Who gets the dashboard',
      whoItems: ['A valid subscription', 'A purchased Lifetime', 'A granted Lifetime or Founder'],
      cta: 'See the options',
      ctaNote: 'Preview: the button is not connected to billing.',
      alwaysTitle: 'Always available to you',
      alwaysBody: 'These areas do not depend on a subscription.',
      settings: 'Settings',
      export: 'Export my data',
      deleteAccount: 'Delete account',
    },
    verification: {
      title: 'We cannot verify your access',
      body: {
        read_failed: 'The check did not respond. We have concluded nothing about your subscription: try again shortly.',
        unknown_contract_version: 'We cannot read the state of your access. Try again shortly.',
      },
      retry: 'Try again',
    },
  },
};

export function sharedCopy(l: UiLocale): SharedCopy {
  return l === 'it' ? IT : EN;
}
