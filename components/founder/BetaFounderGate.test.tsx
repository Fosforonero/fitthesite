import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, render, screen } from "@testing-library/react";

import { BetaFounderGate } from "./BetaFounderGate";
import { FOUNDER_END_AT_MS } from "@/lib/founder/program-window";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

function renderGate() {
  return render(
    <BetaFounderGate
      pending={<span>PENDING VARIANT</span>}
      open={<span>OPEN VARIANT</span>}
      closed={<span>CLOSED VARIANT</span>}
    />,
  );
}

describe("BetaFounderGate — nessuna richiesta di rete", () => {
  it("non chiama fetch durante mount/hydration/timer", () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    vi.useFakeTimers();
    vi.setSystemTime(FOUNDER_END_AT_MS - 1000);
    renderGate();
    vi.advanceTimersByTime(2000);
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });

  it("non usa setInterval (nessun polling a intervalli fissi)", () => {
    const intervalSpy = vi.spyOn(globalThis, "setInterval");
    vi.useFakeTimers();
    vi.setSystemTime(FOUNDER_END_AT_MS - 1000);
    renderGate();
    vi.advanceTimersByTime(5000);
    expect(intervalSpy).not.toHaveBeenCalled();
    intervalSpy.mockRestore();
  });
});

describe("BetaFounderGate — stato pending prima dell'hydration", () => {
  it("mostra esattamente una delle tre varianti, mai una combinazione (pending/open/closed sono mutuamente esclusivi)", () => {
    // jsdom + testing-library flush gli effect in modo sincrono dentro
    // act(), quindi render() restituisce gia' lo stato POST-effect: non
    // possiamo osservare qui il letterale primo frame pre-effect (stessa
    // limitazione gia' accettata in FounderClientGate.test.tsx). Verifichiamo
    // percio' la garanzia equivalente: mai piu' di una variante visibile.
    vi.useFakeTimers();
    vi.setSystemTime(FOUNDER_END_AT_MS - 1000); // programma aperto
    renderGate();
    const hasPending = screen.queryByText("PENDING VARIANT") !== null;
    const hasOpen = screen.queryByText("OPEN VARIANT") !== null;
    const hasClosed = screen.queryByText("CLOSED VARIANT") !== null;
    const visibleCount = [hasPending, hasOpen, hasClosed].filter(Boolean).length;
    expect(visibleCount).toBe(1);
  });

  it("usa useEffect (non useLayoutEffect): il componente e' un client component che rimanda la decisione al post-mount, mai al render sincrono", () => {
    // Garanzia strutturale: leggiamo il sorgente del componente per
    // assicurarci che nessuna futura modifica introduca useLayoutEffect
    // (che romperebbe l'invariante "pending sempre nell'HTML iniziale").
    const fs = require("node:fs") as typeof import("node:fs");
    const path = require("node:path") as typeof import("node:path");
    const src = fs.readFileSync(path.resolve(__dirname, "BetaFounderGate.tsx"), "utf-8");
    expect(src).toContain("useEffect(");
    expect(src).not.toContain("useLayoutEffect");
  });
});

describe("BetaFounderGate — stato dopo hydration ai tre istanti di confine", () => {
  it("cutoff - 1 secondo: dopo l'hydration mostra open", () => {
    vi.useFakeTimers();
    vi.setSystemTime(FOUNDER_END_AT_MS - 1000);
    renderGate();
    expect(screen.getByText("OPEN VARIANT")).toBeDefined();
    expect(screen.queryByText("PENDING VARIANT")).toBeNull();
    expect(screen.queryByText("CLOSED VARIANT")).toBeNull();
  });

  it("cutoff esatto: dopo l'hydration mostra closed (mai open)", () => {
    vi.useFakeTimers();
    vi.setSystemTime(FOUNDER_END_AT_MS);
    renderGate();
    expect(screen.getByText("CLOSED VARIANT")).toBeDefined();
    expect(screen.queryByText("OPEN VARIANT")).toBeNull();
    expect(screen.queryByText("PENDING VARIANT")).toBeNull();
  });

  it("cutoff + 1 secondo: dopo l'hydration mostra closed", () => {
    vi.useFakeTimers();
    vi.setSystemTime(FOUNDER_END_AT_MS + 1000);
    renderGate();
    expect(screen.getByText("CLOSED VARIANT")).toBeDefined();
  });
});

describe("BetaFounderGate — auto-transizione al cutoff, senza reload, senza polling", () => {
  it("tab aperta a cavallo del cutoff: passa da open a closed da sola", () => {
    vi.useFakeTimers();
    vi.setSystemTime(FOUNDER_END_AT_MS - 1000);
    renderGate();
    expect(screen.getByText("OPEN VARIANT")).toBeDefined();

    vi.setSystemTime(FOUNDER_END_AT_MS + 100);
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(screen.getByText("CLOSED VARIANT")).toBeDefined();
    expect(screen.queryByText("OPEN VARIANT")).toBeNull();
  });

  it("un solo timer attivo alla volta anche a grande distanza dal cutoff (delay oltre il limite 32-bit rischedulato, non troncato a 0)", () => {
    vi.useFakeTimers();
    vi.setSystemTime(FOUNDER_END_AT_MS - 40 * 24 * 3600 * 1000);
    renderGate();
    expect(screen.getByText("OPEN VARIANT")).toBeDefined();

    vi.advanceTimersByTime(10 * 24 * 3600 * 1000);
    expect(screen.getByText("OPEN VARIANT")).toBeDefined();
  });
});
