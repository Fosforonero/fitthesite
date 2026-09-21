import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { getDictionary, locales } from "@/lib/i18n";
import CookiesPage, { generateMetadata as cookiesMetadata } from "./cookies/page";
import PrivacyPage, { generateMetadata as privacyMetadata } from "./privacy/page";

/**
 * P0.24-A-A: la data «ultimo aggiornamento» di Cookie Policy e Privacy Policy
 * e' scritta in tre posti: il testo visibile (una stringa per lingua), il
 * `dateModified` del JSON-LD e i metadata. Devono dire lo stesso giorno, in
 * tutte le 15 lingue.
 *
 * Il test legge le pagine RENDERIZZATE, non i sorgenti: non dipende da come le
 * costanti sono scritte (il controllo `selfhost:privacy-truth-check`, che
 * cercava le costanti nel sorgente, e' rosso da prima di questa PR proprio per
 * quel formato) e non dipende dal VALORE della data. Cosi' regge anche
 * l'aggiornamento del giorno del merge: se si cambia una data e si dimentica
 * un'altra, diventa rosso.
 */

type Lang = "it" | "en" | "es" | "de" | "pt" | "fr";

const MONTHS: Record<Lang, string[]> = {
  it: ["gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno", "luglio", "agosto", "settembre", "ottobre", "novembre", "dicembre"],
  en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
  es: ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"],
  de: ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"],
  pt: ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"],
  fr: ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"],
};

// Ordine dei gruppi: giorno, mese, anno.
const FORMATS: Record<Lang, { re: RegExp; order: [number, number, number] }> = {
  it: { re: /^(\d{1,2})\s(\S+)\s(\d{4})$/, order: [1, 2, 3] },
  en: { re: /^(\S+)\s(\d{1,2}),\s(\d{4})$/, order: [2, 1, 3] },
  es: { re: /^(\d{1,2})\sde\s(\S+)\sde\s(\d{4})$/, order: [1, 2, 3] },
  de: { re: /^(\d{1,2})\.\s(\S+)\s(\d{4})$/, order: [1, 2, 3] },
  pt: { re: /^(\d{1,2})\sde\s(\S+)\sde\s(\d{4})$/, order: [1, 2, 3] },
  fr: { re: /^(\d{1,2})\s(\S+)\s(\d{4})$/, order: [1, 2, 3] },
};

/** Le pagine mostrano la data nel formato della lingua per it, es, de, pt, fr e in inglese per le altre nove. */
const dateLang = (locale: string): Lang => (["it", "es", "de", "pt", "fr"].includes(locale) ? (locale as Lang) : "en");

/** «17 settembre 2026» (o l'equivalente) -> «2026-09-17»; null se il formato o il mese non sono quelli attesi. */
export function visibleDateToIso(lang: Lang, text: string): string | null {
  const { re, order } = FORMATS[lang];
  const m = re.exec(text.trim());
  if (!m) return null;
  const day = Number(m[order[0]]);
  const month = MONTHS[lang].indexOf(m[order[1]]) + 1;
  const year = Number(m[order[2]]);
  if (!month || day < 1 || day > 31) return null;
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

const ISO = /\b\d{4}-\d{2}-\d{2}\b/g;
const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

type Surface = {
  name: string;
  path: string;
  render: (locale: string) => Promise<string>;
  metadata: (locale: string) => Promise<unknown>;
};

const surfaces: Surface[] = [
  {
    name: "Cookie Policy",
    path: "/cookies",
    render: async (locale) => renderToStaticMarkup(await CookiesPage({ params: Promise.resolve({ locale }) })),
    metadata: (locale) => cookiesMetadata({ params: Promise.resolve({ locale }) }),
  },
  {
    name: "Privacy Policy",
    path: "/privacy",
    render: async (locale) => renderToStaticMarkup(await PrivacyPage({ params: Promise.resolve({ locale }) })),
    metadata: (locale) => privacyMetadata({ params: Promise.resolve({ locale }) }),
  },
];

/** Le tre date di una pagina: testo visibile, JSON-LD, metadata. */
async function readDates(surface: Surface, locale: string) {
  const html = await surface.render(locale);
  const label = (await getDictionary(locale)).legal.last_updated;
  const visibleMatch = new RegExp(`${escapeRe(label)}: ([^<]+)<`).exec(html);
  const visible = visibleMatch ? visibleMatch[1] : null;

  const nodes = [...html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1]) as Record<string, unknown>);
  const page = nodes.find((n) => n["@type"] === "WebPage" && String(n.url).endsWith(`/${locale}${surface.path}`));
  const jsonLd = page ? (page.dateModified as string | undefined) ?? null : null;

  const metadataDates = JSON.stringify(await surface.metadata(locale)).match(ISO) ?? [];
  return { visible, jsonLd, metadataDates, dateLang: dateLang(locale) };
}

describe("il convertitore della data visibile (controllo del test)", () => {
  it("riconosce il formato di ognuna delle sei lingue", () => {
    expect(visibleDateToIso("it", "17 settembre 2026")).toBe("2026-09-17");
    expect(visibleDateToIso("en", "September 17, 2026")).toBe("2026-09-17");
    expect(visibleDateToIso("es", "17 de septiembre de 2026")).toBe("2026-09-17");
    expect(visibleDateToIso("de", "17. September 2026")).toBe("2026-09-17");
    expect(visibleDateToIso("pt", "17 de setembro de 2026")).toBe("2026-09-17");
    expect(visibleDateToIso("fr", "17 septembre 2026")).toBe("2026-09-17");
    expect(visibleDateToIso("fr", "4 août 2026")).toBe("2026-08-04");
  });

  it("rifiuta un mese di un'altra lingua, un formato inatteso e un giorno impossibile", () => {
    expect(visibleDateToIso("it", "17 September 2026")).toBeNull();
    expect(visibleDateToIso("en", "17 settembre 2026")).toBeNull();
    expect(visibleDateToIso("de", "17 September 2026")).toBeNull();
    expect(visibleDateToIso("it", "32 settembre 2026")).toBeNull();
  });
});

for (const surface of surfaces) {
  describe(`${surface.name}: data visibile, JSON-LD e metadata dicono lo stesso giorno`, () => {
    const all = locales as readonly string[];
    it("le lingue sono 15", () => {
      expect(all).toHaveLength(15);
    });

    for (const locale of all) {
      it(`${locale}`, async () => {
        const d = await readDates(surface, locale);
        expect(d.visible, "la data visibile non e' stata trovata nella pagina renderizzata").not.toBeNull();
        expect(d.jsonLd, "il JSON-LD WebPage della pagina non ha dateModified").toMatch(/^\d{4}-\d{2}-\d{2}$/);
        const visibleIso = visibleDateToIso(d.dateLang, d.visible!);
        expect(visibleIso, `«${d.visible}» non e' una data nel formato ${d.dateLang}`).not.toBeNull();
        expect(visibleIso, `data visibile «${d.visible}» diversa da dateModified ${d.jsonLd}`).toBe(d.jsonLd);
        // I metadata di queste pagine non portano date: se un giorno ne portassero, devono coincidere.
        for (const date of d.metadataDates) expect(date, "una data nei metadata differisce dal JSON-LD").toBe(d.jsonLd);
      });
    }

    it("tutte le lingue mostrano lo stesso giorno", async () => {
      const seen = new Set<string>();
      for (const locale of all) {
        const d = await readDates(surface, locale);
        seen.add(`${visibleDateToIso(d.dateLang, d.visible ?? "")}|${d.jsonLd}`);
      }
      expect([...seen], "le lingue non concordano sulla data").toHaveLength(1);
    });
  });
}
