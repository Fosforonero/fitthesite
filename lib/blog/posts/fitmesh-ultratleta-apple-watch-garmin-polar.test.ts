import { describe, expect, it } from "vitest";
import { featureStatusSentence, type FeatureKey } from "@/lib/feature-status";
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
 * Rettifica 21/10/2026: la guida NON porta nessuna frase di stato su dashboard web o
 * Mesh Famiglia, nemmeno come «non disponibili». Fail-closed:
 * - una frase del registro (lib/feature-status.ts) presente nel testo, in qualunque lingua della guida: ERRORE;
 * - una qualunque frase che nomina dashboard web/Mesh E ne dichiara lo stato (non disponibile, in sviluppo): ERRORE;
 * - una FAQ che chiede della dashboard web o della Mesh: ERRORE;
 * - una promessa di disponibilita' attiva: ERRORE.
 * Il registro, i flag e i cancelli non sono toccati da questo test.
 */
function validateNoStatusSentences(postToTest: BlogPost) {
  for (const lc of LOCALES) {
    const chunks = collectStrings(postToTest, lc);
    const combined = chunks.join(" ");
    for (const key of KEYS) {
      const sentence = featureStatusSentence(key, lc);
      if (combined.includes(sentence)) throw new Error(`[${lc}] frase di stato del registro (${key}) presente nel testo`);
    }
    for (const chunk of chunks) {
      for (const sentence of splitSentences(chunk)) {
        if (TERM[lc].test(sentence) && STATE[lc].test(sentence)) {
          throw new Error(`[${lc}] frase che dichiara lo stato di dashboard web o Mesh: ${sentence}`);
        }
      }
    }
    for (const f of postToTest.faq ?? []) {
      const q = (f.q as Record<string, string | undefined>)[lc] ?? "";
      if (TERM[lc].test(q) && /web|desktop|mesh|famil|ウェブ|ブラウザ|パソコン/i.test(q)) throw new Error(`[${lc}] FAQ sulla dashboard web o sulla Mesh: ${q}`);
    }
    // Le domande delle FAQ non sono promesse: si controllano le affermazioni.
    const statements = chunks.flatMap(splitSentences).filter((x) => !/[?？]$/.test(x)).join(" ");
    for (const forbidden of FORBIDDEN_POSITIVE[lc]) {
      if (forbidden.test(statements)) {
        throw new Error(`[${lc}] promessa di disponibilita' attiva non consentita: ${forbidden}`);
      }
    }
  }
}

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


  it("nessuna frase di stato su dashboard web o Mesh Famiglia, in nessuna delle 5 lingue (rettifica 21/10/2026)", () => {
    expect(() => validateNoStatusSentences(post)).not.toThrow();
  });

  it("resta solo dove si consulta quanto descritto: l'app per iPhone e Android, in tutte le 5 lingue", () => {
    for (const lc of LOCALES) {
      const combined = collectStrings(post, lc).join(" ");
      expect(combined, lc).toMatch(/FitMesh/);
    }
    expect(collectStrings(post, "it").join(" ")).toContain("Quanto descritto in questa guida si consulta nell'app FitMesh per iPhone e Android.");
    expect(collectStrings(post, "en").join(" ")).toContain("What this guide describes is viewed in the FitMesh app for iPhone and Android.");
  });

  it("MUTAZIONE: una frase del registro rimessa nel testo fa fallire il test", () => {
    const mutated = JSON.parse(JSON.stringify(post)) as BlogPost;
    mutated.tldr!.de = [...(mutated.tldr!.de ?? []), featureStatusSentence("webDashboard", "de")];
    expect(() => validateNoStatusSentences(mutated)).toThrow(/\[de\]/);
    const mutated2 = JSON.parse(JSON.stringify(post)) as BlogPost;
    mutated2.tldr!.fr = [...(mutated2.tldr!.fr ?? []), featureStatusSentence("familyMesh", "fr")];
    expect(() => validateNoStatusSentences(mutated2)).toThrow(/\[fr\]/);
  });

  it("MUTAZIONE: una frase di stato scritta a mano, diversa da quella del registro, fa fallire il test", () => {
    const mutated = JSON.parse(JSON.stringify(post)) as BlogPost;
    mutated.tldr!.en = [...(mutated.tldr!.en ?? []), "The web dashboard is currently not available."];
    expect(() => validateNoStatusSentences(mutated)).toThrow(/\[en\]/);
  });

  it("MUTAZIONE: una FAQ sulla dashboard web fa fallire il test", () => {
    const mutated = JSON.parse(JSON.stringify(post)) as BlogPost;
    mutated.faq!.push({
      q: { it: "La dashboard web desktop è già utilizzabile?", en: "Is the desktop web dashboard currently available?", de: "Ist das Desktop-Web-Dashboard verfügbar?", ja: "パソコンのブラウザからWebダッシュボードを使えますか？", fr: "Le tableau de bord web sur ordinateur est-il disponible ?" },
      a: { it: "Si consulta nell'app.", en: "It is viewed in the app.", de: "Es wird in der App angezeigt.", ja: "アプリで確認できます。", fr: "Il se consulte dans l'application." },
    } as never);
    expect(() => validateNoStatusSentences(mutated)).toThrow(/FAQ sulla dashboard web/);
  });

  it("MUTAZIONE: una promessa di disponibilita' attiva fa fallire il test", () => {
    const mutated = JSON.parse(JSON.stringify(post)) as BlogPost;
    mutated.faq![0].a.en += " The web dashboard is already available.";
    expect(() => validateNoStatusSentences(mutated)).toThrow(/\[en\]/);
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
