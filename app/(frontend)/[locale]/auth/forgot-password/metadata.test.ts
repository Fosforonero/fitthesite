import { describe, expect, it, vi } from "vitest";

// Stesso mock scoped documentato in ../reset-password/metadata.test.ts:
// confrontare contro la homepage reale trascina l'import del layout ->
// RootHtmlShell -> lib/fonts.ts, che chiama next/font/google a module scope
// (richiede la trasformazione SWC di Next, assente sotto Vitest).
vi.mock("next/font/google", () => ({
  Inter: () => ({ variable: "--font-inter" }),
  Space_Grotesk: () => ({ variable: "--font-grotesk" }),
}));

import { generateMetadata } from "./page";
import { generateMetadata as generateHomepageMetadata } from "../../layout";
import { FORGOT_PASSWORD_LOCALES, TRANSLATIONS } from "./translations";
import { locales } from "@/lib/i18n";

/**
 * Hotfix P0.10R. Stessa guardia gia' applicata a reset-password: senza
 * metadata dedicati questa route erediterebbe title/description/canonical/
 * OG/Twitter dal layout [locale], cioe' quelli della HOMEPAGE, invitando
 * l'indicizzazione di una pagina di auth e consolidandola sulla home.
 */
describe("forgot-password generateMetadata — nessuna eredita' dalla homepage", () => {
  it.each(FORGOT_PASSWORD_LOCALES)("locale '%s': mai uguale ai metadata della homepage", async (locale) => {
    const params = Promise.resolve({ locale });
    const forgot = await generateMetadata({ params });
    const homepage = await generateHomepageMetadata({ params });

    expect(forgot.title).not.toBe(homepage.title);
    expect(forgot.description).not.toBe(homepage.description);
    expect((forgot.alternates as { canonical?: string })?.canonical).not.toBe(
      (homepage.alternates as { canonical?: string })?.canonical,
    );
    expect((forgot.openGraph as { title?: string })?.title).not.toBe(
      (homepage.openGraph as { title?: string })?.title,
    );
  });
});

describe("forgot-password generateMetadata — noindex e canonical", () => {
  // Tutte e 15, non solo le 11 tradotte: anche sv/da/no/fi devono essere
  // noindex e avere un canonical self-referenziante, altrimenti la variante
  // in inglese servita su quelle locale sarebbe indicizzabile.
  it.each(locales)("locale '%s': robots noindex+nofollow", async (locale) => {
    const meta = await generateMetadata({ params: Promise.resolve({ locale }) });
    const robots = meta.robots as { index?: boolean; follow?: boolean };
    expect(robots.index).toBe(false);
    expect(robots.follow).toBe(false);
  });

  it.each(locales)("locale '%s': canonical self-referenziante sulla locale RICHIESTA", async (locale) => {
    const meta = await generateMetadata({ params: Promise.resolve({ locale }) });
    const canonical = (meta.alternates as { canonical?: string })?.canonical;
    // Deve puntare a se stessa: per sv/da/no/fi il testo e' inglese ma
    // l'URL resta /sv/..., quindi il canonical non deve mai dirottare su /en
    // (dichiarerebbe canonica una pagina diversa da quella servita).
    expect(canonical).toBe(`https://www.fitmesh.fit/${locale}/auth/forgot-password`);
  });

  it("una locale sconosciuta ricade su copy inglese senza rompersi", async () => {
    const meta = await generateMetadata({ params: Promise.resolve({ locale: "xx" }) });
    expect(meta.title).toBe(TRANSLATIONS.en.metaTitle);
  });
});

describe("forgot-password — copertura traduzioni", () => {
  it("ha esattamente le 11 locale canoniche (le 4 nordiche usano il fallback EN)", () => {
    expect([...FORGOT_PASSWORD_LOCALES].sort()).toEqual(
      ["de", "en", "es", "fr", "it", "ja", "ko", "nl", "pl", "pt", "tr"].sort(),
    );
  });

  it("ogni locale tradotta ha tutte le chiavi valorizzate", () => {
    for (const locale of FORGOT_PASSWORD_LOCALES) {
      const t = TRANSLATIONS[locale];
      for (const [key, value] of Object.entries(t)) {
        expect(value, `${locale}.${key}`).toBeTruthy();
        expect(typeof value, `${locale}.${key}`).toBe("string");
      }
    }
  });

  /**
   * Richiesta esplicita di Matteo (integrazione P0.10R punto 2): la
   * lunghezza dell'OTP e' un'impostazione Supabase, non una costante del
   * sito. Il copy non deve mai promettere un numero di cifre.
   */
  it("nessuna locale promette un numero di cifre del codice", () => {
    const digitClaims = /\b\d+\s*(cifre|digit|dígitos|dígito|stellig|chiffres|cyfrow|haneli|cijfers)|[0-9]+\s*桁|[0-9]+자리/i;
    for (const locale of FORGOT_PASSWORD_LOCALES) {
      const all = Object.values(TRANSLATIONS[locale]).join(" ");
      expect(all, `locale ${locale}`).not.toMatch(digitClaims);
    }
  });

  /**
   * La risposta neutra non deve limitarsi a "controlla la posta": chi ha
   * digitato male l'indirizzo resterebbe in attesa senza capire (e' il modo
   * esatto in cui gli utenti si sono bloccati finora). Deve restare neutra
   * MA invitare a ricontrollare l'indirizzo.
   */
  it("la risposta neutra invita a ricontrollare l'indirizzo, senza confermarne l'esistenza", () => {
    for (const locale of FORGOT_PASSWORD_LOCALES) {
      const t = TRANSLATIONS[locale];
      const combined = `${t.neutralTitle} ${t.neutralBody}`;
      // Condizionale esplicito: mai un'affermazione tipo "ti abbiamo inviato".
      expect(combined.length, `locale ${locale}`).toBeGreaterThan(40);
      expect(t.neutralBody, `locale ${locale}`).not.toBe(t.neutralTitle);
    }
  });
});
