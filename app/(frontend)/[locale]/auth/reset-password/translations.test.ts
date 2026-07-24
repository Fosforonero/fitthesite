import { describe, expect, it } from "vitest";

import { RESET_PASSWORD_LOCALES, TRANSLATIONS } from "./translations";

const REQUIRED_KEYS = [
  "title",
  "subtitle",
  "emailLabel",
  "emailPlaceholder",
  "otpLabel",
  "otpPlaceholder",
  "otpHint",
  "passwordLabel",
  "passwordPlaceholder",
  "confirmLabel",
  "submit",
  "saving",
  "success",
  "errorMissingFields",
  "errorTooShort",
  "errorMismatch",
  "errorExpiredOrUsed",
  "errorRateLimited",
  "errorNetwork",
  "errorGeneric",
  "backToLogin",
] as const;

describe("reset-password TRANSLATIONS completeness", () => {
  it("has exactly the 11 canonical site locales, nothing more/less", () => {
    expect(RESET_PASSWORD_LOCALES).toEqual([
      "it", "en", "es", "de", "pt", "fr", "pl", "tr", "nl", "ja", "ko",
    ]);
    expect(Object.keys(TRANSLATIONS).sort()).toEqual([...RESET_PASSWORD_LOCALES].sort());
  });

  it.each(RESET_PASSWORD_LOCALES)("locale '%s' has every required key, non-empty", (locale) => {
    const entry = TRANSLATIONS[locale];
    for (const key of REQUIRED_KEYS) {
      expect(entry).toHaveProperty(key);
      expect(typeof entry[key]).toBe("string");
      expect(entry[key].trim().length).toBeGreaterThan(0);
    }
  });

  it.each(RESET_PASSWORD_LOCALES)("locale '%s' has no leftover template placeholders", (locale) => {
    const entry = TRANSLATIONS[locale];
    for (const key of REQUIRED_KEYS) {
      // Nessuna stringa user-facing deve contenere segnaposto tipo {{ }} o
      // simboli di interpolazione non risolti: sono tutte statiche per design.
      expect(entry[key]).not.toMatch(/\{\{|\}\}|%s|\$\{/);
    }
  });

  it.each(RESET_PASSWORD_LOCALES)("locale '%s' never uses an em-dash (house style)", (locale) => {
    const entry = TRANSLATIONS[locale];
    for (const key of REQUIRED_KEYS) {
      expect(entry[key]).not.toContain("—");
      expect(entry[key]).not.toContain("–");
    }
  });

  it("otpPlaceholder is the same numeric placeholder across every locale (not translatable content)", () => {
    for (const locale of RESET_PASSWORD_LOCALES) {
      expect(TRANSLATIONS[locale].otpPlaceholder).toBe("123456");
    }
  });
});
