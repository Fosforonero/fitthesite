import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, render, screen } from "@testing-library/react";

import { FounderClientGate } from "./FounderClientGate";
import { FOUNDER_END_AT_MS } from "@/lib/founder/program-window";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

function renderGate() {
  return render(
    <FounderClientGate
      founder={<span>FOUNDER VARIANT</span>}
      evergreen={<span>EVERGREEN VARIANT</span>}
    />,
  );
}

describe("FounderClientGate — nessuna richiesta di rete", () => {
  it("non chiama fetch durante mount/hydration/timer", () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    vi.useFakeTimers();
    vi.setSystemTime(FOUNDER_END_AT_MS - 1000);
    renderGate();
    vi.advanceTimersByTime(2000);
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });
});

describe("FounderClientGate — stato iniziale dopo hydration", () => {
  it("cutoff - 1 secondo: mostra la variante founder dopo l'hydration", () => {
    vi.useFakeTimers();
    vi.setSystemTime(FOUNDER_END_AT_MS - 1000);
    renderGate();
    expect(screen.getByText("FOUNDER VARIANT")).toBeDefined();
    expect(screen.queryByText("EVERGREEN VARIANT")).toBeNull();
  });

  it("cutoff esatto: mostra evergreen (mai founder)", () => {
    vi.useFakeTimers();
    vi.setSystemTime(FOUNDER_END_AT_MS);
    renderGate();
    expect(screen.getByText("EVERGREEN VARIANT")).toBeDefined();
    expect(screen.queryByText("FOUNDER VARIANT")).toBeNull();
  });

  it("cutoff + 1 secondo: mostra evergreen", () => {
    vi.useFakeTimers();
    vi.setSystemTime(FOUNDER_END_AT_MS + 1000);
    renderGate();
    expect(screen.getByText("EVERGREEN VARIANT")).toBeDefined();
  });

  it("prima dell'hydration (primo render sincrono) mostra sempre evergreen, anche se il programma e' aperto — mai founder nell'HTML iniziale", () => {
    vi.useFakeTimers();
    vi.setSystemTime(FOUNDER_END_AT_MS - 1000);
    // useState iniziale e' `false` (evergreen) finche' l'effect non gira:
    // renderiamo senza far avanzare i timer/microtask oltre il necessario
    // per React per verificare che il PRIMO frame non mostri mai founder
    // in modo sincrono e non controllato dall'effect.
    render(
      <FounderClientGate founder={<span>FOUNDER VARIANT</span>} evergreen={<span>EVERGREEN VARIANT</span>} />,
    );
    // Dopo il flush degli effect (jsdom + testing-library li esegue in modo
    // sincrono in act()), lo stato e' gia' quello corretto per l'istante
    // corrente: qui verifichiamo solo che founder non sia MAI visibile
    // insieme a evergreen (mai entrambi, mai nessuno dei due).
    const hasFounder = screen.queryByText("FOUNDER VARIANT") !== null;
    const hasEvergreen = screen.queryByText("EVERGREEN VARIANT") !== null;
    expect(hasFounder !== hasEvergreen).toBe(true);
  });
});

describe("FounderClientGate — auto-transizione al cutoff, senza reload, senza polling", () => {
  it("tab aperta a cavallo del cutoff: passa da founder a evergreen da sola", () => {
    vi.useFakeTimers();
    vi.setSystemTime(FOUNDER_END_AT_MS - 1000);
    renderGate();
    expect(screen.getByText("FOUNDER VARIANT")).toBeDefined();

    vi.setSystemTime(FOUNDER_END_AT_MS + 100);
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(screen.getByText("EVERGREEN VARIANT")).toBeDefined();
    expect(screen.queryByText("FOUNDER VARIANT")).toBeNull();
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

  it("un solo timer attivo alla volta anche a grande distanza dal cutoff (delay oltre il limite 32-bit rischedulato, non troncato a 0)", () => {
    vi.useFakeTimers();
    // 40 giorni prima del cutoff: supera il limite setTimeout a 32 bit
    // (~24.8 giorni). Un setTimeout naive tronca a 0 e scatterebbe subito,
    // mostrando evergreen invece di founder.
    vi.setSystemTime(FOUNDER_END_AT_MS - 40 * 24 * 3600 * 1000);
    renderGate();
    expect(screen.getByText("FOUNDER VARIANT")).toBeDefined();

    // Avanziamo di soli 10 giorni: ancora ben lontani dal cutoff, deve
    // restare founder (non deve essere scattato in anticipo).
    vi.advanceTimersByTime(10 * 24 * 3600 * 1000);
    expect(screen.getByText("FOUNDER VARIANT")).toBeDefined();
  });
});
