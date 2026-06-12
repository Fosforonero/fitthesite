/**
 * Tipi condivisi per il blog (`lib/blog/data.ts`) e per le landing high-intent
 * (`lib/landing/data.ts`). La struttura è JSON-like in TypeScript per due motivi:
 *
 * 1. Type-safety completa — niente MDX/CMS, niente runtime parsing fragile.
 * 2. Render deterministico — i componenti React mappano 1:1 i variant dei
 *    `BlogSection`, quindi un nuovo tipo di sezione richiede un cambio
 *    consapevole in `BlogRenderer`.
 *
 * Tutti i contenuti sono `{ it: string; en: string }` per i18n, riusando il
 * pattern di `lib/providers/data.ts`. NON usiamo MDX/react-markdown: nelle
 * stringhe è ammesso solo `**bold**` light-markdown via `renderInlineBold`.
 */
import type { Locale } from "@/lib/i18n";

export type Localized = { it: string; en: string };
export type LocalizedList = { it: string[]; en: string[] };

export type BlogCategory =
  | "guides" // cornerstone + supporting how-to
  | "comparisons" // compare 1 vs 1
  | "privacy" // GDPR, data handling
  | "ecosystem"; // brand ecosystem moves (Google buys Fitbit, etc.)

export interface BlogQA {
  q: Localized;
  a: Localized;
}

/**
 * Sezione di un articolo. Variant-tagged così il renderer fa pattern matching
 * esaustivo. Non aggiungere variant senza estendere `BlogRenderer`.
 */
export type BlogSection =
  | { type: "heading"; level: 2 | 3; text: Localized }
  | { type: "paragraph"; text: Localized }
  | { type: "list"; ordered?: boolean; items: LocalizedList }
  | {
      type: "callout";
      variant: "info" | "warning" | "tip";
      title?: Localized;
      body: Localized;
    }
  | {
      type: "table";
      caption?: Localized;
      headers: LocalizedList;
      rows: Array<LocalizedList>;
    }
  | {
      /**
       * Due colonne pro/contro o "X vs Y". `aTitle`/`bTitle` sono le intestazioni
       * delle due colonne; `aItems`/`bItems` le rispettive bullet list.
       */
      type: "comparison";
      aTitle: Localized;
      aItems: LocalizedList;
      bTitle: Localized;
      bItems: LocalizedList;
    }
  | {
      /**
       * CTA box inline: titolo, descrizione, link primario. `href` può essere
       * un path relativo (`/it/beta`) o URL assoluto.
       */
      type: "cta";
      title: Localized;
      body: Localized;
      ctaLabel: Localized;
      ctaHref: { it: string; en: string };
    };

/**
 * Hero header dell'articolo. `kicker` è la microcategoria (es. "Guida",
 * "Confronto"), `title` è l'H1, `subtitle` è il sommario sotto l'H1.
 */
export interface BlogHero {
  kicker: Localized;
  title: Localized;
  subtitle: Localized;
}

export interface BlogPost {
  /** URL slug — lowercase, kebab-case, stabile (SEO-critical). */
  slug: string;
  category: BlogCategory;
  /** Date ISO 8601 (es. "2026-05-21"). */
  publishedAt: string;
  /** Stessa data di publish, o data ultima revisione contenuto. */
  updatedAt: string;
  /**
   * Pillar cornerstone hub. Mostrato come badge "Pilastro" e usato dal renderer
   * per allungare il container max-width. Solo i 2 cornerstone hanno `true`.
   */
  pillar?: boolean;
  hero: BlogHero;
  /** Meta description e OG description. ~140-160 caratteri ideale. */
  metaDescription: Localized;
  /** Parola/frase chiave principale (per `keywords` meta). */
  primaryKeyword: Localized;
  /** Secondary keywords mostrate in meta keywords. */
  secondaryKeywords: { it: string[]; en: string[] };
  /** Tempo lettura stimato in minuti (calcolato a mano, no auto). */
  readMinutes: number;
  /**
   * TL;DR: 3-5 bullet che riassumono l'articolo, mostrati in un box in cima
   * (subito dopo l'header), stile blog Claude. Dà il "succo" in 10 secondi.
   * Opzionale per retrocompatibilità; il box si mostra solo se presente.
   */
  tldr?: LocalizedList;
  /** Sezioni in ordine sequenziale. Render top-to-bottom. */
  body: BlogSection[];
  /** FAQ section (renderizzata come <details>) + JSON-LD FAQPage. */
  faq?: BlogQA[];
  /** Slug di articoli correlati (rendered come card a fondo pagina). */
  related?: string[];
  /**
   * Brand citati nell'articolo. Footer disclaimer auto-inserito:
   * "non affiliato a {brand}, marchi citati...".
   */
  brandsMentioned?: string[];
  /** Tipo di JSON-LD da emettere. Default: "BlogPosting". */
  ldType?: "Article" | "BlogPosting";
}

export const CATEGORY_LABEL: Record<BlogCategory, Localized> = {
  guides: { it: "Guida", en: "Guide" },
  comparisons: { it: "Confronto", en: "Comparison" },
  privacy: { it: "Privacy", en: "Privacy" },
  ecosystem: { it: "Ecosistema", en: "Ecosystem" },
};

export function categoryLabel(c: BlogCategory, lc: Locale): string {
  return CATEGORY_LABEL[c][lc];
}
