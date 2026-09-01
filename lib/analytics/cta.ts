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
 * `homepage_final_cta`, `beta_archive`, `fitness_data_sync`).
 * `homepage_pricing` era ambiguo — lo stesso valore era usato sia dalla card
 * Free sia dalla card "Prova 14 giorni" della sezione pricing, rendendo
 * impossibile distinguere la CTA che portava le conversioni — separato in
 * `homepage_pricing_free` / `homepage_pricing_trial` lo stesso giorno.
 * Poi (stesso giorno, review visiva post-deploy di Matteo) la card Free e'
 * stata rimossa perche' ridondante con la card Prova (stessa offerta, stili
 * diversi): resta una sola card pricing evidenziata, `homepage_pricing_trial`
 * — `homepage_pricing_free` rimosso, zero altri consumer.
 */
export const CTA_PLACEMENTS = {
  headerPrimary: "header_primary",
  mobileMenuPrimary: "mobile_menu_primary",
  homepageHero: "homepage_hero",
  homepagePricingTrial: "homepage_pricing_trial",
  homepageFinalCta: "homepage_final_cta",
  betaArchive: "beta_archive",
  fitnessDataSync: "fitness_data_sync",
  // FASE 7 P1.8C: le tre StoreButtonsRow di /sync/[provider] non avevano
  // ctaLocation (nessun data-cta-* emesso, cta_view/cta_click orfani per
  // l'intero funnel di 19 pagine provider). "Traccia almeno: CTA store
  // hero; CTA dopo la matrice; CTA finale" — un solo placement per
  // posizione, condiviso da tutti i provider (non uno per-provider: la
  // dimensione "provider" e' gia' distinguibile dal path/pagina).
  syncProviderHero: "sync_provider_hero",
  syncProviderMidMatrix: "sync_provider_mid_matrix",
  syncProviderFinalCta: "sync_provider_final_cta",
  // P1.9 FASE 3: modulo editoriale FitMesh nel blog (blocco
  // "fitmesh-editorial-cta", lib/blog/types.ts). Due sole posizioni ammesse
  // dal mandato, condivise da tutte le famiglie di pagine — la famiglia si
  // distingue con `content_cluster` sotto, non con un placement per famiglia
  // (stessa logica di syncProviderHero/... sopra: "provider"/"cluster" è già
  // una dimensione propria, non va duplicata nel placement).
  blogEditorialAfterSolution: "blog_editorial_after_solution",
  blogEditorialArticleEnd: "blog_editorial_article_end",
} as const;

export type CtaPlacement = (typeof CTA_PLACEMENTS)[keyof typeof CTA_PLACEMENTS];

/**
 * P1.9 FASE 6 — dimensione `content_cluster`: quale famiglia editoriale ha
 * generato l'evento, per distinguere il funnel per cluster di intento senza
 * bisogno di un placement diverso per famiglia (vedi commento sopra).
 * Chiuso apposta, stesso motivo di CTA_PLACEMENTS. Nessun dato sanitario o
 * identificativo: solo il nome del cluster editoriale.
 */
export const CONTENT_CLUSTERS = {
  healthConnectTroubleshooting: "health_connect_troubleshooting",
  garminSamsungHealth: "garmin_samsung_health",
  googleHealthVsFit: "google_health_vs_fit",
  smartRingHealthConnect: "smart_ring_health_connect",
  fitmeshVsAlternatives: "fitmesh_vs_alternatives",
  multiDeviceDedup: "multi_device_dedup",
} as const;

export type ContentCluster = (typeof CONTENT_CLUSTERS)[keyof typeof CONTENT_CLUSTERS];

/**
 * P1.9 FASE 6 — dimensione `target_type`: cosa risolve la CTA cliccata.
 * "store" è sempre emesso da StoreButtonsRow (vedi il suo
 * `data-cta-target-type` fisso); "internal_landing" va dichiarato a mano
 * sul singolo link secondario (es. verso /sync/[provider] o /integrations).
 */
export const TARGET_TYPES = {
  store: "store",
  internalLanding: "internal_landing",
} as const;

export type TargetType = (typeof TARGET_TYPES)[keyof typeof TARGET_TYPES];

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

/**
 * P0.14A — evento `external_community_click`, indipendente dal funnel
 * store_click/cta_click/cta_view sopra (nessuna `campaign`: non è il
 * funnel post-Founder). Dimensioni: `platform`, `placement`, `locale`,
 * `path` — nessun'altra, per istruzione esplicita di Matteo.
 */
export type CommunityLink = {
  platform: "reddit";
};

/**
 * Riconosce un link d'uscita verso la community ufficiale dal solo href.
 * Match sull'URL esatto (non un generico `includes("reddit.com")"): solo
 * https://www.reddit.com/r/FitMesh/ deve emettere l'evento, non qualunque
 * altro link Reddit che comparisse altrove sul sito (es. citazioni in
 * articoli).
 */
export function resolveCommunityLink(href: string): CommunityLink | null {
  if (href === "https://www.reddit.com/r/FitMesh/") {
    return { platform: "reddit" };
  }
  return null;
}

/** Placement chiusi per `external_community_click` — Footer e /support. */
export const COMMUNITY_PLACEMENTS = {
  footer: "footer",
  support: "support",
} as const;

export type CommunityPlacement = (typeof COMMUNITY_PLACEMENTS)[keyof typeof COMMUNITY_PLACEMENTS];
