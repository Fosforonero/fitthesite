/**
 * @vitest-environment jsdom
 *
 * Serve `window.sessionStorage`: l'ambiente di default di questo repo per i
 * file .test.ts (non .tsx) e' "node" (vedi vitest.config.ts,
 * environmentMatchGlobs matcha solo **\/*.test.tsx). Questa direttiva
 * sovrascrive l'ambiente per il SOLO questo file.
 */
import { afterEach, describe, expect, it } from "vitest";

import { RECOVERY_EMAIL_HANDOFF_KEY, consumeHandoffEmail } from "./handoff";

afterEach(() => {
  window.sessionStorage.clear();
});

describe("consumeHandoffEmail", () => {
  it("legge il valore memorizzato", () => {
    window.sessionStorage.setItem(RECOVERY_EMAIL_HANDOFF_KEY, "mario@example.com");
    expect(consumeHandoffEmail()).toBe("mario@example.com");
  });

  it("e' monouso: la seconda lettura restituisce null", () => {
    window.sessionStorage.setItem(RECOVERY_EMAIL_HANDOFF_KEY, "mario@example.com");
    consumeHandoffEmail();
    expect(consumeHandoffEmail()).toBeNull();
  });

  it("restituisce null se non c'e' nulla", () => {
    expect(consumeHandoffEmail()).toBeNull();
  });

  it("non lancia se sessionStorage e' inaccessibile (es. navigazione privata)", () => {
    const original = Object.getOwnPropertyDescriptor(window, "sessionStorage");
    Object.defineProperty(window, "sessionStorage", {
      configurable: true,
      get() {
        throw new DOMException("blocked");
      },
    });

    expect(() => consumeHandoffEmail()).not.toThrow();
    expect(consumeHandoffEmail()).toBeNull();

    if (original) Object.defineProperty(window, "sessionStorage", original);
  });
});
