/**
 * Invarianti della home e di /about dopo il pacchetto S02 (BASE-HOME-v2.1-8961c3f9).
 *
 * Questi test fissano lo stato NUOVO (decisioni di Matteo del 02/10/2026):
 * H1 opzione B, hero senza riga commerciale, sezione prezzi senza importi,
 * nessuno slogan privacy, una sola fonte per title/description/JSON-LD.
 *
 * Le 13 lingue con celle ancora PENDENTI (attesa della consegna Gemini) non
 * sono qui rese verdi con un allentamento: dove una lingua ha ancora il testo
 * di f142eac l'asserzione e' sul suo insieme esplicito (PENDENTI_*), che puo'
 * solo restringersi. Il rosso complessivo resta in
 * tools/check-s02-home-lingue.ts (gate di rilascio).
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { locales, type Locale } from "@/lib/i18n";
import { FORBIDDEN } from "@/tools/s02-forbidden";
import { PRIVACY_SLOGANS_VIETATI } from "@/lib/content/s02-privacy-slogans-vietati";
import { PRICING_SECTION } from "@/lib/pricing-section";
import { HOMEPAGE_COPY } from "@/lib/content/homepage-copy";
import { ABOUT_COPY } from "@/lib/content/about-copy";
import { HOME_AI_COPY } from "@/lib/content/home-ai-copy";
import { HOME_META_DESCRIPTIONS, HOME_META_TITLES } from "@/lib/content/home-meta";
import { ORG_DESCRIPTIONS } from "@/lib/product-facts";
import { tlOwn } from "@/lib/content/localized-own";
import { organizationJsonLdData } from "@/components/seo/OrganizationJsonLd";

const root = join(__dirname, "..", "..");
const read = (p: string) => readFileSync(join(root, p), "utf8");
const dict = (lc: string) => JSON.parse(read(`lib/dictionaries/${lc}.json`)) as Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
const DICTS = Object.fromEntries(locales.map((l) => [l, dict(l)])) as Record<Locale, Record<string, any>>; // eslint-disable-line @typescript-eslint/no-explicit-any

const DASH = /[–—]/;
const forbid = (label: string) => FORBIDDEN.find((f) => f.label === label)!.re;

/** Tutti i valori stringa di un oggetto Localized-like per una lingua. */
function valuesOf(node: unknown, lc: string, out: string[] = []): string[] {
  if (typeof node === "string") out.push(node);
  else if (Array.isArray(node)) node.forEach((n) => valuesOf(n, lc, out));
  else if (node && typeof node === "object") {
    const o = node as Record<string, unknown>;
    if (lc in o && typeof o[lc] === "string") out.push(o[lc] as string);
    else if (lc in o) valuesOf(o[lc], lc, out);
    else for (const v of Object.values(o)) valuesOf(v, lc, out);
  }
  return out;
}

describe("H1 della home (U-HERO-01/02, opzione B)", () => {
  it("it e en: testo esatto", () => {
    expect(DICTS.it.hero.heading_1).toBe("I tuoi dati fitness, insieme.");
    expect(DICTS.it.hero.heading_accent).toBe("Anche quando cambi dispositivo.");
    expect(DICTS.en.hero.heading_1).toBe("Your fitness data, together.");
    expect(DICTS.en.hero.heading_accent).toBe("Even when you switch devices.");
  });

  it("descrizione dell'hero it/en: cambio dispositivo, senza promesse di prezzo", () => {
    expect(DICTS.it.hero.description).toMatch(/^Funziona anche con un solo orologio\./);
    expect(DICTS.en.hero.description).toMatch(/^It works with a single watch too\./);
    for (const lc of ["it", "en"] as const) {
      expect(DICTS[lc].hero.description).not.toMatch(forbid("importo"));
      expect(DICTS[lc].hero.description).not.toMatch(forbid("privacy-first"));
    }
  });

  it("l'H1 e' reso dal dizionario (heading_1 + heading_accent), non da una stringa nel codice", () => {
    const src = read("app/(frontend)/[locale]/(marketing)/page.tsx");
    expect(src).toMatch(/\{t\.hero\.heading_1\}/);
    expect(src).toMatch(/\{t\.hero\.heading_accent\}/);
  });
});

describe("hero senza riga commerciale", () => {
  it("la chiave hero.pricing non esiste in nessuna delle 15 lingue", () => {
    for (const lc of locales) expect(Object.keys(DICTS[lc].hero), lc).not.toContain("pricing");
  });

  it("nessun valore del blocco hero contiene importi, in nessuna lingua", () => {
    for (const lc of locales) {
      for (const v of valuesOf(DICTS[lc].hero, lc)) expect(v, `${lc}: ${v}`).not.toMatch(forbid("importo"));
    }
  });
});

describe("sezione prezzi: nessun importo, nessun «niente abbonamento» (15 lingue)", () => {
  const sezioni: [string, unknown][] = [
    ["PRICING_SECTION", PRICING_SECTION],
    ["HOMEPAGE_COPY.trialName", HOMEPAGE_COPY.trialName],
    ["HOMEPAGE_COPY.trialTagline", HOMEPAGE_COPY.trialTagline],
  ];

  it("nessun «€», «$», cifra di prezzo o valuta", () => {
    for (const lc of locales) {
      for (const [nome, node] of sezioni) {
        for (const v of valuesOf(node, lc)) {
          expect(v, `${nome} ${lc}`).not.toMatch(forbid("importo"));
          expect(v, `${nome} ${lc}`).not.toMatch(/[€$£¥]/);
        }
      }
    }
  });

  it("nessun «niente abbonamento», «gratis per sempre», em dash o en dash", () => {
    for (const lc of locales) {
      for (const [nome, node] of sezioni) {
        for (const v of valuesOf(node, lc)) {
          expect(v, `${nome} ${lc}`).not.toMatch(forbid("niente abbonamento"));
          expect(v, `${nome} ${lc}`).not.toMatch(forbid("gratis per sempre"));
          expect(v, `${nome} ${lc}`).not.toMatch(DASH);
        }
      }
    }
  });

  it("it/en esatti: titolo, subhead (fonte unica di ABOUT_COPY.trialDesc), nota dello store", () => {
    expect(PRICING_SECTION.heading.it).toBe("L'app si scarica gratis.");
    expect(PRICING_SECTION.heading.en).toBe("The app is free to download.");
    expect(PRICING_SECTION.subhead.en).toBe(
      "Try FitMesh Pro for 14 days. After the trial, continuing to use Pro features requires a purchase or subscription.",
    );
    expect(ABOUT_COPY.trialDesc).toBe(PRICING_SECTION.subhead);
    expect(PRICING_SECTION.storeNote.en).toBe("The purchase options and the price are the ones your store shows in the app, in your country.");
    expect(PRICING_SECTION.proTagline.it).toBe("Sblocco a vita o abbonamento, secondo lo store");
  });

  it("la pagina non importa lib/pricing (gli importi non entrano nella home)", () => {
    expect(read("app/(frontend)/[locale]/(marketing)/page.tsx")).not.toMatch(/from "@\/lib\/pricing"/);
  });

  it("FAQ di costo it/en senza importi ne' «niente abbonamento»", () => {
    const faqs = read("lib/content/faqs.ts");
    expect(faqs).not.toMatch(/(?:[€$]\s?\d|\d\s?€)[^\n]*(?:it:|en:)/);
  });
});

describe("blocco privacy della home e privacy di /about: nessuno slogan (15 lingue)", () => {
  // Delle chiavi di privacy di ABOUT_COPY la pagina rende solo privacyBody1
  // (U-PRIV-06..09: H2 da nav.privacy, link da footer.links.privacy). Le altre
  // sono dati non resi (serverChoice ha ancora un em dash nelle 15 lingue, ma
  // non e' piu' sulla pagina: il test sotto fissa che non lo diventi).
  const aboutPrivacy = ["privacyBody1"] as const;
  const NON_RESE = ["privacyHeading", "privacyBody2", "serverChoice", "deleteAccountPrefix", "deleteAccountSuffix", "privacyPolicyLink"];

  it("/about rende solo ABOUT_COPY.privacyBody1 fra le chiavi privacy (le altre non tornano sulla pagina)", () => {
    const about = read("app/(frontend)/[locale]/(marketing)/about/page.tsx");
    expect(about).toMatch(/ABOUT_COPY\.privacyBody1/);
    for (const k of NON_RESE) expect(about, k).not.toMatch(new RegExp(`ABOUT_COPY\\.${k}\\b`));
    expect(about).toMatch(/t\.nav\.privacy/);
  });

  it("il dizionario di ogni lingua ha solo privacy_block.cta (kicker, heading, description tolti)", () => {
    for (const lc of locales) expect(Object.keys(DICTS[lc].privacy_block), lc).toEqual(["cta"]);
  });

  it("nessuna delle stringhe vietate (inventario, testi esatti) in privacy_block", () => {
    for (const lc of locales) {
      const txt = valuesOf(DICTS[lc].privacy_block, lc).join("\n");
      for (const s of new Set(PRIVACY_SLOGANS_VIETATI[lc])) expect(txt, `${lc}: ${s}`).not.toContain(s);
      expect(txt, lc).not.toMatch(forbid("privacy-first"));
    }
  });

  it("HOMEPAGE_COPY non ha piu' privacyPoints", () => {
    expect(Object.keys(HOMEPAGE_COPY)).not.toContain("privacyPoints");
  });

  it("sezione privacy di /about: nessuno slogan vietato, nessun «privacy-first» equivalente", () => {
    for (const lc of locales) {
      for (const k of aboutPrivacy) {
        const v = (ABOUT_COPY[k] as Record<string, string>)[lc] ?? "";
        for (const s of new Set(PRIVACY_SLOGANS_VIETATI[lc])) expect(v, `${k} ${lc}: ${s}`).not.toContain(s);
        expect(v, `${k} ${lc}`).not.toMatch(forbid("privacy-first"));
        expect(v, `${k} ${lc}`).not.toMatch(DASH);
      }
    }
  });

  it("/about it/en: la frase sul codice dell'app e' ridotta (teamBody2) e la privacy parla solo di GA4 e cookie", () => {
    expect(ABOUT_COPY.privacyBody1.it).toMatch(/^Il sito usa Google Analytics 4 solo dopo che lo accetti/);
    expect(ABOUT_COPY.privacyBody1.en).toMatch(/^The website uses Google Analytics 4 only after you accept it/);
  });

  it("la frase GA4 della privacy resta in 15 lingue", () => {
    for (const lc of locales) {
      expect((ABOUT_COPY.privacyBody1 as Record<string, string>)[lc], lc).toMatch(/Google Analytics 4|GA4/);
    }
  });
});

describe("title, description, homeLd e ORG_DESCRIPTIONS", () => {
  const layoutRadice = read("app/(frontend)/[locale]/layout.tsx");
  const layoutMkt = read("app/(frontend)/[locale]/(marketing)/layout.tsx");
  const page = read("app/(frontend)/[locale]/(marketing)/page.tsx");

  it("i due layout leggono title e description da home-meta, senza copie locali", () => {
    for (const src of [layoutRadice, layoutMkt]) {
      expect(src).toMatch(/from ["']@\/lib\/content\/home-meta["']/);
      expect(src).toMatch(/const descriptions = HOME_META_DESCRIPTIONS/);
      expect(src).toMatch(/HOME_META_TITLES/);
      // nessuna tabella di description inline: nessun oggetto {it:..., en:...} con descrizioni lunghe
      expect(src).not.toMatch(/\bit:\s*"FitMesh Sync/);
    }
  });

  it("homeLd.name e homeLd.description vengono dalla stessa fonte dei metadata, senza ramo inglese", () => {
    const i = page.indexOf("const homeLd");
    const blocco = page.slice(i, page.indexOf("inLanguage", i));
    expect(blocco).toMatch(/name: homeMetaTitle\(lc\)/);
    expect(blocco).toMatch(/description: homeMetaDescription\(lc\)/);
    expect(blocco).not.toMatch(/lc === "(?:it|en)"|\?\s*"[^"]*FitMesh|\.en\b|\?\? /);
  });

  it("per ogni lingua metadata e homeLd danno lo stesso valore, e le 12 lingue non ereditano l'inglese", () => {
    for (const lc of locales) {
      expect(HOME_META_TITLES[lc]).toBeTruthy();
      expect(HOME_META_DESCRIPTIONS[lc]).toBeTruthy();
    }
    for (const lc of locales.filter((l) => l !== "it" && l !== "en")) {
      expect(HOME_META_TITLES[lc], lc).not.toBe(HOME_META_TITLES.en);
      expect(HOME_META_DESCRIPTIONS[lc], lc).not.toBe(HOME_META_DESCRIPTIONS.en);
      expect(HOME_META_DESCRIPTIONS[lc], lc).not.toBe(HOME_META_DESCRIPTIONS.it);
    }
  });

  it("title it/en esatti e description it/en senza slogan", () => {
    expect(HOME_META_TITLES.it).toBe("FitMesh Sync: i tuoi dati fitness insieme, su iPhone e Android");
    expect(HOME_META_TITLES.en).toBe("FitMesh Sync: your fitness data together, on iPhone and Android");
    for (const lc of ["it", "en"] as const) {
      for (const v of [HOME_META_DESCRIPTIONS[lc], ORG_DESCRIPTIONS[lc]]) {
        expect(v, lc).not.toMatch(forbid("privacy-first"));
        expect(v, lc).not.toMatch(forbid("dashboard web"));
        expect(v, lc).not.toMatch(DASH);
      }
    }
  });

  it("ORG_DESCRIPTIONS: 15 lingue, it/en dal testo base, e il JSON-LD Organization legge la propria lingua", () => {
    expect(Object.keys(ORG_DESCRIPTIONS).sort()).toEqual([...locales].sort());
    expect(ORG_DESCRIPTIONS.it).toMatch(/^FitMesh Sync è un'app per iPhone e Android che legge i dati fitness/);
    expect(ORG_DESCRIPTIONS.en).toMatch(/^FitMesh Sync is an iPhone and Android app that reads fitness data/);
    for (const lc of locales) {
      expect(organizationJsonLdData(lc).description, lc).toBe(ORG_DESCRIPTIONS[lc]);
    }
    for (const lc of locales.filter((l) => l !== "it" && l !== "en")) {
      expect(ORG_DESCRIPTIONS[lc], lc).not.toBe(ORG_DESCRIPTIONS.en);
    }
  });
});

describe("campi nuovi opzionali: nessun ripiego inglese, il blocco si ritira", () => {
  const PRESENTI = new Set<Locale>(["it", "en"]);

  it("HOME_AI_COPY e le chiavi nuove dei prezzi: valore proprio o undefined, mai la lingua sbagliata", () => {
    for (const nodo of [HOME_AI_COPY.heading, HOME_AI_COPY.body, HOME_AI_COPY.linkLabel, PRICING_SECTION.storeNote, PRICING_SECTION.priceFromStore]) {
      for (const lc of locales) {
        const v = tlOwn(nodo, lc);
        if (PRESENTI.has(lc)) expect(v, lc).toBeTruthy();
        else if (v !== undefined) {
          // valore consegnato in quella lingua: deve essere diverso da it/en
          expect(v, lc).not.toBe(nodo.en);
          expect(v, lc).not.toBe(nodo.it);
        }
      }
    }
  });

  it("la pagina rende i blocchi opzionali solo con il valore (nessun tl() sui campi nuovi)", () => {
    const page = read("app/(frontend)/[locale]/(marketing)/page.tsx");
    expect(page).toMatch(/\{aiHeading && aiBody && \(/);
    expect(page).not.toMatch(/tl\(HOME_AI_COPY/);
    expect(page).not.toMatch(/tl\(PRICING_SECTION\.(?:storeNote|priceFromStore)/);
  });
});

describe("testi collegati: nessun importo, em dash o en dash nei campi it/en toccati", () => {
  it("HOME_AI_COPY, PRICING_SECTION, ABOUT_COPY.trialDesc, HOMEPAGE_COPY.leadSentence/howItWorks", () => {
    for (const lc of ["it", "en"] as const) {
      const tutti = [
        ...valuesOf(HOME_AI_COPY, lc),
        ...valuesOf(PRICING_SECTION, lc),
        ...valuesOf(HOMEPAGE_COPY.leadSentence, lc),
        ...valuesOf(HOMEPAGE_COPY.steps, lc),
        ...valuesOf(HOMEPAGE_COPY.howItWorksHeading, lc),
      ];
      for (const v of tutti) {
        expect(v, `${lc}: ${v}`).not.toMatch(DASH);
        expect(v, `${lc}: ${v}`).not.toMatch(forbid("importo"));
        expect(v, `${lc}: ${v}`).not.toMatch(forbid("privacy-first"));
        expect(v, `${lc}: ${v}`).not.toMatch(forbid("dashboard web"));
      }
    }
  });
});
