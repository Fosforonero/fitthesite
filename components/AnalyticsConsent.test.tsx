import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render } from "@testing-library/react";

let currentPath = "/it";
vi.mock("next/navigation", () => ({ usePathname: () => currentPath }));

import AnalyticsConsent from "./AnalyticsConsent";
import OutboundTracker from "./OutboundTracker";
import {
  CONSENT_STORAGE_KEY,
  GA_MEASUREMENT_ID,
  isAnalyticsActive,
  pageLifecycle,
  RELOAD_CSP,
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
  document.querySelectorAll("script, meta[http-equiv]").forEach((s) => s.remove());
  for (const key of ["gtag", "dataLayer", "__fitmeshAnalytics", "__fitmeshCollectGuard", "__fitmeshHistorySync", "__fitmeshReloading", DISABLE]) {
    delete win()[key];
  }
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
