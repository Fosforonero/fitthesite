import { describe, expect, it } from "vitest";

import {
  parseAcceptLanguageLocale,
  localeFromCountry,
  resolveNegotiatedLocale,
} from "./locale-negotiation";

describe("parseAcceptLanguageLocale — q-value priority, not list order", () => {
  it("picks the highest-q locale even when listed last", () => {
    // en q=0.5, de q=0.9, it q=0.2 (implicit q=1 base case covered separately)
    expect(parseAcceptLanguageLocale("en-US;q=0.5,de-DE;q=0.9,it;q=0.2")).toBe("de");
  });

  it("treats a bare language tag (no q) as q=1", () => {
    expect(parseAcceptLanguageLocale("fr-FR;q=0.8,de")).toBe("de");
  });

  it("falls back to the base language when only a regional variant is supported", () => {
    expect(parseAcceptLanguageLocale("de-AT")).toBe("de");
  });

  it("skips unsupported languages and picks the next-best supported one", () => {
    expect(parseAcceptLanguageLocale("zh-CN;q=0.9,de;q=0.5")).toBe("de");
  });

  it("returns null for an empty/missing header", () => {
    expect(parseAcceptLanguageLocale(null)).toBeNull();
    expect(parseAcceptLanguageLocale("")).toBeNull();
  });

  it("returns null when nothing in the header is supported", () => {
    expect(parseAcceptLanguageLocale("zh-CN,ru-RU")).toBeNull();
  });

  it("maps Norwegian Bokmål (nb-NO) to the editorial locale 'no'", () => {
    expect(parseAcceptLanguageLocale("nb-NO")).toBe("no");
  });

  it("maps Norwegian Nynorsk (nn-NO) to the editorial locale 'no'", () => {
    expect(parseAcceptLanguageLocale("nn-NO")).toBe("no");
  });

  it("resolves no-NO to 'no' directly (already supported, unaffected by the nb/nn alias)", () => {
    expect(parseAcceptLanguageLocale("no-NO")).toBe("no");
  });
});

describe("localeFromCountry — geo fallback map", () => {
  it("maps DE and AT to de", () => {
    expect(localeFromCountry("DE")).toBe("de");
    expect(localeFromCountry("AT")).toBe("de");
  });

  it("is case-insensitive", () => {
    expect(localeFromCountry("it")).toBe("it");
  });

  it("returns null for an unmapped country", () => {
    expect(localeFromCountry("US")).toBeNull();
  });

  it("returns null for a missing country", () => {
    expect(localeFromCountry(null)).toBeNull();
  });
});

describe("resolveNegotiatedLocale — priority: cookie > Accept-Language > geo IP > en", () => {
  it("cookie wins over everything else", () => {
    expect(
      resolveNegotiatedLocale({
        cookieLocale: "en",
        acceptLanguage: "de-DE",
        country: "DE",
      }),
    ).toBe("en");
  });

  it("ignores an invalid/unsupported cookie value and falls through", () => {
    expect(
      resolveNegotiatedLocale({
        cookieLocale: "xx",
        acceptLanguage: "de-DE",
        country: "IT",
      }),
    ).toBe("de");
  });

  it("Accept-Language wins over geo IP when no cookie", () => {
    expect(
      resolveNegotiatedLocale({
        cookieLocale: null,
        acceptLanguage: "fr-FR",
        country: "DE",
      }),
    ).toBe("fr");
  });

  it("falls back to geo IP when Accept-Language has no supported language", () => {
    expect(
      resolveNegotiatedLocale({
        cookieLocale: null,
        acceptLanguage: "zh-CN",
        country: "DE",
      }),
    ).toBe("de");
  });

  it("falls back to 'en' as the final neutral default with no signals", () => {
    expect(
      resolveNegotiatedLocale({
        cookieLocale: null,
        acceptLanguage: null,
        country: null,
      }),
    ).toBe("en");
  });

  it("de-DE Accept-Language alone resolves to de", () => {
    expect(resolveNegotiatedLocale({ acceptLanguage: "de-DE,de;q=0.9" })).toBe("de");
  });

  it("it-IT Accept-Language alone resolves to it", () => {
    expect(resolveNegotiatedLocale({ acceptLanguage: "it-IT,it;q=0.9" })).toBe("it");
  });

  it("fr-FR Accept-Language alone resolves to fr", () => {
    expect(resolveNegotiatedLocale({ acceptLanguage: "fr-FR,fr;q=0.9" })).toBe("fr");
  });

  it("nb-NO Accept-Language alone resolves to 'no' (P0.8)", () => {
    expect(resolveNegotiatedLocale({ acceptLanguage: "nb-NO,nb;q=0.9" })).toBe("no");
  });

  it("nn-NO Accept-Language alone resolves to 'no' (P0.8)", () => {
    expect(resolveNegotiatedLocale({ acceptLanguage: "nn-NO,nn;q=0.9" })).toBe("no");
  });
});
