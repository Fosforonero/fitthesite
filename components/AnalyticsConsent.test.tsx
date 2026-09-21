import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render } from "@testing-library/react";

let currentPath = "/it";
vi.mock("next/navigation", () => ({ usePathname: () => currentPath }));

import AnalyticsConsent from "./AnalyticsConsent";
import CookieBanner from "./CookieBanner";
import OutboundTracker from "./OutboundTracker";
import { getDictionary } from "@/lib/i18n";
import {
  CONSENT_STORAGE_KEY,
  GA_MEASUREMENT_ID,
  isAnalyticsActive,
  clearAnalyticsCookies,
  isAnalyticsExcludedPath,
  sanitizeCollectQuery,
  pageLifecycle,
  RELOAD_CSP,
  RELOAD_RETRY_MS,
  resetReloadState,
  sanitizeEventParams,
  sanitizeReferrer,
  sanitizePageLocation,
  trackEvent,
  writeConsent,
} from "@/lib/analytics/consent";

/**
 * P0.24-A: prima del consenso non esiste niente di Google nella pagina, il
 * rifiuto non produce richieste, la revoca ferma gli eventi e ricarica la
 * pagina senza il tag, il consenso non carica due volte e le route con codici
 * nell'URL non caricano mai GA.
 */

type Win = Window & Record<string, unknown> & { dataLayer?: IArguments[] };
const win = () => window as unknown as Win;
const DISABLE = `ga-disable-${GA_MEASUREMENT_ID}`;

function gaScripts() {
  return document.querySelectorAll('script[src*="googletagmanager.com/gtag/js"]');
}
function commands(name: string): unknown[][] {
  return (win().dataLayer ?? []).map((a) => Array.from(a)).filter((a) => a[0] === name);
}
function reloadCsp() {
  return [...document.querySelectorAll<HTMLMetaElement>('meta[http-equiv="Content-Security-Policy"]')].map((m) => m.content);
}
function goTo(path: string) {
  currentPath = path;
  window.history.replaceState({}, "", path);
}
/** Quello che una ricarica butta via: script, meta, variabili di pagina, timer. */
function discardDocument() {
  document.querySelectorAll("script, meta[http-equiv]").forEach((s) => s.remove());
  for (const key of ["gtag", "dataLayer", "__fitmeshAnalytics", "__fitmeshCollectGuard", "__fitmeshHistorySync", "__fitmeshReloading", "__fitmeshMemoryConsent", DISABLE]) {
    delete win()[key];
  }
  resetReloadState();
}
/** Ripristino della pagina dalla cache avanti/indietro (`pageshow`). */
function restore(persisted: boolean) {
  const event = new Event("pageshow") as Event & { persisted: boolean };
  Object.defineProperty(event, "persisted", { value: persisted });
  window.dispatchEvent(event);
}

class NoopIO implements IntersectionObserver {
  readonly root = null;
  readonly rootMargin = "";
  readonly thresholds: ReadonlyArray<number> = [];
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
}

// Node 25+ espone un `localStorage` globale che, senza --localstorage-file,
// vale undefined e copre quello di jsdom: uno Storage in memoria rende il
// test identico su Node 22 (CI) e sulle versioni locali piu' recenti.
class MemoryStorage implements Storage {
  private data = new Map<string, string>();
  get length() {
    return this.data.size;
  }
  clear() {
    this.data.clear();
  }
  getItem(key: string) {
    return this.data.has(key) ? this.data.get(key)! : null;
  }
  key(index: number) {
    return [...this.data.keys()][index] ?? null;
  }
  removeItem(key: string) {
    this.data.delete(key);
  }
  setItem(key: string, value: string) {
    this.data.set(key, String(value));
  }
}

const reload = vi.fn();
const originalReload = pageLifecycle.reload;

beforeEach(() => {
  reload.mockReset();
  pageLifecycle.reload = reload;
  (globalThis as unknown as { IntersectionObserver: unknown }).IntersectionObserver = NoopIO;
  Object.defineProperty(window, "localStorage", { value: new MemoryStorage(), configurable: true });
  goTo("/it");
});

const originalFetch = window.fetch;
const originalBeacon = navigator.sendBeacon;
const originalPushState = window.history.pushState;
const originalReplaceState = window.history.replaceState;
const popstateListeners: EventListenerOrEventListenerObject[] = [];
const originalAddEventListener = window.addEventListener.bind(window);
window.addEventListener = ((type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions) => {
  if (type === "popstate") popstateListeners.push(listener);
  originalAddEventListener(type, listener, options);
}) as typeof window.addEventListener;

afterEach(() => {
  cleanup();
  discardDocument();
  pageLifecycle.reload = originalReload;
  delete (document as unknown as Record<string, unknown>).referrer;
  window.history.pushState = originalPushState;
  window.history.replaceState = originalReplaceState;
  for (const listener of popstateListeners.splice(0)) window.removeEventListener("popstate", listener);
  window.fetch = originalFetch;
  Object.defineProperty(navigator, "sendBeacon", { value: originalBeacon, configurable: true, writable: true });
  document.cookie.split(";").forEach((c) => {
    const name = c.trim().split("=")[0];
    if (name) document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
  });
});

describe("prima del consenso", () => {
  it("primo accesso: nessuno script GA, nessun gtag, nessun dataLayer", () => {
    render(<AnalyticsConsent />);
    expect(gaScripts()).toHaveLength(0);
    expect(win().gtag).toBeUndefined();
    expect(win().dataLayer).toBeUndefined();
    expect(isAnalyticsActive()).toBe(false);
  });

  it("un click su uno store senza consenso non genera alcun evento", () => {
    render(
      <>
        <AnalyticsConsent />
        <OutboundTracker />
        <a href="https://play.google.com/store/apps/details?id=com.fitmeshsync.app" data-cta-id="x">Play</a>
      </>,
    );
    fireEvent.click(document.querySelector("a")!);
    expect(win().dataLayer).toBeUndefined();
    expect(gaScripts()).toHaveLength(0);
  });
});

describe("rifiuto", () => {
  it("una scelta di rifiuto salvata non carica niente", () => {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify({ analytics: false, ts: 1 }));
    render(<AnalyticsConsent />);
    expect(gaScripts()).toHaveLength(0);
    expect(win().gtag).toBeUndefined();
    trackEvent("cta_click", { cta_id: "x" });
    expect(win().dataLayer).toBeUndefined();
    expect(reload).not.toHaveBeenCalled();
  });

  it("rifiutare dal banner non carica niente e non ricarica la pagina", () => {
    render(<AnalyticsConsent />);
    act(() => {
      writeConsent(false);
    });
    expect(gaScripts()).toHaveLength(0);
    expect(win().dataLayer).toBeUndefined();
    expect(reload).not.toHaveBeenCalled();
    expect(reloadCsp()).toEqual([]);
  });
});

describe("consenso", () => {
  it("accettare carica GA una volta sola, con un solo config", () => {
    render(<AnalyticsConsent />);
    act(() => {
      writeConsent(true);
    });
    expect(gaScripts()).toHaveLength(1);
    expect(commands("config")).toHaveLength(1);
    act(() => {
      writeConsent(true);
    });
    expect(gaScripts()).toHaveLength(1);
    expect(commands("config")).toHaveLength(1);
    expect(isAnalyticsActive()).toBe(true);
  });

  it("consenso gia' salvato: carica al montaggio, senza segnali pubblicitari", () => {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify({ analytics: true, ts: 1 }));
    render(<AnalyticsConsent />);
    expect(gaScripts()).toHaveLength(1);
    const [[, , defaults]] = commands("consent") as [[string, string, Record<string, string>]];
    expect(defaults).toMatchObject({ ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied" });
    const [[, , config]] = commands("config") as [[string, string, Record<string, unknown>]];
    expect(config).toMatchObject({ allow_google_signals: false, allow_ad_personalization_signals: false });
  });

  it("una navigazione client-side non ricarica GA e non aggiunge page_view manuali", () => {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify({ analytics: true, ts: 1 }));
    const { rerender } = render(<AnalyticsConsent />);
    for (const path of ["/it/integrations", "/it/about", "/it"]) {
      goTo(path);
      rerender(<AnalyticsConsent />);
    }
    expect(gaScripts()).toHaveLength(1);
    expect(commands("config")).toHaveLength(1);
    const pageViews = commands("event").filter((c) => c[1] === "page_view");
    expect(pageViews).toHaveLength(0);
  });

  it("page_location non porta query string ne' frammento, salvo i parametri UTM", () => {
    goTo("/it?code=SEGRETO&utm_source=newsletter#token=abc");
    window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify({ analytics: true, ts: 1 }));
    render(<AnalyticsConsent />);
    const [[, , config]] = commands("config") as [[string, string, Record<string, string>]];
    expect(config.page_location).toBe(`${window.location.origin}/it?utm_source=newsletter`);
    expect(sanitizePageLocation("https://www.fitmesh.fit/it/x?state=1&utm_medium=m")).toBe(
      "https://www.fitmesh.fit/it/x?utm_medium=m",
    );
  });
});

describe("revoca", () => {
  it("dopo la revoca nessun evento parte, i cookie _ga vengono cancellati e la pagina si ricarica senza il tag", () => {
    render(<AnalyticsConsent />);
    act(() => {
      writeConsent(true);
    });
    document.cookie = "_ga=GA1.1.123.456; path=/";
    document.cookie = `_ga_${GA_MEASUREMENT_ID.slice(2)}=GS1.1.1; path=/`;
    // gtag.js reagisce subito all'aggiornamento del consenso (su Chromium con un
    // <script> diagnostico): a quel punto la CSP deve gia' esserci.
    const cspAtConsentUpdate: number[] = [];
    const realGtag = win().gtag as (...args: unknown[]) => void;
    win().gtag = (...args: unknown[]) => {
      if (args[0] === "consent") cspAtConsentUpdate.push(reloadCsp().length);
      realGtag(...args);
    };
    const before = win().dataLayer!.length;
    act(() => {
      writeConsent(false);
    });
    expect(win()[DISABLE]).toBe(true);
    expect(isAnalyticsActive()).toBe(false);
    expect(document.cookie).not.toMatch(/_ga/);
    const afterRevoke = win().dataLayer!.length;
    trackEvent("cta_click", { cta_id: "x" });
    expect(win().dataLayer!.length).toBe(afterRevoke);
    expect(commands("consent").at(-1)).toEqual(["consent", "update", { analytics_storage: "denied" }]);
    expect(afterRevoke).toBe(before + 1);
    expect(reload).toHaveBeenCalledTimes(1);
    // Fino alla ricarica la pagina non puo' caricare script o immagini ne' connettersi ad altri domini.
    expect(reloadCsp()).toEqual([RELOAD_CSP]);
    expect(cspAtConsentUpdate).toEqual([1]);
    expect(RELOAD_CSP).toMatch(/script-src 'none'/);
    expect(RELOAD_CSP).toMatch(/img-src 'none'/);
    expect(RELOAD_CSP).toMatch(/connect-src 'self'/);
    // Un secondo rifiuto prima che la ricarica sia avvenuta non ne chiede un'altra.
    act(() => {
      writeConsent(false);
    });
    expect(reload).toHaveBeenCalledTimes(1);
    expect(reloadCsp()).toHaveLength(1);
  });

  it("fino alla ricarica la coda gia' formata da gtag.js non esce: fetch e sendBeacon verso GA e Google tag scartati", async () => {
    const fetchSpy = vi.fn(async () => new Response(null, { status: 200 }));
    const beaconSpy = vi.fn(() => true);
    window.fetch = fetchSpy as unknown as typeof window.fetch;
    Object.defineProperty(navigator, "sendBeacon", { value: beaconSpy, configurable: true, writable: true });
    render(<AnalyticsConsent />);
    act(() => {
      writeConsent(true);
    });
    const collect = "https://region1.google-analytics.com/g/collect?v=2&en=scroll";
    await window.fetch(collect, { method: "POST", keepalive: true });
    navigator.sendBeacon(collect, "en=scroll");
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(beaconSpy).toHaveBeenCalledTimes(1);
    act(() => {
      writeConsent(false);
    });
    const blocked = await window.fetch(collect, { method: "POST", keepalive: true });
    expect(blocked.status).toBe(204);
    expect(navigator.sendBeacon(new URL("https://www.google-analytics.com/g/collect"), "x")).toBe(true);
    await window.fetch(new Request("https://www.googletagmanager.com/td?id=G-TEST&fin=1"));
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(beaconSpy).toHaveBeenCalledTimes(1);
    await window.fetch("https://www.fitmesh.fit/api/v1/ping");
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  it("una nuova visita dopo la revoca non carica GA", () => {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify({ analytics: false, ts: 2 }));
    render(<AnalyticsConsent />);
    expect(gaScripts()).toHaveLength(0);
  });
});

describe("altre schede e contesto pagina", () => {
  it("un rifiuto salvato in un'altra scheda spegne GA anche qui", () => {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify({ analytics: true, ts: 1 }));
    render(<AnalyticsConsent />);
    expect(isAnalyticsActive()).toBe(true);
    window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify({ analytics: false, ts: 2 }));
    act(() => {
      window.dispatchEvent(new StorageEvent("storage", { key: CONSENT_STORAGE_KEY }));
    });
    expect(isAnalyticsActive()).toBe(false);
    expect(win()[DISABLE]).toBe(true);
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it("dati del sito cancellati in un'altra scheda: nessuna scelta vale come nessun consenso", () => {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify({ analytics: true, ts: 1 }));
    render(<AnalyticsConsent />);
    window.localStorage.clear();
    act(() => {
      window.dispatchEvent(new StorageEvent("storage", { key: null }));
    });
    expect(isAnalyticsActive()).toBe(false);
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it("dopo una navigazione client-side gli eventi portano la pagina corrente, ripulita", () => {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify({ analytics: true, ts: 1 }));
    const { rerender } = render(<AnalyticsConsent />);
    goTo("/it/integrations?ref=abc&utm_campaign=x");
    rerender(<AnalyticsConsent />);
    trackEvent("cta_click", { cta_id: "x", page_location: "https://esempio.test/altro?code=1" });
    const [ev] = commands("event") as [[string, string, Record<string, unknown>]];
    expect(ev[2].page_location).toBe(`${window.location.origin}/it/integrations?utm_campaign=x`);
    // Un `set` globale non basta con GA4 (resta il valore del config): non deve servire.
    expect(commands("set")).toHaveLength(0);
    expect(commands("config")).toHaveLength(1);
  });

  // gtag.js avvolge history.pushState dopo di noi e legge page_location subito
  // dopo il cambio di URL: qui lo si simula con un involucro esterno.
  function wrapLikeGtag(read: () => unknown) {
    const seen: unknown[] = [];
    const inner = window.history.pushState;
    window.history.pushState = function (this: History, ...args: Parameters<History["pushState"]>) {
      inner.apply(this, args);
      seen.push(read());
    };
    return seen;
  }

  it("indietro verso una route esclusa: GA e' sospeso prima dell'ascoltatore popstate di gtag.js", () => {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify({ analytics: true, ts: 1 }));
    render(<AnalyticsConsent />);
    // Registrato dopo il nostro, come fa gtag.js che viene caricato dopo.
    const seen: unknown[] = [];
    const gtagListener = () => seen.push([isAnalyticsActive(), win()[DISABLE]]);
    window.addEventListener("popstate", gtagListener);
    originalReplaceState.call(window.history, {}, "", "/it/famiglia/join/CODICE");
    window.dispatchEvent(new PopStateEvent("popstate"));
    expect(seen).toEqual([[false, true]]);
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it("entrando in una route esclusa con pushState, GA e' gia' sospeso quando gtag.js vede il cambio", () => {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify({ analytics: true, ts: 1 }));
    render(<AnalyticsConsent />);
    const seen = wrapLikeGtag(() => [isAnalyticsActive(), win()[DISABLE]]);
    window.history.pushState({}, "", "/it/auth/login?code=X");
    window.history.pushState({}, "", "/it/integrations");
    // Il secondo passaggio vale solo se la ricarica non e' ancora avvenuta.
    expect(seen).toEqual([
      [false, true],
      [true, false],
    ]);
    expect(reload).toHaveBeenCalledTimes(1);
    expect(JSON.stringify(commands("event"))).not.toContain("/auth/");
  });
});

describe("route escluse", () => {
  const excluded = [
    "/oauth/fitbit/callback?code=X&state=Y",
    "/oauth/strava-callback?code=X",
    "/it/auth/reset-password?code=X",
    "/de/auth/login",
    "/en/app/devices",
    "/fr/admin/beta",
    "/it/famiglia/join/CODICE",
  ];
  for (const path of excluded) {
    it(`${path}: nessun caricamento anche con consenso`, () => {
      goTo(path);
      window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify({ analytics: true, ts: 1 }));
      render(<AnalyticsConsent />);
      expect(gaScripts()).toHaveLength(0);
      expect(win().gtag).toBeUndefined();
    });
  }

  it("entrando in una route esclusa gli eventi si fermano e la pagina si ricarica senza il tag", () => {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify({ analytics: true, ts: 1 }));
    const { rerender } = render(<AnalyticsConsent />);
    expect(isAnalyticsActive()).toBe(true);
    goTo("/it/app");
    rerender(<AnalyticsConsent />);
    expect(isAnalyticsActive()).toBe(false);
    expect(reload).toHaveBeenCalledTimes(1);
    expect(reloadCsp()).toEqual([RELOAD_CSP]);
    const size = win().dataLayer!.length;
    trackEvent("cta_click", { cta_id: "x" });
    expect(win().dataLayer!.length).toBe(size);
    // Qui la ricarica e' simulata: uscendo, lo stato si riattiva senza un secondo script.
    goTo("/it/integrations");
    rerender(<AnalyticsConsent />);
    expect(isAnalyticsActive()).toBe(true);
    expect(gaScripts()).toHaveLength(1);
  });
});

describe("referrer", () => {
  const setReferrer = (value: string) => Object.defineProperty(document, "referrer", { value, configurable: true });
  const config = () => (commands("config") as [[string, string, Record<string, unknown>]])[0][2];
  const accept = () => window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify({ analytics: true, ts: 1 }));

  it("il referrer di una route esclusa non arriva a GA: dopo un avanti/indietro l'URL escluso sarebbe il referrer", () => {
    for (const path of [
      "/it/famiglia/join/CODICE-SEGRETO?x=1",
      "/it/auth/login",
      "/en/app/devices",
      "/oauth/fitbit/callback?code=X&state=Y",
      "/fr/admin/beta",
    ]) {
      setReferrer(`${window.location.origin}${path}`);
      accept();
      const { unmount } = render(<AnalyticsConsent />);
      expect(config().page_referrer, path).toBe("");
      expect(JSON.stringify((win().dataLayer ?? []).map((a) => Array.from(a))), path).not.toMatch(/CODICE-SEGRETO|code=X|\/auth\/|\/app\/|\/admin\//);
      unmount();
      document.querySelectorAll("script").forEach((el) => el.remove());
      for (const key of ["gtag", "dataLayer", "__fitmeshAnalytics", "__fitmeshCollectGuard", "__fitmeshHistorySync", "__fitmeshReloading", DISABLE]) delete win()[key];
    }
  });

  it("il referrer del sito perde la query salvo UTM, quello di altri siti resta invariato", () => {
    setReferrer(`${window.location.origin}/it/integrations?ref=abc&utm_source=news`);
    expect(sanitizeReferrer(document.referrer)).toBe(`${window.location.origin}/it/integrations?utm_source=news`);
    expect(sanitizeReferrer("https://www.google.com/search?q=fitmesh")).toBe("https://www.google.com/search?q=fitmesh");
    accept();
    render(<AnalyticsConsent />);
    expect(config().page_referrer).toBe(`${window.location.origin}/it/integrations?utm_source=news`);
  });

  it("nessun referrer o un referrer non valido non producono un valore", () => {
    expect(sanitizeReferrer("")).toBe("");
    expect(sanitizeReferrer("non un url")).toBe("");
  });
});

describe("parametri evento", () => {
  it("scarta email, identificativi interni, numeri lunghi e token", () => {
    const out = sanitizeEventParams({
      cta_id: "header-download-primary",
      path: "/it/sync/garmin",
      email: "mario.rossi@example.com",
      user: "3f2b8c1e-9a4d-4c2e-8f1a-2b3c4d5e6f70",
      phone: "3471234567",
      link_url: "https://www.fitmesh.fit/oauth/fitbit/callback?code=abc",
      count: 3,
    });
    expect(out).toEqual({
      cta_id: "header-download-primary",
      path: "/it/sync/garmin",
      email: "redacted",
      user: "redacted",
      phone: "redacted",
      link_url: "redacted",
      count: 3,
    });
  });

  it("i link agli store restano leggibili, anche con l'id numerico dell'app", () => {
    const apple = "https://apps.apple.com/app/fitmesh-sync/id6779751708";
    const play = "https://play.google.com/store/apps/details?id=com.fitmeshsync.app&utm_source=site";
    expect(sanitizeEventParams({ link_url: apple })).toEqual({ link_url: apple });
    expect(sanitizeEventParams({ link_url: play })).toEqual({ link_url: play });
    expect(sanitizeEventParams({ link_url: `${apple}?code=abc` })).toEqual({ link_url: "redacted" });
    expect(sanitizeEventParams({ link_url: "https://apps.apple.com/me@example.com" })).toEqual({ link_url: "redacted" });
  });

  it("gli eventi inviati con consenso passano dal filtro", () => {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify({ analytics: true, ts: 1 }));
    render(<AnalyticsConsent />);
    trackEvent("cta_click", { cta_id: "ok", note: "scrivi a mario.rossi@example.com" });
    const [ev] = commands("event") as [[string, string, Record<string, unknown>]];
    expect(ev[2]).toEqual({ cta_id: "ok", note: "redacted", page_location: `${window.location.origin}/it` });
  });
});

// ---------------------------------------------------------------------------
// Micro-gate P0.24-A-A: correzioni emerse dalla revisione avversariale.
// ---------------------------------------------------------------------------

const ORIGIN = () => window.location.origin;
const enc = encodeURIComponent;

describe("uscita verso GA: dl e dr sanificati su ogni richiesta di raccolta", () => {
  // gtag.js genera da solo i page_view sulla history con URL e referrer del
  // browser, query compresa: l'unico punto controllabile e' l'uscita.
  const collect = () =>
    `https://region1.google-analytics.com/g/collect?v=2&tid=G-TEST&gtm=45je69f3v9&_p=1234567890&gcs=G101&` +
    `dl=${enc(`${ORIGIN()}/it/about?code=SECRETCODE1&state=SECRETSTATE1&token=TOK123&fbclid=FB1&utm_source=news`)}&` +
    `dr=${enc(`${ORIGIN()}/it?code=SECRETCODE2&email=mario@example.com`)}&cid=123456789.1234567890&en=page_view`;

  function setup() {
    const fetchSpy = vi.fn(async (..._args: unknown[]) => new Response(null, { status: 204 }));
    const beaconSpy = vi.fn((..._args: unknown[]) => true);
    window.fetch = fetchSpy as unknown as typeof window.fetch;
    Object.defineProperty(navigator, "sendBeacon", { value: beaconSpy, configurable: true, writable: true });
    render(<AnalyticsConsent />);
    act(() => {
      writeConsent(true);
    });
    return { fetchSpy, beaconSpy };
  }

  it("fetch: dl e dr perdono code, state, token e click id; il resto della richiesta resta identico", async () => {
    const { fetchSpy } = setup();
    await window.fetch(collect(), { method: "POST", keepalive: true });
    const sent = String(fetchSpy.mock.calls.at(-1)![0]);
    const q = new URL(sent).searchParams;
    expect(q.get("dl")).toBe(`${ORIGIN()}/it/about?utm_source=news`);
    expect(q.get("dr")).toBe(`${ORIGIN()}/it`);
    for (const [k, v] of [["v", "2"], ["tid", "G-TEST"], ["gtm", "45je69f3v9"], ["_p", "1234567890"], ["gcs", "G101"], ["cid", "123456789.1234567890"], ["en", "page_view"]]) {
      expect(q.get(k), k).toBe(v);
    }
    expect(sent).not.toMatch(/SECRET|TOK123|FB1|mario|example\.com/);
  });

  it("fetch: anche le righe del corpo di una richiesta raggruppata, con i loro fine riga", async () => {
    const { fetchSpy } = setup();
    const body =
      `en=scroll&epn.percent_scrolled=90&dl=${enc(`${ORIGIN()}/it?code=SECRETCODE1&utm_medium=m`)}\r\n` +
      `en=page_view&dr=${enc(`${ORIGIN()}/it/x?token=TOK123`)}&_et=5`;
    await window.fetch("https://region1.google-analytics.com/g/collect?v=2&tid=G-TEST", { method: "POST", body });
    const sentBody = String((fetchSpy.mock.calls.at(-1)![1] as RequestInit).body);
    expect(sentBody).toBe(
      `en=scroll&epn.percent_scrolled=90&dl=${enc(`${ORIGIN()}/it?utm_medium=m`)}\r\n` +
        `en=page_view&dr=${enc(`${ORIGIN()}/it/x`)}&_et=5`,
    );
  });

  it("sendBeacon: stessa sanificazione di URL e corpo", () => {
    const { beaconSpy } = setup();
    navigator.sendBeacon(collect(), `en=page_view&dl=${enc(`${ORIGIN()}/it?state=SECRETSTATE1`)}`);
    const [url, data] = beaconSpy.mock.calls.at(-1) as unknown as [string, string];
    expect(new URL(url).searchParams.get("dl")).toBe(`${ORIGIN()}/it/about?utm_source=news`);
    expect(data).toBe(`en=page_view&dl=${enc(`${ORIGIN()}/it`)}`);
  });

  it("un referrer di un altro sito resta invariato (attribuzione del traffico) e le altre richieste non vengono toccate", async () => {
    const { fetchSpy } = setup();
    const external = "https://www.google.com/search?q=fitmesh";
    await window.fetch(`https://region1.google-analytics.com/g/collect?v=2&dr=${enc(external)}`);
    expect(new URL(String(fetchSpy.mock.calls.at(-1)![0])).searchParams.get("dr")).toBe(external);
    const other = `${ORIGIN()}/api/v1/ping?dl=${enc(`${ORIGIN()}/x?code=KEEP`)}`;
    await window.fetch(other);
    expect(fetchSpy.mock.calls.at(-1)![0]).toBe(other);
  });

  it("i campi campagna con un valore non sicuro diventano redacted, gli altri restano", () => {
    expect(sanitizeCollectQuery("v=2&cs=newsletter&cm=email&cn=20260921_launch")).toBe("v=2&cs=newsletter&cm=email&cn=20260921_launch");
    expect(sanitizeCollectQuery(`cs=${enc("mario@example.com")}&cn=550e8400-e29b-41d4-a716-446655440000&cc=1234567890123&ct=ok`)).toBe(
      "cs=redacted&cn=redacted&cc=redacted&ct=ok",
    );
  });

  it("il termine di ricerca ricavato dall'URL passa dallo stesso filtro dei campi campagna", () => {
    expect(sanitizeCollectQuery("v=2&en=view_search_results&ep.search_term=fitbit")).toBe("v=2&en=view_search_results&ep.search_term=fitbit");
    expect(sanitizeCollectQuery(`ep.search_term=${enc("550e8400-e29b-41d4-a716-446655440000")}&en=view_search_results`)).toBe(
      "ep.search_term=redacted&en=view_search_results",
    );
    expect(sanitizeCollectQuery(`en=view_search_results&ep.search_term=${enc("mario@example.com")}`)).toBe("en=view_search_results&ep.search_term=redacted");
  });

  it("i wrapper non cambiano il comportamento nativo: nessun argomento, stessi argomenti", async () => {
    const { fetchSpy, beaconSpy } = setup();
    await (window.fetch as unknown as () => Promise<Response>)();
    expect(fetchSpy).toHaveBeenLastCalledWith();
    const init = { method: "POST" };
    await window.fetch("/api/v1/x", init);
    expect(fetchSpy).toHaveBeenLastCalledWith("/api/v1/x", init);
    (navigator.sendBeacon as unknown as () => boolean)();
    expect(beaconSpy).toHaveBeenLastCalledWith();
  });

  it("dopo la revoca la richiesta resta scartata (la sanificazione non la riapre)", async () => {
    const { fetchSpy } = setup();
    act(() => {
      writeConsent(false);
    });
    const before = fetchSpy.mock.calls.length;
    const res = await window.fetch(collect(), { method: "POST" });
    expect(res.status).toBe(204);
    expect(fetchSpy.mock.calls.length).toBe(before);
  });
});

describe("valori UTM: etichette di campagna, non identificativi", () => {
  const loc = (query: string) => sanitizePageLocation(`https://www.fitmesh.fit/it?${query}`);

  it("indirizzi, UUID, numeri di 10 o piu' cifre, esadecimali lunghi, JWT e valori lunghi diventano redacted", () => {
    const out = loc(
      `utm_source=${enc("mario@example.com")}&utm_medium=3f2b8c1e-9a4d-4e6f-8b7a-1c2d3e4f5a6b&utm_campaign=1234567890123&` +
        `utm_content=0123456789abcdef0123456789abcdef&utm_term=eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3`,
    );
    expect(out).toBe("https://www.fitmesh.fit/it?utm_source=redacted&utm_medium=redacted&utm_campaign=redacted&utm_term=redacted&utm_content=redacted");
    expect(loc(`utm_source=${"a".repeat(101)}`)).toBe("https://www.fitmesh.fit/it?utm_source=redacted");
  });

  it("le etichette normali restano, anche con una data", () => {
    expect(loc("utm_source=newsletter&utm_medium=email&utm_campaign=20260921_launch&utm_content=hero-cta")).toBe(
      "https://www.fitmesh.fit/it?utm_source=newsletter&utm_medium=email&utm_campaign=20260921_launch&utm_content=hero-cta",
    );
  });

  it.each([
    ["un indirizzo codificato due volte", enc(enc("mario@example.com"))],
    ["un code= nascosto nel valore", enc("a&code=SECRETINUTM")],
    ["uno state= codificato tre volte", enc(enc(enc("x&state=SECRET")))],
    ["un token alfanumerico di 32 caratteri", "k3Jd8sLq0PzXm2VbN7tRcYwH5aQe1UfG"],
  ])("%s diventa redacted", (_label, value) => {
    expect(loc(`utm_source=${value}`)).toBe("https://www.fitmesh.fit/it?utm_source=redacted");
  });

  it("le etichette con trattini, trattini bassi, spazi e un percento isolato restano", () => {
    for (const label of ["spring-summer-sale-2026-newsletter-campaign", "newsletter_settembre", "Black+Friday", "50%25off", "hero-cta"]) {
      expect(loc(`utm_source=${label}`), label).not.toContain("redacted");
    }
  });

  it("un valore molto lungo si scarta subito: nessun costo quadratico sull'espressione degli indirizzi", () => {
    const long = "a".repeat(100000);
    const start = performance.now();
    expect(loc(`utm_source=${long}`)).toBe("https://www.fitmesh.fit/it?utm_source=redacted");
    expect(sanitizeEventParams({ q: long })).toEqual({ q: "redacted" });
    expect(performance.now() - start).toBeLessThan(1000);
  });

  it("il referrer del sito applica lo stesso filtro", () => {
    expect(sanitizeReferrer(`${ORIGIN()}/it?utm_source=${enc("mario@example.com")}&code=X`)).toBe(`${ORIGIN()}/it?utm_source=redacted`);
  });
});

describe("pageshow: ripristino dalla cache avanti/indietro", () => {
  it("una scelta revocata altrove mentre la pagina era congelata spegne GA al ripristino", () => {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify({ analytics: true, ts: 1 }));
    render(<AnalyticsConsent />);
    expect(isAnalyticsActive()).toBe(true);
    // La pagina e' nella cache: la revoca avviene altrove, senza evento `storage` per lei.
    window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify({ analytics: false, ts: 2 }));
    expect(isAnalyticsActive()).toBe(true);
    restore(false); // caricamento normale: il gestore non fa nulla
    expect(reload).not.toHaveBeenCalled();
    restore(true);
    expect(isAnalyticsActive()).toBe(false);
    expect(win()[DISABLE]).toBe(true);
    expect(reload).toHaveBeenCalledTimes(1);
    expect(reloadCsp()).toEqual([RELOAD_CSP]);
  });

  it("la scelta cancellata altrove vale come nessun consenso", () => {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify({ analytics: true, ts: 1 }));
    render(<AnalyticsConsent />);
    window.localStorage.clear();
    restore(true);
    expect(isAnalyticsActive()).toBe(false);
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it("un consenso dato altrove mentre la pagina era congelata carica GA una volta sola", () => {
    render(<AnalyticsConsent />);
    expect(gaScripts()).toHaveLength(0);
    window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify({ analytics: true, ts: 3 }));
    restore(true);
    expect(gaScripts()).toHaveLength(1);
    restore(true);
    expect(gaScripts()).toHaveLength(1);
    expect(commands("config")).toHaveLength(1);
  });

  it("il gestore viene rimosso allo smontaggio", () => {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify({ analytics: true, ts: 1 }));
    const { unmount } = render(<AnalyticsConsent />);
    unmount();
    window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify({ analytics: false, ts: 2 }));
    restore(true);
    expect(reload).not.toHaveBeenCalled();
  });
});

describe("ricarica che non si completa", () => {
  // `reload` e' un mock: il documento resta vivo, come dopo uno Stop o una navigazione che scavalca la ricarica.
  // La CSP temporanea non si solleva togliendo la meta (verificato su Chromium e WebKit): la ricarica si ripete.
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    resetReloadState();
    vi.useRealTimers();
  });
  function revoke() {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify({ analytics: true, ts: 1 }));
    render(<AnalyticsConsent />);
    act(() => {
      writeConsent(false);
    });
  }
  const advance = (ms: number) =>
    act(() => {
      vi.advanceTimersByTime(ms);
    });

  it("la ricarica si ripete a intervalli crescenti, poi ogni minuto, finche' il documento vive", () => {
    revoke();
    expect(reload).toHaveBeenCalledTimes(1);
    advance(RELOAD_RETRY_MS[0] - 1);
    expect(reload).toHaveBeenCalledTimes(1);
    advance(1);
    expect(reload).toHaveBeenCalledTimes(2);
    advance(RELOAD_RETRY_MS[1]);
    expect(reload).toHaveBeenCalledTimes(3);
    advance(RELOAD_RETRY_MS[2]);
    advance(RELOAD_RETRY_MS[2]);
    expect(reload).toHaveBeenCalledTimes(5);
  });

  it("azzerare lo stato (pagina sostituita o ripristinata) ferma i tentativi", () => {
    revoke();
    resetReloadState();
    advance(RELOAD_RETRY_MS[0] * 20);
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it("pageshow dalla cache dopo una ricarica scavalcata: si ricarica di nuovo subito, con una sola meta CSP", () => {
    revoke();
    expect(reloadCsp()).toEqual([RELOAD_CSP]);
    restore(false); // caricamento normale: il gestore non fa nulla
    expect(reload).toHaveBeenCalledTimes(1);
    restore(true);
    expect(reload).toHaveBeenCalledTimes(2);
    expect(reloadCsp()).toEqual([RELOAD_CSP]);
    expect(win()[DISABLE]).toBe(true);
  });
});

describe("percorsi esclusi: il confronto non dipende dalla normalizzazione dell'hosting", () => {
  it.each([
    "/oauth", "/oauth/", "/oauth/fitbit/callback", "/it/auth", "/it/auth/", "/it/auth/login", "/en/app/devices",
    "/fr/admin/beta", "/it/famiglia/join/CODICE",
    "/IT/auth/login", "/It/AUTH/login", "/it/%61uth/login", "/it/auth%2Flogin", "//it/auth/login", "/it//auth///login", "/OAUTH/x", "/it/famiglia//join/CODICE",
  ])("%s e' escluso", (path) => {
    expect(isAnalyticsExcludedPath(path)).toBe(true);
  });

  it.each(["/", "/it", "/it/blog", "/it/authx", "/oauthx", "/it/famiglia/joinx/CODICE", "/it/famiglia", "/delete-account", "/self-host", "/it/%E0%A4%A"])(
    "%s non e' escluso",
    (path) => {
      expect(isAnalyticsExcludedPath(path)).toBe(false);
    },
  );
});

describe("banner: la scelta fatta in un'altra scheda vale anche qui", () => {
  it("un consenso salvato altrove nasconde il banner, una scelta cancellata lo mostra", async () => {
    const dict = await getDictionary("it");
    render(<CookieBanner dict={dict} />);
    expect(document.querySelector('[role="dialog"]')).not.toBeNull();
    window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify({ analytics: true, ts: 1 }));
    act(() => {
      window.dispatchEvent(new StorageEvent("storage", { key: CONSENT_STORAGE_KEY }));
    });
    expect(document.querySelector('[role="dialog"]')).toBeNull();
    window.localStorage.clear();
    act(() => {
      window.dispatchEvent(new StorageEvent("storage", { key: null }));
    });
    expect(document.querySelector('[role="dialog"]')).not.toBeNull();
  });

  it("dopo un ripristino dalla cache la scelta si rilegge anche se l'evento storage non e' arrivato", async () => {
    const dict = await getDictionary("it");
    render(<CookieBanner dict={dict} />);
    expect(document.querySelector('[role="dialog"]')).not.toBeNull();
    window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify({ analytics: true, ts: 1 })); // nessun evento storage
    act(() => {
      restore(false); // caricamento normale: nulla
    });
    expect(document.querySelector('[role="dialog"]')).not.toBeNull();
    act(() => {
      restore(true);
    });
    expect(document.querySelector('[role="dialog"]')).toBeNull();
  });

  it("un'altra chiave non cambia il banner", async () => {
    const dict = await getDictionary("it");
    render(<CookieBanner dict={dict} />);
    window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify({ analytics: true, ts: 1 }));
    act(() => {
      window.dispatchEvent(new StorageEvent("storage", { key: "altra_chiave" }));
    });
    expect(document.querySelector('[role="dialog"]')).not.toBeNull();
  });
});

describe("storage indisponibile: la scelta vale per il documento", () => {
  const brokenStorage = (mode: "write" | "all") =>
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: {
        getItem: () => {
          if (mode === "all") throw new DOMException("denied", "SecurityError");
          return null;
        },
        setItem: () => {
          throw new DOMException("quota", "QuotaExceededError");
        },
        removeItem: () => {},
        clear: () => {},
      },
    });

  for (const mode of ["write", "all"] as const) {
    it(`${mode === "write" ? "scrittura che fallisce" : "storage che lancia anche in lettura"}: Accetta, poi navigazioni client-side senza ricaricare la pagina`, () => {
      brokenStorage(mode);
      const { rerender } = render(<AnalyticsConsent />);
      act(() => {
        writeConsent(true);
      });
      expect(isAnalyticsActive()).toBe(true);
      for (const path of ["/it/integrations", "/it/about", "/it"]) {
        goTo(path);
        rerender(<AnalyticsConsent />);
      }
      expect(reload).not.toHaveBeenCalled();
      expect(isAnalyticsActive()).toBe(true);
      expect(gaScripts()).toHaveLength(1);
      expect(commands("config")).toHaveLength(1);
    });

    it(`${mode === "write" ? "scrittura che fallisce" : "storage che lancia anche in lettura"}: la revoca vale e ricarica`, () => {
      brokenStorage(mode);
      render(<AnalyticsConsent />);
      act(() => {
        writeConsent(true);
      });
      act(() => {
        writeConsent(false);
      });
      expect(isAnalyticsActive()).toBe(false);
      expect(reload).toHaveBeenCalledTimes(1);
    });
  }

  it("con lo storage funzionante la scelta in memoria non c'e': una scelta cancellata altrove spegne GA", () => {
    render(<AnalyticsConsent />);
    act(() => {
      writeConsent(true);
    });
    expect(win().__fitmeshMemoryConsent).toBeUndefined();
    window.localStorage.clear();
    act(() => {
      window.dispatchEvent(new StorageEvent("storage", { key: null }));
    });
    expect(isAnalyticsActive()).toBe(false);
    expect(reload).toHaveBeenCalledTimes(1);
  });
});

describe("scrittura che non riesce con una scelta vecchia ancora nello storage", () => {
  // Storage pieno fino all'ultimo carattere (la scelta passa da «true» a «false» e cresce di uno): la lettura
  // funziona, la scrittura della scelta lancia un errore o, in un browser che la ignora, non fa nulla.
  class FullStorage extends MemoryStorage {
    constructor(
      private readonly mode: "throws" | "ignores",
      seed: boolean | null,
    ) {
      super();
      if (seed !== null) super.setItem(CONSENT_STORAGE_KEY, JSON.stringify({ analytics: seed, ts: 1 }));
    }
    setItem(key: string, value: string) {
      if (key !== CONSENT_STORAGE_KEY) return super.setItem(key, value);
      if (this.mode === "throws") throw new DOMException("quota", "QuotaExceededError");
    }
  }
  const install = (mode: "throws" | "ignores", seed: boolean | null) =>
    Object.defineProperty(window, "localStorage", { value: new FullStorage(mode, seed), configurable: true });

  for (const mode of ["throws", "ignores"] as const) {
    it(`${mode}: un vecchio «accetto» non riaccende GA dopo il rifiuto e la ricarica`, () => {
      install(mode, true);
      render(<AnalyticsConsent />);
      expect(isAnalyticsActive()).toBe(true);
      act(() => {
        writeConsent(false);
      });
      expect(isAnalyticsActive()).toBe(false);
      expect(reload).toHaveBeenCalledTimes(1);
      expect(window.localStorage.getItem(CONSENT_STORAGE_KEY)).toBeNull();
      // La pagina dopo la ricarica: nessuna memoria del documento precedente, solo lo storage.
      cleanup();
      discardDocument();
      render(<AnalyticsConsent />);
      expect(gaScripts()).toHaveLength(0);
      expect(win().gtag).toBeUndefined();
    });

    it(`${mode}: un vecchio «rifiuto» non annulla un Accetta che non si riesce a salvare`, () => {
      install(mode, false);
      const { rerender } = render(<AnalyticsConsent />);
      act(() => {
        writeConsent(true);
      });
      expect(isAnalyticsActive()).toBe(true);
      goTo("/it/about");
      rerender(<AnalyticsConsent />);
      expect(reload).not.toHaveBeenCalled();
      expect(isAnalyticsActive()).toBe(true);
    });
  }

  it("scrittura ignorata senza nessuna scelta vecchia: Accetta non si annulla alla prima navigazione", () => {
    install("ignores", null);
    const { rerender } = render(<AnalyticsConsent />);
    act(() => {
      writeConsent(true);
    });
    goTo("/it/about");
    rerender(<AnalyticsConsent />);
    expect(reload).not.toHaveBeenCalled();
    expect(isAnalyticsActive()).toBe(true);
  });
});

describe("cancellazione dei cookie: host, domini padre e percorsi", () => {
  function recorder(jar: string) {
    const writes: string[] = [];
    Object.defineProperty(document, "cookie", { configurable: true, get: () => jar, set: (v: string) => void writes.push(v) });
    return writes;
  }
  afterEach(() => {
    delete (document as unknown as Record<string, unknown>).cookie;
  });
  const JAR = "_ga=1; _ga_WLBXXFB21G=1; _gid=1; _gat=1; _gat_gtag_G-WLBXXFB21G=1; _gac_x=1; sb-auth-token=KEEP; fm_locale=KEEP; _gallery=KEEP; other_ga=KEEP";

  it("host, tutti i domini padre e il percorso radice piu' ogni prefisso del percorso corrente", () => {
    const writes = recorder(JAR);
    clearAnalyticsCookies("www.fitmesh.fit", "/it/blog/post");
    const of = (name: string) => writes.filter((x) => x.startsWith(`${name}=`));
    expect(of("_ga")).toHaveLength(3 * 4);
    for (const domain of ["", "; domain=.www.fitmesh.fit", "; domain=.fitmesh.fit"]) {
      for (const path of ["/", "/it", "/it/blog", "/it/blog/post"]) {
        expect(writes).toContain(`_ga=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=${path}${domain}`);
      }
    }
    expect(writes.some((x) => x.includes("domain=.fit;") || x.endsWith("domain=.fit"))).toBe(false);
  });

  it("cancella la famiglia GA e nient'altro", () => {
    const writes = recorder(JAR);
    clearAnalyticsCookies("www.fitmesh.fit", "/");
    const names = new Set(writes.map((x) => x.split("=")[0]));
    expect([...names].sort()).toEqual(["_ga", "_ga_WLBXXFB21G", "_gac_x", "_gat", "_gat_gtag_G-WLBXXFB21G", "_gid"].sort());
  });

  it("localhost e un indirizzo IP: solo l'host, nessun dominio padre inventato", () => {
    const writes = recorder("_ga=1");
    clearAnalyticsCookies("localhost", "/it");
    expect(writes.every((x) => !x.includes("domain="))).toBe(true);
    expect(writes).toHaveLength(2);
  });

  it("un cookie con lo stesso nome scritto due volte (percorsi diversi) si cancella una sola volta per combinazione", () => {
    const writes = recorder("_ga=1; _ga=2");
    clearAnalyticsCookies("localhost", "/");
    expect(writes).toHaveLength(1);
  });
});
