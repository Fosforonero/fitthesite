import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render } from "@testing-library/react";

import OutboundTracker from "./OutboundTracker";
import StoreButtonsRow from "./StoreButtonsRow";
import { CTA_CAMPAIGN, CTA_IDS, CTA_PLACEMENTS, COMMUNITY_PLACEMENTS } from "@/lib/analytics/cta";

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
      // P1.9 FASE 6: content_cluster (famiglia editoriale) e target_type
      // (store vs internal_landing) — entrambi vocabolari chiusi, nessun
      // dato sanitario/identificativo, vedi lib/analytics/cta.ts.
      "content_cluster",
      "target_type",
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

describe("P0.14A — external_community_click (r/FitMesh)", () => {
  it("un click sul link Reddit del footer emette platform/placement/locale/path, nient'altro", () => {
    render(
      <>
        <OutboundTracker />
        <a
          href="https://www.reddit.com/r/FitMesh/"
          data-cta-placement={COMMUNITY_PLACEMENTS.footer}
          onClick={(e) => e.preventDefault()}
        >
          Community
        </a>
      </>,
    );

    document.querySelector<HTMLAnchorElement>('a[href="https://www.reddit.com/r/FitMesh/"]')!.click();

    const events = eventsNamed("external_community_click");
    expect(events).toHaveLength(1);
    // toEqual (non toMatchObject): prova che non ci sia NESSUN parametro
    // oltre ai quattro dichiarati — niente campaign, niente id, niente PII.
    expect(events[0]).toEqual({
      platform: "reddit",
      placement: COMMUNITY_PLACEMENTS.footer,
      locale: "de",
      path: "/de/preise",
    });
    // un link Reddit non è ne' una CTA ne' uno store: non deve mai comparire li'.
    expect(eventsNamed("cta_click")).toHaveLength(0);
    expect(eventsNamed("store_click")).toHaveLength(0);
  });

  it("il placement riflette /support quando dichiarato", () => {
    render(
      <>
        <OutboundTracker />
        <a
          href="https://www.reddit.com/r/FitMesh/"
          data-cta-placement={COMMUNITY_PLACEMENTS.support}
          onClick={(e) => e.preventDefault()}
        >
          Community
        </a>
      </>,
    );
    document.querySelector<HTMLAnchorElement>("a")!.click();
    expect(eventsNamed("external_community_click")[0]).toMatchObject({
      placement: COMMUNITY_PLACEMENTS.support,
    });
  });

  it("un link Reddit diverso da r/FitMesh (es. citato in un articolo) non emette l'evento", () => {
    render(
      <>
        <OutboundTracker />
        <a href="https://www.reddit.com/r/fitness/" onClick={(e) => e.preventDefault()}>
          Altro subreddit
        </a>
      </>,
    );
    document.querySelector<HTMLAnchorElement>("a")!.click();
    expect(eventsNamed("external_community_click")).toHaveLength(0);
  });
});

describe("ADDENDUM P1.9 — contratto cta_view (dedup per page view, non per sempre)", () => {
  it("piu' callback IntersectionObserver sullo stesso elemento, stessa page view -> un solo evento", () => {
    render(
      <>
        <OutboundTracker />
        <a href="/de#download" data-cta-id={CTA_IDS.headerPrimary} data-cta-placement={CTA_PLACEMENTS.headerPrimary}>
          Download
        </a>
      </>,
    );
    const io = latestObserver();
    const cta = document.querySelector(`[data-cta-id="${CTA_IDS.headerPrimary}"]`)!;
    io.enter(cta);
    io.enter(cta);
    io.enter(cta);
    expect(eventsNamed("cta_view")).toHaveLength(1);
  });

  it("il MutationObserver che ri-esamina lo stesso elemento non produce un doppio evento", async () => {
    render(
      <>
        <OutboundTracker />
        <a href="/de#download" data-cta-id={CTA_IDS.headerPrimary} data-cta-placement={CTA_PLACEMENTS.headerPrimary}>
          Download
        </a>
      </>,
    );
    const io = latestObserver();
    const cta = document.querySelector(`[data-cta-id="${CTA_IDS.headerPrimary}"]`)!;
    io.enter(cta);
    expect(eventsNamed("cta_view")).toHaveLength(1);

    // Forza il MutationObserver a rigirare (una mutazione qualsiasi altrove
    // nel DOM), poi simula una ri-osservazione dello STESSO elemento gia'
    // visto: deve restare un solo evento.
    const filler = document.createElement("div");
    document.body.appendChild(filler);
    await flushMutations();
    io.observe(cta); // idempotente per spec, ma il gate e' comunque nel callback IO
    io.enter(cta);
    expect(eventsNamed("cta_view")).toHaveLength(1);
  });

  it("una sostituzione involontaria dello stesso nodo (stessa page view, nessuna navigazione) non produce un doppio evento", async () => {
    const { container } = render(
      <>
        <OutboundTracker />
        <div id="host">
          <a href="/de#download" data-cta-id={CTA_IDS.headerPrimary} data-cta-placement={CTA_PLACEMENTS.headerPrimary}>
            Download
          </a>
        </div>
      </>,
    );
    const io = latestObserver();
    const original = document.querySelector(`[data-cta-id="${CTA_IDS.headerPrimary}"]`)!;
    io.enter(original);
    expect(eventsNamed("cta_view")).toHaveLength(1);

    // Sostituisce il nodo DOM con un elemento NUOVO ma con lo stesso
    // data-cta-id — simula un remount React senza alcuna navigazione
    // (stesso pathname, nessun window.history.pushState). L'ID stabile,
    // non l'identita' dell'oggetto DOM, e' cio' che deve deduplicare qui.
    const host = container.querySelector("#host")!;
    host.innerHTML = "";
    const replacement = document.createElement("a");
    replacement.setAttribute("href", "/de#download");
    replacement.setAttribute("data-cta-id", CTA_IDS.headerPrimary);
    replacement.setAttribute("data-cta-placement", CTA_PLACEMENTS.headerPrimary);
    host.appendChild(replacement);
    await flushMutations();

    expect(io.observed.has(replacement)).toBe(false); // non ri-osservato: gia' visto in questa page view
    // Anche se qualcosa forzasse comunque un enter() sul nodo nuovo, il
    // gate per data-cta-id deve sopprimerlo.
    io.enter(replacement);
    expect(eventsNamed("cta_view")).toHaveLength(1);
  });

  it("una navigazione genuina (pathname cambia) seguita da un ritorno concede una nuova impression una sola volta — non deduplica per sempre", async () => {
    render(
      <>
        <OutboundTracker />
        <a href="/de#download" data-cta-id={CTA_IDS.headerPrimary} data-cta-placement={CTA_PLACEMENTS.headerPrimary}>
          Download
        </a>
      </>,
    );
    const io = latestObserver();
    const cta = document.querySelector(`[data-cta-id="${CTA_IDS.headerPrimary}"]`)!;
    io.enter(cta);
    expect(eventsNamed("cta_view")).toHaveLength(1);

    // Naviga altrove (URL diverso) e forza il MutationObserver a rigirare —
    // sul branch reale questo avviene perche' Next.js sostituisce l'intero
    // albero dei componenti a ogni navigazione client-side; qui basta una
    // mutazione qualsiasi per far scattare il rilevamento del cambio path.
    window.history.pushState({}, "", "/de/altra-pagina");
    document.body.appendChild(document.createElement("div"));
    await flushMutations();

    // Torna alla pagina originale — stesso URL della prima visita, ma e'
    // una SECONDA page view: la CTA deve poter generare un'impression nuova.
    window.history.pushState({}, "", "/de/preise");
    document.body.appendChild(document.createElement("div"));
    await flushMutations();

    // Sulla pagina reale il remount di Next.js ri-osserverebbe l'elemento
    // automaticamente; qui lo si osserva di nuovo esplicitamente per
    // simulare lo stesso effetto senza un vero router.
    io.observe(cta);
    io.enter(cta);

    const views = eventsNamed("cta_view");
    expect(views).toHaveLength(2);
    expect(views[1]).toMatchObject({ cta_id: CTA_IDS.headerPrimary, path: "/de/preise" });
  });

  it("non deduplica per sempre l'intera sessione: una terza page view della stessa CTA continua a contare", async () => {
    render(
      <>
        <OutboundTracker />
        <a href="/de#download" data-cta-id={CTA_IDS.headerPrimary} data-cta-placement={CTA_PLACEMENTS.headerPrimary}>
          Download
        </a>
      </>,
    );
    const io = latestObserver();
    const cta = document.querySelector(`[data-cta-id="${CTA_IDS.headerPrimary}"]`)!;

    for (const path of ["/de/pagina-a", "/de/pagina-b", "/de/pagina-a"]) {
      window.history.pushState({}, "", path);
      document.body.appendChild(document.createElement("div"));
      await flushMutations();
      io.observe(cta);
      io.enter(cta);
    }

    expect(eventsNamed("cta_view")).toHaveLength(3);
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
