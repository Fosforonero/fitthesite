import { afterEach, describe, expect, it } from "vitest";
import { CAPABILITY_STATUS } from "@/lib/product-facts";
import { featureStatusSentence, isFeatureAvailable, meshStatusSentenceRenderable, type FeatureKey } from "@/lib/feature-status";
import { post } from "./fitmesh-ultratleta-apple-watch-garmin-polar";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { BLOG_POSTS } from "../data";
import { isBlogVariantIndexable, isPostLocaleComplete } from "../indexability";
import type { BlogPost } from "../types";

type GuideLocale = "it" | "en" | "de" | "ja" | "fr";
const LOCALES: GuideLocale[] = ["it", "en", "de", "ja", "fr"];
const KEYS: FeatureKey[] = ["webDashboard", "familyMesh"];

/** Tutte le stringhe di una lingua, ovunque stiano nel post (hero, tldr, corpo, cta, faq). */
function collectStrings(node: unknown, lc: GuideLocale, out: string[] = []): string[] {
  if (Array.isArray(node)) {
    for (const n of node) collectStrings(n, lc, out);
  } else if (node && typeof node === "object") {
    for (const [k, v] of Object.entries(node as Record<string, unknown>)) {
      if (k === lc) {
        if (typeof v === "string") out.push(v);
        else if (Array.isArray(v)) {
          for (const x of v) {
            if (typeof x === "string") out.push(x);
            else collectStrings(x, lc, out);
          }
        }
      } else if (!LOCALES.includes(k as GuideLocale)) {
        collectStrings(v, lc, out);
      }
    }
  }
  return out;
}

// Una frase che parla di dashboard web o Mesh E ne dichiara lo stato (non disponibile / in sviluppo).
const TERM: Record<GuideLocale, RegExp> = {
  it: /dashboard|mesh famiglia|family mesh/i,
  en: /dashboard|family mesh/i,
  de: /dashboard|mesh familie|family mesh/i,
  ja: /ダッシュボード|family mesh/i,
  fr: /tableau de bord|mesh famille|family mesh/i,
};
const STATE: Record<GuideLocale, RegExp> = {
  it: /non (è |sono )?(ancora )?disponibil|in sviluppo/i,
  en: /not (yet )?available|in development/i,
  de: /nicht (mehr )?verfügbar|in entwicklung/i,
  ja: /利用できません|開発中/,
  fr: /pas encore disponible|non disponible|en cours de développement/i,
};
const FORBIDDEN_POSITIVE: Record<GuideLocale, RegExp[]> = {
  it: [/disponibil[ei] ora/i, /apri il browser/i, /già disponibil[ei]/i],
  en: [/available now/i, /already available/i, /open (it )?in (any |your )?browser/i],
  de: [/jetzt verfügbar/i, /bereits verfügbar/i, /im browser öffnen/i],
  ja: [/今すぐ利用可能/, /すでに利用可能/, /ブラウザで開く/],
  fr: [/disponible maintenant/i, /déjà disponible/i, /ouvrir dans le navigateur/i],
};

const splitSentences = (s: string) => s.split(/(?<=[.。!?？])\s*/).map((x) => x.trim()).filter(Boolean);

/**
 * Verifica che LEGGE lo stato dal registro (CAPABILITY_STATUS tramite
 * isFeatureAvailable) e le frasi da lib/feature-status.ts. Fail-closed:
 * - funzione disponibile nel registro mentre il post la dichiara non disponibile: ERRORE;
 * - funzione non disponibile e frase del registro assente (dove renderizzabile): ERRORE;
 * - frase Mesh presente dove il registro non la rende (lingua senza formula approvata): ERRORE;
 * - frase di stato nel post diversa da quella del registro nella stessa lingua: ERRORE.
 */
function validateFutureFeatureStatus(postToTest: BlogPost) {
  for (const lc of LOCALES) {
    const chunks = collectStrings(postToTest, lc);
    const combined = chunks.join(" ");
    const registrySentences: string[] = [];
    for (const key of KEYS) {
      const sentence = featureStatusSentence(key, lc);
      registrySentences.push(...splitSentences(sentence));
      const declared = combined.includes(sentence);
      const renderable = key === "familyMesh" ? meshStatusSentenceRenderable(lc) : true;
      if (isFeatureAvailable(key)) {
        if (declared) throw new Error(`[${lc}] ${key} e' disponibile nel registro ma il post lo dichiara non disponibile`);
      } else if (renderable && !declared) {
        throw new Error(`[${lc}] ${key} non e' disponibile nel registro ma il post non riporta la frase del registro`);
      } else if (!renderable && declared) {
        throw new Error(`[${lc}] ${key}: la frase del registro non e' renderizzabile in questa lingua ma e' nel post`);
      }
    }
    for (const chunk of chunks) {
      for (const sentence of splitSentences(chunk)) {
        if (TERM[lc].test(sentence) && STATE[lc].test(sentence) && !registrySentences.includes(sentence)) {
          throw new Error(`[${lc}] frase di stato diversa da quella del registro: ${sentence}`);
        }
      }
    }
    // Le domande delle FAQ ("... e' gia' disponibile?") non sono promesse: si controllano le affermazioni.
    const statements = chunks.flatMap(splitSentences).filter((x) => !/[?？]$/.test(x)).join(" ");
    for (const forbidden of FORBIDDEN_POSITIVE[lc]) {
      if (forbidden.test(statements)) {
        throw new Error(`[${lc}] promessa di disponibilita' attiva non consentita: ${forbidden}`);
      }
    }
  }
}

const original = Object.fromEntries(KEYS.map((k) => [k, CAPABILITY_STATUS[k].status])) as Record<FeatureKey, string>;
afterEach(() => {
  for (const k of KEYS) CAPABILITY_STATUS[k].status = original[k] as never;
});

describe("Guida ultratleta multi-dispositivo (fitmesh-ultratleta-apple-watch-garmin-polar)", () => {
  it("il post esporta le proprietà canoniche corrette e coverAlt per le 5 lingue", () => {
    expect(post.slug).toBe("fitmesh-ultratleta-apple-watch-garmin-polar");
    expect(post.category).toBe("guides");
    expect(post.publishedAt).toBe("2026-10-01");
    expect(post.updatedAt).toBe("2026-10-01");
    expect(post.readMinutes).toBeGreaterThan(0);
    expect(post.coverAlt).toBeDefined();
    for (const lc of ["it", "en", "de", "ja", "fr"] as const) {
      expect(post.coverAlt?.[lc], `coverAlt mancante per ${lc}`).toBeDefined();
      expect(post.coverAlt?.[lc]?.length).toBeGreaterThan(15);
    }
  });

  it("è completo campo per campo per le 5 lingue previste (it, en, de, ja, fr)", () => {
    for (const lc of ["it", "en", "de", "ja", "fr"] as const) {
      expect(isPostLocaleComplete(post, lc), `La locale ${lc} deve essere completa campo per campo`).toBe(true);
    }
  });

  it("l'oggetto BlogPost risulta incompleto per le lingue non ancora tradotte (isPostLocaleComplete === false), condizione necessaria per il noindex a livello di routing", () => {
    for (const lc of ["es", "pt", "pl", "tr", "nl", "ko"] as const) {
      expect(isPostLocaleComplete(post, lc), `La locale ${lc} deve risultare incompleta nell'oggetto post`).toBe(false);
    }
  });

  it("non contiene alcun em dash (—) nei testi localizzati (EDITORIAL-CORE 8)", () => {
    const rawJson = JSON.stringify(post);
    expect(rawJson).not.toContain("—");
  });

  it("non contiene marchi di app concorrenti di sincronizzazione", () => {
    const rawText = JSON.stringify(post).toLowerCase();
    const banned = ["health sync", "syncmytracks", "fitnesssyncer", "rungap", "zepp life"];
    for (const b of banned) {
      expect(rawText).not.toContain(b);
    }
  });


  it("lo stato di dashboard web e Mesh e' quello del registro, frase per frase, in tutte le 5 lingue", () => {
    expect(() => validateFutureFeatureStatus(post)).not.toThrow();
  });

  it("MUTAZIONE: se la dashboard web diventa disponibile nel registro il test diventa rosso", () => {
    CAPABILITY_STATUS.webDashboard.status = "live_verified";
    expect(() => validateFutureFeatureStatus(post)).toThrow(/webDashboard e' disponibile nel registro/);
  });

  it("MUTAZIONE: se la Mesh diventa disponibile (anche limitata) nel registro il test diventa rosso", () => {
    CAPABILITY_STATUS.familyMesh.status = "live_limited";
    expect(() => validateFutureFeatureStatus(post)).toThrow(/familyMesh e' disponibile nel registro/);
  });

  it("MUTAZIONE: una frase di stato diversa da quella del registro fa fallire il test", () => {
    const mutated = JSON.parse(JSON.stringify(post)) as BlogPost;
    const sentence = featureStatusSentence("webDashboard", "de");
    const chunk = mutated.faq!.find((f) => (f.a.de ?? "").includes(sentence))!;
    chunk.a.de = (chunk.a.de ?? "").replace(sentence, "Das Web-Dashboard ist derzeit nicht verfügbar.");
    expect(() => validateFutureFeatureStatus(mutated)).toThrow(/\[de\]/);
  });

  it("MUTAZIONE: la frase del registro tolta in una lingua fa fallire il test", () => {
    const mutated = JSON.parse(JSON.stringify(post)) as BlogPost;
    const sentence = featureStatusSentence("webDashboard", "fr");
    for (const f of mutated.faq!) f.a.fr = (f.a.fr ?? "").replace(sentence, "");
    mutated.tldr!.fr = (mutated.tldr!.fr ?? []).map((x) => x.replace(sentence, ""));
    expect(() => validateFutureFeatureStatus(mutated)).toThrow(/\[fr\] webDashboard non e' disponibile/);
  });

  it("MUTAZIONE: una promessa di disponibilita' attiva fa fallire il test", () => {
    const mutated = JSON.parse(JSON.stringify(post)) as BlogPost;
    mutated.faq![3].a.en += " The web dashboard is already available.";
    expect(() => validateFutureFeatureStatus(mutated)).toThrow(/\[en\]/);
  });

  it("le stringhe errate corrette in C2 non ci sono piu' in nessuna lingua", () => {
    const WRONG: Record<GuideLocale, RegExp[]> = {
      it: [/periodi di quiete/i, /ridurre le duplicazioni|riduce le duplicazioni/i, /dati restano protetti/i, /backend sicuro/i],
      en: [/resting and sleep intervals/i, /reduce duplication/i, /remain secure/i, /secure (account )?backend|secure account/i],
      de: [/ruhe- und schlafphasen/i, /duplikate? (zu )?(reduzieren|vermeiden)/i, /geschützt/i, /gesichert/i],
      ja: [/安静期や睡眠時/, /安全に保護/, /安全な/],
      fr: [/périodes de calme/i, /réduire les doublons/i, /protégées/i, /sécuris/i],
    };
    for (const lc of LOCALES) {
      const text = collectStrings(post, lc).join("\n");
      for (const re of WRONG[lc]) expect(text, `[${lc}] ${re}`).not.toMatch(re);
    }
  });

  it("il percorso di download e' un blocco fitmesh-editorial-cta (App Store e Google Play), non un link a #pricing", () => {
    const ctas = post.body.filter((s) => s.type === "fitmesh-editorial-cta");
    expect(ctas).toHaveLength(1);
    expect(post.body.filter((s) => s.type === "cta")).toHaveLength(0);
    expect(JSON.stringify(post)).not.toContain("#pricing");
    // Il blocco rende StoreButtonsRow (App Store e Google Play): lo garantisce il renderer condiviso.
    const renderer = readFileSync(join(__dirname, "../../../components/blog/BlogRenderer.tsx"), "utf8");
    const caseBlock = renderer.split('case "fitmesh-editorial-cta"')[1]?.split('case "flow-diagram"')[0] ?? "";
    expect(caseBlock).toContain("<StoreButtonsRow");
    const row = readFileSync(join(__dirname, "../../../components/StoreButtonsRow.tsx"), "utf8");
    expect(row).toMatch(/App Store|apple/i);
    expect(row).toMatch(/Google Play|google/i);
  });

  it("nessun link con schema file:// o segnaposto, e nessun link interno verso un post assente nella lingua", () => {
    const raw = JSON.stringify(post);
    expect(raw).not.toMatch(/file:\/\//i);
    expect(raw).not.toMatch(/BLOG_SLUGS|TODO|TBD|PLACEHOLDER|SEGNAPOSTO|\[\[|\{\{/);
    expect(raw).not.toContain("apple-watch-garmin-polar-giornata-fitmesh");
    for (const lc of LOCALES) {
      for (const s of collectStrings(post, lc)) {
        for (const m of s.matchAll(/\]\((\/blog\/[a-z0-9-]+)\)/g)) {
          const slug = m[1].replace("/blog/", "");
          const target = BLOG_POSTS.find((p) => p.slug === slug);
          expect(target, `[${lc}] slug interno inesistente: ${slug}`).toBeDefined();
          // TRANSLATIONS 5: nessun link che ripieghi sull'inglese.
          expect(isBlogVariantIndexable(target!, lc), `[${lc}] ${slug} non e' indicizzabile in questa lingua`).toBe(true);
        }
      }
    }
    for (const slug of post.related ?? []) {
      const target = BLOG_POSTS.find((p) => p.slug === slug);
      expect(target, `related inesistente: ${slug}`).toBeDefined();
      for (const lc of LOCALES) {
        expect(isBlogVariantIndexable(target!, lc), `[${lc}] related ${slug} ripiegherebbe sull'inglese`).toBe(true);
      }
    }
  });
});
