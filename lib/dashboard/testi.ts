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
