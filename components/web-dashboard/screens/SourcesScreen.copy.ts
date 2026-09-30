/**
 * Copy della schermata «Sorgenti dei dati» (PROTOTIPO, dati sintetici). IT e EN;
 * ogni altra lingua usa l'EN. I gesti nell'app sono quelli dell'app al tag
 * v3.10.0+191 (syncNow, syncFreshnessNever). Dove l'app non ha una stringa la
 * frase e' neutra. I nomi delle sorgenti stanno in lib/web-dashboard/copy.ts
 * (`sourceNames`, vocabolario chiuso): qui non ci sono nomi di dispositivo,
 * ne' un elenco dei tipi di dato per sorgente, ne' una sorgente scelta per tipo.
 *
 * Cio' che esiste gia' in lib/web-dashboard/copy.ts NON si ripete qui:
 * «Ultimo dato ricevuto», «Nessun dato», i motivi di assenza («Non fornito
 * dalla fonte», «Nessun campione»), «Dati non aggiornati». Qui c'e' solo cio' che e' specifico di questa schermata. Il server
 * non possiede l'esito dei singoli sync: nessuna frase qui lo dichiara.
 *
 * Regole: niente em dash, niente promesse di disponibilita' o di date, niente
 * linguaggio promozionale, niente AI. Il web non puo' avviare un sync: nessuna
 * frase qui promette il contrario. Testo PLACEHOLDER da approvare (SITE-WRITING).
 */
import type { UiLocale } from '@/lib/web-dashboard/format';

/** Le frasi-gesto che la schermata sa comporre; quali usare lo decide il componente dallo stato. */
export type ActionKey = 'open_sync' | 'connect_device';

export interface SourcesCopy {
  status: {
    title: string;
    aboutTitle: string;
    /** Cosa dice e cosa non dice questa pagina: il server conosce quando e' arrivato un dato, non l'esito dei sync. */
    scope: string;
    never: string;
    actionsTitle: string;
    actions: Record<ActionKey, string>;
    /** Sotto l'eta' quando l'ultimo dato ricevuto e' vecchio: cio' che manca non e' zero. */
    staleNote: string;
    /** Il web non puo' avviare un sync: e' scritto, non nascosto. */
    webNote: string;
  };
  sources: {
    title: string;
    intro: string;
    empty: {
      title: string;
      body: string;
      stepsTitle: string;
      steps: string[];
      link: string;
    };
  };
}

const IT: SourcesCopy = {
  status: {
    title: 'Ultimo dato ricevuto',
    aboutTitle: 'Cosa vedi qui',
    scope: 'FitMesh mostra quando è arrivato l’ultimo dato di ogni sorgente. Non conserva un elenco delle ricezioni passate e non conosce come è andato ogni singolo sync sul telefono.',
    never: 'Non è ancora arrivato nessun dato.',
    actionsTitle: 'Cosa puoi fare',
    actions: {
      open_sync: 'Apri l’app FitMesh e tocca «Sincronizza ora».',
      connect_device: 'Collega un dispositivo dall’app FitMesh: più sotto trovi come.',
    },
    staleNote: 'Dopo questo dato non è arrivato nient’altro. I giorni successivi sono senza dato, non a zero.',
    webNote: 'Il sync si avvia dall’app FitMesh, non da questa pagina.',
  },
  sources: {
    title: 'Sorgenti che hanno inviato dati',
    intro: 'Per ogni sorgente vedi il nome da cui arrivano i dati e quando è arrivato l’ultimo dato.',
    empty: {
      title: 'Nessun dato ricevuto dalle sorgenti',
      body: 'Qui compariranno le sorgenti che consegnano dati a questo account, con l’ultimo dato ricevuto da ciascuna.',
      stepsTitle: 'Come collegare un dispositivo',
      steps: [
        'Apri la pagina dei dispositivi e genera un codice di abbinamento.',
        'Inserisci il codice nell’app FitMesh.',
        'Nell’app tocca «Sincronizza ora».',
      ],
      link: 'Vai ai dispositivi',
    },
  },
};

const EN: SourcesCopy = {
  status: {
    title: 'Last data received',
    aboutTitle: 'What you see here',
    scope: 'FitMesh shows when the last data of each source arrived. It does not keep a list of past receipts and does not know how each single sync on the phone went.',
    never: 'No data has arrived yet.',
    actionsTitle: 'What you can do',
    actions: {
      open_sync: 'Open the FitMesh app and tap “Sync now”.',
      connect_device: 'Connect a device from the FitMesh app: you will find how further down.',
    },
    staleNote: 'Nothing else has arrived after this data. The days after it have no data, they are not zero.',
    webNote: 'Sync starts from the FitMesh app, not from this page.',
  },
  sources: {
    title: 'Sources that sent data',
    intro: 'For each source you see the name the data comes from and when the last data arrived.',
    empty: {
      title: 'No data received from any source',
      body: 'The sources that deliver data to this account will appear here, with the last data received from each.',
      stepsTitle: 'How to connect a device',
      steps: [
        'Open the devices page and generate a pairing code.',
        'Enter the code in the FitMesh app.',
        'In the app tap “Sync now”.',
      ],
      link: 'Go to devices',
    },
  },
};

export function sourcesCopy(l: UiLocale): SourcesCopy {
  return l === 'it' ? IT : EN;
}
