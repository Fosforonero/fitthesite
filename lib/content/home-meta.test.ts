import { describe, expect, it } from "vitest";
import { locales } from "@/lib/i18n";
import {
  HOME_META_DESCRIPTIONS,
  HOME_META_TITLES,
  homeMetaDescription,
  homeMetaTitle,
} from "@/lib/content/home-meta";

describe("home-meta: fonte unica di title e description della home", () => {
  it("copre tutte le 15 lingue, senza valori vuoti", () => {
    for (const lc of locales) {
      expect(HOME_META_TITLES[lc]?.trim().length, `title ${lc}`).toBeGreaterThan(0);
      expect(HOME_META_DESCRIPTIONS[lc]?.trim().length, `description ${lc}`).toBeGreaterThan(0);
    }
    expect(Object.keys(HOME_META_TITLES).sort()).toEqual([...locales].sort());
  });

  it("nessun trattino lungo ne' en dash nei title (core rule 8)", () => {
    for (const lc of locales) {
      expect(HOME_META_TITLES[lc], lc).not.toMatch(/[–—]/);
    }
  });

  it("le lingue senza ramo non ricevono l'inglese: ogni lingua legge il proprio valore", () => {
    for (const lc of locales) {
      expect(homeMetaTitle(lc)).toBe(HOME_META_TITLES[lc]);
      expect(homeMetaDescription(lc)).toBe(HOME_META_DESCRIPTIONS[lc]);
    }
    for (const lc of locales.filter((l) => l !== "en")) {
      expect(HOME_META_TITLES[lc], lc).not.toBe(HOME_META_TITLES.en);
      expect(HOME_META_DESCRIPTIONS[lc], lc).not.toBe(HOME_META_DESCRIPTIONS.en);
    }
  });

  it("i title non superano i 75 caratteri (nessuna regressione di lunghezza)", () => {
    for (const lc of locales) expect(HOME_META_TITLES[lc].length, lc).toBeLessThanOrEqual(75);
  });
});
