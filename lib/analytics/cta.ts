/**
 * Sprint P0.10K — Fase 7 (analytics del funnel post-Founder).
 *
 * Sorgente UNICA dei valori condivisi dagli eventi GA4 del funnel ordinario
 * (`cta_view` -> `cta_click` -> `store_click`, emessi da
 * `components/OutboundTracker.tsx`). Prima di questo sprint la campagna era
 * una stringa inline dentro OutboundTracker e i "placement" erano stringhe
 * libere sparse nelle pagine: esattamente i valori che divergono in
 * silenzio (un refuso in una pagina = un segmento che sparisce dal report,
 * senza alcun errore ne' a build ne' a runtime).
 *
 * PRIVACY (vincolo non negoziabile): qui NON possono comparire, e gli
 * eventi che usano queste costanti non possono trasportare, dati sanitari
 * o identificativi personali. Le sole dimensioni ammesse sono: locale,
 * placement (posizione della CTA nel sito), store_destination (nome dello
 * store di destinazione), campaign, path della pagina. Nessun id utente,
 * nessuna email, nessun valore inserito dall'utente, nessuna metrica
 * fisiologica.
 *
 * Il modulo e' volutamente puro (solo costanti + una funzione senza stato):
 * viene importato sia da Server Component (Header) sia da Client Component
 * (OutboundTracker, MobileMenu), non tocca la rete e non rende dinamica
 * alcuna route.
 */

/**
 * Campagna del funnel commerciale post-Founder: "prova 14 giorni -> scarica
 * dallo store". Sostituisce la vecchia stringa inline "post_founder", che
 * viveva in un solo punto (store_click) e quindi rendeva il funnel
 * view -> click -> store non segmentabile su una dimensione unica.
 *
 * Va usata SEMPRE tramite questa costante: mai ricopiata inline.
 */
export const CTA_CAMPAIGN = "post_founder_trial";

/** Valore emesso quando il placement di una CTA non e' dichiarato nel DOM. */
export const CTA_UNSPECIFIED = "unspecified";

/**
 * Valore di `store_destination` quando l'evento non risolve a un singolo
 * store: una `cta_view` (una visualizzazione non ha destinazione) oppure un
 * `cta_click` su una CTA interna (es. l'ancora `#download` dell'header).
 * Serve a tenere le cinque dimensioni SEMPRE presenti su tutti e tre gli
 * eventi, invece di avere parametri assenti a intermittenza.
 */
export const CTA_NO_STORE_DESTINATION = "none";

/**
 * Vocabolario chiuso dei placement delle CTA post-Founder. Chiuso apposta:
 * `StoreButtonsRow` tipizza la sua prop su questa unione, quindi un refuso
 * rompe `tsc --noEmit` invece di produrre in silenzio un segmento orfano
 * in GA4.
 *
 * I valori restano quelli gia' in produzione (`homepage_hero`,
 * `homepage_final_cta`, `beta_archive`, `fitness_data_sync`) tranne
 * `homepage_pricing`, che era ambiguo — lo stesso valore era usato sia
 * dalla card Free sia dalla card "Prova 14 giorni", rendendo impossibile
 * distinguere la CTA che oggi porta le conversioni. E' stato separato in
 * `homepage_pricing_free` / `homepage_pricing_trial`.
 */
export const CTA_PLACEMENTS = {
  headerPrimary: "header_primary",
  mobileMenuPrimary: "mobile_menu_primary",
  homepageHero: "homepage_hero",
  homepagePricingFree: "homepage_pricing_free",
  homepagePricingTrial: "homepage_pricing_trial",
  homepageFinalCta: "homepage_final_cta",
  betaArchive: "beta_archive",
  fitnessDataSync: "fitness_data_sync",
} as const;

export type CtaPlacement = (typeof CTA_PLACEMENTS)[keyof typeof CTA_PLACEMENTS];

/**
 * `data-cta-id` delle due CTA di navigazione (header desktop + menu mobile).
 * Non sono `StoreButtonsRow` — sono ancore interne verso `/<locale>#download`
 * — quindi il loro id non e' derivabile e va dichiarato qui.
 */
export const CTA_IDS = {
  headerPrimary: "header-download-primary",
  mobileMenuPrimary: "mobile-menu-download-primary",
} as const;

/**
 * `data-cta-id` di una riga di badge store, derivato dal placement: un solo
 * valore da mantenere (il placement), zero tabelle parallele da tenere
 * allineate.
 */
export function storeButtonsCtaId(placement: CtaPlacement): string {
  return `store_buttons_${placement}`;
}

export type StoreLink = {
  /** Chiave tecnica, storica: parametro `store_platform` di `store_click`. */
  platform: "play" | "appstore";
  /** Nome leggibile dello store: parametro `store_destination`. */
  destination: "Google Play" | "App Store";
};

/**
 * Riconosce un link d'uscita verso uno store dal solo href. Funzione pura,
 * niente DOM: usata sia da `store_click` sia da `cta_click` (cosi' un click
 * su un badge store porta la stessa `store_destination` su entrambi gli
 * eventi, e il funnel resta agganciabile).
 */
export function resolveStoreLink(href: string): StoreLink | null {
  if (href.includes("play.google.com")) {
    return { platform: "play", destination: "Google Play" };
  }
  if (href.includes("apps.apple.com")) {
    return { platform: "appstore", destination: "App Store" };
  }
  return null;
}
