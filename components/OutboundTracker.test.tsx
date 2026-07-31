import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render } from "@testing-library/react";

import OutboundTracker from "./OutboundTracker";
import StoreButtonsRow from "./StoreButtonsRow";
import { CTA_CAMPAIGN, CTA_IDS, CTA_PLACEMENTS } from "@/lib/analytics/cta";

/**
 * Fase 7 (funnel post-Founder): verifica che i TRE eventi del funnel
 * ordinario — `cta_view` -> `cta_click` -> `store_click` — portino le stesse
 * cinque dimensioni (locale, placement, store_destination, campaign, path)
 * e la stessa campagna, e che non trasportino nient'altro che quelle piu' i
 * parametri tecnici gia' esistenti. Nessun identificativo personale, nessun
 * dato sanitario.
 */

type GtagCall = [string, string, Record<string, unknown>];

/** jsdom non implementa IntersectionObserver: stub minimo pilotabile a mano. */
class FakeIntersectionObserver implements IntersectionObserver {
  static instances: FakeIntersectionObserver[] = [];
  readonly root = null;
  readonly rootMargin = "";
  readonly thresholds: ReadonlyArray<number> = [];
  observed = new Set<Element>();
  private readonly cb: IntersectionObserverCallback;

  constructor(cb: IntersectionObserverCallback) {
    this.cb = cb;
    FakeIntersectionObserver.instances.push(this);
  }
  observe(el: Element) {
    this.observed.add(el);
  }
  unobserve(el: Element) {
    this.observed.delete(el);
  }
  disconnect() {
    this.observed.clear();
  }
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
  /** Simula l'ingresso nel viewport di un elemento gia' osservato. */
  enter(el: Element) {
    this.cb(
      [{ target: el, isIntersecting: true } as unknown as IntersectionObserverEntry],
      this,
    );
  }
}

function gtagCalls(): GtagCall[] {
  const spy = (window as unknown as { gtag: ReturnType<typeof vi.fn> }).gtag;
  return spy.mock.calls as GtagCall[];
}

function eventsNamed(name: string): Record<string, unknown>[] {
  return gtagCalls()
    .filter((c) => c[0] === "event" && c[1] === name)
    .map((c) => c[2]);
}

function latestObserver(): FakeIntersectionObserver {
  const io = FakeIntersectionObserver.instances.at(-1);
  if (!io) throw new Error("nessun IntersectionObserver creato da OutboundTracker");
  return io;
}

/** Attende un giro di MutationObserver (microtask). */
function flushMutations(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

beforeEach(() => {
  FakeIntersectionObserver.instances = [];
  (globalThis as unknown as { IntersectionObserver: unknown }).IntersectionObserver =
    FakeIntersectionObserver;
  (window as unknown as { gtag: unknown }).gtag = vi.fn();
  window.history.replaceState({}, "", "/de/preise");
});

afterEach(() => {
  cleanup();
  delete (window as unknown as { gtag?: unknown }).gtag;
});

describe("funnel post-Founder — le tre dimensioni comuni", () => {
  it("cta_view porta locale, placement, store_destination, campaign e path", () => {
    render(
      <>
        <OutboundTracker />
        <a
          href="/de#download"
          data-cta-id={CTA_IDS.headerPrimary}
          data-cta-placement={CTA_PLACEMENTS.headerPrimary}
        >
          Download
        </a>
      </>,
    );

    const io = latestObserver();
    const cta = document.querySelector(`[data-cta-id="${CTA_IDS.headerPrimary}"]`)!;
    expect(io.observed.has(cta)).toBe(true);
    io.enter(cta);

    const views = eventsNamed("cta_view");
    expect(views).toHaveLength(1);
    expect(views[0]).toMatchObject({
      cta_id: CTA_IDS.headerPrimary,
      placement: CTA_PLACEMENTS.headerPrimary,
      cta_placement: CTA_PLACEMENTS.headerPrimary,
      store_destination: "none",
      campaign: CTA_CAMPAIGN,
      path: "/de/preise",
      page_path: "/de/preise",
      locale: "de",
    });
  });

  it("cta_click sulla CTA primaria dell'header porta la stessa campagna e lo stesso placement", () => {
    render(
      <>
        <OutboundTracker />
        <a
          href="/de#download"
          data-cta-id={CTA_IDS.headerPrimary}
          data-cta-placement={CTA_PLACEMENTS.headerPrimary}
          onClick={(e) => e.preventDefault()}
        >
          Download
        </a>
      </>,
    );

    document.querySelector<HTMLAnchorElement>(`[data-cta-id="${CTA_IDS.headerPrimary}"]`)!.click();

    const clicks = eventsNamed("cta_click");
    expect(clicks).toHaveLength(1);
    expect(clicks[0]).toMatchObject({
      cta_id: CTA_IDS.headerPrimary,
      placement: CTA_PLACEMENTS.headerPrimary,
      cta_placement: CTA_PLACEMENTS.headerPrimary,
      // ancora interna: nessuno store di destinazione
      store_destination: "none",
      campaign: CTA_CAMPAIGN,
      path: "/de/preise",
      locale: "de",
    });
    // una CTA interna non deve MAI emettere store_click
    expect(eventsNamed("store_click")).toHaveLength(0);
  });

  it("un click sul badge Play emette sia cta_click sia store_click, con lo stesso placement e la stessa campagna", () => {
    render(
      <>
        <OutboundTracker />
        <div onClick={(e) => e.preventDefault()}>
          <StoreButtonsRow locale="de" ctaLocation={CTA_PLACEMENTS.homepagePricingTrial} />
        </div>
      </>,
    );

    const playLink = document.querySelector<HTMLAnchorElement>('a[href*="play.google.com"]')!;
    playLink.click();

    const stores = eventsNamed("store_click");
    expect(stores).toHaveLength(1);
    expect(stores[0]).toMatchObject({
      store_platform: "play",
      store_destination: "Google Play",
      placement: CTA_PLACEMENTS.homepagePricingTrial,
      cta_location: CTA_PLACEMENTS.homepagePricingTrial,
      campaign: CTA_CAMPAIGN,
      path: "/de/preise",
      locale: "de",
    });

    const clicks = eventsNamed("cta_click");
    expect(clicks).toHaveLength(1);
    expect(clicks[0]).toMatchObject({
      cta_id: "store_buttons_homepage_pricing_trial",
      placement: CTA_PLACEMENTS.homepagePricingTrial,
      store_destination: "Google Play",
      campaign: CTA_CAMPAIGN,
      locale: "de",
    });
  });
});

describe("privacy — superficie dei dati", () => {
  it("nessun evento trasporta parametri diversi da quelli dichiarati", () => {
    const ALLOWED = new Set([
      "locale",
      "placement",
      "cta_placement",
      "cta_location",
      "cta_id",
      "store_destination",
      "store_platform",
      "link_url",
      "campaign",
      "path",
      "page_path",
    ]);

    render(
      <>
        <OutboundTracker />
        <div onClick={(e) => e.preventDefault()}>
          <StoreButtonsRow locale="de" ctaLocation={CTA_PLACEMENTS.homepageHero} />
        </div>
      </>,
    );

    const io = latestObserver();
    const row = document.querySelector("[data-cta-id]")!;
    io.enter(row);
    document.querySelector<HTMLAnchorElement>('a[href*="apps.apple.com"]')!.click();

    const params = gtagCalls().flatMap((c) => Object.keys(c[2]));
    expect(params.length).toBeGreaterThan(0);
    expect(params.filter((k) => !ALLOWED.has(k))).toEqual([]);
  });
});

describe("CTA aggiunte dopo il mount", () => {
  it("aggancia una CTA che riceve data-cta-id mentre e' gia' nel DOM (menu mobile aperto)", async () => {
    render(
      <>
        <OutboundTracker />
        <a href="/de#download" data-cta-placement={CTA_PLACEMENTS.mobileMenuPrimary}>
          Download
        </a>
      </>,
    );

    const io = latestObserver();
    const link = document.querySelector<HTMLAnchorElement>("a[data-cta-placement]")!;
    // pannello chiuso: nessun data-cta-id -> nessuna cta_view fantasma
    expect(io.observed.has(link)).toBe(false);

    // pannello aperto: l'attributo compare su un elemento gia' montato
    link.setAttribute("data-cta-id", CTA_IDS.mobileMenuPrimary);
    await flushMutations();

    expect(io.observed.has(link)).toBe(true);
    io.enter(link);
    expect(eventsNamed("cta_view")[0]).toMatchObject({
      cta_id: CTA_IDS.mobileMenuPrimary,
      placement: CTA_PLACEMENTS.mobileMenuPrimary,
      campaign: CTA_CAMPAIGN,
    });
  });
});
