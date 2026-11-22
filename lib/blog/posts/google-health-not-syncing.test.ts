import { describe, expect, it } from "vitest";

import { BLOG_POSTS } from "../data";
import { blogLanguages, isBlogVariantIndexable } from "../indexability";
import { filterBlogContentForLocale } from "../locale-filter";
import { localizedBlogSlug } from "../slug-i18n";
import { applyNordicOverlay, walkPost, type NordicOverlay } from "../nordic-overlay";
import overlayJson from "../nordic-overlay.json";
import { COVER_FILE, coverSrc, coverType } from "../covers";
import { blogSeoTitle, type BlogPost } from "../types";
import { locales } from "@/lib/i18n";
import { localizeInternalHref } from "@/components/blog/BlogRenderer";
import { SITE_URL } from "@/lib/product-facts";
import { post } from "./google-health-not-syncing";
import { post as guidaHealthConnect } from "./health-connect-not-syncing";
import { post as pillarGoogleHealth } from "./google-health-google-fit";

/**
 * Guida diagnostica "Google Health not syncing: what to check" (IT/EN, testi congelati e rivisti).
 * Deterministico: legge solo i sorgenti, nessuna rete. Verifica registrazione, indicizzabilita' (solo it/en;
 * le altre 13 lingue in fallback noindex, fuori da hreflang), assenza di traduzioni inventate, collegamenti
 * risolti verso gli URL canonici, limiti e condizioni delle affermazioni Garmin/Google, e i due collegamenti
 * contestuali nelle guide esistenti (che non devono rendere incomplete le altre lingue di quelle guide).
 */

const SLUG = "google-health-not-syncing";
const PUBLIC_LOCALES = ["it", "en"] as const;

function stringhe(node: unknown, out: string[] = []): string[] {
  if (typeof node === "string") out.push(node);
  else if (Array.isArray(node)) node.forEach((n) => stringhe(n, out));
  else if (node && typeof node === "object") Object.values(node as Record<string, unknown>).forEach((v) => stringhe(v, out));
  return out;
}
const testoDi = (lc: "it" | "en"): string[] => {
  const out: string[] = [];
  const raccogli = (n: unknown): void => {
    if (typeof n === "string") return;
    if (Array.isArray(n)) { n.forEach(raccogli); return; }
    if (n && typeof n === "object") {
      const o = n as Record<string, unknown>;
      if ("it" in o && "en" in o) { stringhe(o[lc], out); return; }
      Object.values(o).forEach(raccogli);
    }
  };
  raccogli(post.body);
  raccogli(post.faq);
  raccogli(post.hero);
  raccogli(post.metaDescription);
  return out;
};
const linkInterni = (lc: "it" | "en"): string[] =>
  testoDi(lc).flatMap((t) => [...t.matchAll(/\]\((\/[^)]+)\)/g)].map((m) => m[1]));

describe("google-health-not-syncing: registrazione e campi di base", () => {
  it("e' registrato una sola volta; lo slug canonico coincide con lo slug EN e IT scelti", () => {
    expect(BLOG_POSTS.filter((p) => p.slug === SLUG)).toHaveLength(1);
    expect(post.slug).toBe(SLUG);
    expect(localizedBlogSlug(SLUG, "it")).toBe(SLUG);
    expect(localizedBlogSlug(SLUG, "en")).toBe(SLUG);
  });

  it("date ISO valide; il nuovo articolo ha publishedAt uguale a updatedAt (date da riconfermare alla pubblicazione)", () => {
    expect(post.publishedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(post.updatedAt).toBe(post.publishedAt);
    expect(Number.isNaN(new Date(post.publishedAt).getTime())).toBe(false);
  });

  it("H1, title con suffisso e description entro i limiti, uguali ai metadati approvati", () => {
    expect(post.hero.title.it).toBe("Google Health non si sincronizza: cosa controllare");
    expect(post.hero.title.en).toBe("Google Health not syncing: what to check");
    for (const lc of PUBLIC_LOCALES) {
      expect(`${blogSeoTitle(post, lc)} · FitMesh`.length, `title ${lc}`).toBeLessThanOrEqual(60);
      expect(post.metaDescription[lc].length, `description ${lc}`).toBeLessThanOrEqual(155);
    }
    expect(post.metaDescription.it).toBe("Dato mancante in Google Health? Controlla l'app del dispositivo, Health Connect o Apple Health, i permessi di lettura e le funzioni che usano il dato.");
    expect(post.metaDescription.en).toBe("Data missing from Google Health? Check the device app, Health Connect or Apple Health, Google Health's read permissions, and which features use the data.");
    expect(post.seoTitle).toBeUndefined();
  });

  it("usa una cover esistente (googleHealthSync): nessun file aggiunto, nessun alt inventato", () => {
    expect(coverType(post)).toBe("googleHealthSync");
    expect(coverSrc(post)).toBe(`/blog/covers/${COVER_FILE.googleHealthSync}`);
    expect(post.coverAlt).toBeUndefined();
    expect(post.coverCaption).toBeUndefined();
  });
});

describe("google-health-not-syncing: indicizzabilita', hreflang e fallback delle altre lingue", () => {
  it("solo IT ed EN sono indicizzabili: le altre 13 lingue sono in fallback noindex", () => {
    const indicizzabili = locales.filter((lc) => isBlogVariantIndexable(post, lc));
    expect(indicizzabili).toEqual(["it", "en"]);
    const altre = locales.filter((lc) => lc !== "it" && lc !== "en");
    expect(altre).toHaveLength(13);
    for (const lc of altre) expect(isBlogVariantIndexable(post, lc), lc).toBe(false);
  });

  it("hreflang: solo it, en e x-default (su /it/); nessuna lingua noindex", () => {
    const langs = blogLanguages(post);
    expect(Object.keys(langs).sort()).toEqual(["en", "it", "x-default"]);
    expect(langs.it).toBe(`${SITE_URL}/it/blog/${SLUG}`);
    expect(langs.en).toBe(`${SITE_URL}/en/blog/${SLUG}`);
    expect(langs["x-default"]).toBe(`${SITE_URL}/it/blog/${SLUG}`);
  });

  it("nessuna traduzione inventata: ogni testo localizzato ha solo le chiavi it ed en", () => {
    const controlla = (n: unknown, percorso: string): void => {
      if (Array.isArray(n)) { n.forEach((x, i) => controlla(x, `${percorso}[${i}]`)); return; }
      if (n && typeof n === "object") {
        const o = n as Record<string, unknown>;
        if ("it" in o && "en" in o) { expect(Object.keys(o).filter((k) => k !== "it" && k !== "en"), percorso).toEqual([]); return; }
        Object.entries(o).forEach(([k, v]) => controlla(v, `${percorso}.${k}`));
      }
    };
    controlla({ hero: post.hero, body: post.body, faq: post.faq, m: post.metaDescription, k: post.primaryKeyword, s: post.secondaryKeywords }, "post");
  });

  it("nessun blocco ha `locales` (il contenuto e' lo stesso per tutte le lingue servite) e IT/EN hanno la stessa struttura", () => {
    expect(post.body.filter((b) => b.locales !== undefined)).toHaveLength(0);
    expect(post.faq?.filter((f) => f.locales !== undefined)).toHaveLength(0);
    const heading = post.body.filter((b) => b.type === "heading");
    expect(heading).toHaveLength(8);
    expect(post.faq).toHaveLength(3);
    for (const b of post.body) {
      if (b.type === "list") expect(b.items.it.length).toBe(b.items.en.length);
    }
  });
});

describe("google-health-not-syncing: collegamenti, fonti e FAQ", () => {
  it("i link interni risolvono verso gli URL canonici corretti, in IT e in EN", () => {
    expect([...new Set(linkInterni("it").map((h) => localizeInternalHref(h, "it")))].sort()).toEqual(["/it/blog/google-health-google-fit", "/it/blog/health-connect-not-syncing"]);
    expect([...new Set(linkInterni("en").map((h) => localizeInternalHref(h, "en")))].sort()).toEqual(["/en/blog/google-health-replaces-google-fit", "/en/blog/health-connect-not-syncing"]);
    expect(linkInterni("it")).toHaveLength(linkInterni("en").length);
  });

  it("le stesse 4 fonti esterne in IT e in EN, tutte presenti in `sources`; fonti gia' citate nel corpo (sourcesRenderedInline)", () => {
    const esterni = (lc: "it" | "en") => [...new Set(testoDi(lc).flatMap((t) => [...t.matchAll(/\]\((https:[^)]+)\)/g)].map((m) => m[1])))].sort();
    expect(esterni("it")).toEqual(esterni("en"));
    expect(esterni("en")).toHaveLength(4);
    expect([...(post.sources ?? [])].sort()).toEqual(esterni("en"));
    expect(post.sourcesRenderedInline).toBe(true);
  });

  it("tre FAQ con domanda e risposta in IT e EN, senza markdown di corsivo", () => {
    expect(post.faq).toHaveLength(3);
    for (const f of post.faq ?? []) for (const lc of PUBLIC_LOCALES) { expect(f.q[lc].trim().length).toBeGreaterThan(5); expect(f.a[lc].trim().length).toBeGreaterThan(20); expect(f.q[lc].endsWith("?")).toBe(true); }
    for (const lc of PUBLIC_LOCALES) for (const t of testoDi(lc)) expect(/^\*(?!\*).*\*$/.test(t), t.slice(0, 40)).toBe(false);
  });
});

describe("google-health-not-syncing: condizioni, limiti e divieti del contenuto approvato", () => {
  const tutto = (lc: "it" | "en") => testoDi(lc).join("\n");

  it("Garmin: Android 14, una sola direzione, nessuna esclusione esplicita di HRV; concordanza corretta (come #126)", () => {
    expect(tutto("en")).toContain("Android 14 and above");
    expect(tutto("en")).toContain("do not assume they are written to Health Connect");
    expect(tutto("it")).toContain("su Android 14 o successivo");
    expect(tutto("it")).toContain("non vanno dati per scritti in Health Connect");
    expect(tutto("it")).not.toContain("date per scritte");
    for (const lc of PUBLIC_LOCALES) expect(tutto(lc)).toContain("HRV Status");
  });

  it("la formulazione first-party resta quella documentata (nessun 'Fitbit/Pixel'), e il limite delle etichette e' dichiarato", () => {
    expect(tutto("en")).toContain("currently uses only first-party data to calculate the sleep score and Cardio Load");
    expect(tutto("it")).toContain("per ora usa solo dati first-party");
    for (const lc of PUBLIC_LOCALES) expect(tutto(lc)).not.toMatch(/Fitbit\/Pixel/);
    expect(tutto("en")).toContain("we have not verified the Italian ones or other languages");
    expect(tutto("it")).toContain("come sia chiamata in italiano o in altre lingue");
  });

  it("l'etichetta sui tempi parla di sincronizzazione, non di recupero, e non aggiunge durate", () => {
    expect(tutto("en")).toContain("Sync completion times: Google's pages give none, so we give none.");
    expect(tutto("it")).toContain("Tempi di completamento della sincronizzazione: le pagine di Google non ne indicano, quindi non ne indichiamo.");
    expect(tutto("en")).not.toMatch(/Recovery times/i);
    expect(tutto("it")).not.toMatch(/Tempi di recupero/i);
  });

  it("nessun trattino lungo o en dash, nessun apostrofo usato come accento, nessun FitMesh nel testo, nessuna etichetta di menu italiana inventata", () => {
    for (const lc of PUBLIC_LOCALES) {
      const t = tutto(lc);
      expect(t).not.toMatch(/[—–]/);
      expect(t).not.toMatch(/FitMesh/);
    }
    expect(tutto("it")).not.toMatch(/\b(e|piu|puo|c|perche|cioe|gia|cosi)'(?=[\s.,;:)])/i);
    expect(tutto("it")).not.toMatch(/Collegamenti,|App partner|Gestisci Health Connect|Sincronizzat[oa] ora/);
    expect(tutto("it")).toContain("nell'app in inglese: Connections, poi Partner apps, poi Manage Health Connect");
  });

  it("non duplica i sette fix generici (batteria, cache, reset, sync forzata dell'app sorgente, riavvio)", () => {
    expect(tutto("en")).not.toMatch(/battery optimi[sz]ation|disable battery|clear (the )?(health connect )?(cache|data)|revoke|re-grant all|full reset|factory reset|force (a )?sync|pull-to-refresh|restart (your )?(phone|device)|reboot/i);
    expect(tutto("it")).not.toMatch(/ottimizzazione batteria|svuota(re)? (la )?cache|reimposta|riavvia|disinstall|reset completo/i);
  });

  it("Garmin verso Apple Health non e' affermato; nessun Google 'Fitbit o Pixel' inventato", () => {
    for (const lc of PUBLIC_LOCALES) {
      const righeGarmin = tutto(lc).split("\n").filter((l) => /Garmin/.test(l) && /Apple Health/.test(l));
      for (const l of righeGarmin) expect(l, "Garmin e Apple Health nella stessa riga solo come elenco della frase di Google").not.toMatch(/Garmin[^.]{0,80}(scrive|writes|invia|send)[^.]{0,60}Apple Health/i);
    }
  });
});

describe("google-health-not-syncing: collegamenti contestuali nelle due guide esistenti (L1, L2)", () => {
  const blocchiLink = (p: BlogPost) =>
    p.body.filter((b) => b.type === "paragraph" && /google-health-not-syncing/.test(JSON.stringify(b.text)));

  it("ciascuna guida ha esattamente un blocco di collegamento, solo it/en, con l'URL canonico del nuovo articolo", () => {
    for (const guida of [guidaHealthConnect, pillarGoogleHealth]) {
      const b = blocchiLink(guida);
      expect(b, guida.slug).toHaveLength(1);
      expect(b[0].locales).toEqual(["it", "en"]);
      const t = (b[0] as { text: { it: string; en: string } }).text;
      expect(t.it).toContain("(/it/blog/google-health-not-syncing)");
      expect(t.en).toContain("(/en/blog/google-health-not-syncing)");
      expect(localizeInternalHref("/it/blog/google-health-not-syncing", "it")).toBe("/it/blog/google-health-not-syncing");
      expect(localizeInternalHref("/en/blog/google-health-not-syncing", "en")).toBe("/en/blog/google-health-not-syncing");
    }
    expect((blocchiLink(guidaHealthConnect)[0] as { text: { en: string } }).text.en).toContain("missing from Google Health");
  });

  it("le altre 13 lingue non vedono il collegamento e non diventano incomplete: l'indicizzabilita' delle guide non cambia", () => {
    for (const guida of [guidaHealthConnect, pillarGoogleHealth]) {
      const senzaLink: BlogPost = { ...guida, body: guida.body.filter((b) => !blocchiLink(guida).includes(b)) };
      for (const lc of locales) {
        expect(isBlogVariantIndexable(guida, lc), `${guida.slug} ${lc}`).toBe(isBlogVariantIndexable(senzaLink, lc));
        const visibili = filterBlogContentForLocale(guida.body, lc).some((b) => blocchiLink(guida).includes(b));
        expect(visibili, `${guida.slug} ${lc}`).toBe(lc === "it" || lc === "en");
      }
    }
  });

  it("il testo esistente delle guide non e' stato toccato: il paragrafo-catena del pillar e l'elenco della guida generica restano al loro posto", () => {
    const iCatena = pillarGoogleHealth.body.findIndex((b) => b.type === "paragraph" && /If a piece of data is missing or stale in Google Health|Se un dato non compare o è vecchio in Google Health/.test(JSON.stringify(b.text)));
    expect(iCatena).toBeGreaterThan(0);
    expect(blocchiLink(pillarGoogleHealth)[0]).toBe(pillarGoogleHealth.body[iCatena + 1]);
    const iLista = guidaHealthConnect.body.indexOf(blocchiLink(guidaHealthConnect)[0]) - 1;
    expect(guidaHealthConnect.body[iLista].type).toBe("list");
  });
});

describe("google-health-not-syncing: l'inserimento dei collegamenti non sposta le traduzioni nordiche delle guide", () => {
  // Le chiavi di nordic-overlay.json sono percorsi `body.<indice>` sull'array ORIGINALE (walkPost): un blocco inserito a meta'
  // corpo sposta i successivi e, se le chiavi non vengono rinumerate, le varianti nordiche risultano incomplete (noindex) e
  // spariscono dall'hreflang. Regressione trovata sul candidato (SV e DA della guida generica) e corretta rinumerando 5 chiavi.
  const overlay = overlayJson as unknown as Record<string, Record<string, Record<string, unknown>>>;

  it("ogni chiave d'overlay delle due guide punta a un percorso reale dello stesso tipo, e le lingue nordiche indicizzabili restano quelle di produzione", () => {
    // Come a runtime (payload-source.ts): overlay nordico applicato su un clone del post registrato.
    const registrate = [guidaHealthConnect, pillarGoogleHealth].map((g) => {
      const clone = structuredClone(BLOG_POSTS.find((p) => p.slug === g.slug)!);
      applyNordicOverlay(clone, overlayJson as unknown as NordicOverlay);
      return clone;
    });
    for (const guida of registrate) {
      const voci = new Map(walkPost(guida).map((e) => [e.path, e]));
      for (const [chiave, valori] of Object.entries(overlay[guida.slug] ?? {})) {
        const e = voci.get(chiave);
        if (!e) {
          // Unico caso ammesso senza voce in walkPost: chiavi storiche di un blocco CTA editoriale (walkPost non lo enumera).
          // L'indice DEVE comunque essere quello del blocco CTA, altrimenti la chiave e' stata spostata dall'inserimento.
          const indice = Number(chiave.match(/^body\.(\d+)\./)?.[1]);
          expect(guida.body[indice]?.type, `${guida.slug}: chiave d'overlay senza blocco corrispondente: ${chiave}`).toBe("fitmesh-editorial-cta");
          continue;
        }
        for (const v of Object.values(valori)) {
          if (e.kind === "list") {
            expect(Array.isArray(v), `${guida.slug} ${chiave}: lista attesa`).toBe(true);
            // secondaryKeywords puo' avere cardinalita' diversa per lingua (caso gia' previsto dal repository): si controlla solo il corpo.
            if (chiave.startsWith("body.")) expect((v as unknown[]).length, `${guida.slug} ${chiave}: stessa lunghezza dell'IT`).toBe((e.node as { it: unknown[] }).it.length);
          } else {
            expect(typeof v, `${guida.slug} ${chiave}: testo atteso`).toBe("string");
          }
        }
      }
    }
    const nordiche = (p: BlogPost) => (["sv", "da", "no", "fi"] as const).filter((lc) => isBlogVariantIndexable(p, lc));
    expect(nordiche(registrate[0])).toEqual(["sv", "da"]); // come in produzione (hreflang live del 13/11/2026)
    expect(nordiche(registrate[1])).toEqual([]);
    expect(Object.keys(blogLanguages(registrate[0]))).toEqual(expect.arrayContaining(["sv", "da"]));
  });
});
