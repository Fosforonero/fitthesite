import { describe, expect, it } from "vitest";
import { SITE_URL, CANONICAL_HOST } from "./site-url";
import { SITE_URL as REEXPORTED_FROM_PRODUCT_FACTS } from "@/lib/product-facts";

/**
 * MICRO-GATE P0.14-A punto 1 — gate anti-divergenza: `CANONICAL_HOST`
 * (usato da `LanguageSwitcher` per accettare un host non-same-origin come
 * legittimo, es. in preview) deve restare SEMPRE derivato da `SITE_URL`,
 * mai un secondo letterale mantenuto a mano che potrebbe scivolare fuori
 * sincrono se `SITE_URL` cambia.
 */
describe("lib/site-url — SSOT host canonico", () => {
  it("CANONICAL_HOST è l'hostname derivato da SITE_URL, non un letterale indipendente", () => {
    expect(CANONICAL_HOST).toBe(new URL(SITE_URL).hostname);
  });

  it("product-facts.ts riesporta lo STESSO SITE_URL (nessuna seconda stringa ridichiarata)", () => {
    expect(REEXPORTED_FROM_PRODUCT_FACTS).toBe(SITE_URL);
  });

  it("SITE_URL è https e senza slash finale (assunzione su cui blogLanguages()/localeAlternates() costruiscono i path)", () => {
    expect(SITE_URL).toMatch(/^https:\/\/[^/]+$/);
  });
});
