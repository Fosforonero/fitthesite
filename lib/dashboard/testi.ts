/**
 * Testi della pagina /[locale]/app/dashboard.
 *
 * Registro della sorgente (TRANSLATIONS, «Declaring the source»):
 *   it  lingua di scrittura, sorgente
 *   en  derivato da `it`, stessa revisione di questo file
 *   controllo: nessun controllo di indicizzazione richiesto, la pagina e'
 *   `noindex` e dietro login (TRANSLATIONS 6 riguarda cio' che un motore
 *   raggiunge). Nessuna revisione madrelingua registrata per `en`.
 *
 * Le altre lingue del sito NON hanno una traduzione rivista: la pagina non e'
 * pubblicata in quelle lingue (404), invece di mostrare testo di un'altra
 * lingua senza dirlo (TRANSLATIONS 5). Una chiave mancante in una delle due
 * lingue fa fallire testi.test.ts.
 */
import type { MotivoDiniego } from './verdetto';

export const LINGUE_DASHBOARD = ['it', 'en'] as const;
export type LinguaDashboard = (typeof LINGUE_DASHBOARD)[number];

export type TestiDashboard = {
  titolo: string;
  concessoPer: (email: string) => string;
  giorniConDati: (n: number) => string;
  conteggioParziale: string;
  richiesta: string;
  motivi: Record<MotivoDiniego, string | null>;
  sessione: (email: string) => string;
  acquisti: string;
  nonDisponibile: string;
  riprova: string;
};

export const TESTI_DASHBOARD: Record<LinguaDashboard, TestiDashboard> = {
  it: {
    titolo: 'Dashboard web',
    concessoPer: (email) => `Accesso confermato per ${email}.`,
    giorniConDati: (n) => `Giorni con dati negli ultimi 30 giorni: ${n}.`,
    conteggioParziale: 'Il conteggio è parziale: questa pagina non ha letto tutti i dati.',
    richiesta: 'La dashboard web richiede un abbonamento attivo o l’accesso a vita a FitMesh.',
    motivi: {
      trial_only: 'La prova gratuita non comprende la dashboard web.',
      subscription_inactive:
        'Il tuo abbonamento non risulta attivo. Se lo hai rinnovato di recente, apri l’app FitMesh sul telefono e riprova.',
      purchase_revoked: 'L’acquisto risulta revocato o rimborsato.',
      purchase_pending: 'Il pagamento risulta ancora in attesa di conferma.',
      no_entitlement: null,
      altro: null,
    },
    sessione: (email) =>
      `Hai effettuato l’accesso come ${email}. Se hai acquistato con un altro account FitMesh, esci ed entra con quello.`,
    acquisti: 'Gli acquisti si fanno dall’app FitMesh sul telefono.',
    nonDisponibile: 'Non riusciamo a verificare il tuo accesso in questo momento.',
    riprova: 'Riprova',
  },
  en: {
    titolo: 'Web dashboard',
    concessoPer: (email) => `Access confirmed for ${email}.`,
    giorniConDati: (n) => `Days with data in the last 30 days: ${n}.`,
    conteggioParziale: 'This is a partial count: this page did not read all of the data.',
    richiesta: 'The web dashboard requires an active subscription or lifetime access to FitMesh.',
    motivi: {
      trial_only: 'The free trial does not include the web dashboard.',
      subscription_inactive:
        'Your subscription does not show as active. If you renewed it recently, open the FitMesh app on your phone and try again.',
      purchase_revoked: 'The purchase shows as revoked or refunded.',
      purchase_pending: 'The payment still shows as waiting for confirmation.',
      no_entitlement: null,
      altro: null,
    },
    sessione: (email) =>
      `You are signed in as ${email}. If you bought with a different FitMesh account, sign out and sign in with that one.`,
    acquisti: 'Purchases are made in the FitMesh app on your phone.',
    nonDisponibile: 'We can’t check your access right now.',
    riprova: 'Try again',
  },
};

export function testiPer(locale: string): TestiDashboard | null {
  return (LINGUE_DASHBOARD as readonly string[]).includes(locale)
    ? TESTI_DASHBOARD[locale as LinguaDashboard]
    : null;
}

/* ------------------------------------------------------------------------------------------
 * Testi del solo grafico dei passi (DASHBOARD-REAL-02, B3c-1).
 *
 * Registro: it = sorgente; en = derivato da `it`. en: nessuna revisione madrelingua.
 * Funzioni pure, nessuno stato di modulo. Le date si leggono dalla stringa AAAA-MM-GG a mano:
 * mai `new Date` in fuso locale, mai Intl con il fuso di default. Il testo non dice mai
 * «fino a ieri»: l'ultimo giorno puo' precedere lo ieri dell'utente.
 * Nessuna percentuale, nessuna parola «copertura» riferita a un numero.
 * ---------------------------------------------------------------------------------------- */

export type StatoTestoPassi =
  | 'measured'
  | 'measured-zero'
  | 'partial'
  | 'absent'
  | 'error'
  | 'received'
  | 'ambiguous'
  | 'undetermined'
  | 'placeholder';

export type ConteggiGiorniPassi = {
  ricevuti: number;
  ambigui: number;
  nonDeterminabili: number;
  segnaposto: number;
  assenti: number;
  nonDisponibili: number;
};

export type TestiPassi = {
  titolo: string;
  /** Intestazione con le date effettive; null se una data non e' una data valida. */
  finestra: (primo: string, ultimo: string) => string | null;
  /** Le due date in forma discorsiva («dal 5 all'11 marzo»); null se non valide. */
  intervallo: (primo: string, ultimo: string) => string | null;
  giorniConclusi: string;
  completezzaNonVerificata: string;
  /** Etichette di stato per il kit (props stateLabels). */
  etichette: Record<StatoTestoPassi, string>;
  /** Testo al posto del valore per gli stati senza valore (props valueLabels). */
  valori: Record<'absent' | 'error' | 'ambiguous' | 'undetermined' | 'placeholder', string>;
  /** Spiegazione per stato, per tooltip e tabella. */
  spiegazioni: Record<'absent' | 'error' | 'ambiguous' | 'undetermined' | 'placeholder' | 'received', string>;
  graficoNonDisponibile: string;
  nessunDatoRicevuto: string;
  /** Lettura incompleta: e' il paragrafo gia' presente nella pagina, non una copia. */
  letturaNonVerificata: string;
  graficoNonMostrato: string;
  passi: (n: number) => string;
  giorni: (n: number) => string;
  riepilogo: (c: ConteggiGiorniPassi) => string;
};

type LinguaData = {
  mesi: readonly string[];
  intervallo: (a: DataLeggibile, b: DataLeggibile) => string;
};
type DataLeggibile = { y: number; m: number; d: number };

const FORMA_DATA = /^(\d{4})-(\d{2})-(\d{2})$/;

function leggiData(s: string): DataLeggibile | null {
  const mt = FORMA_DATA.exec(s);
  if (!mt) return null;
  const y = Number(mt[1]);
  const m = Number(mt[2]);
  const d = Number(mt[3]);
  if (m < 1 || m > 12 || d < 1) return null;
  const giorniNelMese = new Date(Date.UTC(y, m, 0)).getUTCDate();
  if (d > giorniNelMese) return null;
  return { y, m, d };
}

function raggruppa(n: number, sep: string): string {
  const s = String(Math.abs(n));
  return (n < 0 ? '-' : '') + s.replace(/\B(?=(\d{3})+(?!\d))/g, sep);
}

const MESI_IT = [
  'gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno',
  'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre',
] as const;
const MESI_EN = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
] as const;

/** Giorno in italiano: 1 -> «1°»; 8, 11 e 18 vogliono l'apostrofo dopo «al»/«dal». */
const giornoIt = (d: number): string => (d === 1 ? '1°' : String(d));
const elisoIt = (d: number): boolean => d === 8 || d === 11 || d === 18;

const DATI: Record<LinguaDashboard, LinguaData> = {
  it: {
    mesi: MESI_IT,
    intervallo: (a, b) => {
      const dal = elisoIt(a.d) ? `dall’${a.d}` : `dal ${giornoIt(a.d)}`;
      const al = elisoIt(b.d) ? `all’${b.d}` : `al ${giornoIt(b.d)}`;
      const mb = MESI_IT[b.m - 1];
      if (a.y === b.y && a.m === b.m) return `${dal} ${al} ${mb}`;
      const ma = MESI_IT[a.m - 1];
      if (a.y === b.y) return `${dal} ${ma} ${al} ${mb}`;
      return `${dal} ${ma} ${a.y} ${al} ${mb} ${b.y}`;
    },
  },
  en: {
    mesi: MESI_EN,
    intervallo: (a, b) => {
      const mb = MESI_EN[b.m - 1];
      if (a.y === b.y && a.m === b.m) return `${a.d} to ${b.d} ${mb}`;
      const ma = MESI_EN[a.m - 1];
      if (a.y === b.y) return `${a.d} ${ma} to ${b.d} ${mb}`;
      return `${a.d} ${ma} ${a.y} to ${b.d} ${mb} ${b.y}`;
    },
  },
};

function intervalloPer(lingua: LinguaDashboard, primo: string, ultimo: string): string | null {
  const a = leggiData(primo);
  const b = leggiData(ultimo);
  if (!a || !b) return null;
  return DATI[lingua].intervallo(a, b);
}

function elencoNonZero(parti: Array<[number, string]>, fine: string): string {
  const v = parti.filter(([n]) => n > 0).map(([, t]) => t);
  return v.length === 0 ? '' : `${v.join('; ')}${fine}`;
}

export const TESTI_PASSI: Record<LinguaDashboard, TestiPassi> = {
  it: {
    titolo: 'Passi',
    intervallo: (p, u) => intervalloPer('it', p, u),
    finestra: (p, u) => {
      const t = intervalloPer('it', p, u);
      return t === null ? null : `Passi, ${t}`;
    },
    giorniConclusi: 'Sono giorni conclusi in ogni fuso orario. Ogni giorno porta la data registrata nei dati ricevuti.',
    completezzaNonVerificata:
      'Una data conclusa o una riga presente non dimostrano che la giornata sia completa: una sincronizzazione tardiva può cambiare il valore.',
    etichette: {
      measured: 'Misurato',
      'measured-zero': 'Zero misurato',
      partial: 'Parziale',
      absent: 'Nessun dato ricevuto',
      error: 'Non disponibile',
      received: 'Valore ricevuto',
      ambiguous: 'Più righe',
      undetermined: 'Zero non determinabile',
      placeholder: 'Segnaposto',
    },
    valori: {
      absent: 'Nessun dato',
      error: 'Non disponibile',
      ambiguous: 'Più righe',
      undetermined: '0 non determinabile',
      placeholder: 'Segnaposto',
    },
    spiegazioni: {
      absent: 'Nessun dato ricevuto per questo giorno.',
      error: 'Questo giorno non è disponibile in questo momento.',
      ambiguous: 'Più righe per questo giorno: non scegliamo per te.',
      undetermined: '0 ricevuto, ma non sappiamo se significa nessun passo o passi non letti.',
      placeholder: 'La fonte non fornisce i passi per questo giorno.',
      received:
        'Valore ricevuto. La completezza della giornata non è verificata: una sincronizzazione tardiva può cambiarla.',
    },
    graficoNonDisponibile: 'Il grafico dei passi non è disponibile in questo momento.',
    nessunDatoRicevuto: 'Nessun dato ricevuto per questi sette giorni.',
    letturaNonVerificata: TESTI_DASHBOARD.it.conteggioParziale,
    graficoNonMostrato: 'Il grafico dei passi non è mostrato perché la lettura non è completa.',
    passi: (n) => `${raggruppa(n, '.')} ${n === 1 ? 'passo' : 'passi'}`,
    giorni: (n) => `${raggruppa(n, '.')} ${n === 1 ? 'giorno' : 'giorni'}`,
    riepilogo: (c) => {
      const g = (n: number) => TESTI_PASSI.it.giorni(n);
      return elencoNonZero(
        [
          [c.ricevuti, `${g(c.ricevuti)} con valore ricevuto`],
          [c.ambigui, `${g(c.ambigui)} con più righe`],
          [c.nonDeterminabili, `${g(c.nonDeterminabili)} con zero non determinabile`],
          [c.segnaposto, `${g(c.segnaposto)} con segnaposto`],
          [c.assenti, `${g(c.assenti)} senza dati ricevuti`],
          [c.nonDisponibili, `${g(c.nonDisponibili)} ${c.nonDisponibili === 1 ? 'non disponibile' : 'non disponibili'}`],
        ],
        '.',
      );
    },
  },
  en: {
    titolo: 'Steps',
    intervallo: (p, u) => intervalloPer('en', p, u),
    finestra: (p, u) => {
      const t = intervalloPer('en', p, u);
      return t === null ? null : `Steps, ${t}`;
    },
    giorniConclusi: 'These are completed days in every time zone. Each day carries the date recorded in the data received.',
    completezzaNonVerificata:
      'A completed date or a row that is present does not show that the day is complete: a late sync can change the value.',
    etichette: {
      measured: 'Measured',
      'measured-zero': 'Measured zero',
      partial: 'Partial',
      absent: 'No data received',
      error: 'Not available',
      received: 'Value received',
      ambiguous: 'Several rows',
      undetermined: 'Zero not determinable',
      placeholder: 'Placeholder',
    },
    valori: {
      absent: 'No data',
      error: 'Not available',
      ambiguous: 'Several rows',
      undetermined: '0 not determinable',
      placeholder: 'Placeholder',
    },
    spiegazioni: {
      absent: 'No data received for this day.',
      error: 'This day is not available right now.',
      ambiguous: 'Several rows for this day: we do not choose for you.',
      undetermined: '0 received, but we do not know whether it means no steps or steps that were not read.',
      placeholder: 'The source does not provide steps for this day.',
      received: 'Value received. Whether the day is complete is not verified: a late sync can change it.',
    },
    graficoNonDisponibile: 'The steps chart is not available right now.',
    nessunDatoRicevuto: 'No data received for these seven days.',
    letturaNonVerificata: TESTI_DASHBOARD.en.conteggioParziale,
    graficoNonMostrato: 'The steps chart is not shown because the read is not complete.',
    passi: (n) => `${raggruppa(n, ',')} ${n === 1 ? 'step' : 'steps'}`,
    giorni: (n) => `${raggruppa(n, ',')} ${n === 1 ? 'day' : 'days'}`,
    riepilogo: (c) => {
      const g = (n: number) => TESTI_PASSI.en.giorni(n);
      return elencoNonZero(
        [
          [c.ricevuti, `${g(c.ricevuti)} with a value received`],
          [c.ambigui, `${g(c.ambigui)} with several rows`],
          [c.nonDeterminabili, `${g(c.nonDeterminabili)} with a zero not determinable`],
          [c.segnaposto, `${g(c.segnaposto)} with a placeholder`],
          [c.assenti, `${g(c.assenti)} with no data received`],
          [c.nonDisponibili, `${g(c.nonDisponibili)} not available`],
        ],
        '.',
      );
    },
  },
};

export function testiPassiPer(locale: string): TestiPassi | null {
  return (LINGUE_DASHBOARD as readonly string[]).includes(locale)
    ? TESTI_PASSI[locale as LinguaDashboard]
    : null;
}
