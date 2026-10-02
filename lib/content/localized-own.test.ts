import { describe, expect, it } from "vitest";
import { tlOwn } from "@/lib/content/localized-own";
import { PRICING_SECTION } from "@/lib/pricing-section";

describe("tlOwn: nessun ripiego inglese per i campi nuovi", () => {
  it("restituisce il valore della lingua, o undefined (mai en/it al suo posto)", () => {
    const l = { it: "ciao", en: "hello" };
    expect(tlOwn(l, "it")).toBe("ciao");
    expect(tlOwn(l, "en")).toBe("hello");
    expect(tlOwn(l, "de")).toBeUndefined();
    expect(tlOwn({ ...l, de: "  " }, "de")).toBeUndefined();
  });

  it("le chiavi nuove della sezione prezzi esistono in it/en e si ritirano nelle altre lingue finche' manca il valore", () => {
    expect(tlOwn(PRICING_SECTION.storeNote, "it")).toBeTruthy();
    expect(tlOwn(PRICING_SECTION.priceFromStore, "en")).toBeTruthy();
    expect(tlOwn(PRICING_SECTION.storeNote, "fr")).toBeUndefined();
    expect(tlOwn(PRICING_SECTION.priceFromStore, "ja")).toBeUndefined();
  });

  it("le liste con importi o elenchi non verificati non esistono piu'", () => {
    const keys = Object.keys(PRICING_SECTION);
    expect(keys).not.toContain("trialFeatures");
    expect(keys).not.toContain("proFeatures");
  });
});
