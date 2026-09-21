/**
 * Consenso analytics del sito (P0.24-A).
 *
 * Regola: prima di un «Accetta» esplicito nel banner non esiste niente di
 * Google nella pagina. Niente `gtag.js`, niente `window.gtag`, niente
 * `dataLayer`, niente ping cookieless. Il Consent Mode «advanced» usato fino
 * al 17/09/2026 caricava la libreria e mandava un `page_view` con consenso
 * negato gia' al primo accesso: riprodotto su Chromium e WebKit a profilo
 * pulito, ed era in contraddizione con Privacy e Cookie Policy.
 *
 * Le route in `isAnalyticsExcludedPath` non caricano mai analytics, nemmeno
 * con consenso: portano nell'URL codici OAuth, codici di invito o link di
 * reset, e il `page_view` di GA invia l'URL completo. Se ci si arriva con il
 * tag gia' caricato, la pagina si ricarica senza.
 */

export const GA_MEASUREMENT_ID = "G-WLBXXFB21G";
export const GA_SCRIPT_SRC = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
export const CONSENT_STORAGE_KEY = "fitmesh_cookie_consent";
export const CONSENT_CHANGED_EVENT = "fitmesh:consent-changed";
export const CONSENT_REOPEN_EVENT = "fitmesh:consent-reopen";
const GA_DISABLE_FLAG = `ga-disable-${GA_MEASUREMENT_ID}`;
const SCRIPT_ID = "fitmesh-ga4";

export type ConsentRecord = { analytics: boolean; ts: number };

type AnalyticsWindow = Window & {
  dataLayer?: unknown[];
  gtag?: (...args: unknown[]) => void;
  __fitmeshAnalytics?: { loaded: boolean; active: boolean };
  __fitmeshCollectGuard?: boolean;
  __fitmeshHistorySync?: boolean;
  __fitmeshReloading?: boolean;
  __fitmeshMemoryConsent?: ConsentRecord;
} & Record<string, unknown>;

const w = () => window as unknown as AnalyticsWindow;

/**
 * Se lo storage non e' disponibile (WebView senza DOM storage, quota, browser
 * che lo blocca) la scelta dell'utente vale per questo documento: senza,
 * alla prima navigazione client-side `applyConsent` non troverebbe nessuna
 * scelta, spegnerebbe GA e ricaricherebbe la pagina. La scelta in memoria si
 * usa solo se lo storage non ha un valore proprio: con lo storage funzionante
 * resta l'unica fonte, e una scelta cancellata altrove continua a valere.
 */
export function readConsent(): ConsentRecord | null {
  try {
    const raw = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!raw) return w().__fitmeshMemoryConsent ?? null;
    const parsed = JSON.parse(raw) as Partial<ConsentRecord>;
    if (typeof parsed?.analytics !== "boolean") return null;
    return { analytics: parsed.analytics, ts: Number(parsed.ts) || 0 };
  } catch {
    return w().__fitmeshMemoryConsent ?? null;
  }
}

export function writeConsent(analytics: boolean): ConsentRecord {
  const record: ConsentRecord = { analytics, ts: Date.now() };
  try {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(record));
    delete w().__fitmeshMemoryConsent;
  } catch {
    w().__fitmeshMemoryConsent = record;
  }
  window.dispatchEvent(new CustomEvent(CONSENT_CHANGED_EVENT, { detail: record }));
  return record;
}

export function requestConsentReopen(): void {
  window.dispatchEvent(new CustomEvent(CONSENT_REOPEN_EVENT));
}

const EXCLUDED_PATH =
  /^\/(?:oauth(?:\/|$)|[a-z]{2}\/(?:auth|app|admin)(?:\/|$)|[a-z]{2}\/famiglia\/join(?:\/|$))/;

/**
 * Il confronto non dipende da come il livello di hosting normalizza il
 * percorso: maiuscole, segmenti percent-encoded e slash doppi portano allo
 * stesso percorso escluso. Un percorso malformato si confronta cosi' com'e'.
 */
function normalizePath(pathname: string): string {
  let path = pathname;
  try {
    path = path.split("/").map((segment) => decodeURIComponent(segment)).join("/");
  } catch {
    /* sequenza % non valida: si usa il percorso originale */
  }
  return path.toLowerCase().replace(/\/{2,}/g, "/");
}

export function isAnalyticsExcludedPath(pathname: string): boolean {
  return EXCLUDED_PATH.test(normalizePath(pathname));
}

const KEPT_QUERY_PARAMS = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"];

const EMAIL = /[^\s@]+@[^\s@]+\.[^\s@]+/;
const UUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
const LONG_NUMBER = /\d{7,}/;
const TOKEN_QUERY = /[?&](?:code|state|token|token_hash|access_token|refresh_token)=/i;

/**
 * Un valore UTM e' un'etichetta di campagna, ma i link di alcuni strumenti di
 * email vi mettono l'indirizzo o l'id dell'iscritto. Si scartano indirizzi,
 * UUID, sequenze di 10 o piu' cifre (una data come 20260921 resta), stringhe
 * esadecimali lunghe, token in stile JWT e valori molto lunghi.
 */
function isUnsafeUtmValue(value: string): boolean {
  return (
    EMAIL.test(value) ||
    UUID.test(value) ||
    /\d{10,}/.test(value) ||
    /[0-9a-f]{24,}/i.test(value) ||
    /eyJ[\w-]{10,}\.[\w-]{10,}/.test(value) ||
    value.length > 100
  );
}

/** URL da inviare come `page_location`: origine e percorso, piu' i soli parametri UTM. */
export function sanitizePageLocation(href: string): string {
  let url: URL;
  try {
    url = new URL(href);
  } catch {
    return "";
  }
  const kept = new URLSearchParams();
  for (const key of KEPT_QUERY_PARAMS) {
    const value = url.searchParams.get(key);
    if (value) kept.set(key, isUnsafeUtmValue(value) ? "redacted" : value);
  }
  const query = kept.toString();
  return `${url.origin}${url.pathname}${query ? `?${query}` : ""}`;
}

/**
 * Referrer da inviare come `page_referrer`. `document.referrer` puo' essere
 * l'URL di una route esclusa: succede dopo una navigazione completa in uscita
 * da una pagina di accesso, dell'area privata o di un invito, anche via
 * avanti/indietro. Con un codice nel percorso o nella query arriverebbe a
 * Google col primo `page_view`. I referrer di altri siti restano invariati
 * (servono all'attribuzione del traffico), quelli del sito perdono la query
 * salvo i parametri UTM.
 */
export function sanitizeReferrer(referrer: string): string {
  if (!referrer) return "";
  let url: URL;
  try {
    url = new URL(referrer);
  } catch {
    return "";
  }
  if (url.origin !== window.location.origin) return referrer;
  return isAnalyticsExcludedPath(url.pathname) ? "" : sanitizePageLocation(referrer);
}

// I link agli store contengono l'id numerico dell'app (App Store: 10 cifre):
// sono pubblici e servono all'evento store_click, quindi non vanno oscurati.
const STORE_URL = /^https:\/\/(?:apps\.apple\.com|play\.google\.com)\/[^\s@]*$/;

/**
 * Parametri evento ammessi: solo stringhe corte o numeri, mai qualcosa che
 * somigli a un indirizzo email, a un identificativo interno o a un token.
 * I valori scartati vengono sostituiti da "redacted", la chiave resta.
 */
export function sanitizeEventParams(params: Record<string, unknown>): Record<string, string | number | boolean | null> {
  const out: Record<string, string | number | boolean | null> = {};
  for (const [key, value] of Object.entries(params)) {
    if (value === null || typeof value === "number" || typeof value === "boolean") {
      out[key] = value;
      continue;
    }
    const text = String(value);
    const storeLink = STORE_URL.test(text) && !TOKEN_QUERY.test(text);
    const unsafe =
      EMAIL.test(text) ||
      UUID.test(text) ||
      (!storeLink && LONG_NUMBER.test(text)) ||
      TOKEN_QUERY.test(text) ||
      text.length > 200;
    out[key] = unsafe ? "redacted" : text;
  }
  return out;
}

export function isAnalyticsActive(): boolean {
  if (typeof window === "undefined") return false;
  const state = w().__fitmeshAnalytics;
  return !!state?.loaded && !!state.active && typeof w().gtag === "function" && w()[GA_DISABLE_FLAG] !== true;
}

/**
 * Evento GA4, solo se l'utente ha accettato e la pagina non e' esclusa.
 * `page_location` va sull'evento: un `set` globale non sostituisce quello del
 * `config`, e dopo una navigazione client-side l'evento porterebbe la prima
 * pagina (verificato su Chromium e WebKit).
 */
export function trackEvent(name: string, params: Record<string, unknown>): void {
  if (!isAnalyticsActive()) return;
  if (isAnalyticsExcludedPath(window.location.pathname)) return;
  try {
    w().gtag!("event", name, {
      ...sanitizeEventParams(params),
      page_location: sanitizePageLocation(window.location.href),
    });
  } catch {
    /* un errore di analytics non deve rompere la pagina */
  }
}

const GOOGLE_TAG_HOST = /(^|\.)(google-analytics\.com|analytics\.google\.com|googletagmanager\.com)$/i;
const GA_COLLECT_HOST = /(^|\.)(google-analytics\.com|analytics\.google\.com)$/i;

function decodeParam(value: string): string | null {
  try {
    return decodeURIComponent(value.replace(/\+/g, " "));
  } catch {
    return null;
  }
}

/**
 * gtag.js genera da solo i `page_view` sulle navigazioni client-side e sul
 * avanti/indietro, con l'URL e il referrer del browser: query compresa
 * (`code`, `state`, `token`, click id, indirizzi). Ne' `send_page_view:false` ne'
 * `gtag("set")` lo impediscono (provato in browser su Chromium e WebKit).
 * L'unico punto sotto il controllo del sito e' l'uscita: qui `dl` e `dr` di ogni
 * richiesta di raccolta passano dagli stessi sanificatori del `config`, e i
 * campi campagna con un valore non sicuro diventano "redacted". Il resto della
 * richiesta resta identico byte per byte.
 */
export function sanitizeCollectQuery(query: string): string {
  return query
    .replace(/(^|&)(dl|dr)=([^&]*)/g, (_m, sep: string, key: string, value: string) => {
      const text = decodeParam(value);
      const clean = text === null ? "" : key === "dl" ? sanitizePageLocation(text) : sanitizeReferrer(text);
      return `${sep}${key}=${encodeURIComponent(clean)}`;
    })
    .replace(/(^|&)(cs|cm|cn|ct|cc)=([^&]*)/g, (match: string, sep: string, key: string, value: string) => {
      const text = decodeParam(value);
      return text !== null && !isUnsafeUtmValue(text) ? match : `${sep}${key}=redacted`;
    });
}

/** Il corpo di una richiesta raggruppata ha un evento per riga. */
function sanitizeCollectBody(body: unknown): unknown {
  if (typeof body !== "string") return body;
  return body
    .split("\n")
    .map((line) => {
      const cr = line.endsWith("\r") ? "\r" : "";
      return sanitizeCollectQuery(cr ? line.slice(0, -1) : line) + cr;
    })
    .join("\n");
}

/** URL e corpo ripuliti se la destinazione e' la raccolta di GA (stringa o URL); altrimenti null. */
function sanitizeCollectCall(target: unknown, body: unknown): { url: string; body: unknown } | null {
  try {
    const raw = typeof target === "string" ? target : target instanceof URL ? target.href : null;
    if (raw === null) return null;
    const url = new URL(raw, window.location.href);
    if (!GA_COLLECT_HOST.test(url.hostname)) return null;
    url.search = sanitizeCollectQuery(url.search.slice(1));
    return { url: url.href, body: sanitizeCollectBody(body) };
  } catch {
    return null;
  }
}

function isBlockedCollect(target: unknown): boolean {
  if (w()[GA_DISABLE_FLAG] !== true) return false;
  try {
    const raw =
      typeof target === "string" ? target : target instanceof URL ? target.href : (target as { url?: string })?.url;
    if (!raw) return false;
    return GOOGLE_TAG_HOST.test(new URL(raw, window.location.href).hostname);
  } catch {
    return false;
  }
}

/**
 * `ga-disable-<ID>` ferma gli eventi nuovi, ma non la coda che gtag.js ha gia'
 * formato: su Chromium e WebKit un evento `scroll` nato prima del rifiuto
 * partiva ~5 secondi dopo la revoca. Questa guardia, installata prima di
 * caricare gtag.js, scarta ogni fetch e sendBeacon verso i domini di GA e del
 * Google tag finche' il flag e' attivo, anche durante la ricarica che segue la
 * revoca. Tutte le altre richieste passano invariate.
 */
function installCollectGuard(): void {
  const win = w();
  if (win.__fitmeshCollectGuard) return;
  win.__fitmeshCollectGuard = true;
  if (typeof window.fetch === "function") {
    const originalFetch = window.fetch.bind(window);
    window.fetch = function fetch(...args: Parameters<typeof window.fetch>) {
      if (isBlockedCollect(args[0])) return Promise.resolve(new Response(null, { status: 204 }));
      const clean = sanitizeCollectCall(args[0], args[1]?.body);
      if (!clean) return originalFetch(...args);
      return originalFetch(clean.url, { ...args[1], body: clean.body as BodyInit | null | undefined });
    } as typeof window.fetch;
  }
  if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
    const originalBeacon = navigator.sendBeacon.bind(navigator);
    navigator.sendBeacon = function sendBeacon(...args: Parameters<Navigator["sendBeacon"]>) {
      if (isBlockedCollect(args[0])) return true;
      const clean = sanitizeCollectCall(args[0], args[1]);
      return clean ? originalBeacon(clean.url, clean.body as BodyInit | null | undefined) : originalBeacon(...args);
    };
  }
}

/**
 * gtag.js avvolge history.pushState/replaceState e ascolta popstate per i
 * page_view automatici. Questo aggancio, installato prima di gtag.js (che poi
 * lo avvolge), applica il consenso al nuovo URL prima che gtag.js veda il
 * cambio: entrando in una route esclusa GA e' gia' sospeso, senza dipendere
 * dall'ordine dei re-render di React.
 */
function installHistorySync(): void {
  const win = w();
  if (win.__fitmeshHistorySync) return;
  win.__fitmeshHistorySync = true;
  for (const method of ["pushState", "replaceState"] as const) {
    const original = window.history[method];
    window.history[method] = function (this: History, ...args: Parameters<History["pushState"]>) {
      const before = window.location.href;
      const result = original.apply(this, args);
      if (window.location.href !== before) applyConsent(window.location.pathname);
      return result;
    };
  }
  window.addEventListener("popstate", () => applyConsent(window.location.pathname));
}

/**
 * Carica GA4 una sola volta, e solo se chiamata dopo un consenso esplicito.
 * Idempotente: chiamate ripetute non aggiungono script ne' `config`.
 */
export function loadAnalytics(): void {
  if (typeof window === "undefined") return;
  const win = w();
  if (isAnalyticsExcludedPath(window.location.pathname)) return;
  installCollectGuard();
  installHistorySync();
  win[GA_DISABLE_FLAG] = false;
  if (win.__fitmeshAnalytics?.loaded) {
    const wasActive = win.__fitmeshAnalytics.active;
    win.__fitmeshAnalytics.active = true;
    if (!wasActive) win.gtag?.("consent", "update", { analytics_storage: "granted" });
    return;
  }
  win.dataLayer = win.dataLayer || [];
  const dataLayer = win.dataLayer;
  win.gtag = function gtag() {
    // gtag.js legge l'oggetto `arguments`, non un array: va passato cosi'.
    dataLayer.push(arguments);
  };
  win.gtag("consent", "default", {
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
    analytics_storage: "granted",
  });
  win.gtag("js", new Date());
  win.gtag("config", GA_MEASUREMENT_ID, {
    page_location: sanitizePageLocation(window.location.href),
    page_referrer: sanitizeReferrer(document.referrer),
    anonymize_ip: true,
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
  });
  if (!document.getElementById(SCRIPT_ID)) {
    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.async = true;
    script.src = GA_SCRIPT_SRC;
    document.head.appendChild(script);
  }
  win.__fitmeshAnalytics = { loaded: true, active: true };
}

// La famiglia di cookie analytics di Google: GA4 imposta solo `_ga` e `_ga_<ID>`,
// gli altri sono di versioni precedenti o di configurazioni con la pubblicita'.
const GA_COOKIE = /^(?:_ga|_ga_.+|_gid|_gat|_gat_.+|_gac_.+)$/;

/**
 * Cookie analytics di Google sull'host corrente e sui domini padre, con il
 * percorso radice e con ogni prefisso del percorso corrente: un cookie si
 * cancella solo con lo stesso dominio e lo stesso percorso con cui e' stato
 * scritto. GA4 usa `path=/` sul dominio padre (verificato in browser), ma un
 * `cookie_path` diverso o una versione precedente non devono restare.
 * Gli altri cookie del sito (Supabase, lingua) non si toccano.
 */
export function clearAnalyticsCookies(host: string = window.location.hostname, pathname: string = window.location.pathname): void {
  const names = new Set(
    document.cookie
      .split(";")
      .map((c) => c.trim().split("=")[0])
      .filter((n) => GA_COOKIE.test(n)),
  );
  const parts = host.split(".");
  const domains = [""];
  for (let i = 0; i < parts.length - 1; i++) domains.push(`; domain=.${parts.slice(i).join(".")}`);
  const paths = ["/"];
  let prefix = "";
  for (const segment of pathname.split("/").filter(Boolean)) {
    prefix += `/${segment}`;
    paths.push(prefix);
  }
  const expired = "; expires=Thu, 01 Jan 1970 00:00:00 GMT";
  for (const name of names) {
    for (const domain of domains) {
      for (const path of paths) document.cookie = `${name}=${expired}; path=${path}${domain}`;
    }
  }
}

/** Ricarica della pagina, separata per poterla sostituire nei test (jsdom non la implementa). */
export const pageLifecycle = { reload: () => window.location.reload() };

/**
 * gtag.js, una volta caricato, non si puo' scaricare: restano i suoi timer, su
 * una piccola parte dei caricamenti invia richieste diagnostiche a
 * googletagmanager.com anche dopo il rifiuto (anche come pixel immagine, che
 * la guardia non vede), e ricorda l'ultimo URL per mandarlo come referrer al
 * page_view successivo. Per questo, dopo una revoca o entrando in una route
 * esclusa, la pagina si ricarica senza il tag. Il flag e la guardia coprono
 * l'intervallo fino alla ricarica.
 */
function suspendAndReload(): void {
  const win = w();
  win[GA_DISABLE_FLAG] = true;
  if (!win.__fitmeshAnalytics?.loaded) return;
  win.__fitmeshAnalytics.active = false;
  if (win.__fitmeshReloading) return;
  win.__fitmeshReloading = true;
  blockExternalRequestsUntilReload();
  pageLifecycle.reload();
}

/**
 * Alla chiusura della pagina gtag.js puo' ancora inserire un'ultima richiesta
 * diagnostica come <script> verso googletagmanager.com (vista su Chromium con i
 * diagnostici del tag attivi), che la guardia su fetch e sendBeacon non vede.
 * Una Content Security Policy aggiunta alla pagina che sta per essere scartata
 * blocca script, immagini e connessioni verso altri domini fino alla ricarica.
 * Il sito non registra gestori beforeunload, quindi la ricarica non si ferma.
 */
export const RELOAD_CSP = "script-src 'none'; img-src 'none'; connect-src 'self'";

function blockExternalRequestsUntilReload(): void {
  const meta = document.createElement("meta");
  meta.httpEquiv = "Content-Security-Policy";
  meta.content = RELOAD_CSP;
  document.head.appendChild(meta);
}

/**
 * Rifiuto o revoca: nessun evento successivo, cookie `_ga*` cancellati e, se il
 * tag era stato caricato in questa pagina, ricarica senza il tag.
 */
export function disableAnalytics(): void {
  if (typeof window === "undefined") return;
  const win = w();
  const loaded = !!win.__fitmeshAnalytics?.loaded;
  // Prima flag, CSP e ricarica: gtag.js reagisce subito all'aggiornamento del
  // consenso e su Chromium puo' inviare i suoi diagnostici in quel momento.
  suspendAndReload();
  if (loaded) {
    try {
      win.gtag?.("consent", "update", { analytics_storage: "denied" });
    } catch {
      /* silent */
    }
  }
  clearAnalyticsCookies();
}

/** Stato da applicare alla pagina corrente: carica, sospende o non fa nulla. */
export function applyConsent(pathname: string): void {
  const consent = readConsent();
  if (!consent) {
    // Nessuna scelta salvata vale come nessun consenso: se GA era gia' attivo
    // (dati del sito cancellati in un'altra scheda), si spegne.
    if (w().__fitmeshAnalytics?.loaded) disableAnalytics();
    return;
  }
  if (!consent.analytics) {
    disableAnalytics();
    return;
  }
  if (isAnalyticsExcludedPath(pathname)) {
    if (w().__fitmeshAnalytics?.loaded) suspendAndReload();
    return;
  }
  loadAnalytics();
}
