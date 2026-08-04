/**
 * Sprint P0.11-A — /self-host, pagina di STATO (non una guida self-service).
 *
 * Solo IT/EN: la funzione self-host esiste nel software (vedi
 * SelfHostServerScreen nell'app), ma oggi è gated ad account admin e il
 * path di scrittura sync dipende ancora dall'infrastruttura FitMesh — non
 * è un percorso self-service reale, quindi non pubblichiamo un walkthrough
 * "incolla URL e chiave" che gli utenti non potrebbero comunque usare.
 * Nessun "coming soon", nessuna roadmap, nessun prezzo: solo fatti
 * verificati sul codice attuale (vedi audit FASE 0/0B del mandato).
 *
 * Addendum (chiusura criteri pre-merge PR#39): la feature non è disponibile
 * al pubblico, quindi ogni superficie self-host (bare /self-host, /it/self-host,
 * /en/self-host) è noindex,follow e fuori sitemap — resta raggiungibile e
 * linkata (da /about, /privacy), solo non proposta ai motori di ricerca come
 * contenuto pubblico consumabile.
 */

export type TwoLocale = "it" | "en";

export type LocalizedText = Record<TwoLocale, string>;
export type LocalizedList = Record<TwoLocale, string[]>;

export function t(text: LocalizedText, lc: TwoLocale): string {
  return text[lc];
}

export function tl(list: LocalizedList, lc: TwoLocale): string[] {
  return list[lc];
}

export const SELF_HOST_COPY = {
  kicker: {
    it: "Infrastruttura",
    en: "Infrastructure",
  } satisfies LocalizedText,

  metaTitle: {
    it: "Self-host FitMesh: stato attuale",
    en: "FitMesh self-hosting: current status",
  } satisfies LocalizedText,

  metaDescription: {
    it: "La configurazione di un server personalizzato esiste nel software FitMesh, ma oggi è un uso tecnico interno, non un percorso self-service per gli utenti.",
    en: "Custom-server configuration exists in the FitMesh software, but today it's an internal technical capability, not a self-service path available to app users.",
  } satisfies LocalizedText,

  h1: {
    it: "Self-host: stato attuale",
    en: "Self-hosting: current status",
  } satisfies LocalizedText,

  lastUpdated: {
    it: "Verificato sul codice il 4 agosto 2026",
    en: "Verified against the code on August 4, 2026",
  } satisfies LocalizedText,

  // ISO per il dateModified del WebPage JSON-LD — deve coincidere
  // semanticamente col testo sopra (addendum P0.11-C, Fase 7).
  lastUpdatedIso: "2026-08-04",

  breadcrumbHome: {
    it: "Home",
    en: "Home",
  } satisfies LocalizedText,

  breadcrumbSelfHost: {
    it: "Self-host",
    en: "Self-hosting",
  } satisfies LocalizedText,

  // Addendum PR#39 — pagina bare /self-host (nessun prefisso locale):
  // toggle client-side, stessa convenzione di DELETE_ACCOUNT_COPY.toggleLabel
  // (mostra la lingua verso cui si passa, non quella corrente).
  toggleLabel: {
    it: "English",
    en: "Italiano",
  } satisfies LocalizedText,

  permalinkPrefix: {
    it: "Link diretti alle versioni complete: ",
    en: "Direct links to the full versions: ",
  } satisfies LocalizedText,

  intro: {
    it: "FitMesh Sync sincronizza normalmente i tuoi dati sul backend cloud gestito da FitMesh (Supabase, infrastruttura UE). Nel software esiste anche un meccanismo tecnico per puntare l'app a un backend Supabase diverso, scelto da te.",
    en: "FitMesh Sync normally syncs your data to FitMesh's managed cloud backend (Supabase, EU infrastructure). The software also contains a technical mechanism for pointing the app at a different, self-chosen Supabase backend.",
  } satisfies LocalizedText,

  statusHeading: {
    it: "Stato di oggi",
    en: "Current status",
  } satisfies LocalizedText,

  statusPoints: {
    it: [
      "Oggi questo NON è un self-host completo e funzionante per il pubblico: componenti chiave (scrittura dei dati fitness, export/cancellazione account) restano legati al backend gestito FitMesh, indipendentemente dal server Supabase che configuri.",
      "La configurazione di un server personalizzato esiste nel software dell'app, ma è un uso tecnico/interno: non è un percorso self-service aperto agli utenti.",
      "Il percorso principale di scrittura dei dati fitness continua a inviare i dati all'endpoint FitMesh, indipendentemente dal server Supabase configurato.",
      "Non c'è una migrazione automatica dei dati già sincronizzati verso il nuovo server.",
    ],
    en: [
      "Today this is NOT a complete, working self-host for the public: key components (fitness-data writes, account export/deletion) remain tied to FitMesh's managed backend, regardless of the Supabase server you configure.",
      "Custom-server configuration exists in the app's software, but it's for internal/technical use: it isn't a self-service path open to users.",
      "The main fitness-data write path still sends data to FitMesh's endpoint, regardless of the Supabase server you configure.",
      "There's no automatic migration of data already synced to your new server.",
    ],
  } satisfies LocalizedList,

  whatItIsNotHeading: {
    it: "Cosa non fa (oggi)",
    en: "What it doesn't do (today)",
  } satisfies LocalizedText,

  whatItIsNotPoints: {
    it: [
      "Non migra automaticamente i dati esistenti dal backend FitMesh a un server diverso.",
      "Non rende l'app completamente offline: alcune funzioni restano collegate ai servizi FitMesh.",
      "Non disattiva Firebase Crashlytics (diagnostica crash) né Firebase Cloud Messaging (notifiche push): restano percorsi distinti dal database, indipendenti dal server scelto.",
      "Non cambia gli acquisti effettuati su App Store o Google Play.",
      "Non è un servizio di backup NAS generico: è un meccanismo di configurazione del backend dell'app.",
    ],
    en: [
      "It doesn't automatically migrate existing data from FitMesh's backend to a different server.",
      "It doesn't make the app fully offline: some functions remain connected to FitMesh's services.",
      "It doesn't disable Firebase Crashlytics (crash diagnostics) or Firebase Cloud Messaging (push notifications): these stay separate from the database, independent of the server you choose.",
      "It doesn't change purchases made on the App Store or Google Play.",
      "It isn't a generic NAS backup service: it's a configuration mechanism for the app's backend.",
    ],
  } satisfies LocalizedList,

  dataHeading: {
    it: "Dati e account",
    en: "Data and account",
  } satisfies LocalizedText,

  dataParagraph: {
    it: "Sul backend gestito da FitMesh, puoi sempre esportare o cancellare i tuoi dati sincronizzati e il tuo account dall'app, in autonomia, con cancellazione automatica entro 24 ore. Su un backend Supabase alternativo questo non è oggi un percorso supportato end-to-end: le funzioni di export e cancellazione dell'app presuppongono lo schema e le funzioni del backend gestito FitMesh, che non vengono replicate automaticamente su un progetto Supabase diverso. Per i dettagli completi vedi la",
    en: "On FitMesh's managed backend, you can always export or delete your synced data and account from within the app, on your own, with automatic deletion within 24 hours. On an alternative Supabase backend this isn't today a supported end-to-end path: the app's export and deletion functions rely on the managed FitMesh backend's schema and functions, which aren't automatically replicated on a different Supabase project. For full details, see the",
  } satisfies LocalizedText,

  privacyPolicyLink: {
    it: "Privacy Policy",
    en: "Privacy Policy",
  } satisfies LocalizedText,

  closingParagraph: {
    it: "Questa pagina descrive lo stato tecnico attuale, non un piano di rilascio. Non offriamo prezzi né date per una versione self-service: quando (e se) cambierà, questa pagina verrà aggiornata con i fatti verificati del momento.",
    en: "This page describes the current technical state, not a release plan. We don't offer pricing or dates for a self-service version: if and when that changes, this page will be updated with the verified facts of that time.",
  } satisfies LocalizedText,

  supportPrefix: {
    it: "Domande sull'app in generale? Vedi le ",
    en: "General questions about the app? See the ",
  } satisfies LocalizedText,

  supportLink: {
    it: "domande frequenti",
    en: "FAQ",
  } satisfies LocalizedText,

  supportSuffix: {
    it: ".",
    en: ".",
  } satisfies LocalizedText,
} as const;
